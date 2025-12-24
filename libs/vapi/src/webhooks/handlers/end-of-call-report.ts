/**
 * End of Call Report Handler
 *
 * Handles end-of-call-report webhook events with comprehensive call data
 * including recordings, transcripts, analysis, and costs.
 *
 * @module vapi/webhooks/handlers/end-of-call-report
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/logger";
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
  type ExistingCallRecord,
} from "./inbound-call-helpers";
import type { VapiCallResponse } from "../../client";
import { mapInboundCallToUser } from "../../inbound-calls";
import { scheduleCallExecution } from "@odis-ai/qstash/client";
import { cleanTranscript } from "@odis-ai/ai";

const logger = loggers.webhook.child("end-of-call-report");

/**
 * Clean transcript using AI and update the database (fire-and-forget)
 * This runs in the background so it doesn't block the webhook response
 */
function cleanTranscriptInBackground(
  transcript: string | null | undefined,
  clinicName: string | null | undefined,
  callId: string,
  tableName: string,
  supabase: SupabaseClient,
): void {
  if (!transcript || transcript.trim().length === 0) {
    return;
  }

  // Fire and forget - don't await
  void (async () => {
    try {
      const result = await cleanTranscript({
        transcript,
        clinicName,
      });

      if (result.wasModified) {
        logger.debug("Transcript cleaned successfully", {
          callId,
          originalLength: transcript.length,
          cleanedLength: result.cleanedTranscript.length,
        });

        // Update database with cleaned transcript
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ cleaned_transcript: result.cleanedTranscript })
          .eq("vapi_call_id", callId);

        if (updateError) {
          logger.error("Failed to update cleaned transcript", {
            callId,
            error: updateError.message,
          });
        } else {
          logger.debug("Cleaned transcript saved to database", { callId });
        }
      }
    } catch (error) {
      logger.error("Failed to clean transcript in background", {
        callId,
        error: error instanceof Error ? error.message : String(error),
        transcriptLength: transcript.length,
      });
      // Silent failure - UI will fall back to raw transcript
    }
  })();
}

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
  existingCall: ExistingCallRecord,
  supabase: SupabaseClient,
): Promise<void> {
  // Cast to VapiCallResponse for compatibility with existing functions
  const callResponse = call as unknown as VapiCallResponse;

  // Map assistant to clinic/user
  const { clinicName, userId } = await mapInboundCallToUser(callResponse);

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

  // Extract artifact and analysis data from message (same as outbound handler)
  const artifact = message.artifact ?? {};
  // Analysis can be at call level OR message level
  const analysis = call.analysis ?? message.analysis ?? {};

  // Calculate duration - check both call and message level
  const startedAt = call.startedAt ?? message.startedAt;
  const endedAt = call.endedAt ?? message.endedAt;
  const durationSeconds = calculateDuration(startedAt, endedAt);

  // Calculate total cost
  const cost = calculateTotalCost(call.costs) ?? message.cost;

  // Extract sentiment - check analysis at both levels
  const userSentiment = extractSentiment(analysis);

  // Get structured data from analysis or artifact
  const structuredData =
    (analysis as { structuredData?: unknown }).structuredData ??
    artifact.structuredOutputs;

  // COMPREHENSIVE DATA EXTRACTION with multiple fallback sources
  // Recording URL: call.recordingUrl -> artifact.recordingUrl -> message.recordingUrl
  const recordingUrl =
    call.recordingUrl ?? artifact.recordingUrl ?? message.recordingUrl ?? null;

  // Stereo Recording URL: artifact only (or message level if available)
  const stereoRecordingUrl =
    artifact.stereoRecordingUrl ?? message.stereoRecordingUrl ?? null;

  // Transcript: call.transcript -> artifact.transcript -> message.transcript
  const transcript =
    call.transcript ?? artifact.transcript ?? message.transcript ?? null;

  // Messages: call.messages -> artifact.messages
  const transcriptMessages = call.messages ?? artifact.messages ?? null;

  // Log data sources for debugging
  logger.debug("Inbound call data sources", {
    callId: call.id,
    recordingSource: call.recordingUrl
      ? "call"
      : artifact.recordingUrl
        ? "artifact"
        : message.recordingUrl
          ? "message"
          : "none",
    transcriptSource: call.transcript
      ? "call"
      : artifact.transcript
        ? "artifact"
        : message.transcript
          ? "message"
          : "none",
    analysisSource: call.analysis
      ? "call"
      : message.analysis
        ? "message"
        : "none",
  });

  // Prepare update data - save immediately WITHOUT cleaned transcript
  // Cleaned transcript will be added in background to avoid blocking webhook
  const updateData: Record<string, unknown> = {
    vapi_call_id: call.id,
    assistant_id: call.assistantId ?? null,
    user_id: userId,
    clinic_name: clinicName,
    customer_phone: call.customer?.number ?? null,
    status: finalStatus,
    started_at: startedAt ?? null,
    ended_at: endedAt ?? null,
    duration_seconds: durationSeconds,
    recording_url: recordingUrl,
    stereo_recording_url: stereoRecordingUrl,
    transcript: transcript,
    transcript_messages: transcriptMessages,
    call_analysis: analysis,
    summary: analysis.summary ?? null,
    success_evaluation: analysis.successEvaluation ?? null,
    structured_data: structuredData ?? null,
    user_sentiment: userSentiment,
    cost,
    ended_reason: call.endedReason ?? message.endedReason ?? null,
  };

  logger.info("Inbound call ended - extracted data", {
    callId: call.id,
    dbId: existingCall.id,
    status: finalStatus,
    endedReason: call.endedReason ?? message.endedReason,
    clinicName,
    userId,
    duration: durationSeconds,
    cost,
    hasRecording: !!recordingUrl,
    hasStereoRecording: !!stereoRecordingUrl,
    hasTranscript: !!transcript,
    hasMessages: !!transcriptMessages,
    hasSummary: !!analysis.summary,
    userSentiment,
  });

  // Save to database FIRST - don't let transcript cleaning block this
  const { error: updateError } = await supabase
    .from("inbound_vapi_calls")
    .update(updateData)
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update inbound call", {
      callId: call.id,
      error: updateError.message,
      errorCode: updateError.code,
    });
    return; // Don't proceed with transcript cleaning if main update failed
  }

  // Clean transcript in background (fire-and-forget) - won't block webhook response
  cleanTranscriptInBackground(
    transcript,
    clinicName,
    call.id,
    "inbound_vapi_calls",
    supabase,
  );
}

/**
 * Handle outbound call end
 */
async function handleOutboundCallEnd(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  existingCall: ExistingCallRecord,
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

  // Get structured data from analysis or artifact
  const structuredData = analysis.structuredData ?? artifact.structuredOutputs;

  // Get clinic name from metadata for transcript cleaning
  const clinicName = (metadata.clinic_name as string) ?? null;
  const transcript = call.transcript ?? null;

  // Prepare update data - save immediately WITHOUT cleaned transcript
  // Cleaned transcript will be added in background to avoid blocking webhook
  const updateData: Record<string, unknown> = {
    status: finalStatus,
    ended_reason: call.endedReason,
    started_at: call.startedAt,
    ended_at: call.endedAt,
    duration_seconds: durationSeconds,
    recording_url: call.recordingUrl ?? artifact.recordingUrl,
    stereo_recording_url: artifact.stereoRecordingUrl,
    transcript: transcript,
    transcript_messages: call.messages ?? null,
    call_analysis: analysis,
    summary: analysis.summary,
    success_evaluation: analysis.successEvaluation,
    structured_data: structuredData,
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
    hasTranscript: !!transcript,
    hasSummary: !!analysis.summary,
    userSentiment,
  });

  // Handle attention case detection (new structured outputs)
  await handleAttentionCase(
    call,
    existingCall,
    structuredData,
    updateData,
    supabase,
  );

  // Handle retry logic for failed calls
  if (finalStatus === "failed" && shouldRetry(call.endedReason, metadata)) {
    await handleRetryLogic(call, existingCall, updateData, metadata, supabase);
  }

  // Save to database FIRST - don't let transcript cleaning block this
  const { error: updateError } = await supabase
    .from("scheduled_discharge_calls")
    .update(updateData)
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update call", {
      callId: call.id,
      error: updateError,
    });
    return; // Don't proceed with transcript cleaning if main update failed
  }

  // Clean transcript in background (fire-and-forget) - won't block webhook response
  cleanTranscriptInBackground(
    transcript,
    clinicName,
    call.id,
    "scheduled_discharge_calls",
    supabase,
  );
}

/**
 * Handle attention case detection from structured outputs
 *
 * Processes the new attention classification fields:
 * - needs_attention (boolean)
 * - attention_types (string[])
 * - attention_severity (string)
 * - attention_summary (string)
 */
async function handleAttentionCase(
  call: VapiWebhookCall,
  existingCall: ExistingCallRecord,
  structuredData: Record<string, unknown> | undefined,
  updateData: Record<string, unknown>,
  supabase: SupabaseClient,
): Promise<void> {
  const needsAttention = structuredData?.needs_attention === true;

  if (!needsAttention) {
    return;
  }

  logger.info("Attention case detected", {
    callId: call.id,
    dbId: existingCall.id,
    caseId: existingCall.case_id,
    attentionTypes: structuredData?.attention_types,
    severity: structuredData?.attention_severity,
  });

  // Set attention fields
  updateData.attention_types =
    (structuredData?.attention_types as string[]) ?? [];
  updateData.attention_severity =
    (structuredData?.attention_severity as string) ?? "routine";
  updateData.attention_flagged_at = new Date().toISOString();
  updateData.attention_summary =
    (structuredData?.attention_summary as string) ?? null;

  // If critical severity, also mark parent case as urgent
  if (
    structuredData?.attention_severity === "critical" &&
    existingCall.case_id
  ) {
    const { error: caseUpdateError } = await supabase
      .from("cases")
      .update({ is_urgent: true })
      .eq("id", existingCall.case_id);

    if (caseUpdateError) {
      logger.error("Failed to update case is_urgent for critical attention", {
        callId: call.id,
        caseId: existingCall.case_id,
        error: caseUpdateError.message,
      });
    } else {
      logger.info("Updated case is_urgent for critical attention", {
        callId: call.id,
        caseId: existingCall.case_id,
      });
    }
  }
}

/**
 * Handle retry logic for failed calls
 */
async function handleRetryLogic(
  call: VapiWebhookCall,
  existingCall: ExistingCallRecord,
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
