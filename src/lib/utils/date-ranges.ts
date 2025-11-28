import { subDays, startOfDay, endOfDay } from "date-fns";

export type DateRangePreset = "all" | "1d" | "3d" | "30d";

/**
 * Valid preset values for runtime validation
 */
export const VALID_DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  "all",
  "1d",
  "3d",
  "30d",
] as const;

/**
 * Validates if a value is a valid DateRangePreset
 * @param value - The value to validate
 * @returns true if the value is a valid preset
 */
export function isValidDateRangePreset(
  value: unknown,
): value is DateRangePreset {
  return (
    typeof value === "string" &&
    VALID_DATE_RANGE_PRESETS.includes(value as DateRangePreset)
  );
}

/**
 * Converts a date range preset to actual start and end dates
 *
 * Note: Dates are calculated at call time using the current date/time.
 * All dates are in the local timezone of the server/client where this function runs.
 *
 * @param preset - The preset value ("all", "1d", "3d", "30d")
 * @returns Object with startDate and endDate (null for "all" preset)
 * @throws {Error} If preset is not a valid DateRangePreset
 */
export function getDateRangeFromPreset(preset: DateRangePreset): {
  startDate: Date | null;
  endDate: Date | null;
} {
  // Validate preset at runtime for safety
  if (!isValidDateRangePreset(preset)) {
    console.warn(
      `Invalid date range preset: ${String(preset)}. Defaulting to "all".`,
    );
    return { startDate: null, endDate: null };
  }

  const now = new Date();

  switch (preset) {
    case "all":
      return { startDate: null, endDate: null };
    case "1d":
      return {
        startDate: startOfDay(subDays(now, 1)),
        endDate: endOfDay(now),
      };
    case "3d":
      return {
        startDate: startOfDay(subDays(now, 3)),
        endDate: endOfDay(now),
      };
    case "30d":
      return {
        startDate: startOfDay(subDays(now, 30)),
        endDate: endOfDay(now),
      };
  }
}
