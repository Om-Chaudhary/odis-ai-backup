/**
 * Detects calls where the user didn't respond or hung up early
 * These calls will have blank outcome columns (no badge displayed)
 */

import type { Database } from "@odis-ai/shared/types";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

/**
 * Determines if a call should have a blank outcome (no badge)
 *
 * Detection criteria:
 * - Very short duration (< 30 seconds)
 * - Ended due to no answer/timeout reasons
 * - Very minimal transcript content (< 50 characters)
 */
export function isNoResponseCall(call: InboundCall): boolean {
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

  // Check for very short calls (< 30 seconds)
  if (call.duration_seconds && call.duration_seconds < 30) {
    return true;
  }

  // Check for minimal transcript content (< 50 characters)
  // This catches cases where someone said a word or two and hung up
  const transcriptLength = (call.transcript ?? "").trim().length;
  if (transcriptLength > 0 && transcriptLength < 50) {
    return true;
  }

  return false;
}
