/**
 * Timezone utilities for consistent date handling across the app.
 *
 * All appointment/case dates are stored in UTC in the database.
 * These utilities handle converting between UTC and local timezone
 * for both querying (filtering by day) and display purposes.
 */

import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Default timezone for the application.
 * TODO: In the future, this should come from clinic settings in the database.
 */
export const DEFAULT_TIMEZONE = "America/Los_Angeles";

/**
 * Get the UTC boundaries for a specific day in a given timezone.
 *
 * This is the KEY function for fixing date filtering issues.
 * When a user selects "December 12" in their local timezone (e.g., PST),
 * we need to query for all timestamps that fall within December 12 PST,
 * which is different from December 12 UTC.
 *
 * @param date - The date to get boundaries for. Accepts:
 *   - Date object
 *   - YYYY-MM-DD string (recommended)
 *   - ISO string (e.g., "2024-12-12T08:00:00.000Z")
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @returns Object with startISO and endISO strings in UTC for use in database queries
 *
 * @example
 * // User selects December 12, 2024 in PST
 * const { startISO, endISO } = getLocalDayRange('2024-12-12', 'America/Los_Angeles');
 * // startISO = '2024-12-12T08:00:00.000Z' (midnight PST = 8am UTC)
 * // endISO = '2024-12-13T07:59:59.999Z' (11:59:59pm PST = 7:59am UTC next day)
 *
 * // Use in Supabase query:
 * query.gte('scheduled_at', startISO).lte('scheduled_at', endISO)
 */
export function getLocalDayRange(
  date: Date | string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): { startISO: string; endISO: string } {
  // Handle null/undefined by using current date
  if (!date) {
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    const startOfDayZoned = startOfDay(zonedNow);
    const endOfDayZoned = endOfDay(zonedNow);
    const startUTC = fromZonedTime(startOfDayZoned, timezone);
    const endUTC = fromZonedTime(endOfDayZoned, timezone);
    return {
      startISO: startUTC.toISOString(),
      endISO: endUTC.toISOString(),
    };
  }

  // Parse the date input
  let localDate: Date;

  if (typeof date === "string") {
    // Check if it's an ISO string (contains 'T' or 'Z')
    if (date.includes("T") || date.includes("Z")) {
      // ISO string - parse as UTC and convert to the target timezone
      const utcDate = new Date(date);
      if (!isNaN(utcDate.getTime())) {
        // Get the date in the target timezone
        const zonedDate = toZonedTime(utcDate, timezone);
        // Create a date at noon in the target timezone for that day
        localDate = new Date(
          zonedDate.getFullYear(),
          zonedDate.getMonth(),
          zonedDate.getDate(),
          12,
          0,
          0,
          0,
        );
      } else {
        // Invalid date, use current date
        localDate = new Date();
      }
    } else {
      // YYYY-MM-DD string - parse it as a local date
      const parts = date.split("-");
      const year = parseInt(parts[0] ?? "", 10);
      const month = parseInt(parts[1] ?? "", 10);
      const day = parseInt(parts[2] ?? "", 10);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Create a date object at noon to avoid any DST edge cases
        localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      } else {
        // Fallback: try parsing as regular date string
        localDate = new Date(date);
        if (isNaN(localDate.getTime())) {
          localDate = new Date(); // Use current date if parsing fails
        }
      }
    }
  } else {
    localDate = date;
  }

  // Get start of day (midnight) in the target timezone
  const zonedDate = toZonedTime(localDate, timezone);
  const startOfDayZoned = startOfDay(zonedDate);
  const endOfDayZoned = endOfDay(zonedDate);

  // Convert back to UTC for database queries
  const startUTC = fromZonedTime(startOfDayZoned, timezone);
  const endUTC = fromZonedTime(endOfDayZoned, timezone);

  return {
    startISO: startUTC.toISOString(),
    endISO: endUTC.toISOString(),
  };
}

/**
 * Convert a UTC timestamp to a formatted date string in the local timezone.
 *
 * @param utcTimestamp - UTC timestamp (ISO string or Date object)
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @param formatStr - date-fns format string (defaults to 'MMM d, yyyy')
 * @returns Formatted date string in the local timezone
 *
 * @example
 * formatLocalDate('2024-12-12T08:00:00.000Z', 'America/Los_Angeles')
 * // Returns 'Dec 12, 2024' (the UTC timestamp is midnight PST on Dec 12)
 */
export function formatLocalDate(
  utcTimestamp: string | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
  formatStr = "MMM d, yyyy",
): string {
  if (!utcTimestamp) return "";

  const date =
    typeof utcTimestamp === "string" ? new Date(utcTimestamp) : utcTimestamp;

  if (isNaN(date.getTime())) return "";

  return formatTz(date, formatStr, { timeZone: timezone });
}

/**
 * Convert a UTC timestamp to a formatted time string in the local timezone.
 *
 * @param utcTimestamp - UTC timestamp (ISO string or Date object)
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @param formatStr - date-fns format string (defaults to 'h:mm a')
 * @returns Formatted time string in the local timezone
 *
 * @example
 * formatLocalTime('2024-12-12T20:30:00.000Z', 'America/Los_Angeles')
 * // Returns '12:30 PM' (8:30pm UTC = 12:30pm PST)
 */
export function formatLocalTime(
  utcTimestamp: string | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
  formatStr = "h:mm a",
): string {
  if (!utcTimestamp) return "";

  const date =
    typeof utcTimestamp === "string" ? new Date(utcTimestamp) : utcTimestamp;

  if (isNaN(date.getTime())) return "";

  return formatTz(date, formatStr, { timeZone: timezone });
}

/**
 * Convert a UTC timestamp to a formatted date and time string in the local timezone.
 *
 * @param utcTimestamp - UTC timestamp (ISO string or Date object)
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @param formatStr - date-fns format string (defaults to 'MMM d, yyyy h:mm a')
 * @returns Formatted date and time string in the local timezone
 */
export function formatLocalDateTime(
  utcTimestamp: string | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
  formatStr = "MMM d, yyyy h:mm a",
): string {
  if (!utcTimestamp) return "";

  const date =
    typeof utcTimestamp === "string" ? new Date(utcTimestamp) : utcTimestamp;

  if (isNaN(date.getTime())) return "";

  return formatTz(date, formatStr, { timeZone: timezone });
}

/**
 * Convert a UTC timestamp to a Date object representing the same moment in the local timezone.
 * Useful when you need to do date comparisons or manipulations in local time.
 *
 * @param utcTimestamp - UTC timestamp (ISO string or Date object)
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @returns Date object in the local timezone
 */
export function toLocalDate(
  utcTimestamp: string | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): Date | null {
  if (!utcTimestamp) return null;

  const date =
    typeof utcTimestamp === "string" ? new Date(utcTimestamp) : utcTimestamp;

  if (isNaN(date.getTime())) return null;

  return toZonedTime(date, timezone);
}

/**
 * Get the current date in the specified timezone as a YYYY-MM-DD string.
 * Useful for getting "today" in the user's timezone.
 *
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayInTimezone(
  timezone: string = DEFAULT_TIMEZONE,
): string {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  return formatTz(zonedNow, "yyyy-MM-dd", { timeZone: timezone });
}

/**
 * Check if a UTC timestamp falls on a specific date in the local timezone.
 *
 * @param utcTimestamp - UTC timestamp to check
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @returns true if the timestamp falls on the specified date in local time
 */
export function isOnDate(
  utcTimestamp: string | Date | null | undefined,
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE,
): boolean {
  if (!utcTimestamp) return false;

  const { startISO, endISO } = getLocalDayRange(dateStr, timezone);
  const date =
    typeof utcTimestamp === "string" ? new Date(utcTimestamp) : utcTimestamp;

  if (isNaN(date.getTime())) return false;

  const timestamp = date.getTime();
  return (
    timestamp >= new Date(startISO).getTime() &&
    timestamp <= new Date(endISO).getTime()
  );
}

/**
 * Format a UTC timestamp as a relative time string (e.g., "2 hours ago").
 * Uses the local timezone to determine "today" and "yesterday".
 *
 * @param utcTimestamp - UTC timestamp
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @returns Relative time string
 */
export function formatRelativeTime(
  utcTimestamp: string | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): string {
  if (!utcTimestamp) return "";

  const date =
    typeof utcTimestamp === "string" ? new Date(utcTimestamp) : utcTimestamp;

  if (isNaN(date.getTime())) return "";

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
    return formatLocalDate(date, timezone);
  }
}

/**
 * Get a date range for common presets in the local timezone.
 *
 * @param preset - Preset name ('today', 'yesterday', 'last7days', 'last30days', 'thisWeek', 'thisMonth')
 * @param timezone - IANA timezone string (defaults to America/Los_Angeles)
 * @returns Object with startISO and endISO strings
 */
export function getPresetDateRange(
  preset:
    | "today"
    | "yesterday"
    | "last7days"
    | "last30days"
    | "thisWeek"
    | "thisMonth",
  timezone: string = DEFAULT_TIMEZONE,
): { startISO: string; endISO: string } {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);

  switch (preset) {
    case "today":
      return getLocalDayRange(zonedNow, timezone);

    case "yesterday": {
      const yesterday = new Date(zonedNow);
      yesterday.setDate(yesterday.getDate() - 1);
      return getLocalDayRange(yesterday, timezone);
    }

    case "last7days": {
      const sevenDaysAgo = new Date(zonedNow);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { startISO } = getLocalDayRange(sevenDaysAgo, timezone);
      const { endISO } = getLocalDayRange(zonedNow, timezone);
      return { startISO, endISO };
    }

    case "last30days": {
      const thirtyDaysAgo = new Date(zonedNow);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const { startISO } = getLocalDayRange(thirtyDaysAgo, timezone);
      const { endISO } = getLocalDayRange(zonedNow, timezone);
      return { startISO, endISO };
    }

    case "thisWeek": {
      // Start of week (Monday)
      const dayOfWeek = zonedNow.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(zonedNow);
      monday.setDate(monday.getDate() - daysToMonday);
      const { startISO } = getLocalDayRange(monday, timezone);
      const { endISO } = getLocalDayRange(zonedNow, timezone);
      return { startISO, endISO };
    }

    case "thisMonth": {
      const firstOfMonth = new Date(
        zonedNow.getFullYear(),
        zonedNow.getMonth(),
        1,
      );
      const { startISO } = getLocalDayRange(firstOfMonth, timezone);
      const { endISO } = getLocalDayRange(zonedNow, timezone);
      return { startISO, endISO };
    }

    default:
      return getLocalDayRange(zonedNow, timezone);
  }
}
