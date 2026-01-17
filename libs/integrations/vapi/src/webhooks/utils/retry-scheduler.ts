/**
 * Retry Scheduling Utilities
 *
 * Handles retry logic for failed calls including eligibility
 * determination and exponential backoff timing.
 *
 * @module vapi/webhooks/utils/retry-scheduler
 */

import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.webhook.child("retry-scheduler");

/**
 * Reasons that should trigger a retry
 * These are transient failures where trying again later might succeed
 *
 * NOTE: "voicemail" is intentionally excluded - we do NOT retry voicemail calls.
 * If voicemail detection is enabled and hangup is configured, the call is marked
 * as completed (voicemail reached) rather than failed, so no retry is needed.
 */
export const RETRYABLE_REASONS = [
  "dial-busy",
  "dial-no-answer",
  "silence-timed-out",
  "customer-did-not-answer",
];

/**
 * Default maximum number of retries
 */
export const DEFAULT_MAX_RETRIES = 3;

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
 * Retry decision result
 */
export interface RetryDecision {
  /** Whether the call should be retried */
  shouldRetry: boolean;
  /** Delay in milliseconds before retry */
  delayMs: number;
  /** Human-readable reason for the decision */
  reason: string;
}

/**
 * Evaluate whether a call should be retried and when
 *
 * @param endedReason - VAPI ended reason
 * @param metadata - Call metadata including retry count
 * @returns Retry decision with timing
 */
export function evaluateRetry(
  endedReason: string | undefined,
  metadata?: Record<string, unknown>,
): RetryDecision {
  const retryCount = (metadata?.retry_count as number) ?? 0;
  const maxRetries = (metadata?.max_retries as number) ?? DEFAULT_MAX_RETRIES;

  if (!shouldRetry(endedReason, metadata)) {
    return {
      shouldRetry: false,
      delayMs: 0,
      reason: `Ended reason "${endedReason}" is not retryable`,
    };
  }

  if (retryCount >= maxRetries) {
    return {
      shouldRetry: false,
      delayMs: 0,
      reason: `Max retries (${maxRetries}) reached`,
    };
  }

  const delayMinutes = calculateRetryDelay(retryCount);
  return {
    shouldRetry: true,
    delayMs: delayMinutes * 60 * 1000,
    reason: `Scheduling retry ${retryCount + 1} of ${maxRetries} in ${delayMinutes} minutes`,
  };
}
