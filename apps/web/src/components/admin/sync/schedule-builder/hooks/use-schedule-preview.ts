/**
 * useSchedulePreview Hook
 *
 * Calculates next N occurrences of a cron schedule
 */

import { useMemo } from "react";
import { parseExpression } from "cron-parser";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { SchedulePreviewItem } from "../types";

interface UseSchedulePreviewOptions {
  /** Cron expression */
  cron: string;
  /** Timezone for display (default: UTC) */
  timezone?: string;
  /** Number of occurrences to show (default: 3) */
  count?: number;
}

export function useSchedulePreview({
  cron,
  timezone = "UTC",
  count = 3,
}: UseSchedulePreviewOptions): {
  items: SchedulePreviewItem[];
  error: string | null;
} {
  return useMemo(() => {
    try {
      // Parse cron expression
      const interval = parseExpression(cron, {
        tz: timezone,
        currentDate: new Date(),
      });

      // Generate next N occurrences
      const items: SchedulePreviewItem[] = [];
      for (let i = 0; i < count; i++) {
        const next = interval.next().toDate();
        const zonedDate = toZonedTime(next, timezone);

        items.push({
          date: format(zonedDate, "EEE, MMM d 'at' h:mm a zzz"),
          timestamp: next,
        });
      }

      return { items, error: null };
    } catch (error) {
      return {
        items: [],
        error: error instanceof Error ? error.message : "Invalid cron expression",
      };
    }
  }, [cron, timezone, count]);
}

/**
 * Format a date for display in a specific timezone
 *
 * @param date - Date to format
 * @param timezone - Timezone name
 * @returns Formatted date string
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, "EEE, MMM d 'at' h:mm a zzz");
}
