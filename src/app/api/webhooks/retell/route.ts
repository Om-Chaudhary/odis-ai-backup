import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "~/lib/supabase/server";
import type { RetellCallResponse } from "~/lib/retell/client";
import { scheduleCallExecution } from "~/lib/qstash/client";

/**
 * Retell AI Webhook Handler
 *
 * Receives real-time notifications from Retell AI when call events occur.
 * Events: call_started, call_ended, call_analyzed
 *
 * - call_started: Triggered when a new call begins
 * - call_ended: Triggered when a call completes (includes all data except call_analysis)
 * - call_analyzed: Triggered when call analysis is complete (includes call_analysis)
 *
 * Enhanced with automatic retry logic for failed calls.
 *
 * Documentation: https://docs.retellai.com/features/webhook-overview
 */

interface RetellWebhookPayload {
  event: "call_started" | "call_ended" | "call_analyzed";
  call: RetellCallResponse;
}

/**
 * Verify webhook signature from Retell AI
 * Currently disabled - uncomment check in POST handler when enabling
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifySignature(request: NextRequest): boolean {
  const signature = request.headers.get("x-retell-signature");
  const apiKey = process.env.RETELL_API_KEY;

  if (!signature || !apiKey) {
    return false;
  }

  // Retell sends the API key as the signature
  return signature === apiKey;
}

/**
 * Map Retell API status to our database status
 */
function mapRetellStatus(retellStatus: string | undefined): string {
  if (!retellStatus) return "initiated";

  const statusMap: Record<string, string> = {
    registered: "initiated",
    ongoing: "in_progress",
    active: "in_progress",
    ended: "completed",
    error: "failed",
  };

  const lowerStatus = retellStatus.toLowerCase();
  return statusMap[lowerStatus] ?? lowerStatus;
}

/**
 * Determine if a call should be retried based on disconnection reason
 */
function shouldRetry(disconnectionReason?: string): boolean {
  const retryableReasons = [
    "dial_no_answer",
    "dial_busy",
    "error_inbound_webhook",
  ];
  return retryableReasons.includes(disconnectionReason ?? "");
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
 * Handle incoming webhook from Retell AI
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable signature verification after setting RETELL_API_KEY in Vercel
    // if (!verifySignature(request)) {
    //   console.error("[RETELL_WEBHOOK] Invalid webhook signature");
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // Parse webhook payload
    const payload = (await request.json()) as RetellWebhookPayload;
    const { event, call } = payload;

    console.log("[RETELL_WEBHOOK] Received event", {
      event,
      callId: call.call_id,
    });

    // Get Supabase service client (bypasses RLS since webhooks have no auth context)
    const supabase = await createServiceClient();

    // Find the call in our database by Retell call ID
    const { data: existingCall, error: findError } = await supabase
      .from("retell_calls")
      .select("id, metadata")
      .eq("retell_call_id", call.call_id)
      .single();

    if (findError || !existingCall) {
      console.warn("[RETELL_WEBHOOK] Call not found in database", {
        callId: call.call_id,
        error: findError,
      });
      // Return 200 to prevent Retell from retrying
      return NextResponse.json(
        {
          success: true,
          message: "Call not tracked in database",
        },
        { status: 200 },
      );
    }

    // Calculate duration if timestamps are available
    const durationSeconds =
      call.end_timestamp && call.start_timestamp
        ? call.end_timestamp - call.start_timestamp
        : null;

    // Map status
    const mappedStatus = mapRetellStatus(call.call_status);

    // Prepare update data based on event type
    const updateData: Record<string, unknown> = {
      status: mappedStatus,
      retell_response: call as unknown,
    };

    if (event === "call_started") {
      // Update with start timestamp and ongoing status
      updateData.start_timestamp = call.start_timestamp
        ? new Date(call.start_timestamp * 1000).toISOString()
        : null;
      updateData.status = "in_progress";

      console.log("[RETELL_WEBHOOK] Call started", {
        callId: call.call_id,
        dbId: existingCall.id,
      });
    }

    if (event === "call_ended") {
      // Update with complete call data
      updateData.end_timestamp = call.end_timestamp
        ? new Date(call.end_timestamp * 1000).toISOString()
        : null;
      updateData.duration_seconds = durationSeconds;
      updateData.recording_url = call.recording_url ?? null;
      updateData.transcript = call.transcript ?? null;
      updateData.transcript_object = call.transcript_object
        ? (call.transcript_object as unknown)
        : null;
      updateData.call_analysis = call.call_analysis
        ? (call.call_analysis as unknown)
        : null;
      updateData.disconnection_reason = call.disconnection_reason ?? null;
      updateData.public_log_url = call.public_log_url ?? null;

      // Map final status based on disconnection reason
      if (call.disconnection_reason === "user_hangup") {
        updateData.status = "completed";
      } else if (
        [
          "dial_failed",
          "dial_no_answer",
          "dial_busy",
          "error_inbound_webhook",
        ].includes(call.disconnection_reason ?? "")
      ) {
        updateData.status = "failed";
      }

      console.log("[RETELL_WEBHOOK] Call ended", {
        callId: call.call_id,
        dbId: existingCall.id,
        status: updateData.status,
        disconnectionReason: call.disconnection_reason,
      });

      // Handle retry logic for failed calls
      if (
        updateData.status === "failed" &&
        shouldRetry(call.disconnection_reason)
      ) {
        const metadata =
          (existingCall.metadata as Record<string, unknown>) ?? {};
        const retryCount = (metadata.retry_count as number) ?? 0;
        const maxRetries = (metadata.max_retries as number) ?? 3;

        if (retryCount < maxRetries) {
          // Calculate retry delay with exponential backoff
          const delayMinutes = calculateRetryDelay(retryCount);
          const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

          console.log("[RETELL_WEBHOOK] Scheduling retry", {
            callId: call.call_id,
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
            last_retry_reason: call.disconnection_reason,
          };

          // Reset status to scheduled for retry
          updateData.status = "scheduled";

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

            console.log("[RETELL_WEBHOOK] Retry scheduled successfully", {
              callId: call.call_id,
              dbId: existingCall.id,
              qstashMessageId: messageId,
            });
          } catch (qstashError) {
            console.error("[RETELL_WEBHOOK] Failed to schedule retry", {
              callId: call.call_id,
              dbId: existingCall.id,
              error:
                qstashError instanceof Error
                  ? qstashError.message
                  : String(qstashError),
            });
            // Keep status as failed if retry scheduling fails
            updateData.status = "failed";
          }
        } else {
          console.log("[RETELL_WEBHOOK] Max retries reached", {
            callId: call.call_id,
            dbId: existingCall.id,
            retryCount,
            maxRetries,
          });

          // Mark as permanently failed
          updateData.metadata = {
            ...metadata,
            final_failure: true,
            final_failure_reason: call.disconnection_reason,
          };
        }
      }
    }

    if (event === "call_analyzed") {
      // Update with call analysis data
      // This event is triggered after call_ended when analysis is complete
      updateData.call_analysis = call.call_analysis
        ? (call.call_analysis as unknown)
        : null;

      // Also update any other fields that might be present
      if (call.transcript) {
        updateData.transcript = call.transcript;
      }
      if (call.transcript_object) {
        updateData.transcript_object = call.transcript_object as unknown;
      }

      console.log("[RETELL_WEBHOOK] Call analyzed", {
        callId: call.call_id,
        dbId: existingCall.id,
      });
    }

    // Update the call in database
    const { error: updateError } = await supabase
      .from("retell_calls")
      .update(updateData)
      .eq("id", existingCall.id);

    if (updateError) {
      console.error("[RETELL_WEBHOOK] Database update error", {
        callId: call.call_id,
        dbId: existingCall.id,
        error: updateError,
      });
      return NextResponse.json(
        { error: "Failed to update call" },
        { status: 500 },
      );
    }

    console.log("[RETELL_WEBHOOK] Successfully processed", {
      event,
      callId: call.call_id,
      dbId: existingCall.id,
      status: String(updateData.status),
    });

    // Return success response
    return NextResponse.json({
      success: true,
      event,
      call_id: call.call_id,
      status: updateData.status,
    });
  } catch (error) {
    console.error("[RETELL_WEBHOOK] Error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Retell webhook endpoint is active",
  });
}
