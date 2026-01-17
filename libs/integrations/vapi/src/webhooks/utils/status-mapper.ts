/**
 * Status Mapping Utilities
 *
 * Converts VAPI call statuses to internal database statuses.
 * Handles status transitions for different call outcomes.
 *
 * @module vapi/webhooks/utils/status-mapper
 */

import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.webhook.child("status-mapper");

/**
 * Internal call status types used in database
 */
export type CallStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Maps VAPI status to our internal database status
 *
 * @param vapiStatus - VAPI call status
 * @returns Our database status
 */
export function mapVapiStatus(vapiStatus: string | undefined): CallStatus {
  if (!vapiStatus) return "queued";

  const statusMap: Record<string, CallStatus> = {
    queued: "queued",
    ringing: "ringing",
    "in-progress": "in_progress",
    forwarding: "in_progress",
    ended: "completed",
  };

  const mappedStatus = statusMap[vapiStatus.toLowerCase()];

  if (!mappedStatus) {
    logger.warn("Unknown VAPI status, defaulting to queued", { vapiStatus });
    return "queued";
  }

  return mappedStatus;
}

/**
 * List of ended reasons that indicate a failed call
 *
 * These reasons indicate the call did not successfully reach a live person
 * or deliver the intended message, so they should be marked as failed for retry.
 *
 * NOTE: "voicemail" is intentionally excluded - voicemail is a successful outcome.
 */
export const FAILED_ENDED_REASONS = [
  // Dialing failures
  "dial-busy",
  "dial-failed",
  "dial-no-answer",
  // Timeout failures
  "silence-timed-out",
  "customer-did-not-answer",
  "exceeded-max-duration",
  // Assistant/system errors
  "assistant-error",
  "assistant-not-found",
  "assistant-not-invalid",
  "assistant-not-provided",
  "assistant-request-failed",
  "assistant-request-returned-error",
  "assistant-request-returned-unspeakable-error",
  "assistant-request-returned-invalid-json",
  "assistant-request-returned-no-content",
  // Provider failures
  "twilio-failed-to-connect-call",
  "vonage-rejected",
  // Connection errors (partial match)
  "sip-outbound-call-failed",
  "failed-to-connect",
];

/**
 * Determines if a call should be marked as failed based on ended reason
 *
 * @param endedReason - VAPI ended reason
 * @param _metadata - Call metadata (unused, for API compatibility)
 * @returns True if call should be marked as failed
 */
export function shouldMarkAsFailed(
  endedReason?: string,
  _metadata?: Record<string, unknown>,
): boolean {
  if (!endedReason) return false;

  // Voicemail is never marked as failed - it's a successful outcome
  if (endedReason.toLowerCase().includes("voicemail")) {
    return false;
  }

  return FAILED_ENDED_REASONS.some((reason) =>
    endedReason.toLowerCase().includes(reason.toLowerCase()),
  );
}

/**
 * Determines if an inbound call should be marked as failed
 *
 * @param endedReason - VAPI ended reason
 * @returns True if inbound call should be marked as failed
 */
export function shouldMarkInboundCallAsFailed(endedReason?: string): boolean {
  if (!endedReason) return false;

  return FAILED_ENDED_REASONS.some((reason) =>
    endedReason.toLowerCase().includes(reason.toLowerCase()),
  );
}

/**
 * Map VAPI ended reason to our internal status
 *
 * @param endedReason - VAPI ended reason string
 * @param metadata - Call metadata including voicemail settings
 * @returns Final call status
 */
export function mapEndedReasonToStatus(
  endedReason?: string,
  metadata?: Record<string, unknown>,
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

  // Voicemail handling:
  // Always mark voicemail calls as completed - we do not retry voicemail.
  // The customer's voicemail was reached, which is a successful outcome.
  if (endedReason.toLowerCase().includes("voicemail")) {
    logger.debug("Voicemail detected - marking as completed", {
      endedReason,
      voicemailDetectionEnabled: metadata?.voicemail_detection_enabled,
      hangupOnVoicemail: metadata?.voicemail_hangup_on_detection,
      outcome: "completed (voicemail reached)",
    });

    return "completed";
  }

  // Failed calls
  if (shouldMarkAsFailed(endedReason, metadata)) {
    return "failed";
  }

  // Default to completed for unknown reasons
  return "completed";
}
