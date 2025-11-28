import { subDays, startOfDay, endOfDay } from "date-fns";

export type DateRangePreset = "all" | "1d" | "3d" | "30d";

/**
 * Converts a date range preset to actual start and end dates
 * @param preset - The preset value ("all", "1d", "3d", "30d")
 * @returns Object with startDate and endDate (null for "all" preset)
 */
export function getDateRangeFromPreset(preset: DateRangePreset): {
  startDate: Date | null;
  endDate: Date | null;
} {
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
