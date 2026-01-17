/**
 * Outbound Call End Processor
 *
 * Handles end-of-call processing for outbound VAPI calls.
 * Extracts call data, handles retry logic, updates the database,
 * and triggers background jobs for transcript cleaning.
 *
 * @module vapi/webhooks/handlers/end-of-call-report/outbound-processor
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import type {
  EndOfCallReportMessage,
  VapiAnalysis,
  VapiArtifact,
  VapiWebhookCall,
} from "../../types";
import {
  calculateDuration,
  calculateRetryDelay,
  calculateTotalCost,
  DEFAULT_MAX_RETRIES,
  extractSentiment,
  mapEndedReasonToStatus,
  shouldRetry,
} from "../../utils";
import { parseAllStructuredOutputs } from "../../processors";
import { handleOutboundAttentionCase } from "../../processors/attention-handler";
import { cleanOutboundTranscript } from "../../background-jobs";
import type { ExistingCallRecord } from "../inbound-call-helpers";

const logger = loggers.webhook.child("outbound-processor");

/**
 * Handle outbound call end
 *
 * Processes the end-of-call report for outbound calls:
 * 1. Calculates duration and cost
 * 2. Determines final status
 * 3. Extracts all call data
 * 4. Handles retry logic for failed calls
 * 5. Updates the database
 * 6. Triggers background transcript cleaning
 *
 * @param call - Enriched VAPI call object
 * @param message - End-of-call report message
 * @param existingCall - Existing call record from database
 * @param supabase - Supabase client
 */
export async function handleOutboundCallEnd(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  existingCall: ExistingCallRecord,
  supabase: SupabaseClient,
): Promise<void> {
  // Extract metadata
  const metadata = (existingCall.metadata as Record<string, unknown>) ?? {};

  // Calculate duration and cost
  const durationSeconds = calculateDuration(call.startedAt, call.endedAt);
  const cost = calculateTotalCost(call.costs);

  // Determine final status
  const finalStatus = mapEndedReasonToStatus(call.endedReason, metadata);

  // Extract analysis and artifact data
  const analysis = call.analysis ?? {};
  const artifact = message.artifact ?? {};

  // Extract sentiment
  const userSentiment = extractSentiment(analysis);

  // Get structured data
  const structuredData = analysis.structuredData ?? artifact.structuredOutputs;

  // Parse all structured outputs
  const structuredOutputs =
    parseAllStructuredOutputs(artifact.structuredOutputs) ?? {};

  // Get clinic name and transcript for cleaning
  const clinicName = (metadata.clinic_name as string) ?? null;
  const transcript = call.transcript ?? null;

  // Build update data
  const updateData = buildOutboundUpdateData(
    call,
    artifact,
    analysis,
    finalStatus,
    durationSeconds,
    cost,
    userSentiment,
    structuredData,
    structuredOutputs,
    metadata,
  );

  // Log extracted data
  logOutboundCallData(
    call,
    existingCall,
    finalStatus,
    durationSeconds,
    cost,
    userSentiment,
    structuredOutputs,
  );

  // Handle attention case detection
  await handleOutboundAttentionCase(
    call.id,
    existingCall,
    structuredData,
    updateData,
    supabase,
  );

  // Handle retry logic for failed calls
  if (finalStatus === "failed" && shouldRetry(call.endedReason, metadata)) {
    await handleRetryLogic(call, existingCall, updateData, metadata);
  }

  // Save to database
  const { error: updateError } = await supabase
    .from("scheduled_discharge_calls")
    .update(updateData)
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update call", {
      callId: call.id,
      error: updateError,
    });
    return;
  }

  // Clean transcript in background (fire-and-forget)
  cleanOutboundTranscript(transcript, clinicName, call.id, supabase);
}

/**
 * Build update data for database
 */
function buildOutboundUpdateData(
  call: VapiWebhookCall,
  artifact: VapiArtifact,
  analysis: VapiAnalysis,
  finalStatus: string,
  durationSeconds: number | null,
  cost: number,
  userSentiment: string,
  structuredData: unknown,
  structuredOutputs: ReturnType<typeof parseAllStructuredOutputs>,
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  return {
    status: finalStatus,
    ended_reason: call.endedReason,
    started_at: call.startedAt,
    ended_at: call.endedAt,
    duration_seconds: durationSeconds,
    recording_url: call.recordingUrl ?? artifact.recordingUrl,
    stereo_recording_url: artifact.stereoRecordingUrl,
    transcript: call.transcript ?? null,
    transcript_messages: call.messages ?? null,
    call_analysis: analysis,
    summary: (analysis as { summary?: string }).summary,
    success_evaluation: (analysis as { successEvaluation?: string })
      .successEvaluation,
    structured_data: structuredData,
    user_sentiment: userSentiment,
    cost,
    // New structured output columns
    call_outcome_data: structuredOutputs.callOutcome,
    pet_health_data: structuredOutputs.petHealth,
    medication_compliance_data: structuredOutputs.medicationCompliance,
    owner_sentiment_data: structuredOutputs.ownerSentiment,
    escalation_data: structuredOutputs.escalation,
    follow_up_data: structuredOutputs.followUp,
    // Metadata
    metadata: {
      ...metadata,
      artifact,
      webhook_received_at: new Date().toISOString(),
      has_structured_outputs: !!artifact.structuredOutputs,
    },
  };
}

/**
 * Handle retry logic for failed calls
 */
async function handleRetryLogic(
  call: VapiWebhookCall,
  existingCall: ExistingCallRecord,
  updateData: Record<string, unknown>,
  metadata: Record<string, unknown>,
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
      // Dynamic import due to module boundary
      const { scheduleCallExecution } =
        await import("@odis-ai/integrations/qstash/client");

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
 * Log extracted call data
 */
function logOutboundCallData(
  call: VapiWebhookCall,
  existingCall: ExistingCallRecord,
  status: string,
  duration: number | null,
  cost: number,
  userSentiment: string,
  structuredOutputs: ReturnType<typeof parseAllStructuredOutputs>,
): void {
  logger.info("Call ended - extracted data", {
    callId: call.id,
    dbId: existingCall.id,
    status,
    endedReason: call.endedReason,
    duration,
    cost,
    hasRecording: !!call.recordingUrl,
    hasStereoRecording: !!(call.analysis as { stereoRecordingUrl?: string })
      ?.stereoRecordingUrl,
    hasTranscript: !!call.transcript,
    hasSummary: !!(call.analysis as { summary?: string })?.summary,
    userSentiment,
    structuredOutputs: {
      hasCallOutcome: !!structuredOutputs.callOutcome,
      hasPetHealth: !!structuredOutputs.petHealth,
      hasMedicationCompliance: !!structuredOutputs.medicationCompliance,
      hasOwnerSentiment: !!structuredOutputs.ownerSentiment,
      hasEscalation: !!structuredOutputs.escalation,
      hasFollowUp: !!structuredOutputs.followUp,
    },
  });
}
