"use client";

import { Badge } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";
import type { OutcomeFilter, CallStats } from "../types";

interface OutcomeFilterPillsProps {
  value: OutcomeFilter;
  onChange: (value: OutcomeFilter) => void;
  stats: CallStats | undefined;
}

interface FilterPill {
  value: OutcomeFilter;
  label: string;
  color: "emerald" | "orange" | "amber" | "blue" | "gray";
  getCount: (stats: CallStats) => number;
}

const FILTER_PILLS: FilterPill[] = [
  {
    value: "all",
    label: "All",
    color: "gray",
    getCount: (stats) => stats.total,
  },
  {
    value: "appointment",
    label: "Appointments",
    color: "emerald",
    getCount: (stats) => stats.appointment,
  },
  {
    value: "emergency",
    label: "ER",
    color: "orange",
    getCount: (stats) => stats.emergency,
  },
  {
    value: "callback",
    label: "Callback",
    color: "amber",
    getCount: (stats) => stats.callback,
  },
  {
    value: "info",
    label: "Info",
    color: "blue",
    getCount: (stats) => stats.info,
  },
];

// Muted styling: neutral inactive state, subtle color hints when active
const COLOR_STYLES = {
  gray: {
    inactive:
      "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
    active:
      "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900",
  },
  emerald: {
    inactive:
      "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
    active:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  },
  orange: {
    inactive:
      "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
    active:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800",
  },
  amber: {
    inactive:
      "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
    active:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  },
  blue: {
    inactive:
      "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
    active:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  },
};

export function OutcomeFilterPills({
  value,
  onChange,
  stats,
}: OutcomeFilterPillsProps) {
  const handleClick = (filterValue: OutcomeFilter) => {
    // If clicking the active filter, return to "All"
    if (filterValue === value) {
      onChange("all");
    } else {
      onChange(filterValue);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_PILLS.map((pill) => {
        const isActive = value === pill.value;
        const count = stats ? pill.getCount(stats) : 0;
        const colorStyle = COLOR_STYLES[pill.color];

        return (
          <button
            key={pill.value}
            type="button"
            onClick={() => handleClick(pill.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive ? colorStyle.active : colorStyle.inactive,
            )}
          >
            <span>{pill.label}</span>
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 h-5 min-w-[20px] px-1.5 text-xs font-medium",
                isActive && pill.color === "gray"
                  ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900"
                  : isActive
                    ? "bg-current/10 text-inherit"
                    : "bg-neutral-200/80 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400",
              )}
            >
              {count}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
