/**
 * Inbound Call End Processor
 *
 * Handles end-of-call processing for inbound VAPI calls.
 * Extracts call data, updates the database, and triggers
 * background jobs for transcript cleaning and notifications.
 *
 * @module vapi/webhooks/handlers/end-of-call-report/inbound-processor
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
  calculateTotalCost,
  extractSentiment,
  mapVapiStatus,
  shouldMarkInboundCallAsFailed,
} from "../../utils";
import { parseAllStructuredOutputs } from "../../processors";
import { handleInboundAttentionCase } from "../../processors/attention-handler";
import {
  cleanInboundTranscript,
  extractAppointmentDateFromTranscript,
  notifyAppointmentBooked,
} from "../../background-jobs";
import type { ExistingCallRecord } from "../inbound-call-helpers";
import { mapInboundCallToUser } from "../../../inbound-calls";
import type { VapiCallResponse } from "../../../client";
import {
  extractCallerNameFromTranscript,
  extractPetNameFromTranscript,
} from "@odis-ai/shared/util";

const logger = loggers.webhook.child("inbound-processor");

/**
 * Handle inbound call end
 *
 * Processes the end-of-call report for inbound calls:
 * 1. Maps assistant to clinic/user
 * 2. Determines final status
 * 3. Extracts all call data (recordings, transcripts, analysis)
 * 4. Updates the database
 * 5. Triggers background jobs
 *
 * @param call - Enriched VAPI call object
 * @param message - End-of-call report message
 * @param existingCall - Existing call record from database
 * @param supabase - Supabase client
 */
export async function handleInboundCallEnd(
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
  const finalStatus = determineInboundStatus(call);

  // Detect incomplete webhook
  const isIncompleteWebhook = detectIncompleteWebhook(
    call,
    message,
    existingCall,
  );
  if (isIncompleteWebhook) {
    return; // Will be retried when status-update arrives
  }

  // Extract all call data
  const callData = extractInboundCallData(call, message, clinicName, userId);

  // Parse structured outputs
  const artifact = message.artifact ?? {};
  const structuredOutputs =
    parseAllStructuredOutputs(artifact.structuredOutputs) ?? {};

  // Enhance structured data with transcript-extracted names if action card data is incomplete
  const enhancedStructuredData = enhanceStructuredDataWithTranscriptNames(
    callData.structuredData,
    callData.transcript,
    call.id,
  );

  // Build update data with enhanced structured data
  const updateData = buildInboundUpdateData(
    call,
    message,
    { ...callData, structuredData: enhancedStructuredData },
    finalStatus,
    structuredOutputs,
    artifact,
  );

  // Log extracted data
  logInboundCallData(
    call.id,
    existingCall.id,
    finalStatus,
    callData,
    structuredOutputs,
  );

  // Handle attention case detection
  const structuredData =
    callData.analysis?.structuredData ?? artifact.structuredOutputs;
  handleInboundAttentionCase(call.id, existingCall, structuredData, updateData);

  // Save to database
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
    return;
  }

  // Trigger background jobs (fire-and-forget)
  cleanInboundTranscript(callData.transcript, clinicName, call.id, supabase);
  extractAppointmentDateFromTranscript(call.id, callData.transcript, supabase);
  notifyAppointmentBooked(call.id, call.assistantId, supabase);
}

/**
 * Determine final status for inbound call
 */
function determineInboundStatus(call: VapiWebhookCall): string {
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

  return finalStatus;
}

/**
 * Detect incomplete webhook that needs retry
 */
function detectIncompleteWebhook(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  existingCall: ExistingCallRecord,
): boolean {
  const isIncomplete =
    call.status === "ringing" &&
    !call.endedReason &&
    !message.artifact?.structuredOutputs;

  if (isIncomplete) {
    logger.warn("Incomplete end-of-call-report webhook detected", {
      callId: call.id,
      dbId: existingCall.id,
      reason: "missing endedReason and structuredOutputs",
      status: call.status,
      suggestion: "Call will be retried when status-update webhook arrives",
    });
  }

  return isIncomplete;
}

/**
 * Extracted call data
 */
interface InboundCallData {
  startedAt: string | undefined;
  endedAt: string | undefined;
  durationSeconds: number | null;
  cost: number | undefined;
  userSentiment: string;
  recordingUrl: string | null;
  stereoRecordingUrl: string | null;
  transcript: string | null;
  transcriptMessages: unknown[] | null;
  analysis: VapiAnalysis;
  structuredData: Record<string, unknown> | undefined;
  clinicName: string | null;
  userId: string | null;
}

/**
 * Extract all call data from message and call objects
 */
function extractInboundCallData(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  clinicName: string | null,
  userId: string | null,
): InboundCallData {
  const artifact = message.artifact ?? {};
  const analysis = call.analysis ?? message.analysis ?? {};

  // Calculate duration
  const startedAt = call.startedAt ?? message.startedAt;
  const endedAt = call.endedAt ?? message.endedAt;
  const durationSeconds = calculateDuration(startedAt, endedAt);

  // Calculate cost
  const cost = calculateTotalCost(call.costs) ?? message.cost;

  // Extract sentiment
  const userSentiment = extractSentiment(analysis);

  // Recording URLs with fallbacks
  const recordingUrl =
    call.recordingUrl ?? artifact.recordingUrl ?? message.recordingUrl ?? null;
  const stereoRecordingUrl =
    artifact.stereoRecordingUrl ?? message.stereoRecordingUrl ?? null;

  // Transcript with fallbacks
  const transcript =
    call.transcript ?? artifact.transcript ?? message.transcript ?? null;
  const transcriptMessages = call.messages ?? artifact.messages ?? null;

  // Structured data
  const structuredData = ((analysis as { structuredData?: unknown })
    .structuredData ?? artifact.structuredOutputs) as
    | Record<string, unknown>
    | undefined;

  // Log detailed structured data for debugging name extraction
  logger.info("Inbound call structured data analysis", {
    callId: call.id,
    customerPhone: call.customer?.number,
    hasAnalysisStructuredData: !!(analysis as { structuredData?: unknown }).structuredData,
    hasArtifactStructuredOutputs: !!artifact.structuredOutputs,
    analysisStructuredData: (analysis as { structuredData?: unknown }).structuredData,
    artifactStructuredOutputs: artifact.structuredOutputs,
    finalStructuredData: structuredData,
    structuredDataSource: (analysis as { structuredData?: unknown }).structuredData
      ? "analysis.structuredData"
      : artifact.structuredOutputs
        ? "artifact.structuredOutputs"
        : "none",
  });

  // Log data sources
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

  return {
    startedAt,
    endedAt,
    durationSeconds,
    cost,
    userSentiment,
    recordingUrl,
    stereoRecordingUrl,
    transcript,
    transcriptMessages,
    analysis,
    structuredData,
    clinicName,
    userId,
  };
}

/**
 * Build update data for database
 */
function buildInboundUpdateData(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  callData: InboundCallData,
  finalStatus: string,
  structuredOutputs: ReturnType<typeof parseAllStructuredOutputs>,
  artifact: VapiArtifact,
): Record<string, unknown> {
  return {
    vapi_call_id: call.id,
    assistant_id: call.assistantId ?? null,
    user_id: callData.userId,
    clinic_name: callData.clinicName,
    customer_phone: call.customer?.number ?? null,
    status: finalStatus,
    started_at: callData.startedAt ?? null,
    ended_at: callData.endedAt ?? null,
    duration_seconds: callData.durationSeconds,
    recording_url: callData.recordingUrl,
    stereo_recording_url: callData.stereoRecordingUrl,
    transcript: callData.transcript,
    transcript_messages: callData.transcriptMessages,
    call_analysis: callData.analysis,
    summary: (callData.analysis as { summary?: string }).summary ?? null,
    success_evaluation:
      (callData.analysis as { successEvaluation?: string }).successEvaluation ??
      null,
    structured_data: callData.structuredData ?? null,
    user_sentiment: callData.userSentiment,
    cost: callData.cost,
    ended_reason: call.endedReason ?? message.endedReason ?? null,
    // Call intelligence columns
    outcome:
      (structuredOutputs.callOutcome as { call_outcome?: string } | null)
        ?.call_outcome ?? null,
    call_outcome_data: structuredOutputs.callOutcome,
    pet_health_data: structuredOutputs.petHealth,
    medication_compliance_data: structuredOutputs.medicationCompliance,
    owner_sentiment_data: structuredOutputs.ownerSentiment,
    escalation_data: structuredOutputs.escalation,
    follow_up_data: structuredOutputs.followUp,
    // Note: action_card_data removed - structured_data already contains action card format
    // from VAPI's analysis.structuredData
    // Metadata
    metadata: {
      artifact,
      webhook_received_at: new Date().toISOString(),
      has_structured_outputs: !!artifact.structuredOutputs,
    },
  };
}

/**
 * Log extracted call data
 */
function logInboundCallData(
  callId: string,
  dbId: string,
  status: string,
  callData: InboundCallData,
  structuredOutputs: ReturnType<typeof parseAllStructuredOutputs>,
): void {
  logger.info("Inbound call ended - extracted data", {
    callId,
    dbId,
    status,
    clinicName: callData.clinicName,
    userId: callData.userId,
    duration: callData.durationSeconds,
    cost: callData.cost,
    hasRecording: !!callData.recordingUrl,
    hasStereoRecording: !!callData.stereoRecordingUrl,
    hasTranscript: !!callData.transcript,
    hasMessages: !!callData.transcriptMessages,
    hasSummary: !!(callData.analysis as { summary?: string }).summary,
    userSentiment: callData.userSentiment,
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

/**
 * Enhance structured data with transcript-extracted names
 *
 * If the action card data is missing caller/pet names, this function
 * attempts to extract them directly from the transcript and adds
 * fallback entries to ensure names are captured.
 *
 * @param structuredData - Original structured data from VAPI
 * @param transcript - Call transcript
 * @param callId - VAPI call ID for logging
 * @returns Enhanced structured data with fallback names
 */
function enhanceStructuredDataWithTranscriptNames(
  structuredData: Record<string, unknown> | undefined,
  transcript: string | null,
  callId: string,
): Record<string, unknown> | undefined {
  if (!transcript) {
    logger.debug("No transcript available for name extraction", { callId });
    return structuredData;
  }

  // Extract names from transcript
  const callerNameFromTranscript = extractCallerNameFromTranscript(transcript);
  const petNameFromTranscript = extractPetNameFromTranscript(transcript);

  // If no names found in transcript, return original data
  if (!callerNameFromTranscript && !petNameFromTranscript) {
    logger.debug("No names extracted from transcript", { callId });
    return structuredData;
  }

  logger.info("Extracted names from transcript", {
    callId,
    callerName: callerNameFromTranscript,
    petName: petNameFromTranscript,
  });

  // Start with existing structured data or create new object
  const enhanced = structuredData ? { ...structuredData } : {};

  // Check if we already have an action card structure
  const hasExistingActionCard = enhanced.card_type || enhanced.appointment_data || enhanced.callback_data || enhanced.emergency_data;

  if (!hasExistingActionCard) {
    // No existing action card - create a basic callback card with extracted names
    enhanced.card_type = "callback";
    enhanced.callback_data = {
      reason: "Caller information extracted from transcript",
      caller_name: callerNameFromTranscript,
      pet_name: petNameFromTranscript,
    };
    logger.info("Created new action card from transcript names", { callId });
  } else {
    // Enhance existing action card data with missing names
    if (enhanced.callback_data && typeof enhanced.callback_data === "object") {
      const callbackData = enhanced.callback_data as Record<string, unknown>;
      if (!callbackData.caller_name && callerNameFromTranscript) {
        callbackData.caller_name = callerNameFromTranscript;
      }
      if (!callbackData.pet_name && petNameFromTranscript) {
        callbackData.pet_name = petNameFromTranscript;
      }
    }

    if (enhanced.appointment_data && typeof enhanced.appointment_data === "object") {
      const appointmentData = enhanced.appointment_data as Record<string, unknown>;
      if (!appointmentData.client_name && callerNameFromTranscript) {
        appointmentData.client_name = callerNameFromTranscript;
      }
      if (!appointmentData.patient_name && petNameFromTranscript) {
        appointmentData.patient_name = petNameFromTranscript;
      }
    }

    // If we have names but no appropriate structure to store them, add callback_data
    const hasCallbackData = enhanced.callback_data && typeof enhanced.callback_data === "object";
    const hasAppointmentData = enhanced.appointment_data && typeof enhanced.appointment_data === "object";

    if (!hasCallbackData && !hasAppointmentData && (callerNameFromTranscript || petNameFromTranscript)) {
      enhanced.callback_data = {
        reason: "Names extracted from transcript",
        caller_name: callerNameFromTranscript,
        pet_name: petNameFromTranscript,
      };
      logger.info("Added callback_data to existing action card for transcript names", { callId });
    }
  }

  return enhanced;
}
