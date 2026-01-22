import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  addDays,
  setHours,
  setMinutes,
  setSeconds,
  isWeekend,
  getDay,
} from "date-fns";
import type { DailyHours } from "@odis-ai/shared/types";

export interface BusinessHoursConfig {
  startHour: number; // 24-hour format (e.g., 9 for 9 AM)
  endHour: number; // 24-hour format (e.g., 17 for 5 PM)
  timezone: string; // IANA timezone (e.g., "America/Los_Angeles")
  excludeWeekends: boolean;
}

const DEFAULT_CONFIG: BusinessHoursConfig = {
  startHour: 9,
  endHour: 17,
  timezone: "America/Los_Angeles",
  excludeWeekends: true,
};

/**
 * Check if a given time is within business hours
 *
 * @param timestamp - The timestamp to check
 * @param timezone - IANA timezone string (e.g., "America/Los_Angeles")
 * @param config - Optional business hours configuration
 * @returns true if timestamp is within business hours, false otherwise
 */
export function isWithinBusinessHours(
  timestamp: Date,
  timezone: string = DEFAULT_CONFIG.timezone,
  config: Partial<BusinessHoursConfig> = {},
): boolean {
  const fullConfig = { ...DEFAULT_CONFIG, timezone, ...config };

  // Convert to clinic's timezone
  const zonedTime = toZonedTime(timestamp, fullConfig.timezone);

  // Check if weekend
  if (fullConfig.excludeWeekends && isWeekend(zonedTime)) {
    return false;
  }

  const hour = zonedTime.getHours();
  return hour >= fullConfig.startHour && hour < fullConfig.endHour;
}

/**
 * Get next available business hour slot
 *
 * @param fromTime - Starting timestamp
 * @param timezone - IANA timezone string
 * @param config - Optional business hours configuration
 * @returns Next available business hour timestamp
 */
export function getNextBusinessHourSlot(
  fromTime: Date,
  timezone: string = DEFAULT_CONFIG.timezone,
  config: Partial<BusinessHoursConfig> = {},
): Date {
  const fullConfig = { ...DEFAULT_CONFIG, timezone, ...config };

  let candidate = new Date(fromTime);
  let maxIterations = 14; // Prevent infinite loops (2 weeks max)

  while (maxIterations > 0) {
    const zonedCandidate = toZonedTime(candidate, fullConfig.timezone);
    const hour = zonedCandidate.getHours();
    const dayOfWeek = getDay(zonedCandidate);

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (fullConfig.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      // Jump to next Monday at start hour
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 2; // Sunday +1, Saturday +2
      candidate = addDays(candidate, daysUntilMonday);
      candidate = setHours(
        setMinutes(setSeconds(candidate, 0), 0),
        fullConfig.startHour,
      );

      // Convert back to UTC
      candidate = fromZonedTime(candidate, fullConfig.timezone);
      maxIterations--;
      continue;
    }

    // Before business hours: move to start hour today
    if (hour < fullConfig.startHour) {
      const adjusted = setHours(
        setMinutes(setSeconds(zonedCandidate, 0), 0),
        fullConfig.startHour,
      );
      candidate = fromZonedTime(adjusted, fullConfig.timezone);
      break;
    }

    // After business hours: move to start hour next day
    if (hour >= fullConfig.endHour) {
      candidate = addDays(candidate, 1);
      const adjusted = setHours(
        setMinutes(
          setSeconds(toZonedTime(candidate, fullConfig.timezone), 0),
          0,
        ),
        fullConfig.startHour,
      );
      candidate = fromZonedTime(adjusted, fullConfig.timezone);
      maxIterations--;
      continue;
    }

    // Within business hours
    break;
  }

  return candidate;
}

/**
 * Check if a given time is within business hours using per-day configuration
 *
 * @param timestamp - The timestamp to check
 * @param dailyHours - Per-day business hours configuration
 * @param timezone - IANA timezone string (e.g., "America/Los_Angeles")
 * @returns true if timestamp is within business hours for that specific day, false otherwise
 */
export function isWithinBusinessHoursPerDay(
  timestamp: Date,
  dailyHours: DailyHours,
  timezone: string,
): boolean {
  const zonedTime = toZonedTime(timestamp, timezone);
  const dayOfWeek = zonedTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayConfig = dailyHours[String(dayOfWeek)];

  // Check if day is closed
  if (!dayConfig?.enabled) {
    return false;
  }

  // Check time range for this day
  const hour = zonedTime.getHours();
  const minute = zonedTime.getMinutes();

  const openParts = (dayConfig.open ?? "00:00").split(":").map(Number);
  const closeParts = (dayConfig.close ?? "00:00").split(":").map(Number);

  const openH = openParts[0] ?? 0;
  const openM = openParts[1] ?? 0;
  const closeH = closeParts[0] ?? 0;
  const closeM = closeParts[1] ?? 0;

  const current = hour * 60 + minute;
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;

  return current >= open && current < close;
}

/**
 * Validate that a scheduled time is in the future
 *
 * @param scheduledTime - The time to validate
 * @returns true if scheduledTime is in the future
 */
export function isFutureTime(scheduledTime: Date): boolean {
  return scheduledTime.getTime() > Date.now();
}

/**
 * Calculate delay in seconds from now until scheduled time
 *
 * @param scheduledTime - Target execution time
 * @returns Delay in seconds (0 if time is in the past)
 */
export function calculateDelay(scheduledTime: Date): number {
  const delayMs = scheduledTime.getTime() - Date.now();
  return Math.max(0, Math.floor(delayMs / 1000));
}
