/**
 * Relative Time Utilities
 *
 * Formats timestamps as human-readable relative times:
 * - Within 48 hours: "about X hours ago"
 * - Over 48 hours: "X days ago"
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const TWO_DAYS_MS = 2 * DAY_MS;

/**
 * Formats a timestamp as a relative time string.
 *
 * @param timestamp - The timestamp to format (Date, string, or number)
 * @param now - Optional reference time (defaults to current time)
 * @returns Formatted relative time string
 *
 * @example
 * // Returns "about 5 hours ago"
 * formatRelativeTime(new Date(Date.now() - 5 * 60 * 60 * 1000))
 *
 * @example
 * // Returns "3 days ago"
 * formatRelativeTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
 */
export function formatRelativeTime(
  timestamp: string | Date | number,
  now: Date = new Date()
): string {
  const date =
    timestamp instanceof Date
      ? timestamp
      : typeof timestamp === "number"
        ? new Date(timestamp)
        : new Date(timestamp);

  const diffMs = now.getTime() - date.getTime();

  // Future timestamps
  if (diffMs < 0) {
    return formatFutureTime(Math.abs(diffMs));
  }

  // Less than 1 minute ago
  if (diffMs < 60 * 1000) {
    return "just now";
  }

  // Less than 1 hour ago
  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / (60 * 1000));
    return minutes === 1 ? "about 1 minute ago" : `about ${minutes} minutes ago`;
  }

  // Within 48 hours: show hours
  if (diffMs < TWO_DAYS_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return hours === 1 ? "about 1 hour ago" : `about ${hours} hours ago`;
  }

  // Over 48 hours: show days
  const days = Math.floor(diffMs / DAY_MS);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

/**
 * Formats a future time difference.
 */
function formatFutureTime(diffMs: number): string {
  if (diffMs < 60 * 1000) {
    return "in a moment";
  }

  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / (60 * 1000));
    return minutes === 1 ? "in about 1 minute" : `in about ${minutes} minutes`;
  }

  if (diffMs < TWO_DAYS_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return hours === 1 ? "in about 1 hour" : `in about ${hours} hours`;
  }

  const days = Math.floor(diffMs / DAY_MS);
  return days === 1 ? "in 1 day" : `in ${days} days`;
}

/**
 * Formats a duration in seconds to a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2m 30s", "45s")
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) {
    return "--";
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Formats a timestamp as a short date/time string.
 *
 * @param timestamp - The timestamp to format
 * @returns Formatted string like "Jan 25 at 2:30 PM"
 */
export function formatShortDateTime(
  timestamp: string | Date | number
): string {
  const date =
    timestamp instanceof Date
      ? timestamp
      : typeof timestamp === "number"
        ? new Date(timestamp)
        : new Date(timestamp);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
