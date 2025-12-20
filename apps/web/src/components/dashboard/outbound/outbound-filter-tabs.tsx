"use client";

import {
  Search,
  List,
  UserX,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import { Button } from "@odis-ai/ui/button";
import type { ViewMode, DischargeSummaryStats } from "./types";
import { OutboundDateNav } from "./outbound-date-nav";

interface OutboundFilterTabsProps {
  // Counts
  counts: DischargeSummaryStats;
  // Search
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  // Date navigation
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
  // View mode
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  // Schedule All
  onScheduleAll?: () => void;
  scheduleAllDisabled?: boolean;
}

/**
 * Outbound Filter Tabs - Compact Glassmorphism Layout
 *
 * Structure (single row):
 * Date navigation | View tabs | Status filters | Search
 */
export function OutboundFilterTabs({
  counts,
  searchTerm = "",
  onSearchChange,
  currentDate,
  onDateChange,
  isLoading = false,
  viewMode,
  onViewModeChange,
  onScheduleAll,
  scheduleAllDisabled = false,
}: OutboundFilterTabsProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      {/* Left: Date Navigator + Schedule All */}
      <div className="flex items-center gap-3">
        <OutboundDateNav
          currentDate={currentDate}
          onDateChange={onDateChange}
          isLoading={isLoading}
        />
        {onScheduleAll && (
          <Button
            onClick={onScheduleAll}
            disabled={scheduleAllDisabled}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            Schedule All
          </Button>
        )}
      </div>

      {/* Center: View Mode Filter Tabs */}
      {onViewModeChange && (
        <div className="flex items-center gap-1 rounded-lg border border-teal-100/50 bg-white/40 p-1">
          <button
            onClick={() => onViewModeChange("all")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200",
              viewMode === "all"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <List className="h-5 w-5" />
            All
          </button>
          <button
            onClick={() => onViewModeChange("needs_review")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200",
              viewMode === "needs_review"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <UserX className="h-5 w-5" />
            Missing
            {counts.needsReview > 0 && (
              <span
                className={cn(
                  "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
                  viewMode === "needs_review"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {counts.needsReview}
              </span>
            )}
          </button>
          <button
            onClick={() => onViewModeChange("needs_attention")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium whitespace-nowrap transition-all duration-200",
              viewMode === "needs_attention"
                ? "bg-white text-orange-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <AlertTriangle className="h-5 w-5" />
            Needs Attention
            {counts.needsAttention > 0 && (
              <span
                className={cn(
                  "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
                  viewMode === "needs_attention"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-slate-100 text-slate-500",
                  // Pulsing red when critical cases exist
                  (counts.needsAttentionBreakdown?.critical ?? 0) > 0 &&
                    viewMode !== "needs_attention" &&
                    "animate-pulse bg-red-100 text-red-700",
                )}
              >
                {counts.needsAttention}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Right: Search */}
      {onSearchChange && (
        <div className="relative w-80">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "h-12 w-full rounded-lg border border-teal-200/50 bg-white/60 pr-16 pl-12 text-base",
              "placeholder:text-slate-400",
              "transition-all duration-200",
              "hover:border-teal-300/60 hover:bg-white/80",
              "focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none",
            )}
          />
          <kbd className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-medium text-slate-400 sm:inline-block">
            ⌘K
          </kbd>
        </div>
      )}
    </div>
  );
}
