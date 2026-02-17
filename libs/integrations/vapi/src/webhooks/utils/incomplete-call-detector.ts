/**
 * Incomplete Call Detector
 *
 * Multi-signal detector that identifies inbound calls that should NOT
 * receive fallback outcomes (Priority 3/4). These are calls where
 * VAPI returns a card_type in analysis.structuredData even though
 * no real conversation occurred (voicemails, early hang-ups, greeting-only calls).
 *
 * @module vapi/webhooks/utils/incomplete-call-detector
 */

import { loggers } from "@odis-ai/shared/logger";
import type { VapiMessage } from "../types";

const logger = loggers.webhook.child("incomplete-call-detector");

/**
 * Ended reasons that indicate no real conversation took place
 */
const NO_CONVERSATION_ENDED_REASONS = [
  "silence-timed-out",
  "customer-did-not-answer",
  "dial-busy",
  "dial-failed",
  "dial-no-answer",
  "assistant-error",
  "assistant-not-found",
  "assistant-not-provided",
  "assistant-request-failed",
  "twilio-failed-to-connect-call",
  "vonage-rejected",
  "failed-to-connect",
];

/** Hard cutoff — greeting-only territory */
const HARD_DURATION_CUTOFF_SECONDS = 15;

/** Soft cutoff — requires meaningful user speech */
const SOFT_DURATION_CUTOFF_SECONDS = 30;

/** Minimum chars of user speech for soft cutoff */
const MIN_USER_SPEECH_CHARS = 100;

interface IncompleteCallInput {
  durationSeconds: number | null;
  transcript: string | null;
  messages: VapiMessage[] | unknown[] | null;
  endedReason: string | null | undefined;
}

/**
 * Determine if an inbound call is "incomplete" — meaning it should NOT
 * receive a fallback outcome from VAPI's card_type analysis.
 *
 * An incomplete call is one where no meaningful conversation occurred:
 * - The endedReason indicates no conversation (silence, no answer, etc.)
 * - Duration < 15s (hard cutoff — greeting-only territory)
 * - No user speech detected in messages
 * - Duration < 30s AND < 100 chars of user speech
 *
 * Priority 1 (reschedule/cancel) and Priority 2 (tool-set) outcomes
 * are NOT affected — they are always trusted.
 */
export function isIncompleteInboundCall(input: IncompleteCallInput): boolean {
  const { durationSeconds, transcript, messages, endedReason } = input;

  // Signal 1: endedReason is a no-conversation type
  if (endedReason && isNoConversationEndedReason(endedReason)) {
    logger.info("Incomplete call detected: no-conversation endedReason", {
      endedReason,
      durationSeconds,
    });
    return true;
  }

  // Signal 2: Hard duration cutoff (< 15s)
  if (
    durationSeconds !== null &&
    durationSeconds < HARD_DURATION_CUTOFF_SECONDS
  ) {
    logger.info("Incomplete call detected: duration below hard cutoff", {
      durationSeconds,
      cutoff: HARD_DURATION_CUTOFF_SECONDS,
    });
    return true;
  }

  // Signal 3: No user speech in messages
  const userSpeech = extractUserSpeech(messages);
  if (userSpeech.length === 0 && hasNoUserSpeechInTranscript(transcript)) {
    logger.info("Incomplete call detected: no user speech", {
      durationSeconds,
      hasMessages: !!messages?.length,
      transcriptLength: transcript?.length ?? 0,
    });
    return true;
  }

  // Signal 4: Soft cutoff — short call with minimal user speech
  const totalUserChars = userSpeech.reduce((sum, text) => sum + text.length, 0);
  if (
    durationSeconds !== null &&
    durationSeconds < SOFT_DURATION_CUTOFF_SECONDS &&
    totalUserChars < MIN_USER_SPEECH_CHARS
  ) {
    logger.info("Incomplete call detected: short call with minimal speech", {
      durationSeconds,
      totalUserChars,
      softCutoff: SOFT_DURATION_CUTOFF_SECONDS,
      minChars: MIN_USER_SPEECH_CHARS,
    });
    return true;
  }

  return false;
}

/**
 * Check if the endedReason indicates no conversation took place
 */
function isNoConversationEndedReason(endedReason: string): boolean {
  const normalized = endedReason.toLowerCase();
  return NO_CONVERSATION_ENDED_REASONS.some((reason) =>
    normalized.includes(reason.toLowerCase()),
  );
}

/**
 * Extract user speech text from VapiMessage array
 */
function extractUserSpeech(
  messages: VapiMessage[] | unknown[] | null,
): string[] {
  if (!messages || !Array.isArray(messages)) return [];

  const result: string[] = [];
  for (const msg of messages) {
    const m = msg as VapiMessage;
    if (m.role === "user") {
      const text = (m.message ?? m.content ?? "").trim();
      if (text.length > 0) {
        result.push(text);
      }
    }
  }
  return result;
}

/**
 * Check if transcript contains no identifiable user speech.
 * Looks for "User:" lines in the transcript text.
 */
function hasNoUserSpeechInTranscript(transcript: string | null): boolean {
  if (!transcript) return true;

  // VAPI transcripts typically format as "AI: ..." and "User: ..."
  const userLines = transcript
    .split("\n")
    .filter((line) => /^user\s*:/i.test(line.trim()));

  // Check if any user line has meaningful content (not just empty)
  return !userLines.some((line) => {
    const content = line.replace(/^user\s*:\s*/i, "").trim();
    return content.length > 0;
  });
}

/**
 * Remove VAPI-generated action card fields from structured data
 * for calls that are incomplete. Preserves tool-stored appointment data.
 */
export function sanitizeIncompleteCallStructuredData(
  structuredData: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!structuredData) return null;

  const sanitized = { ...structuredData };

  // Remove VAPI analysis-generated card fields
  delete sanitized.card_type;
  delete sanitized.callback_data;
  delete sanitized.info_data;
  delete sanitized.emergency_data;

  // Preserve tool-stored data: appointment, appointment_data (from book_appointment tool)

  // If nothing meaningful left, return null
  const remainingKeys = Object.keys(sanitized);
  if (remainingKeys.length === 0) return null;

  return sanitized;
}
