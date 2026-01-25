/**
 * Cron Parser Utility
 *
 * Parses cron expressions into UI state (days + times)
 */

import type { CronParseResult } from "../types";

/**
 * Parse a cron expression into schedule state
 *
 * Supports simple cron patterns:
 * - "0 9 * * *" (daily at 9 AM)
 * - "0 9,14,17 * * 1-5" (9 AM, 2 PM, 5 PM on weekdays)
 * - "0 8,12,16 * * 0,6" (8 AM, 12 PM, 4 PM on weekends)
 *
 * Falls back to "complex" mode for:
 * - Day-of-month patterns
 * - Month-specific patterns
 * - Non-zero minutes
 * - Step values (asterisk/2)
 * - Ranges with steps (1-5/2)
 *
 * @param cron - Cron expression string
 * @returns Parse result with schedule state or error
 */
export function parseCron(cron: string): CronParseResult {
  try {
    const trimmed = cron.trim();
    const parts = trimmed.split(/\s+/);

    // Validate cron has 5 parts
    if (parts.length !== 5) {
      return {
        success: false,
        error: "Cron must have 5 parts (minute hour day-of-month month day-of-week)",
        isComplex: true,
      };
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts as [
      string,
      string,
      string,
      string,
      string,
    ];

    // Only support minute = 0
    if (minute !== "0") {
      return {
        success: false,
        error: "Only :00 minutes are supported in simple mode",
        isComplex: true,
      };
    }

    // Only support day-of-month = * and month = *
    if (dayOfMonth !== "*" || month !== "*") {
      return {
        success: false,
        error: "Day-of-month and month patterns are not supported in simple mode",
        isComplex: true,
      };
    }

    // Parse hours
    const hours = parseHourPart(hour);
    if (!hours) {
      return {
        success: false,
        error: "Invalid hour pattern",
        isComplex: true,
      };
    }

    // Parse days
    const days = parseDayPart(dayOfWeek);
    if (!days) {
      return {
        success: false,
        error: "Invalid day-of-week pattern",
        isComplex: true,
      };
    }

    // Convert hours to time strings
    const times = hours.map((h) => formatTime(h));

    return {
      success: true,
      schedule: { days, times },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown parse error",
      isComplex: true,
    };
  }
}

/**
 * Parse hour part of cron expression
 *
 * Supports:
 * - "*" (all hours)
 * - "9" (single hour)
 * - "9,14,17" (comma-separated)
 * - "9-17" (range)
 *
 * Does NOT support:
 * - "asterisk/2" (step values)
 * - "9-17/2" (ranges with steps)
 *
 * @param hourPart - Hour portion of cron
 * @returns Array of hours or null if invalid
 */
function parseHourPart(hourPart: string): number[] | null {
  // Wildcard = all hours (not typically used, but valid)
  if (hourPart === "*") {
    return Array.from({ length: 24 }, (_, i) => i);
  }

  // Check for step values (not supported in simple mode)
  if (hourPart.includes("/")) {
    return null;
  }

  // Comma-separated hours
  if (hourPart.includes(",")) {
    const hours = hourPart.split(",").map(Number);
    if (hours.some((h) => isNaN(h) || h < 0 || h > 23)) {
      return null;
    }
    return hours;
  }

  // Range (e.g., "9-17")
  if (hourPart.includes("-")) {
    const [start, end] = hourPart.split("-").map(Number);
    if (
      start === undefined ||
      end === undefined ||
      isNaN(start) ||
      isNaN(end) ||
      start < 0 ||
      start > 23 ||
      end < 0 ||
      end > 23 ||
      start > end
    ) {
      return null;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Single hour
  const hour = Number(hourPart);
  if (isNaN(hour) || hour < 0 || hour > 23) {
    return null;
  }
  return [hour];
}

/**
 * Parse day-of-week part of cron expression
 *
 * Supports:
 * - "*" (all days)
 * - "1" (single day)
 * - "1,3,5" (comma-separated)
 * - "1-5" (range, Mon-Fri)
 *
 * Does NOT support:
 * - "asterisk/2" (step values)
 * - "1-5/2" (ranges with steps)
 * - Named days (MON, TUE, etc.)
 *
 * @param dayPart - Day-of-week portion of cron
 * @returns Array of days (0-6) or null if invalid
 */
function parseDayPart(dayPart: string): number[] | null {
  // Wildcard = all days
  if (dayPart === "*") {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  // Check for step values (not supported in simple mode)
  if (dayPart.includes("/")) {
    return null;
  }

  // Check for named days (not supported)
  if (/[A-Za-z]/.test(dayPart)) {
    return null;
  }

  // Comma-separated days
  if (dayPart.includes(",")) {
    const days = dayPart.split(",").map(Number);
    if (days.some((d) => isNaN(d) || d < 0 || d > 6)) {
      return null;
    }
    return days;
  }

  // Range (e.g., "1-5" for Mon-Fri)
  if (dayPart.includes("-")) {
    const [start, end] = dayPart.split("-").map(Number);
    if (
      start === undefined ||
      end === undefined ||
      isNaN(start) ||
      isNaN(end) ||
      start < 0 ||
      start > 6 ||
      end < 0 ||
      end > 6 ||
      start > end
    ) {
      return null;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Single day
  const day = Number(dayPart);
  if (isNaN(day) || day < 0 || day > 6) {
    return null;
  }
  return [day];
}

/**
 * Format time as HH:mm
 */
function formatTime(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * Validate if a cron expression is simple enough for simple mode
 *
 * @param cron - Cron expression
 * @returns True if simple, false if complex
 */
export function isSimpleCron(cron: string): boolean {
  const result = parseCron(cron);
  return result.success && !result.isComplex;
}
