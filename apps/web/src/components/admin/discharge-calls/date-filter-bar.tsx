"use client";

import { Button } from "@odis-ai/ui/button";
import { Calendar } from "lucide-react";
import {
  subDays,
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
} from "date-fns";

interface DateRange {
  startDate: string | undefined;
  endDate: string | undefined;
}

interface DateFilterBarProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type QuickFilter = "all" | "today" | "yesterday" | "week" | "month";

export function DateFilterBar({ value, onChange }: DateFilterBarProps) {
  const getActiveFilter = (): QuickFilter => {
    if (!value.startDate && !value.endDate) return "all";

    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const monthStart = startOfMonth(new Date());

    const startDate = value.startDate ? new Date(value.startDate) : null;

    if (startDate) {
      const startDay = startOfDay(startDate);
      if (startDay.getTime() === today.getTime()) return "today";
      if (startDay.getTime() === yesterday.getTime()) return "yesterday";
      if (startDay.getTime() === weekStart.getTime()) return "week";
      if (startDay.getTime() === monthStart.getTime()) return "month";
    }

    return "all";
  };

  const activeFilter = getActiveFilter();

  const setQuickFilter = (filter: QuickFilter) => {
    const now = new Date();

    switch (filter) {
      case "all":
        onChange({ startDate: undefined, endDate: undefined });
        break;
      case "today":
        onChange({
          startDate: format(startOfDay(now), "yyyy-MM-dd"),
          endDate: format(startOfDay(now), "yyyy-MM-dd"),
        });
        break;
      case "yesterday": {
        const yesterday = subDays(now, 1);
        onChange({
          startDate: format(startOfDay(yesterday), "yyyy-MM-dd"),
          endDate: format(startOfDay(yesterday), "yyyy-MM-dd"),
        });
        break;
      }
      case "week":
        onChange({
          startDate: format(
            startOfWeek(now, { weekStartsOn: 1 }),
            "yyyy-MM-dd",
          ),
          endDate: format(startOfDay(now), "yyyy-MM-dd"),
        });
        break;
      case "month":
        onChange({
          startDate: format(startOfMonth(now), "yyyy-MM-dd"),
          endDate: format(startOfDay(now), "yyyy-MM-dd"),
        });
        break;
    }
  };

  const filters: { key: QuickFilter; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-slate-500" />
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {filters.map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setQuickFilter(filter.key)}
            className={
              activeFilter === filter.key
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }
          >
            {filter.label}
          </Button>
        ))}
      </div>
      {value.startDate && (
        <span className="ml-2 text-sm text-slate-500">
          {format(new Date(value.startDate), "MMM d")}
          {value.endDate &&
            value.startDate !== value.endDate &&
            ` - ${format(new Date(value.endDate), "MMM d")}`}
        </span>
      )}
    </div>
  );
}
