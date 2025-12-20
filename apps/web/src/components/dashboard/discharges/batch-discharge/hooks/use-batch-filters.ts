import { useMemo, useState } from "react";
import {
  startOfDay,
  endOfDay,
  subDays,
  isWithinInterval,
  parseISO,
  format,
} from "date-fns";
import type { BatchEligibleCase } from "@odis-ai/types";
import type { DateFilter } from "../types";

export function useBatchFilters(eligibleCases: BatchEligibleCase[]) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter cases by source, date, communication type, and search
  const filteredCases = useMemo(() => {
    let cases = eligibleCases;

    // Filter by date - use scheduledAt with fallback to createdAt (same as main dashboard)
    const now = new Date();
    const filterDates: Record<DateFilter, { start: Date; end: Date }> = {
      today: { start: startOfDay(now), end: endOfDay(now) },
      yesterday: {
        start: startOfDay(subDays(now, 1)),
        end: endOfDay(subDays(now, 1)),
      },
      "day-2": {
        start: startOfDay(subDays(now, 2)),
        end: endOfDay(subDays(now, 2)),
      },
      "day-3": {
        start: startOfDay(subDays(now, 3)),
        end: endOfDay(subDays(now, 3)),
      },
      "day-4": {
        start: startOfDay(subDays(now, 4)),
        end: endOfDay(subDays(now, 4)),
      },
    };

    const dateRange = filterDates[dateFilter];
    cases = cases.filter((c) => {
      // Use scheduledAt if available, otherwise fall back to createdAt
      const dateStr = c.scheduledAt ?? c.createdAt;
      if (!dateStr) return false;
      const caseDate = parseISO(dateStr);
      return isWithinInterval(caseDate, dateRange);
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cases = cases.filter(
        (c) =>
          c.patientName.toLowerCase().includes(query) ||
          (c.ownerName?.toLowerCase().includes(query) ?? false),
      );
    }

    return cases;
  }, [eligibleCases, dateFilter, searchQuery]);

  // Count cases by date for the filter badges (using scheduledAt with fallback to createdAt)
  const dateCounts: Record<DateFilter, number> = useMemo(() => {
    const now = new Date();
    const days = [0, 1, 2, 3, 4].map((offset) => ({
      start: startOfDay(subDays(now, offset)),
      end: endOfDay(subDays(now, offset)),
    }));

    const counts = [0, 0, 0, 0, 0];

    eligibleCases.forEach((c) => {
      // Use scheduledAt if available, otherwise fall back to createdAt
      const dateStr = c.scheduledAt ?? c.createdAt;
      if (!dateStr) return;
      const caseDate = parseISO(dateStr);

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        if (!day) continue;
        if (isWithinInterval(caseDate, day)) {
          const currentCount = counts[i];
          if (currentCount !== undefined) {
            counts[i] = currentCount + 1;
          }
          break;
        }
      }
    });

    return {
      today: counts[0] ?? 0,
      yesterday: counts[1] ?? 0,
      "day-2": counts[2] ?? 0,
      "day-3": counts[3] ?? 0,
      "day-4": counts[4] ?? 0,
    };
  }, [eligibleCases]);

  // Generate day labels for the filter buttons
  const dayLabels: Record<DateFilter, string> = useMemo(() => {
    const now = new Date();
    return {
      today: "Today",
      yesterday: "Yesterday",
      "day-2": format(subDays(now, 2), "EEE MMM d"),
      "day-3": format(subDays(now, 3), "EEE MMM d"),
      "day-4": format(subDays(now, 4), "EEE MMM d"),
    };
  }, []);

  return {
    dateFilter,
    setDateFilter,
    searchQuery,
    setSearchQuery,
    filteredCases,
    dateCounts,
    dayLabels,
  };
}
