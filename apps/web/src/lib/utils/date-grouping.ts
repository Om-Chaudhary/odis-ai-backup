/**
 * Date grouping utilities for call history
 */

export type DateGroup = "today" | "yesterday" | "this_week" | "older";

export interface DateGroupLabel {
  group: DateGroup;
  label: string;
  description: string;
}

/**
 * Get the date group for a given timestamp
 */
export function getDateGroup(timestamp: string | Date): DateGroup {
  const date = new Date(timestamp);
  const now = new Date();

  // Reset time to midnight for accurate day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const callDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
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
 * @param items - Array of items with created_at timestamp
 * @returns Map of date groups to items
 */
export function groupByDate<T extends { created_at: string }>(
  items: T[],
): Map<DateGroup, T[]> {
  const groups = new Map<DateGroup, T[]>([
    ["today", []],
    ["yesterday", []],
    ["this_week", []],
    ["older", []],
  ]);

  items.forEach((item) => {
    const group = getDateGroup(item.created_at);
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
 */
export function formatDateInGroup(
  timestamp: string | Date,
  group: DateGroup,
): string {
  const date = new Date(timestamp);

  if (group === "today" || group === "yesterday") {
    // Show time for recent calls
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    // Show date for older calls
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else {
    // For older dates, return formatted date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}
