/**
 * VAPI Webhook Utilities
 *
 * Shared utility functions for webhook processing including
 * status mapping, retry logic, and call data transformation.
 *
 * @module vapi/webhooks/utils
 */

import { loggers } from "@odis-ai/logger";
import type {
  VapiAnalysis,
  VapiArtifact,
  VapiCost,
  VapiWebhookCall,
} from "./types";

const logger = loggers.webhook.child("utils");

// =============================================================================
// Status Mapping
// =============================================================================

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

// =============================================================================
// Failure Detection
// =============================================================================

/**
 * List of ended reasons that indicate a failed call
 *
 * These reasons indicate the call did not successfully reach a live person
 * or deliver the intended message, so they should be marked as failed for retry.
 *
 * NOTE: "voicemail" is intentionally excluded - voicemail is a successful outcome.
 */
const FAILED_ENDED_REASONS = [
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
 * @param metadata - Call metadata including voicemail settings
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

// =============================================================================
// Retry Logic
// =============================================================================

/**
 * Reasons that should trigger a retry
 * These are transient failures where trying again later might succeed
 *
 * NOTE: "voicemail" is intentionally excluded - we do NOT retry voicemail calls.
 * If voicemail detection is enabled and hangup is configured, the call is marked
 * as completed (voicemail reached) rather than failed, so no retry is needed.
 */
const RETRYABLE_REASONS = [
  "dial-busy",
  "dial-no-answer",
  "silence-timed-out",
  "customer-did-not-answer",
];

/**
 * Determine if a call should be retried based on ended reason
 *
 * @param endedReason - VAPI ended reason
 * @param metadata - Call metadata including voicemail settings
 * @returns True if call should be retried
 */
export function shouldRetry(
  endedReason?: string,
  metadata?: Record<string, unknown>,
): boolean {
  // Never retry voicemail calls - voicemail is considered a successful outcome
  // whether we left a message or hung up. The customer has been reached.
  if (endedReason?.toLowerCase().includes("voicemail")) {
    logger.debug("Voicemail detected - no retry", {
      endedReason,
      voicemailDetectionEnabled: metadata?.voicemail_detection_enabled,
      hangupOnVoicemail: metadata?.voicemail_hangup_on_detection,
      reason: "Voicemail calls are never retried",
    });

    return false;
  }

  return RETRYABLE_REASONS.some((reason) =>
    endedReason?.toLowerCase().includes(reason.toLowerCase()),
  );
}

/**
 * Calculate retry delay with exponential backoff
 *
 * @param retryCount - Current retry count (0-indexed)
 * @returns Delay in minutes
 */
export function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff: 5, 10, 20 minutes
  return Math.pow(2, retryCount) * 5;
}

/**
 * Default maximum number of retries
 */
export const DEFAULT_MAX_RETRIES = 3;

// =============================================================================
// Cost Calculation
// =============================================================================

/**
 * Calculates total cost from VAPI costs array
 *
 * @param costs - Array of VAPI cost objects
 * @returns Total cost in USD
 */
export function calculateTotalCost(costs?: VapiCost[]): number {
  if (!costs || costs.length === 0) return 0;
  return costs.reduce((total, cost) => total + cost.amount, 0);
}

// =============================================================================
// Duration Calculation
// =============================================================================

/**
 * Calculate call duration in seconds
 *
 * @param startedAt - Call start timestamp
 * @param endedAt - Call end timestamp
 * @returns Duration in seconds, or null if cannot be calculated
 */
export function calculateDuration(
  startedAt?: string,
  endedAt?: string,
): number | null {
  if (!startedAt || !endedAt) return null;

  try {
    const startTime = new Date(startedAt).getTime();
    const endTime = new Date(endedAt).getTime();

    if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) {
      return null;
    }

    return Math.floor((endTime - startTime) / 1000);
  } catch {
    return null;
  }
}

// =============================================================================
// Sentiment Analysis
// =============================================================================

/**
 * Sentiment types
 */
export type Sentiment = "positive" | "neutral" | "negative";

/**
 * Extract sentiment from analysis data
 *
 * @param analysis - VAPI analysis object
 * @returns Detected sentiment
 */
export function extractSentiment(analysis?: VapiAnalysis): Sentiment {
  if (!analysis?.successEvaluation) return "neutral";

  const evalLower = analysis.successEvaluation.toLowerCase();

  if (evalLower.includes("success") || evalLower.includes("positive")) {
    return "positive";
  }

  if (evalLower.includes("fail") || evalLower.includes("negative")) {
    return "negative";
  }

  return "neutral";
}

// =============================================================================
// Call Direction Detection
// =============================================================================

/**
 * Determine if a call is inbound based on call type
 *
 * @param call - VAPI call object
 * @returns True if call is inbound
 */
export function isInboundCall(call?: VapiWebhookCall): boolean {
  return call?.type === "inboundPhoneCall";
}

/**
 * Get the appropriate table name for a call
 *
 * @param isInbound - Whether the call is inbound
 * @returns Table name
 */
export function getCallTableName(isInbound: boolean): string {
  return isInbound ? "inbound_vapi_calls" : "scheduled_discharge_calls";
}

// =============================================================================
// Data Enrichment
// =============================================================================

/**
 * Merge message-level fields with call-level fields for end-of-call-report
 *
 * VAPI sends some fields directly on message for end-of-call-report events,
 * not nested inside message.call. This function merges them.
 *
 * @param call - Call object from message.call
 * @param message - Full message object
 * @returns Enriched call object
 */
export function enrichCallFromMessage(
  call: VapiWebhookCall,
  message: {
    startedAt?: string;
    endedAt?: string;
    transcript?: string;
    recordingUrl?: string;
    endedReason?: string;
    analysis?: VapiAnalysis;
    cost?: number;
    artifact?: VapiArtifact;
  },
): VapiWebhookCall {
  return {
    ...call,
    // Prefer message-level fields (VAPI's primary location for end-of-call-report)
    startedAt: message.startedAt ?? call.startedAt,
    endedAt: message.endedAt ?? call.endedAt,
    transcript: message.transcript ?? call.transcript,
    recordingUrl: message.recordingUrl ?? call.recordingUrl,
    endedReason: message.endedReason ?? call.endedReason,
    analysis: message.analysis ?? call.analysis,
    // Cost comes as a single number on message, but as array on call
    costs:
      call.costs ??
      (message.cost
        ? [{ amount: message.cost, description: "total" }]
        : undefined),
  };
}

// =============================================================================
// Logging Helpers
// =============================================================================

/**
 * Format call info for logging
 *
 * @param call - VAPI call object
 * @returns Formatted log object
 */
export function formatCallForLog(
  call?: VapiWebhookCall,
): Record<string, unknown> {
  if (!call) return { callId: "unknown" };

  return {
    callId: call.id,
    type: call.type,
    status: call.status,
    assistantId: call.assistantId,
    customerNumber: call.customer?.number,
    phoneNumberId: call.phoneNumber?.id,
  };
}

/**
 * Format webhook message for logging
 *
 * @param messageType - Webhook message type
 * @param call - VAPI call object
 * @returns Formatted log object
 */
export function formatWebhookForLog(
  messageType: string,
  call?: VapiWebhookCall,
): Record<string, unknown> {
  return {
    type: messageType,
    ...formatCallForLog(call),
    timestamp: new Date().toISOString(),
  };
}
