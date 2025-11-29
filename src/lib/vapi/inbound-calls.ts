/**
 * Inbound Calls Helper Functions
 *
 * Utilities for mapping VAPI inbound calls to users/clinics
 * and transforming VAPI webhook data to database format.
 */

import { createServiceClient } from "~/lib/supabase/server";
import type { VapiCallResponse } from "./client";
import { loggers } from "~/lib/logger";

const logger = loggers.vapi.child("inbound-calls");

/**
 * Get clinic name by assistant ID
 * Looks up the clinic_assistants table to find which clinic uses this assistant
 */
export async function getClinicByAssistantId(
  assistantId: string,
): Promise<{ clinicName: string | null; userId: string | null }> {
  if (!assistantId || typeof assistantId !== "string") {
    logger.warn("Invalid assistantId provided", { assistantId });
    return { clinicName: null, userId: null };
  }

  const supabase = await createServiceClient();

  // First, try to find in clinic_assistants table
  const { data: clinicAssistant, error: clinicError } = await supabase
    .from("clinic_assistants")
    .select("clinic_name")
    .eq("assistant_id", assistantId)
    .eq("is_active", true)
    .maybeSingle();

  if (clinicError) {
    logger.error("Error looking up clinic by assistant ID", {
      assistantId,
      error: clinicError.message,
    });
    return { clinicName: null, userId: null };
  }

  if (clinicAssistant?.clinic_name) {
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
      clinicName: clinicAssistant.clinic_name,
      userId: user?.id ?? null,
    };
  }

  // Fallback: try to find user directly by assistant_id if stored on users table
  // (This would require adding assistant_id column to users table)
  // For now, return null if not found in clinic_assistants
  logger.debug("Assistant ID not found in clinic_assistants", { assistantId });
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

  // Calculate duration
  let durationSeconds: number | null = null;
  if (call.startedAt && call.endedAt) {
    try {
      const startTime = new Date(call.startedAt).getTime();
      const endTime = new Date(call.endedAt).getTime();
      if (!isNaN(startTime) && !isNaN(endTime) && endTime >= startTime) {
        durationSeconds = Math.floor((endTime - startTime) / 1000);
      }
    } catch (error) {
      logger.warn("Error calculating call duration", {
        callId: call.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Calculate total cost
  const cost =
    call.costs && call.costs.length > 0
      ? call.costs.reduce((total, c) => total + c.amount, 0)
      : null;

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

  // Simple sentiment extraction
  let userSentiment: "positive" | "neutral" | "negative" | null = null;
  if (analysis.successEvaluation) {
    const evalLower = analysis.successEvaluation.toLowerCase();
    if (evalLower.includes("success") || evalLower.includes("positive")) {
      userSentiment = "positive";
    } else if (evalLower.includes("fail") || evalLower.includes("negative")) {
      userSentiment = "negative";
    } else {
      userSentiment = "neutral";
    }
  }

  // Map VAPI status to our internal status
  const status = mapVapiStatusToInternal(call.status);

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
 * Map VAPI status to internal database status
 */
function mapVapiStatusToInternal(
  vapiStatus: string | undefined,
): "queued" | "ringing" | "in_progress" | "completed" | "failed" | "cancelled" {
  if (!vapiStatus) return "queued";

  const statusMap: Record<
    string,
    "queued" | "ringing" | "in_progress" | "completed" | "failed" | "cancelled"
  > = {
    queued: "queued",
    ringing: "ringing",
    "in-progress": "in_progress",
    forwarding: "in_progress",
    ended: "completed",
  };

  const mappedStatus = statusMap[vapiStatus.toLowerCase()];

  if (!mappedStatus) {
    logger.warn("Unknown VAPI status, defaulting to queued", {
      vapiStatus,
    });
    return "queued";
  }

  return mappedStatus;
}

/**
 * Determine if a call should be marked as failed based on ended reason
 */
export function shouldMarkInboundCallAsFailed(endedReason?: string): boolean {
  if (!endedReason) return false;

  const failedReasons = [
    "dial-busy",
    "dial-failed",
    "dial-no-answer",
    "assistant-error",
    "exceeded-max-duration",
    "assistant-not-found",
    "assistant-not-invalid",
    "assistant-not-provided",
    "assistant-request-failed",
    "assistant-request-returned-error",
    "assistant-request-returned-unspeakable-error",
    "assistant-request-returned-invalid-json",
    "assistant-request-returned-no-content",
    "twilio-failed-to-connect-call",
    "vonage-rejected",
  ];

  return failedReasons.some((reason) =>
    endedReason.toLowerCase().includes(reason.toLowerCase()),
  );
}
