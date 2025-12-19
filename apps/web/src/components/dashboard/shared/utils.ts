/**
 * Shared utility functions for dashboard components
 */

import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";

/**
 * Format duration in seconds to human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "2m 30s" or "45s")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
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

  if (reason.includes("silence-timed-out")) {
    return {
      short: "No response from owner",
      detail:
        "The call connected but the owner did not respond. They may have been unavailable or the call went to a busy line.",
    };
  }
  if (
    reason.includes("customer-did-not-answer") ||
    reason.includes("dial-no-answer")
  ) {
    return {
      short: "Owner didn't answer",
      detail:
        "The phone rang but no one picked up. The owner may be unavailable.",
    };
  }
  if (reason.includes("dial-busy")) {
    return {
      short: "Line was busy",
      detail: "The owner's phone line was busy. They may be on another call.",
    };
  }
  if (reason.includes("voicemail")) {
    return {
      short: "Reached voicemail",
      detail:
        "The call went to voicemail. A message was not left per your settings.",
    };
  }
  if (
    reason.includes("sip") ||
    reason.includes("failed-to-connect") ||
    reason.includes("twilio")
  ) {
    return {
      short: "Connection failed",
      detail: "Unable to connect the call due to a network or carrier issue.",
    };
  }
  if (reason.includes("error")) {
    return {
      short: "Call error occurred",
      detail: "An error occurred during the call attempt.",
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

  if (reason.includes("silence-timed-out")) {
    return "No response";
  }
  if (
    reason.includes("customer-did-not-answer") ||
    reason.includes("dial-no-answer")
  ) {
    return "No pickup";
  }
  if (reason.includes("dial-busy")) {
    return "Line busy";
  }
  if (reason.includes("voicemail")) {
    return "Voicemail";
  }
  if (
    reason.includes("sip") ||
    reason.includes("failed-to-connect") ||
    reason.includes("twilio")
  ) {
    return "Connection error";
  }
  if (reason.includes("error")) {
    return "Call error";
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
