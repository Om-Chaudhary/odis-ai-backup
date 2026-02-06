/**
 * Time Range Utilities
 *
 * Utilities for working with PostgreSQL tstzrange (timestamp with timezone range)
 * types in TypeScript. Used for the V2 time range-based scheduling system.
 */

import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Represents a time range with start and end timestamps
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Creates a time range from date and time strings
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param startTime - Start time in HH:MM or HH:MM:SS format
 * @param endTime - End time in HH:MM or HH:MM:SS format
 * @param timezone - Timezone identifier (default: America/Los_Angeles)
 * @returns TimeRange with start and end as Date objects
 *
 * @example
 * const range = createTimeRange('2026-02-05', '09:00', '09:30', 'America/Los_Angeles');
 * // { start: Date, end: Date }
 */
export function createTimeRange(
  date: string,
  startTime: string,
  endTime: string,
  timezone = "America/Los_Angeles",
): TimeRange {
  // Pad times to HH:MM:SS format
  const normalizedStart = startTime.padEnd(8, ":00");
  const normalizedEnd = endTime.padEnd(8, ":00");

  const startStr = `${date}T${normalizedStart}`;
  const endStr = `${date}T${normalizedEnd}`;

  return {
    start: fromZonedTime(startStr, timezone),
    end: fromZonedTime(endStr, timezone),
  };
}

/**
 * Creates a time range from start time and duration in minutes
 *
 * @param startTime - Start timestamp
 * @param durationMinutes - Duration in minutes
 * @returns TimeRange with calculated end time
 */
export function createTimeRangeFromDuration(
  startTime: Date,
  durationMinutes: number,
): TimeRange {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  return {
    start: startTime,
    end: endTime,
  };
}

/**
 * Converts a TimeRange to PostgreSQL tstzrange string format
 * Uses inclusive start and exclusive end: [start, end)
 *
 * @param range - TimeRange to convert
 * @returns PostgreSQL tstzrange string
 *
 * @example
 * timeRangeToPostgres({ start: new Date('2026-02-05T09:00:00Z'), end: new Date('2026-02-05T09:30:00Z') })
 * // "[2026-02-05T09:00:00.000Z,2026-02-05T09:30:00.000Z)"
 */
export function timeRangeToPostgres(range: TimeRange): string {
  return `[${range.start.toISOString()},${range.end.toISOString()})`;
}

/**
 * Parses a PostgreSQL tstzrange string into a TimeRange
 * Handles both formats: [start,end) and (start,end]
 *
 * @param rangeStr - PostgreSQL tstzrange string
 * @returns TimeRange with start and end as Date objects
 * @throws Error if the range string is invalid
 *
 * @example
 * parsePostgresTimeRange("[2026-02-05T09:00:00Z,2026-02-05T09:30:00Z)")
 * // { start: Date, end: Date }
 */
export function parsePostgresTimeRange(rangeStr: string): TimeRange {
  // Match PostgreSQL range format: [start,end) or (start,end] or [start,end]
  const match = /^[\[(](.+),(.+)[\])]$/.exec(rangeStr);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid time range format: ${rangeStr}`);
  }

  const startStr = match[1].trim().replace(/^"/, "").replace(/"$/, "");
  const endStr = match[2].trim().replace(/^"/, "").replace(/"$/, "");

  return {
    start: new Date(startStr),
    end: new Date(endStr),
  };
}

/**
 * Checks if two time ranges overlap
 * Uses the same logic as PostgreSQL's && operator
 *
 * @param a - First time range
 * @param b - Second time range
 * @returns true if ranges overlap
 *
 * @example
 * rangesOverlap(
 *   { start: new Date('09:00'), end: new Date('10:00') },
 *   { start: new Date('09:30'), end: new Date('10:30') }
 * ) // true
 */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  // Two ranges overlap if a.start < b.end AND a.end > b.start
  return a.start < b.end && a.end > b.start;
}

/**
 * Checks if one time range fully contains another
 *
 * @param outer - The potentially containing range
 * @param inner - The potentially contained range
 * @returns true if outer contains inner
 */
export function rangeContains(outer: TimeRange, inner: TimeRange): boolean {
  return outer.start <= inner.start && outer.end >= inner.end;
}

/**
 * Gets the duration of a time range in minutes
 *
 * @param range - TimeRange to measure
 * @returns Duration in minutes
 */
export function getDurationMinutes(range: TimeRange): number {
  return (range.end.getTime() - range.start.getTime()) / (1000 * 60);
}

/**
 * Gets the duration of a time range in hours
 *
 * @param range - TimeRange to measure
 * @returns Duration in hours (decimal)
 */
export function getDurationHours(range: TimeRange): number {
  return getDurationMinutes(range) / 60;
}

/**
 * Checks if a time range is valid (end > start and both are valid dates)
 *
 * @param range - TimeRange to validate
 * @returns true if the range is valid
 */
export function isValidTimeRange(range: TimeRange): boolean {
  return (
    range.start instanceof Date &&
    range.end instanceof Date &&
    !isNaN(range.start.getTime()) &&
    !isNaN(range.end.getTime()) &&
    range.end > range.start
  );
}

/**
 * Formats a time range for display
 *
 * @param range - TimeRange to format
 * @param timezone - Timezone for display (default: America/Los_Angeles)
 * @returns Formatted string like "9:00 AM - 9:30 AM"
 */
export function formatTimeRange(
  range: TimeRange,
  timezone = "America/Los_Angeles",
): string {
  const startZoned = toZonedTime(range.start, timezone);
  const endZoned = toZonedTime(range.end, timezone);

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  return `${formatTime(startZoned)} - ${formatTime(endZoned)}`;
}

/**
 * Gets the intersection of two overlapping time ranges
 * Returns null if ranges don't overlap
 *
 * @param a - First time range
 * @param b - Second time range
 * @returns Intersection range or null
 */
export function getIntersection(a: TimeRange, b: TimeRange): TimeRange | null {
  if (!rangesOverlap(a, b)) {
    return null;
  }

  return {
    start: new Date(Math.max(a.start.getTime(), b.start.getTime())),
    end: new Date(Math.min(a.end.getTime(), b.end.getTime())),
  };
}

/**
 * Merges two overlapping or adjacent time ranges
 * Returns null if ranges don't overlap and aren't adjacent
 *
 * @param a - First time range
 * @param b - Second time range
 * @returns Merged range or null
 */
export function mergeRanges(a: TimeRange, b: TimeRange): TimeRange | null {
  // Check if they overlap or are adjacent
  const gap = Math.abs(a.end.getTime() - b.start.getTime());
  const isAdjacent =
    a.end.getTime() === b.start.getTime() ||
    b.end.getTime() === a.start.getTime();

  if (!rangesOverlap(a, b) && !isAdjacent) {
    return null;
  }

  return {
    start: new Date(Math.min(a.start.getTime(), b.start.getTime())),
    end: new Date(Math.max(a.end.getTime(), b.end.getTime())),
  };
}

/**
 * Extracts the date portion from a time range in a specific timezone
 *
 * @param range - TimeRange
 * @param timezone - Timezone for date extraction
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateFromRange(
  range: TimeRange,
  timezone = "America/Los_Angeles",
): string {
  const zonedDate = toZonedTime(range.start, timezone);
  const year = zonedDate.getFullYear();
  const month = String(zonedDate.getMonth() + 1).padStart(2, "0");
  const day = String(zonedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
