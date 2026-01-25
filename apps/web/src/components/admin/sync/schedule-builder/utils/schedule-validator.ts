/**
 * Schedule Validator Utility
 *
 * Validates schedule configurations
 */

import type { ScheduleState } from "../types";
import { parseExpression } from "cron-parser";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a schedule state
 *
 * @param schedule - Schedule state to validate
 * @returns Validation result with errors and warnings
 */
export function validateSchedule(schedule: ScheduleState): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check days
  if (schedule.days.length === 0) {
    errors.push("At least one day must be selected");
  }

  // Check for invalid days
  const invalidDays = schedule.days.filter((d) => d < 0 || d > 6);
  if (invalidDays.length > 0) {
    errors.push(`Invalid days: ${invalidDays.join(", ")}`);
  }

  // Check times
  if (schedule.times.length === 0) {
    errors.push("At least one time must be selected");
  }

  // Check for invalid times
  for (const time of schedule.times) {
    if (!isValidTime(time)) {
      errors.push(`Invalid time format: ${time}`);
    }
  }

  // Check for duplicate times
  const uniqueTimes = new Set(schedule.times);
  if (uniqueTimes.size !== schedule.times.length) {
    warnings.push("Duplicate times will be removed");
  }

  // Warn if schedule is very frequent (more than 6 times per day)
  if (schedule.times.length > 6) {
    warnings.push("Scheduling more than 6 times per day may impact performance");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a cron expression
 *
 * @param cron - Cron expression to validate
 * @returns Validation result
 */
export function validateCron(cron: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Try to parse with cron-parser
    parseExpression(cron);
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Invalid cron expression",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if time string is valid (HH:mm format)
 *
 * @param time - Time string
 * @returns True if valid
 */
function isValidTime(time: string): boolean {
  const parts = time.split(":");
  if (parts.length !== 2) return false;

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  return (
    !isNaN(hour) &&
    !isNaN(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

/**
 * Check if schedule falls outside business hours
 *
 * @param times - Array of time strings
 * @param businessStart - Business start hour (default: 7)
 * @param businessEnd - Business end hour (default: 19)
 * @returns Array of times outside business hours
 */
export function getTimesOutsideBusinessHours(
  times: string[],
  businessStart = 7,
  businessEnd = 19,
): string[] {
  return times.filter((time) => {
    const [hourStr] = time.split(":");
    const hour = Number(hourStr);
    return hour < businessStart || hour >= businessEnd;
  });
}
