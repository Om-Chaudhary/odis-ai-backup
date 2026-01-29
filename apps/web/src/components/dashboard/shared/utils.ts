/**
 * Shared utility functions for dashboard components
 */

import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";

/**
 * Format duration in seconds to human-readable string
 *
 * Examples:
 * - 45 → "45s"
 * - 90 → "1m 30s"
 * - 3665 → "1h 1m"
 *
 * @param seconds Duration in seconds (or null/undefined)
 * @returns Formatted string, or em dash for null/undefined/zero
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Format schedule time to display relative or absolute time
 * @param isoString ISO datetime string
 * @returns Object with relative time, absolute time, and isPast flag
 */
export function formatScheduleTime(isoString: string | null): {
  relative: string;
  absolute: string;
  isPast: boolean;
} | null {
  if (!isoString) return null;
  try {
    const date = parseISO(isoString);
    const isDatePast = isPast(date);
    const relativeTime = formatDistanceToNow(date, { addSuffix: true });
    const absoluteTime = format(date, "EEE, MMM d 'at' h:mm a");

    return {
      relative: isDatePast ? "Ready to send" : relativeTime,
      absolute: absoluteTime,
      isPast: isDatePast,
    };
  } catch {
    return null;
  }
}

/**
 * Get a friendly failure reason from VAPI ended_reason
 * @param endedReason The ended_reason from VAPI call
 * @param emailFailed Whether email delivery failed
 * @returns Object with short label and detailed description
 */
export function getFailureReason(
  endedReason: string | null | undefined,
  emailFailed?: boolean,
): { short: string; detail: string } {
  // Handle email-only failures
  if (emailFailed && !endedReason) {
    return {
      short: "Email delivery failed",
      detail: "The email could not be delivered to the recipient.",
    };
  }

  if (!endedReason) {
    return {
      short: "Delivery failed",
      detail: "Communications could not be delivered.",
    };
  }

  const reason = endedReason.toLowerCase();

  // Voicemail outcomes
  if (reason.includes("voicemail")) {
    return {
      short: "Reached voicemail",
      detail:
        "The call went to voicemail. A message was not left per your settings.",
    };
  }

  // No answer outcomes
  if (
    reason.includes("customer-did-not-answer") ||
    reason.includes("dial-no-answer") ||
    reason.includes("no-answer")
  ) {
    return {
      short: "No answer",
      detail:
        "The phone rang but no one picked up. The owner may be unavailable.",
    };
  }

  // Timeout/silence outcomes
  if (
    reason.includes("silence-timed-out") ||
    reason.includes("silence-timeout")
  ) {
    return {
      short: "No response",
      detail:
        "The call connected but the owner did not respond. They may have been unavailable.",
    };
  }

  if (reason.includes("exceeded-max-duration")) {
    return {
      short: "Call too long",
      detail: "The call exceeded the maximum allowed duration and was ended.",
    };
  }

  // Connection failures
  if (reason.includes("dial-failed")) {
    return {
      short: "Call failed",
      detail:
        "The call could not be connected. Please verify the phone number.",
    };
  }

  if (
    reason.includes("sip") ||
    reason.includes("failed-to-connect") ||
    reason.includes("twilio") ||
    reason.includes("connection")
  ) {
    return {
      short: "Connection failed",
      detail: "Unable to connect the call due to a network or carrier issue.",
    };
  }

  // Busy/rejected outcomes
  if (reason.includes("dial-busy") || reason.includes("busy")) {
    return {
      short: "Line busy",
      detail: "The owner's phone line was busy. They may be on another call.",
    };
  }

  if (reason.includes("rejected") || reason.includes("vonage-rejected")) {
    return {
      short: "Call declined",
      detail: "The call was declined by the recipient or carrier.",
    };
  }

  // Assistant/system errors
  if (reason.includes("assistant") || reason.includes("error")) {
    return {
      short: "System error",
      detail: "A system error occurred during the call attempt.",
    };
  }

  return {
    short: "Delivery failed",
    detail: "Communications could not be delivered.",
  };
}

/**
 * Get short failure reason (for compact displays like table badges)
 * @param endedReason The ended_reason from VAPI call
 * @param emailFailed Whether email delivery failed
 * @returns Short label string
 */
export function getShortFailureReason(
  endedReason: string | null | undefined,
  emailFailed?: boolean,
): string {
  if (emailFailed && !endedReason) {
    return "Email failed";
  }

  if (!endedReason) {
    return "Failed";
  }

  const reason = endedReason.toLowerCase();

  // Voicemail
  if (reason.includes("voicemail")) {
    return "Voicemail";
  }

  // No answer
  if (
    reason.includes("customer-did-not-answer") ||
    reason.includes("dial-no-answer") ||
    reason.includes("no-answer")
  ) {
    return "No answer";
  }

  // Timeout/silence
  if (
    reason.includes("silence-timed-out") ||
    reason.includes("silence-timeout")
  ) {
    return "No response";
  }

  if (reason.includes("exceeded-max-duration")) {
    return "Too long";
  }

  // Connection failures
  if (reason.includes("dial-failed")) {
    return "Call failed";
  }

  if (
    reason.includes("sip") ||
    reason.includes("failed-to-connect") ||
    reason.includes("twilio") ||
    reason.includes("connection")
  ) {
    return "Connection failed";
  }

  // Busy/rejected
  if (reason.includes("dial-busy") || reason.includes("busy")) {
    return "Line busy";
  }

  if (reason.includes("rejected") || reason.includes("vonage-rejected")) {
    return "Call declined";
  }

  // System errors
  if (reason.includes("assistant") || reason.includes("error")) {
    return "System error";
  }

  return "Failed";
}

/**
 * Format timestamp for display
 * @param timestamp ISO datetime string
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(timestamp: string): string {
  try {
    return format(new Date(timestamp), "h:mm a");
  } catch {
    return "-";
  }
}
