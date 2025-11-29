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
import {
  formatInboundCallData,
  mapInboundCallToUser,
  shouldMarkInboundCallAsFailed,
} from "~/lib/vapi/inbound-calls";
import { loggers } from "~/lib/logger";

/**
 * VAPI Webhook Handler
 *
 * Receives real-time notifications from VAPI when call events occur.
 * Syncs call data, status, analysis, and artifacts to Supabase.
 *
 * Documentation: https://docs.vapi.ai/server_url
 */

interface VapiWebhookPayload {
  message: {
    type: string;
    call?: VapiCallResponse & {
      endedReason?: string;
      startedAt?: string;
      endedAt?: string;
      recordingUrl?: string;
      transcript?: string;
      messages?: unknown[];
      analysis?: {
        summary?: string;
        successEvaluation?: string;
        structuredData?: Record<string, unknown>;
      };
      costs?: Array<{ amount: number; description: string }>;
    };
    artifact?: {
      recordingUrl?: string;
      stereoRecordingUrl?: string;
      logUrl?: string;
      structuredOutputs?: Record<string, unknown>;
    };
    status?: string;
    endedReason?: string;
    phoneNumber?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
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
  const retryableReasons = ["dial-busy", "dial-no-answer", "voicemail"];

  return retryableReasons.some((reason) =>
    endedReason?.toLowerCase().includes(reason.toLowerCase()),
  );
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff: 5, 10, 20 minutes
  return Math.pow(2, retryCount) * 5;
}

const logger = loggers.webhook.child("vapi");

/**
 * Handle incoming webhook from VAPI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Validate payload structure
    if (!body) {
      logger.warn("Empty webhook payload received");
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    let payload: VapiWebhookPayload;
    try {
      payload = JSON.parse(body) as VapiWebhookPayload;
    } catch (parseError) {
      logger.error("Invalid JSON in webhook payload", {
        error:
          parseError instanceof Error ? parseError.message : String(parseError),
      });
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const { message } = payload;

    // Validate message structure
    if (!message || typeof message !== "object") {
      logger.warn("Invalid webhook payload structure", { payload });
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 },
      );
    }

    logger.info("Received webhook event", {
      type: message.type,
      callId: message.call?.id,
    });

    // Get Supabase service client (bypasses RLS)
    const supabase = await createServiceClient();

    // Detect call direction (inbound vs outbound)
    const call = message.call;
    const isInbound = call?.type === "inboundPhoneCall";

    console.log("[VAPI_WEBHOOK] Call direction detected", {
      type: message.type,
      callId: call?.id,
      callType: call?.type,
      isInbound,
    });

    // Handle different message types
    if (message.type === "status-update") {
      await handleStatusUpdate(supabase, message, isInbound);
    } else if (message.type === "end-of-call-report") {
      await handleEndOfCallReport(supabase, message, isInbound);
    } else if (message.type === "hang") {
      await handleHangup(supabase, message, isInbound);
    } else {
      console.log("[VAPI_WEBHOOK] Unhandled message type:", message.type);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    logger.logError("Webhook processing failed", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
      },
    );
  }
}

/**
 * Handle status-update webhook
 */
async function handleStatusUpdate(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
  isInbound: boolean,
) {
  const call = message.call;
  if (!call?.id) {
    logger.warn("Status update missing call data", {
      messageType: message.type,
      isInbound,
    });
    return;
  }

  const tableName = isInbound
    ? "inbound_vapi_calls"
    : "scheduled_discharge_calls";

  const { data: existingCall, error: findError } = await supabase
    .from(tableName)
    .select("id, metadata")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    // For inbound calls, create the record if it doesn't exist
    if (isInbound && findError?.code === "PGRST116") {
      await createInboundCallRecord(supabase, call);
      return;
    }

    logger.warn("Call not found in database", {
      callId: call.id,
      table: tableName,
      error: findError?.message,
      errorCode: findError?.code,
    });
    return;
  }

  const mappedStatus = mapVapiStatus(call.status);
  const updateData: Record<string, unknown> = {
    status: mappedStatus,
  };

  if (call.startedAt) {
    updateData.started_at = call.startedAt;
  }

  const { error: updateError } = await supabase
    .from(tableName)
    .update(updateData)
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update call status", {
      callId: call.id,
      table: tableName,
      error: updateError.message,
      errorCode: updateError.code,
    });
  } else {
    logger.info("Call status updated", {
      callId: call.id,
      table: tableName,
      status: mappedStatus,
    });
  }
}

/**
 * Handle end-of-call-report webhook
 */
async function handleEndOfCallReport(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
  isInbound: boolean,
) {
  const call = message.call;
  if (!call?.id) {
    logger.warn("End-of-call report missing call data", {
      messageType: message.type,
      isInbound,
    });
    return;
  }

  // Log the complete call payload for debugging
  console.log("[VAPI_WEBHOOK] End-of-call-report received", {
    callId: call.id,
    isInbound,
    callStatus: call.status,
    hasStartedAt: !!call.startedAt,
    hasEndedAt: !!call.endedAt,
    hasTranscript: !!call.transcript,
    hasMessages: !!call.messages,
    messagesCount: call.messages?.length ?? 0,
    hasRecordingUrl: !!call.recordingUrl,
    hasCosts: !!call.costs,
    costsCount: call.costs?.length ?? 0,
    hasAnalysis: !!call.analysis,
    hasArtifact: !!message.artifact,
    // Log field names to identify structure
    callKeys: Object.keys(call),
    artifactKeys: message.artifact ? Object.keys(message.artifact) : [],
  });

  const tableName = isInbound
    ? "inbound_vapi_calls"
    : "scheduled_discharge_calls";

  const { data: existingCall, error: findError } = await supabase
    .from(tableName)
    .select("id, metadata")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    // For inbound calls, create the record if it doesn't exist
    if (isInbound && findError?.code === "PGRST116") {
      const newCallId = await createInboundCallRecord(supabase, call);
      if (!newCallId) {
        console.error("[VAPI_WEBHOOK] Failed to create inbound call record");
        return;
      }
      // Re-fetch the newly created call
      const { data: newCall } = await supabase
        .from(tableName)
        .select("id, metadata")
        .eq("id", newCallId)
        .single();
      if (!newCall) {
        console.error("[VAPI_WEBHOOK] Failed to fetch newly created call");
        return;
      }
      // Continue with update using new call
      return handleInboundCallEnd(supabase, call, message, newCall);
    }

    logger.warn("Call not found in database for end-of-call report", {
      callId: call.id,
      table: tableName,
      error: findError?.message,
      errorCode: findError?.code,
    });
    return;
  }

  // Route to appropriate handler
  if (isInbound) {
    await handleInboundCallEnd(supabase, call, message, existingCall);
  } else {
    await handleOutboundCallEnd(supabase, call, message, existingCall);
  }
}

/**
 * Handle inbound call end
 */
async function handleInboundCallEnd(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  call: VapiCallResponse & {
    endedReason?: string;
    startedAt?: string;
    endedAt?: string;
    recordingUrl?: string;
    transcript?: string;
    messages?: unknown[];
    analysis?: {
      summary?: string;
      successEvaluation?: string;
      structuredData?: Record<string, unknown>;
    };
    costs?: Array<{ amount: number; description: string }>;
  },
  message: VapiWebhookPayload["message"],
  existingCall: { id: string; metadata: unknown },
) {
  // Map assistant to clinic/user
  const { clinicName, userId } = await mapInboundCallToUser(call);

  // Format call data
  const callData = formatInboundCallData(call, clinicName, userId);

  // Determine final status
  let finalStatus = mapVapiStatus(call.status);
  if (call.endedReason) {
    if (shouldMarkInboundCallAsFailed(call.endedReason)) {
      finalStatus = "failed";
    } else if (
      call.endedReason === "customer-ended-call" ||
      call.endedReason === "assistant-ended-call"
    ) {
      finalStatus = "completed";
    } else if (call.endedReason.includes("cancelled")) {
      finalStatus = "cancelled";
    }
  }

  callData.status = finalStatus;

  // Extract artifact data
  const artifact = message.artifact ?? {};

  // Update with artifact data if available
  if (artifact.stereoRecordingUrl) {
    callData.stereo_recording_url = artifact.stereoRecordingUrl;
  }
  if (artifact.structuredOutputs) {
    callData.structured_data = artifact.structuredOutputs;
  }

  logger.info("Inbound call ended", {
    callId: call.id,
    status: finalStatus,
    endedReason: call.endedReason,
    clinicName,
    userId,
  });

  const { error: updateError } = await supabase
    .from("inbound_vapi_calls")
    .update(callData)
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update inbound call", {
      callId: call.id,
      error: updateError.message,
      errorCode: updateError.code,
    });
  }
}

/**
 * Handle outbound call end (existing logic)
 */
async function handleOutboundCallEnd(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  call: VapiCallResponse & {
    endedReason?: string;
    startedAt?: string;
    endedAt?: string;
    recordingUrl?: string;
    transcript?: string;
    messages?: unknown[];
    analysis?: {
      summary?: string;
      successEvaluation?: string;
      structuredData?: Record<string, unknown>;
    };
    costs?: Array<{ amount: number; description: string }>;
  },
  message: VapiWebhookPayload["message"],
  existingCall: { id: string; metadata: unknown },
) {
  // Calculate duration
  const durationSeconds =
    call.startedAt && call.endedAt
      ? Math.floor(
          (new Date(call.endedAt).getTime() -
            new Date(call.startedAt).getTime()) /
            1000,
        )
      : null;

  // Calculate total cost
  const cost = calculateTotalCost(call.costs);

  // Determine final status
  const finalStatus = mapEndedReasonToStatus(call.endedReason);

  // Extract analysis data
  const analysis = call.analysis ?? {};
  const artifact = message.artifact ?? {};

  // Simple sentiment extraction from summary or success evaluation if not provided explicitly
  // VAPI doesn't standardly provide a 'sentiment' field, so we derive it or expect it in structured data
  let userSentiment = "neutral";
  if (analysis.successEvaluation?.toLowerCase().includes("success")) {
    userSentiment = "positive";
  } else if (analysis.successEvaluation?.toLowerCase().includes("fail")) {
    userSentiment = "negative";
  }

  // Prepare update data
  const updateData: Record<string, unknown> = {
    status: finalStatus,
    ended_reason: call.endedReason,
    started_at: call.startedAt,
    ended_at: call.endedAt,
    duration_seconds: durationSeconds,
    recording_url: call.recordingUrl ?? artifact.recordingUrl,
    stereo_recording_url: artifact.stereoRecordingUrl,
    transcript: call.transcript,
    transcript_messages: call.messages ?? null,
    call_analysis: analysis,
    summary: analysis.summary,
    success_evaluation: analysis.successEvaluation,
    structured_data: analysis.structuredData ?? artifact.structuredOutputs,
    user_sentiment: userSentiment,
    cost,
  };

  console.log("[VAPI_WEBHOOK] Call ended - extracted data", {
    callId: call.id,
    dbId: existingCall.id,
    status: finalStatus,
    endedReason: call.endedReason,
    // Timestamps
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    duration: durationSeconds,
    // Cost
    rawCosts: call.costs,
    calculatedCost: cost,
    // Media
    hasRecording: !!call.recordingUrl,
    hasStereoRecording: !!artifact.stereoRecordingUrl,
    recordingUrl: call.recordingUrl,
    stereoRecordingUrl: artifact.stereoRecordingUrl,
    // Transcript
    hasTranscript: !!call.transcript,
    transcriptLength: call.transcript?.length,
    hasMessages: !!call.messages,
    messagesCount: call.messages?.length,
    // Analysis
    hasSummary: !!analysis.summary,
    hasSuccessEvaluation: !!analysis.successEvaluation,
    hasStructuredData: !!analysis.structuredData,
    userSentiment,
  });

  // Handle retry logic for failed calls
  if (finalStatus === "failed" && shouldRetry(call.endedReason)) {
    const metadata = (existingCall.metadata as Record<string, unknown>) ?? {};
    const retryCount = (metadata.retry_count as number) ?? 0;
    const maxRetries = (metadata.max_retries as number) ?? 3;

    if (retryCount < maxRetries) {
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

      updateData.metadata = {
        ...metadata,
        retry_count: retryCount + 1,
        next_retry_at: nextRetryAt.toISOString(),
        last_retry_reason: call.endedReason,
      };

      updateData.status = "queued";

      try {
        const messageId = await scheduleCallExecution(
          existingCall.id,
          nextRetryAt,
        );

        updateData.metadata = {
          ...(updateData.metadata as Record<string, unknown>),
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
          error:
            qstashError instanceof Error
              ? qstashError.message
              : String(qstashError),
        });
        updateData.status = "failed";
      }
    } else {
      console.log("[VAPI_WEBHOOK] Max retries reached", {
        callId: call.id,
        dbId: existingCall.id,
        retryCount,
        maxRetries,
      });

      updateData.metadata = {
        ...metadata,
        final_failure: true,
        final_failure_reason: call.endedReason,
      };
    }
  }

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
 * Create inbound call record if it doesn't exist
 */
async function createInboundCallRecord(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  call: VapiCallResponse,
): Promise<string | null> {
  // Map assistant to clinic/user
  const { clinicName, userId } = await mapInboundCallToUser(call);

  // Format call data
  const callData = formatInboundCallData(call, clinicName, userId);

  const { data: newCall, error: insertError } = await supabase
    .from("inbound_vapi_calls")
    .insert(callData)
    .select("id")
    .single();

  if (insertError || !newCall) {
    logger.error("Failed to create inbound call record", {
      callId: call.id,
      error: insertError?.message,
      errorCode: insertError?.code,
    });
    return null;
  }

  logger.info("Created inbound call record", {
    callId: call.id,
    dbId: newCall.id,
    clinicName,
    userId,
  });

  return newCall.id;
}

/**
 * Handle hang webhook
 */
async function handleHangup(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  message: VapiWebhookPayload["message"],
  isInbound: boolean,
) {
  const call = message.call;
  if (!call?.id) {
    logger.warn("Hangup event missing call data", {
      messageType: message.type,
      isInbound,
    });
    return;
  }

  const tableName = isInbound
    ? "inbound_vapi_calls"
    : "scheduled_discharge_calls";

  const { data: existingCall, error: findError } = await supabase
    .from(tableName)
    .select("id")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    // For inbound calls, create the record if it doesn't exist
    if (isInbound && findError?.code === "PGRST116") {
      await createInboundCallRecord(supabase, call);
      return;
    }

    logger.warn("Call not found in database for hangup event", {
      callId: call.id,
      table: tableName,
      error: findError?.message,
      errorCode: findError?.code,
    });
    return;
  }

  const { error: updateError } = await supabase
    .from(tableName)
    .update({
      ended_reason: call.endedReason ?? "user-hangup",
      ended_at: call.endedAt ?? new Date().toISOString(),
    })
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update hangup", {
      callId: call.id,
      table: tableName,
      error: updateError.message,
      errorCode: updateError.code,
    });
  } else {
    logger.info("Hangup processed", {
      callId: call.id,
      table: tableName,
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "VAPI webhook endpoint is active",
  });
}
