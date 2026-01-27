/**
 * Additional Time Formatting Utilities
 *
 * Note: formatRelativeTime is available from ./timezone
 */

/**
 * Formats a duration in seconds to a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2m 30s", "45s")
 */
export function formatDurationHuman(
  seconds: number | null | undefined,
): string {
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
export function formatShortDateTime(timestamp: string | Date | number): string {
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
