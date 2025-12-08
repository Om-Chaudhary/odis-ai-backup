/**
 * End of Call Report Handler
 *
 * Handles end-of-call-report webhook events with comprehensive call data
 * including recordings, transcripts, analysis, and costs.
 *
 * @module vapi/webhooks/handlers/end-of-call-report
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "~/lib/logger";
import type {
  EndOfCallReportMessage,
  VapiWebhookCall,
  WebhookHandlerContext,
} from "../types";
import {
  calculateDuration,
  calculateRetryDelay,
  calculateTotalCost,
  DEFAULT_MAX_RETRIES,
  enrichCallFromMessage,
  extractSentiment,
  getCallTableName,
  mapEndedReasonToStatus,
  mapVapiStatus,
  shouldMarkInboundCallAsFailed,
  shouldRetry,
} from "../utils";
import {
  createInboundCallRecord,
  fetchExistingCall,
} from "./inbound-call-helpers";
import type { VapiCallResponse } from "~/lib/vapi/client";
import {
  formatInboundCallData,
  mapInboundCallToUser,
} from "~/lib/vapi/inbound-calls";
import { scheduleCallExecution } from "~/lib/qstash/client";

const logger = loggers.webhook.child("end-of-call-report");

/**
 * Handle end-of-call-report webhook
 *
 * @param message - End of call report message from VAPI
 * @param context - Handler context with isInbound flag
 * @param supabase - Supabase client for database operations
 */
export async function handleEndOfCallReport(
  message: EndOfCallReportMessage,
  context: WebhookHandlerContext,
  supabase: SupabaseClient,
): Promise<void> {
  const { call } = message;
  const { isInbound } = context;

  if (!call?.id) {
    logger.warn("End-of-call report missing call data", {
      messageType: message.type,
      isInbound,
    });
    return;
  }

  // Enrich call with message-level fields
  const enrichedCall = enrichCallFromMessage(call, message);

  // Log the complete call payload for debugging
  logCallDetails(call, message, enrichedCall, isInbound);

  const tableName = getCallTableName(isInbound);

  // Find existing call record
  let existingCall = await fetchExistingCall(call.id, tableName, supabase);

  if (!existingCall) {
    // For inbound calls, create the record if it doesn't exist
    if (isInbound) {
      const newCallId = await createInboundCallRecord(enrichedCall, supabase);
      if (!newCallId) {
        logger.error("Failed to create inbound call record");
        return;
      }

      // Re-fetch the newly created call
      existingCall = await fetchExistingCall(call.id, tableName, supabase);
      if (!existingCall) {
        logger.error("Failed to fetch newly created call");
        return;
      }
    } else {
      logger.warn("Call not found in database for end-of-call report", {
        callId: call.id,
        table: tableName,
      });
      return;
    }
  }

  // Route to appropriate handler
  if (isInbound) {
    await handleInboundCallEnd(enrichedCall, message, existingCall, supabase);
  } else {
    await handleOutboundCallEnd(enrichedCall, message, existingCall, supabase);
  }
}

/**
 * Handle inbound call end
 */
async function handleInboundCallEnd(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  existingCall: { id: string; metadata: unknown },
  supabase: SupabaseClient,
): Promise<void> {
  // Cast to VapiCallResponse for compatibility with existing functions
  const callResponse = call as unknown as VapiCallResponse;

  // Map assistant to clinic/user
  const { clinicName, userId } = await mapInboundCallToUser(callResponse);

  // Format call data
  const callData = formatInboundCallData(callResponse, clinicName, userId);

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
 * Handle outbound call end
 */
async function handleOutboundCallEnd(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  existingCall: { id: string; metadata: unknown },
  supabase: SupabaseClient,
): Promise<void> {
  // Calculate duration
  const durationSeconds = calculateDuration(call.startedAt, call.endedAt);

  // Calculate total cost
  const cost = calculateTotalCost(call.costs);

  // Extract metadata to check voicemail detection flag
  const metadata = (existingCall.metadata as Record<string, unknown>) ?? {};

  // Determine final status
  const finalStatus = mapEndedReasonToStatus(call.endedReason, metadata);

  // Extract analysis data
  const analysis = call.analysis ?? {};
  const artifact = message.artifact ?? {};

  // Extract sentiment
  const userSentiment = extractSentiment(analysis);

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

  logger.info("Call ended - extracted data", {
    callId: call.id,
    dbId: existingCall.id,
    status: finalStatus,
    endedReason: call.endedReason,
    duration: durationSeconds,
    cost,
    hasRecording: !!call.recordingUrl,
    hasStereoRecording: !!artifact.stereoRecordingUrl,
    hasTranscript: !!call.transcript,
    hasSummary: !!analysis.summary,
    userSentiment,
  });

  // Handle retry logic for failed calls
  if (finalStatus === "failed" && shouldRetry(call.endedReason, metadata)) {
    await handleRetryLogic(call, existingCall, updateData, metadata, supabase);
  }

  const { error: updateError } = await supabase
    .from("scheduled_discharge_calls")
    .update(updateData)
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update call", {
      callId: call.id,
      error: updateError,
    });
  }
}

/**
 * Handle retry logic for failed calls
 */
async function handleRetryLogic(
  call: VapiWebhookCall,
  existingCall: { id: string; metadata: unknown },
  updateData: Record<string, unknown>,
  metadata: Record<string, unknown>,
  _supabase: SupabaseClient,
): Promise<void> {
  const retryCount = (metadata.retry_count as number) ?? 0;
  const maxRetries = (metadata.max_retries as number) ?? DEFAULT_MAX_RETRIES;

  if (retryCount < maxRetries) {
    const delayMinutes = calculateRetryDelay(retryCount);
    const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    logger.info("Scheduling retry", {
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

      logger.info("Retry scheduled successfully", {
        callId: call.id,
        dbId: existingCall.id,
        qstashMessageId: messageId,
      });
    } catch (qstashError) {
      logger.error("Failed to schedule retry", {
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
    logger.info("Max retries reached", {
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

/**
 * Log call details for debugging
 */
function logCallDetails(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  enrichedCall: VapiWebhookCall,
  isInbound: boolean,
): void {
  logger.debug("End-of-call-report received", {
    callId: call.id,
    isInbound,
    callStatus: call.status,
    messageLevel: {
      hasStartedAt: !!message.startedAt,
      hasEndedAt: !!message.endedAt,
      hasTranscript: !!message.transcript,
      hasRecordingUrl: !!message.recordingUrl,
      hasCost: !!message.cost,
      hasAnalysis: !!message.analysis,
      hasEndedReason: !!message.endedReason,
    },
    callLevel: {
      hasStartedAt: !!call.startedAt,
      hasEndedAt: !!call.endedAt,
      hasTranscript: !!call.transcript,
      hasMessages: !!call.messages,
      messagesCount: call.messages?.length ?? 0,
      hasRecordingUrl: !!call.recordingUrl,
      hasCosts: !!call.costs,
      costsCount: call.costs?.length ?? 0,
      hasAnalysis: !!call.analysis,
    },
    enrichedCall: {
      hasStartedAt: !!enrichedCall.startedAt,
      hasEndedAt: !!enrichedCall.endedAt,
      hasTranscript: !!enrichedCall.transcript,
      hasRecordingUrl: !!enrichedCall.recordingUrl,
      hasCosts: !!enrichedCall.costs,
    },
    hasArtifact: !!message.artifact,
  });
}
