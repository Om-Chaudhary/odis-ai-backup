/**
 * Cron Builder Utility
 *
 * Converts UI state (days + times) to cron expression
 */

import type { ScheduleState } from "../types";

/**
 * Build a cron expression from days and times
 *
 * @param schedule - Schedule state with days and times
 * @returns Cron expression string
 *
 * @example
 * buildCron({ days: [1, 3, 5], times: ["09:00", "14:00"] })
 * // Returns: "0 9,14 * * 1,3,5"
 *
 * buildCron({ days: [0, 1, 2, 3, 4, 5, 6], times: ["09:00"] })
 * // Returns: "0 9 * * *" (all days = *)
 */
export function buildCron(schedule: ScheduleState): string {
  const { days, times } = schedule;

  // Validate inputs
  if (days.length === 0) {
    throw new Error("At least one day must be selected");
  }
  if (times.length === 0) {
    throw new Error("At least one time must be selected");
  }

  // Parse hours from times
  const hours = times.map((time) => {
    const [hour] = time.split(":").map(Number);
    if (hour === undefined || hour < 0 || hour > 23) {
      throw new Error(`Invalid time format: ${time}`);
    }
    return hour;
  });

  // Build hour part (sorted, comma-separated)
  const uniqueHours = Array.from(new Set(hours));
  const hourPart = uniqueHours.sort((a, b) => a - b).join(",");

  // Build day part
  let dayPart: string;
  if (days.length === 7) {
    // All days selected = wildcard
    dayPart = "*";
  } else {
    // Specific days (sorted, comma-separated)
    const uniqueDays = Array.from(new Set(days));
    dayPart = uniqueDays.sort((a, b) => a - b).join(",");
  }

  // Cron format: minute hour day-of-month month day-of-week
  // We always use 0 minutes, * for day-of-month and month
  return `0 ${hourPart} * * ${dayPart}`;
}

/**
 * Format time string to 24-hour format (HH:mm)
 *
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @returns Formatted time string
 */
export function formatTime(hour: number, minute = 0): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * Parse time string to hour and minute
 *
 * @param time - Time string in HH:mm format
 * @returns Tuple of [hour, minute]
 */
export function parseTime(time: string): [number, number] {
  const parts = time.split(":");
  const hour = Number(parts[0] ?? 0);
  const minute = Number(parts[1] ?? 0);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time: ${time}`);
  }

  return [hour, minute];
}

/**
 * Generate time options for dropdown (15-minute intervals)
 *
 * @returns Array of time strings in HH:mm format
 */
export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      options.push(formatTime(hour, minute));
    }
  }
  return options;
}

/**
 * Format time for display (e.g., "9:00 AM", "2:30 PM")
 *
 * @param time - Time string in HH:mm format
 * @returns Formatted time string for display
 */
export function formatTimeForDisplay(time: string): string {
  const [hour, minute] = parseTime(time);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}
