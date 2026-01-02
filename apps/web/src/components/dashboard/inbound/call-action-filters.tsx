"use client";

import { AlertCircle, CheckCircle, Filter, Info } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { CallActionFilter } from "./types";

interface CallActionFiltersProps {
  currentFilter: CallActionFilter;
  onFilterChange: (filter: CallActionFilter) => void;
  isLoading?: boolean;
}

interface FilterOption {
  value: CallActionFilter;
  label: string;
  icon: typeof Filter;
  description: string;
}

const filterOptions: FilterOption[] = [
  {
    value: "needs_attention",
    label: "Needs Attention",
    icon: AlertCircle,
    description: "Urgent & Call Back",
  },
  {
    value: "all",
    label: "All Calls",
    icon: Filter,
    description: "Show everything",
  },
  {
    value: "urgent_only",
    label: "Urgent Only",
    icon: AlertCircle,
    description: "Critical calls",
  },
  {
    value: "info_only",
    label: "Info Only",
    icon: Info,
    description: "Informational calls",
  },
];

/**
 * Call Action Filters
 *
 * Horizontal filter buttons for filtering calls by action type.
 * Shows Needs Attention (Urgent + Call Back) by default.
 */
export function CallActionFilters({
  currentFilter,
  onFilterChange,
  isLoading = false,
}: CallActionFiltersProps) {
  return (
    <div className="flex items-center gap-2 border-b border-teal-100/50 bg-gradient-to-r from-teal-50/20 to-white/40 px-6 py-3">
      <span className="text-xs font-medium text-slate-500">Filter by:</span>
      <div className="flex items-center gap-2">
        {filterOptions.map((option) => {
          const isActive = currentFilter === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              disabled={isLoading}
              title={option.description}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-teal-500 text-white shadow-sm"
                  : "border border-teal-200/50 bg-white/60 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-slate-800",
                isLoading && "cursor-not-allowed opacity-50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
