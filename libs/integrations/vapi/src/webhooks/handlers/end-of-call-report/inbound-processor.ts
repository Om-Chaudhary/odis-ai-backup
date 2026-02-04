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
  extractCallbackPhoneFromTranscript,
} from "@odis-ai/shared/util";

const logger = loggers.webhook.child("inbound-processor");

/**
 * Data extracted from transcript and structured data for caller identification
 */
interface ExtractedCallerData {
  callerPhone: string | null;
  callerName: string | null;
  petName: string | null;
}

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
  const { enhanced: enhancedStructuredData, extracted: extractedCallerData } =
    enhanceStructuredDataWithTranscriptNames(
      callData.structuredData,
      callData.transcript,
      call.id,
    );

  // Build update data with enhanced structured data and extracted caller info
  const updateData = buildInboundUpdateData(
    call,
    message,
    { ...callData, structuredData: enhancedStructuredData },
    finalStatus,
    structuredOutputs,
    artifact,
    extractedCallerData,
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
    hasAnalysisStructuredData: !!(analysis as { structuredData?: unknown })
      .structuredData,
    hasArtifactStructuredOutputs: !!artifact.structuredOutputs,
    analysisStructuredData: (analysis as { structuredData?: unknown })
      .structuredData,
    artifactStructuredOutputs: artifact.structuredOutputs,
    finalStructuredData: structuredData,
    structuredDataSource: (analysis as { structuredData?: unknown })
      .structuredData
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
 *
 * Merges VAPI's analysis structured data with existing tool-stored data.
 * Tool-stored data (like appointment dates from book_appointment) takes priority
 * because VAPI's analysis can hallucinate dates.
 */
function buildInboundUpdateData(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  callData: InboundCallData,
  finalStatus: string,
  structuredOutputs: ReturnType<typeof parseAllStructuredOutputs>,
  artifact: VapiArtifact,
  extractedCallerData: ExtractedCallerData,
): Record<string, unknown> {
  // Merge structured data: preserve tool-stored appointment data (correct dates)
  // over VAPI's analysis data (may have hallucinated dates)
  const mergedStructuredData = mergeStructuredDataWithToolData(
    callData.structuredData,
    existingCall.structured_data,
    call.id,
  );

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
    structured_data: mergedStructuredData,
    user_sentiment: callData.userSentiment,
    cost: callData.cost,
    ended_reason: call.endedReason ?? message.endedReason ?? null,
    // Extracted caller information - stored in dedicated columns for reliable display
    extracted_caller_phone: extractedCallerData.callerPhone,
    extracted_caller_name: extractedCallerData.callerName,
    extracted_pet_name: extractedCallerData.petName,
    // Call intelligence columns
    outcome:
      (structuredOutputs.callOutcome as { call_outcome?: string } | null)
        ?.call_outcome ??
      // Fallback: derive outcome from action card data if structured outputs don't have it
      deriveOutcomeFromActionCard(mergedStructuredData ?? undefined) ??
      null,
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
 * Merge VAPI's analysis structured data with existing tool-stored data
 *
 * The book_appointment tool stores correct dates in structured_data.appointment
 * VAPI's analysis may return hallucinated dates in structured_data.appointment_data
 *
 * Priority:
 * 1. Tool-stored data (structured_data.appointment) - has correct dates
 * 2. VAPI analysis data (structured_data.appointment_data) - may be hallucinated
 *
 * @param vapiStructuredData - Structured data from VAPI's analysis
 * @param existingStructuredData - Existing structured data from database (from tool calls)
 * @param callId - Call ID for logging
 * @returns Merged structured data with tool-stored appointment preserved
 */
function mergeStructuredDataWithToolData(
  vapiStructuredData: Record<string, unknown> | undefined,
  existingStructuredData: Record<string, unknown> | null | undefined,
  callId: string,
): Record<string, unknown> | null {
  // If no existing data, just return VAPI data
  if (!existingStructuredData) {
    return vapiStructuredData ?? null;
  }

  // Check if existing data has tool-stored appointment (from book_appointment)
  const toolAppointment = existingStructuredData.appointment as
    | Record<string, unknown>
    | undefined;

  if (!toolAppointment) {
    // No tool-stored appointment, just return VAPI data
    return vapiStructuredData ?? null;
  }

  logger.info("Preserving tool-stored appointment data over VAPI analysis", {
    callId,
    toolAppointmentDate: toolAppointment.date,
    toolAppointmentTime: toolAppointment.time,
    vapiAppointmentDate: (
      vapiStructuredData?.appointment_data as
        | Record<string, unknown>
        | undefined
    )?.date,
  });

  // Start with VAPI data or empty object
  const merged = vapiStructuredData ? { ...vapiStructuredData } : {};

  // Preserve the tool-stored appointment data (has correct dates)
  merged.appointment = toolAppointment;

  // If VAPI has appointment_data, merge tool dates into it for action card display
  // Action cards read from appointment_data, so we need to update it with correct dates
  if (merged.appointment_data && typeof merged.appointment_data === "object") {
    const appointmentData = merged.appointment_data as Record<string, unknown>;
    // Override VAPI's potentially hallucinated dates with tool-stored correct dates
    if (toolAppointment.date) {
      appointmentData.date = toolAppointment.date;
    }
    if (toolAppointment.time) {
      appointmentData.time = toolAppointment.time;
    }
    // Also merge other tool-stored fields if present
    if (toolAppointment.client_name && !appointmentData.client_name) {
      appointmentData.client_name = toolAppointment.client_name;
    }
    if (toolAppointment.patient_name && !appointmentData.patient_name) {
      appointmentData.patient_name = toolAppointment.patient_name;
    }
    if (toolAppointment.client_phone && !appointmentData.client_phone) {
      appointmentData.client_phone = toolAppointment.client_phone;
    }
    if (toolAppointment.reason && !appointmentData.reason) {
      appointmentData.reason = toolAppointment.reason;
    }
  } else if (toolAppointment) {
    // No appointment_data from VAPI, create it from tool data
    // Map tool appointment fields to action card format
    merged.appointment_data = {
      date: toolAppointment.date,
      time: toolAppointment.time,
      client_name: toolAppointment.client_name,
      patient_name: toolAppointment.patient_name,
      client_phone: toolAppointment.client_phone,
      reason: toolAppointment.reason,
    };
  }

  return merged;
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
 * Enhance structured data with transcript-extracted names and extract caller info
 *
 * If the action card data is missing caller/pet names, this function
 * attempts to extract them directly from the transcript and adds
 * fallback entries to ensure names are captured.
 *
 * Also returns extracted caller data for storing in dedicated columns.
 *
 * @param structuredData - Original structured data from VAPI
 * @param transcript - Call transcript
 * @param callId - VAPI call ID for logging
 * @returns Object with enhanced structured data and extracted caller info
 */
function enhanceStructuredDataWithTranscriptNames(
  structuredData: Record<string, unknown> | undefined,
  transcript: string | null,
  callId: string,
): {
  enhanced: Record<string, unknown> | undefined;
  extracted: ExtractedCallerData;
} {
  // Extract from transcript
  const callerNameFromTranscript = extractCallerNameFromTranscript(transcript);
  const petNameFromTranscript = extractPetNameFromTranscript(transcript);
  const phoneFromTranscript = extractCallbackPhoneFromTranscript(transcript);

  // Extract from structured data (priority over transcript)
  const callbackData = structuredData?.callback_data as
    | Record<string, unknown>
    | undefined;
  const appointmentData = structuredData?.appointment_data as
    | Record<string, unknown>
    | undefined;

  // Build extracted caller data with priority: structured data > transcript
  const extracted: ExtractedCallerData = {
    callerPhone:
      (callbackData?.phone_number as string | undefined) ??
      (appointmentData?.client_phone as string | undefined) ??
      phoneFromTranscript,
    callerName:
      (callbackData?.caller_name as string | undefined) ??
      (appointmentData?.client_name as string | undefined) ??
      callerNameFromTranscript,
    petName:
      (callbackData?.pet_name as string | undefined) ??
      (appointmentData?.patient_name as string | undefined) ??
      petNameFromTranscript,
  };

  logger.info("Extracted caller data for dedicated columns", {
    callId,
    extractedCallerPhone: extracted.callerPhone,
    extractedCallerName: extracted.callerName,
    extractedPetName: extracted.petName,
    sources: {
      phoneFromTranscript,
      callerNameFromTranscript,
      petNameFromTranscript,
      hasCallbackData: !!callbackData,
      hasAppointmentData: !!appointmentData,
    },
  });

  if (!transcript) {
    logger.debug("No transcript available for name extraction", { callId });
    return { enhanced: structuredData, extracted };
  }

  // If no names found in transcript, return original data
  if (!callerNameFromTranscript && !petNameFromTranscript) {
    logger.debug("No names extracted from transcript", { callId });
    return { enhanced: structuredData, extracted };
  }

  logger.info("Extracted names from transcript", {
    callId,
    callerName: callerNameFromTranscript,
    petName: petNameFromTranscript,
  });

  // Start with existing structured data or create new object
  const enhanced = structuredData ? { ...structuredData } : {};

  // Check if we already have an action card structure
  const hasExistingActionCard = Boolean(
    enhanced.card_type ??
    enhanced.appointment_data ??
    enhanced.callback_data ??
    enhanced.emergency_data,
  );

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
      const callbackDataObj = enhanced.callback_data as Record<string, unknown>;
      if (!callbackDataObj.caller_name && callerNameFromTranscript) {
        callbackDataObj.caller_name = callerNameFromTranscript;
      }
      if (!callbackDataObj.pet_name && petNameFromTranscript) {
        callbackDataObj.pet_name = petNameFromTranscript;
      }
    }

    if (
      enhanced.appointment_data &&
      typeof enhanced.appointment_data === "object"
    ) {
      const appointmentDataObj = enhanced.appointment_data as Record<
        string,
        unknown
      >;
      if (!appointmentDataObj.client_name && callerNameFromTranscript) {
        appointmentDataObj.client_name = callerNameFromTranscript;
      }
      if (!appointmentDataObj.patient_name && petNameFromTranscript) {
        appointmentDataObj.patient_name = petNameFromTranscript;
      }
    }

    // If we have names but no appropriate structure to store them, add callback_data
    const hasCallbackDataObj =
      enhanced.callback_data && typeof enhanced.callback_data === "object";
    const hasAppointmentDataObj =
      enhanced.appointment_data &&
      typeof enhanced.appointment_data === "object";

    if (
      !hasCallbackDataObj &&
      !hasAppointmentDataObj &&
      (callerNameFromTranscript || petNameFromTranscript)
    ) {
      enhanced.callback_data = {
        reason: "Names extracted from transcript",
        caller_name: callerNameFromTranscript,
        pet_name: petNameFromTranscript,
      };
      logger.info(
        "Added callback_data to existing action card for transcript names",
        { callId },
      );
    }
  }

  return { enhanced, extracted };
}

/**
 * Derive outcome from action card data
 *
 * When VAPI's structured outputs don't contain a call_outcome,
 * we can infer it from the action card data in analysis.structuredData.
 *
 * @param structuredData - Action card data from VAPI's analysis.structuredData
 * @returns Inferred outcome string or null
 */
function deriveOutcomeFromActionCard(
  structuredData: Record<string, unknown> | undefined,
): string | null {
  if (!structuredData?.card_type) {
    return null;
  }

  const cardType = structuredData.card_type as string;

  // Map action card types to outcome values
  switch (cardType) {
    case "scheduled":
      return "scheduled";
    case "rescheduled":
      return "rescheduled";
    case "cancellation":
    case "canceled":
      return "cancellation";
    case "emergency":
      return "emergency";
    case "callback":
      return "callback";
    case "info":
      return "info";
    default:
      return null;
  }
}
