/**
 * Date/Time Utilities
 *
 * Shared date and time manipulation functions for sync operations.
 */

/**
 * Date range type
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Build a date range from parameters
 *
 * Supports multiple input formats:
 * - Explicit start/end dates (YYYY-MM-DD strings)
 * - Start date + days ahead
 * - Default: today + N days ahead
 *
 * @param startDateStr - Start date (YYYY-MM-DD) or undefined for today
 * @param endDateStr - End date (YYYY-MM-DD) or undefined to calculate from daysAhead
 * @param daysAhead - Number of days ahead from start (default: 7)
 * @returns Date range with start at 00:00:00 and end at 23:59:59
 */
export function buildDateRange(
  startDateStr?: string,
  endDateStr?: string,
  daysAhead = 7,
): DateRange {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  start.setHours(0, 0, 0, 0);

  const end = endDateStr
    ? new Date(endDateStr)
    : new Date(start.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Calculate end time from start time + duration
 *
 * @param startTime - Start time in HH:MM format
 * @param durationMinutes - Duration in minutes (default: 15)
 * @returns End time in HH:MM format
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes = 15,
): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Normalize a date string to a Date object
 *
 * @param dateStr - Date string (YYYY-MM-DD)
 * @returns Date object at 00:00:00
 */
export function normalizeDate(dateStr: string): Date {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
}
