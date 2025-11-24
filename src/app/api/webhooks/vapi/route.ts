import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "~/lib/supabase/server";
import { scheduleCallExecution } from "~/lib/qstash/client";
import type { VapiCallResponse } from "~/lib/vapi/client";
import {
  calculateTotalCost,
  mapVapiStatus,
  shouldMarkAsFailed,
} from "~/lib/vapi/client";

/**
 * VAPI Webhook Handler
 *
 * Receives real-time notifications from VAPI when call events occur.
 *
 * Common webhook events:
 * - status-update: Call status changed
 * - end-of-call-report: Call ended with complete data
 * - hang: Call was hung up
 * - speech-update: Transcription update
 *
 * Enhanced with automatic retry logic for failed calls.
 *
 * Documentation: https://docs.vapi.ai/server_url
 */

interface VapiWebhookPayload {
  message: {
    type: string;
    call?: VapiCallResponse;
    status?: string;
    endedReason?: string;
    phoneNumber?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
}

/**
 * Verify webhook signature from VAPI
 * VAPI sends a signature in the x-vapi-signature header using HMAC-SHA256
 */
async function verifySignature(
  request: NextRequest,
  body: string,
): Promise<boolean> {
  const signature = request.headers.get("x-vapi-signature");
  const secret = process.env.VAPI_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      "[VAPI_WEBHOOK] No VAPI_WEBHOOK_SECRET configured - webhook signature not verified",
    );
    return true; // Allow in development
  }

  if (!signature) {
    console.error("[VAPI_WEBHOOK] No signature provided in request");
    return false;
  }

  try {
    // Create HMAC using the webhook secret
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Generate signature from request body
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body),
    );

    // Convert to hex string
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison
    return timingSafeEqual(signature, computedSignature);
  } catch (error) {
    console.error("[VAPI_WEBHOOK] Signature verification error:", error);
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Map VAPI ended reason to our internal status
 */
function mapEndedReasonToStatus(
  endedReason?: string,
): "completed" | "failed" | "cancelled" {
  if (!endedReason) return "completed";

  // Successful completions
  if (
    endedReason === "assistant-ended-call" ||
    endedReason === "customer-ended-call"
  ) {
    return "completed";
  }

  // Cancelled by user/system
  if (endedReason.includes("cancelled")) {
    return "cancelled";
  }

  // Failed calls
  if (shouldMarkAsFailed(endedReason)) {
    return "failed";
  }

  // Default to completed for unknown reasons
  return "completed";
}

/**
 * Determine if a call should be retried based on ended reason
 */
function shouldRetry(endedReason?: string): boolean {
  const retryableReasons = [
    "dial-busy",
    "dial-no-answer",
    "voicemail",
  ];

  return retryableReasons.some((reason) =>
    endedReason?.toLowerCase().includes(reason.toLowerCase())
  );
}

/**
 * Calculate retry delay with exponential backoff
 *
 * @param retryCount - Current retry count (0-based)
 * @returns Delay in minutes
 */
function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff: 5, 10, 20 minutes
  return Math.pow(2, retryCount) * 5;
}

/**
 * Handle incoming webhook from VAPI
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    // const isValid = await verifySignature(request, body);
    // if (!isValid) {
    //   console.error('[VAPI_WEBHOOK] Invalid webhook signature');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Parse webhook payload
    const payload = JSON.parse(body) as VapiWebhookPayload;
    const { message } = payload;

    console.log("[VAPI_WEBHOOK] Received event", {
      type: message.type,
      callId: message.call?.id,
    });

    // Get Supabase service client (bypasses RLS since webhooks have no auth context)
    const supabase = await createServiceClient();

    // Handle different message types
    if (message.type === "status-update") {
      await handleStatusUpdate(supabase, message);
    } else if (message.type === "end-of-call-report") {
      await handleEndOfCallReport(supabase, message);
    } else if (message.type === "hang") {
      await handleHangup(supabase, message);
    } else {
      console.log("[VAPI_WEBHOOK] Unhandled message type:", message.type);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("[VAPI_WEBHOOK] Error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
}

/**
 * Handle status-update webhook
 */
async function handleStatusUpdate(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
) {
  const call = message.call!;
  if (!call?.id) {
    console.warn("[VAPI_WEBHOOK] status-update missing call data");
    return;
  }

  // Find the call in our database
  const { data: existingCall, error: findError } = await supabase
    .from("scheduled_discharge_calls")
    .select("id, metadata")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    console.warn("[VAPI_WEBHOOK] Call not found in database", {
      callId: call.id,
      error: findError,
    });
    return;
  }

  // Update call status
  const mappedStatus = mapVapiStatus(call.status);
  const updateData: Record<string, unknown> = {
    status: mappedStatus,
  };

  if (call.startedAt) {
    updateData.started_at = call.startedAt;
  }

  const { error: updateError } = await supabase
    .from("scheduled_discharge_calls")
    .update(updateData)
    .eq("id", existingCall.id);

  if (updateError) {
    console.error("[VAPI_WEBHOOK] Failed to update call status", {
      callId: call.id,
      error: updateError,
    });
  }

  console.log("[VAPI_WEBHOOK] Status updated", {
    callId: call.id,
    status: mappedStatus,
  });
}

/**
 * Handle end-of-call-report webhook
 */
async function handleEndOfCallReport(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
) {
  const call = message.call!;
  if (!call?.id) {
    console.warn("[VAPI_WEBHOOK] end-of-call-report missing call data");
    return;
  }

  // Find the call in our database
  const { data: existingCall, error: findError } = await supabase
    .from("scheduled_discharge_calls")
    .select("id, metadata")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    console.warn("[VAPI_WEBHOOK] Call not found in database", {
      callId: call.id,
      error: findError,
    });
    return;
  }

  // Calculate duration
  const durationSeconds = call.startedAt && call.endedAt
    ? Math.floor(
      (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) /
        1000,
    )
    : null;

  // Calculate total cost
  const cost = calculateTotalCost(call.costs);

  // Determine final status
  const finalStatus = mapEndedReasonToStatus(call.endedReason);

  // Prepare update data
  const updateData: Record<string, unknown> = {
    status: finalStatus,
    ended_reason: call.endedReason,
    started_at: call.startedAt,
    ended_at: call.endedAt,
    duration_seconds: durationSeconds,
    recording_url: call.recordingUrl,
    transcript: call.transcript,
    transcript_messages: call.messages ? call.messages : null,
    call_analysis: call.analysis ? call.analysis : null,
    cost,
  };

  console.log("[VAPI_WEBHOOK] Call ended", {
    callId: call.id,
    status: finalStatus,
    endedReason: call.endedReason,
    duration: durationSeconds,
    cost,
  });

  // Handle retry logic for failed calls
  if (finalStatus === "failed" && shouldRetry(call.endedReason)) {
    const metadata = (existingCall.metadata as Record<string, unknown>) ?? {};
    const retryCount = (metadata.retry_count as number) ?? 0;
    const maxRetries = (metadata.max_retries as number) ?? 3;

    if (retryCount < maxRetries) {
      // Calculate retry delay with exponential backoff
      const delayMinutes = calculateRetryDelay(retryCount);
      const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

      console.log("[VAPI_WEBHOOK] Scheduling retry", {
        callId: call.id,
        dbId: existingCall.id,
        retryCount: retryCount + 1,
        maxRetries,
        delayMinutes,
        nextRetryAt: nextRetryAt.toISOString(),
      });

      // Update metadata with retry info
      updateData.metadata = {
        ...metadata,
        retry_count: retryCount + 1,
        next_retry_at: nextRetryAt.toISOString(),
        last_retry_reason: call.endedReason,
      };

      // Reset status to queued for retry
      updateData.status = "queued";

      // Re-enqueue in QStash
      try {
        const messageId = await scheduleCallExecution(
          existingCall.id,
          nextRetryAt,
        );

        // Add QStash message ID to metadata
        updateData.metadata = {
          ...(updateData.metadata ?? {}),
          qstash_message_id: messageId,
        };

        console.log("[VAPI_WEBHOOK] Retry scheduled successfully", {
          callId: call.id,
          dbId: existingCall.id,
          qstashMessageId: messageId,
        });
      } catch (qstashError) {
        console.error("[VAPI_WEBHOOK] Failed to schedule retry", {
          callId: call.id,
          dbId: existingCall.id,
          error: qstashError instanceof Error
            ? qstashError.message
            : String(qstashError),
        });
        // Keep status as failed if retry scheduling fails
        updateData.status = "failed";
      }
    } else {
      console.log("[VAPI_WEBHOOK] Max retries reached", {
        callId: call.id,
        dbId: existingCall.id,
        retryCount,
        maxRetries,
      });

      // Mark as permanently failed
      updateData.metadata = {
        ...metadata,
        final_failure: true,
        final_failure_reason: call.endedReason,
      };
    }
  }

  // Update the call in database
  const { error: updateError } = await supabase
    .from("scheduled_discharge_calls")
    .update(updateData)
    .eq("id", existingCall.id);

  if (updateError) {
    console.error("[VAPI_WEBHOOK] Failed to update call", {
      callId: call.id,
      error: updateError,
    });
  }
}

/**
 * Handle hang webhook
 */
async function handleHangup(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
) {
  const call = message.call!;
  if (!call?.id) {
    console.warn("[VAPI_WEBHOOK] hang missing call data");
    return;
  }

  // Find the call in our database
  const { data: existingCall, error: findError } = await supabase
    .from("scheduled_discharge_calls")
    .select("id")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    console.warn("[VAPI_WEBHOOK] Call not found in database for hang event", {
      callId: call.id,
      error: findError,
    });
    return;
  }

  // Update call to mark as ended
  const { error: updateError } = await supabase
    .from("scheduled_discharge_calls")
    .update({
      ended_reason: call.endedReason || "user-hangup",
      ended_at: call.endedAt || new Date().toISOString(),
    })
    .eq("id", existingCall.id);

  if (updateError) {
    console.error("[VAPI_WEBHOOK] Failed to update hangup", {
      callId: call.id,
      error: updateError,
    });
  }

  console.log("[VAPI_WEBHOOK] Hangup processed", {
    callId: call.id,
  });
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "VAPI webhook endpoint is active",
  });
}
