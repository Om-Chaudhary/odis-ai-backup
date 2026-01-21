/**
 * Detects calls where the user didn't respond or hung up early
 * These calls will have blank outcome columns (no badge displayed)
 */

import type { Database } from "@odis-ai/shared/types";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

/**
 * Determines if a call should have a blank outcome (no badge)
 *
 * IMPORTANT: If a call has an explicit outcome set (not null), always show the badge.
 * This function only applies to calls WITHOUT an outcome to determine if they should
 * be hidden based on no-response heuristics.
 *
 * Detection criteria (only when outcome is null):
 * - Very short duration (< 30 seconds)
 * - Ended due to no answer/timeout reasons
 * - Empty or minimal transcript content (< 50 characters)
 * - No user speech detected in transcript (only AI spoke)
 */
export function isNoResponseCall(call: InboundCall): boolean {
  // ALWAYS show badge if call has an explicit outcome set
  // This ensures backfilled outcomes and real-time outcomes are always displayed
  if (call.outcome) {
    return false;
  }

  // Check ended reason for explicit no-answer indicators
  if (call.ended_reason) {
    const noAnswerReasons = [
      "customer-did-not-answer",
      "dial-no-answer",
      "silence-timed-out",
      "customer-did-not-give-microphone-permission",
    ];

    if (
      noAnswerReasons.some((reason) =>
        call.ended_reason?.toLowerCase().includes(reason),
      )
    ) {
      return true;
    }
  }

  // Check for very short calls (< 30 seconds) - reduced threshold since we now rely on outcome
  if (call.duration_seconds && call.duration_seconds < 30) {
    return true;
  }

  // Check for empty or minimal transcript content
  const transcript = (call.transcript ?? "").trim();
  const transcriptLength = transcript.length;

  // Empty transcript = no response
  if (transcriptLength === 0) {
    return true;
  }

  // Minimal transcript (< 50 chars) = no response
  if (transcriptLength < 50) {
    return true;
  }

  // Check if user actually spoke (transcript has user turns)
  // If only the AI spoke, treat as no-response
  const hasUserSpeech = /\b(User|Customer|Client):/i.test(transcript);
  if (!hasUserSpeech) {
    return true;
  }

  return false;
}
