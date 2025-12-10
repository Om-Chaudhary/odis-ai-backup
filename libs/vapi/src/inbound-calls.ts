/**
 * Inbound Calls Helper Functions
 *
 * Utilities for mapping VAPI inbound calls to users/clinics
 * and transforming VAPI webhook data to database format.
 */

import { createServiceClient } from "@odis-ai/db";
import type { VapiCallResponse } from "./client";
import { loggers } from "@odis-ai/logger";
import { getClinicByName } from "@odis-ai/clinics/utils";
import { getClinicByInboundAssistantId } from "@odis-ai/clinics/vapi-config";
import {
  calculateDuration,
  calculateTotalCost,
  extractSentiment,
  mapVapiStatus,
  shouldMarkInboundCallAsFailed as shouldMarkInboundFailed,
} from "./webhooks/utils";

const logger = loggers.vapi.child("inbound-calls");

/**
 * Get clinic name by assistant ID
 * Looks up:
 * 1. clinics.inbound_assistant_id (primary - new clinic-scoped config)
 * 2. clinic_assistants table (legacy - for backward compatibility)
 */
export async function getClinicByAssistantId(
  assistantId: string,
): Promise<{ clinicName: string | null; userId: string | null }> {
  if (!assistantId || typeof assistantId !== "string") {
    logger.warn("Invalid assistantId provided", { assistantId });
    return { clinicName: null, userId: null };
  }

  const supabase = await createServiceClient();

  // First, try to find in clinics table via inbound_assistant_id (new pattern)
  const clinic = await getClinicByInboundAssistantId(assistantId, supabase);

  if (clinic) {
    logger.debug("Found clinic by inbound_assistant_id in clinics table", {
      assistantId,
      clinicName: clinic.name,
    });

    // Find a user from this clinic to get user_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, clinic_name")
      .ilike("clinic_name", clinic.name)
      .limit(1)
      .maybeSingle();

    if (userError) {
      logger.warn("Error finding user for clinic", {
        clinicName: clinic.name,
        error: userError.message,
      });
    }

    return {
      clinicName: clinic.name,
      userId: user?.id ?? null,
    };
  }

  // Fallback: try to find in clinic_assistants table (legacy pattern)
  const { data: clinicAssistant, error: clinicError } = await supabase
    .from("clinic_assistants")
    .select("clinic_name")
    .eq("assistant_id", assistantId)
    .eq("is_active", true)
    .maybeSingle();

  if (clinicError) {
    logger.error(
      "Error looking up clinic by assistant ID in clinic_assistants",
      {
        assistantId,
        error: clinicError.message,
      },
    );
    return { clinicName: null, userId: null };
  }

  if (clinicAssistant?.clinic_name) {
    logger.debug("Found clinic by assistant_id in clinic_assistants table", {
      assistantId,
      clinicName: clinicAssistant.clinic_name,
    });

    // Use clinic lookup utility to get clinic record
    const legacyClinic = await getClinicByName(
      clinicAssistant.clinic_name,
      supabase,
    );

    if (legacyClinic) {
      // Find a user from this clinic to get user_id
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, clinic_name")
        .eq("clinic_name", clinicAssistant.clinic_name)
        .limit(1)
        .maybeSingle();

      if (userError) {
        logger.warn("Error finding user for clinic", {
          clinicName: clinicAssistant.clinic_name,
          error: userError.message,
        });
      }

      return {
        clinicName: legacyClinic.name, // Use clinic.name for consistency
        userId: user?.id ?? null,
      };
    } else {
      logger.warn("Clinic not found in clinics table", {
        clinicName: clinicAssistant.clinic_name,
      });
      // Fallback to clinic_name from clinic_assistants
      return {
        clinicName: clinicAssistant.clinic_name,
        userId: null,
      };
    }
  }

  // Not found in either location
  logger.debug("Assistant ID not found in clinics or clinic_assistants", {
    assistantId,
  });
  return {
    clinicName: null,
    userId: null,
  };
}

/**
 * Map inbound call to user/clinic
 * Determines which user/clinic should own this inbound call
 */
export async function mapInboundCallToUser(
  call: VapiCallResponse | null | undefined,
): Promise<{ clinicName: string | null; userId: string | null }> {
  if (!call?.assistantId) {
    logger.debug("Call missing assistantId", {
      callId: call?.id,
      hasAssistantId: !!call?.assistantId,
    });
    return { clinicName: null, userId: null };
  }

  return getClinicByAssistantId(call.assistantId);
}

/**
 * Transform VAPI call response to database format for inbound_vapi_calls table
 */
export function formatInboundCallData(
  call: VapiCallResponse | null | undefined,
  clinicName: string | null,
  userId: string | null,
): Record<string, unknown> {
  if (!call?.id) {
    logger.warn("formatInboundCallData called with invalid call", {
      hasCall: !!call,
      hasCallId: !!call?.id,
    });
    throw new Error("Invalid call data provided");
  }

  // Calculate duration using shared utility
  const durationSeconds = calculateDuration(call.startedAt, call.endedAt);

  // Calculate total cost using shared utility
  const cost = calculateTotalCost(call.costs);

  // Extract analysis data
  const analysis = call.analysis ?? {};
  const artifact = (
    call as unknown as {
      artifact?: {
        stereoRecordingUrl?: string;
        structuredOutputs?: Record<string, unknown>;
      };
    }
  ).artifact;

  // Extract sentiment using shared utility
  const userSentiment = extractSentiment(analysis);

  // Map VAPI status to our internal status using shared utility
  const status = mapVapiStatus(call.status);

  return {
    vapi_call_id: call.id,
    assistant_id: call.assistantId ?? null,
    phone_number_id: call.phoneNumber?.id ?? null,
    user_id: userId,
    clinic_name: clinicName,
    customer_phone: call.customer?.number ?? null,
    customer_number: call.customer?.number ?? null,
    status,
    type: "inbound",
    started_at: call.startedAt ?? null,
    ended_at: call.endedAt ?? null,
    duration_seconds: durationSeconds,
    recording_url: call.recordingUrl ?? null,
    stereo_recording_url: artifact?.stereoRecordingUrl ?? null,
    transcript: call.transcript ?? null,
    transcript_messages: call.messages
      ? (call.messages as unknown as Array<unknown>)
      : null,
    call_analysis: analysis,
    summary: analysis.summary ?? null,
    success_evaluation: analysis.successEvaluation ?? null,
    structured_data:
      (analysis as { structuredData?: unknown }).structuredData ??
      artifact?.structuredOutputs ??
      null,
    user_sentiment: userSentiment,
    cost,
    ended_reason: call.endedReason ?? null,
    metadata: {},
  };
}

/**
 * Determine if a call should be marked as failed based on ended reason
 * Re-exports from webhooks/utils for backward compatibility
 */
export const shouldMarkInboundCallAsFailed = shouldMarkInboundFailed;
