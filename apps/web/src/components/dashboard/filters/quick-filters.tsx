"use client";

import { useCallback } from "react";
import { Button } from "@odis-ai/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@odis-ai/shared/ui/tooltip";
import {
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

export type QuickFilterId =
  | "missingDischarge"
  | "missingSoap"
  | "today"
  | "thisWeek"
  | "recent";

// Action-based quick filters (not date-based)
export type ActionQuickFilterId = "missingDischarge" | "missingSoap";

interface QuickFilter {
  id: QuickFilterId;
  label: string;
  icon: LucideIcon;
  tooltip: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "missingDischarge",
    label: "Missing Discharge",
    icon: AlertCircle,
    tooltip: "Show cases missing discharge summaries",
  },
  {
    id: "missingSoap",
    label: "Missing SOAP",
    icon: FileText,
    tooltip: "Show cases missing SOAP notes",
  },
  {
    id: "today",
    label: "Today",
    icon: Calendar,
    tooltip: "Show cases created today",
  },
  {
    id: "thisWeek",
    label: "This Week",
    icon: Calendar,
    tooltip: "Show cases created this week",
  },
  {
    id: "recent",
    label: "Recent",
    icon: Clock,
    tooltip: "Show cases created in the last 7 days",
  },
];

// Action-based quick filters only (for the simplified UI)
export const ACTION_QUICK_FILTERS: QuickFilter[] = QUICK_FILTERS.filter(
  (filter) => filter.id === "missingDischarge" || filter.id === "missingSoap",
);

interface QuickFiltersProps {
  selected: Set<QuickFilterId>;
  onChange: (selected: Set<QuickFilterId>) => void;
  className?: string;
}

/**
 * QuickFilters component for one-click filtering of common case scenarios
 *
 * Provides filter chips for: Missing Discharge, Missing SOAP, Today, This Week, and Recent.
 * Supports multiple selection with visual feedback and smooth animations.
 *
 * @param selected - Set of currently selected filter IDs
 * @param onChange - Callback when filters change, receives new Set of selected filter IDs
 * @param className - Optional additional CSS classes
 *
 * @example
 * ```tsx
 * <QuickFilters
 *   selected={new Set(["missingDischarge", "today"])}
 *   onChange={(filters) => setFilters(filters)}
 * />
 * ```
 */
interface QuickFiltersProps {
  selected: Set<QuickFilterId>;
  onChange: (selected: Set<QuickFilterId>) => void;
  className?: string;
  /** If true, only show action-based filters (Missing Discharge, Missing SOAP) */
  actionOnly?: boolean;
}

export function QuickFilters({
  selected,
  onChange,
  className,
  actionOnly = false,
}: QuickFiltersProps) {
  const handleToggle = useCallback(
    (filterId: QuickFilterId) => {
      const newSelected = new Set(selected);
      if (newSelected.has(filterId)) {
        newSelected.delete(filterId);
      } else {
        newSelected.add(filterId);
      }
      onChange(newSelected);
    },
    [selected, onChange],
  );

  const filtersToShow = actionOnly ? ACTION_QUICK_FILTERS : QUICK_FILTERS;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filtersToShow.map((filter) => {
        const Icon = filter.icon;
        const isActive = selected.has(filter.id);

        const button = (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handleToggle(filter.id)}
            className={cn(
              "transition-smooth hover:scale-[1.02] focus:ring-2 focus:ring-[#31aba3] focus:ring-offset-2",
              isActive &&
                "border-[#31aba3] bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
            )}
            aria-pressed={isActive}
          >
            <Icon className="transition-smooth mr-2 h-4 w-4" />
            {filter.label}
          </Button>
        );

        return (
          <Tooltip key={filter.id}>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>
              <p>{filter.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
