"use client";

import { Badge } from "@odis-ai/shared/ui";
import { cn } from "@odis-ai/shared/util";
import type { ViewMode } from "./types";

interface OutboundViewFilterPillsProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  needsAttentionCount?: number;
  totalCount?: number;
}

interface FilterPill {
  value: ViewMode;
  label: string;
  color: "gray" | "amber";
  getCount: (props: {
    totalCount?: number;
    needsAttentionCount?: number;
  }) => number | undefined;
}

const FILTER_PILLS: FilterPill[] = [
  {
    value: "all",
    label: "All Calls",
    color: "gray",
    getCount: ({ totalCount }) => totalCount,
  },
  {
    value: "needs_attention",
    label: "Needs Attention",
    color: "amber",
    getCount: ({ needsAttentionCount }) => needsAttentionCount,
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
  amber: {
    inactive:
      "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
    active:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  },
};

export function OutboundViewFilterPills({
  value,
  onChange,
  needsAttentionCount,
  totalCount,
}: OutboundViewFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_PILLS.map((pill) => {
        const isActive = value === pill.value;
        const count = pill.getCount({ totalCount, needsAttentionCount });
        const colorStyle = COLOR_STYLES[pill.color];

        return (
          <button
            key={pill.value}
            type="button"
            onClick={() => onChange(pill.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive ? colorStyle.active : colorStyle.inactive,
            )}
          >
            <span>{pill.label}</span>
            {count !== undefined && count > 0 && (
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
            )}
          </button>
        );
      })}
    </div>
  );
}
