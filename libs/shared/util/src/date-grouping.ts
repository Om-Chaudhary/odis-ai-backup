/**
 * Date grouping utilities for call history
 *
 * Uses timezone-aware date handling to ensure consistent grouping
 * regardless of where the code runs (client or server).
 */

import { toZonedTime, format as formatTz } from "date-fns-tz";
import { DEFAULT_TIMEZONE, formatRelativeTime } from "./timezone";

export type DateGroup = "today" | "yesterday" | "this_week" | "older";

export interface DateGroupLabel {
  group: DateGroup;
  label: string;
  description: string;
}

/**
 * Get the date group for a given timestamp
 *
 * @param timestamp - UTC timestamp (ISO string or Date)
 * @param timezone - IANA timezone string (defaults to DEFAULT_TIMEZONE)
 */
export function getDateGroup(
  timestamp: string | Date,
  timezone: string = DEFAULT_TIMEZONE,
): DateGroup {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();

  // Convert both dates to the target timezone for comparison
  const zonedDate = toZonedTime(date, timezone);
  const zonedNow = toZonedTime(now, timezone);

  // Reset time to midnight for accurate day comparison
  const today = new Date(
    zonedNow.getFullYear(),
    zonedNow.getMonth(),
    zonedNow.getDate(),
  );
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const callDate = new Date(
    zonedDate.getFullYear(),
    zonedDate.getMonth(),
    zonedDate.getDate(),
  );

  if (callDate.getTime() === today.getTime()) {
    return "today";
  } else if (callDate.getTime() === yesterday.getTime()) {
    return "yesterday";
  } else if (callDate.getTime() >= oneWeekAgo.getTime()) {
    return "this_week";
  } else {
    return "older";
  }
}

/**
 * Get label and description for a date group
 */
export function getDateGroupLabel(
  group: DateGroup,
  count: number,
): DateGroupLabel {
  const labels: Record<DateGroup, { label: string; description: string }> = {
    today: {
      label: "Today",
      description: `${count} ${count === 1 ? "call" : "calls"} today`,
    },
    yesterday: {
      label: "Yesterday",
      description: `${count} ${count === 1 ? "call" : "calls"} yesterday`,
    },
    this_week: {
      label: "This Week",
      description: `${count} ${count === 1 ? "call" : "calls"} this week`,
    },
    older: {
      label: "Older",
      description: `${count} ${count === 1 ? "call" : "calls"} from before this week`,
    },
  };

  return {
    group,
    ...labels[group],
  };
}

/**
 * Group an array of items by date
 *
 * @param items - Array of items with created_at timestamp
 * @param timezone - IANA timezone string (defaults to DEFAULT_TIMEZONE)
 * @returns Map of date groups to items
 */
export function groupByDate<T extends { created_at: string }>(
  items: T[],
  timezone: string = DEFAULT_TIMEZONE,
): Map<DateGroup, T[]> {
  const groups = new Map<DateGroup, T[]>([
    ["today", []],
    ["yesterday", []],
    ["this_week", []],
    ["older", []],
  ]);

  items.forEach((item) => {
    const group = getDateGroup(item.created_at, timezone);
    groups.get(group)?.push(item);
  });

  return groups;
}

/**
 * Sort date groups in chronological order (today first, older last)
 */
export const DATE_GROUP_ORDER: DateGroup[] = [
  "today",
  "yesterday",
  "this_week",
  "older",
];

/**
 * Format a date for display in a specific group
 *
 * @param timestamp - UTC timestamp (ISO string or Date)
 * @param group - The date group this timestamp belongs to
 * @param timezone - IANA timezone string (defaults to DEFAULT_TIMEZONE)
 */
export function formatDateInGroup(
  timestamp: string | Date,
  group: DateGroup,
  timezone: string = DEFAULT_TIMEZONE,
): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  if (group === "today" || group === "yesterday") {
    // Show time for recent calls
    return formatTz(date, "h:mm a", { timeZone: timezone });
  } else {
    // Show date for older calls
    const now = new Date();
    const zonedDate = toZonedTime(date, timezone);
    const zonedNow = toZonedTime(now, timezone);
    const sameYear = zonedDate.getFullYear() === zonedNow.getFullYear();

    if (sameYear) {
      return formatTz(date, "MMM d", { timeZone: timezone });
    } else {
      return formatTz(date, "MMM d, yyyy", { timeZone: timezone });
    }
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 *
 * @param timestamp - UTC timestamp (ISO string or Date)
 * @param timezone - IANA timezone string (defaults to DEFAULT_TIMEZONE)
 *
 * @deprecated Use formatRelativeTime from timezone.ts instead
 */
export function getRelativeTime(
  timestamp: string | Date,
  timezone: string = DEFAULT_TIMEZONE,
): string {
  return formatRelativeTime(timestamp, timezone);
}
