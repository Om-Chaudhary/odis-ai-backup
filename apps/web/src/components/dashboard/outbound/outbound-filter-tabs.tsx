"use client";

import { Search, List, UserX, AlertTriangle } from "lucide-react";
import { cn } from "@odis-ai/utils";
import type { StatusFilter, ViewMode, DischargeSummaryStats } from "./types";
import { OutboundDateNav } from "./outbound-date-nav";

interface OutboundFilterTabsProps {
  // Status filter
  activeStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
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
}

/**
 * Outbound Filter Tabs - Compact Glassmorphism Layout
 *
 * Structure (single row):
 * Date navigation | View tabs | Status filters | Search
 */
export function OutboundFilterTabs({
  activeStatus,
  onStatusChange,
  counts,
  searchTerm = "",
  onSearchChange,
  currentDate,
  onDateChange,
  isLoading = false,
  viewMode,
  onViewModeChange,
}: OutboundFilterTabsProps) {
  const statusTabs: Array<{
    value: StatusFilter;
    label: string;
    count: number;
    activeColor?: string;
    countColor?: string;
  }> = [
    { value: "all", label: "All", count: counts.total },
    { value: "ready_to_send", label: "Ready", count: counts.readyToSend },
    { value: "scheduled", label: "Scheduled", count: counts.scheduled },
    { value: "sent", label: "Sent", count: counts.sent },
    {
      value: "failed",
      label: "Failed",
      count: counts.failed,
      activeColor: "bg-red-50/80 text-red-700 border-red-200/60",
      countColor: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left: Date nav + View tabs */}
      <div className="flex items-center gap-4">
        <OutboundDateNav
          currentDate={currentDate}
          onDateChange={onDateChange}
          totalItems={counts.total}
          isLoading={isLoading}
        />

        {/* View Tabs - Integrated */}
        {onViewModeChange && (
          <div className="flex items-center gap-0.5 rounded-lg border border-teal-100/50 bg-white/40 p-0.5">
            <button
              onClick={() => onViewModeChange("all")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-all duration-200",
                viewMode === "all"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <List className="h-3 w-3" />
              All
            </button>
            <button
              onClick={() => onViewModeChange("needs_review")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-all duration-200",
                viewMode === "needs_review"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <UserX className="h-3 w-3" />
              Missing
              {counts.needsReview > 0 && (
                <span
                  className={cn(
                    "inline-flex h-3.5 min-w-3.5 items-center justify-center rounded px-0.5 text-[9px] font-semibold tabular-nums",
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
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium whitespace-nowrap transition-all duration-200",
                viewMode === "needs_attention"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              Needs Attention
              {counts.needsAttention > 0 && (
                <span
                  className={cn(
                    "inline-flex h-3.5 min-w-3.5 items-center justify-center rounded px-0.5 text-[9px] font-semibold tabular-nums",
                    viewMode === "needs_attention"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {counts.needsAttention}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Center: Status filters - Only show when in "all" view mode */}
      {viewMode === "all" && (
        <div className="flex items-center gap-1">
          {statusTabs.map((tab) => {
            const isActive = activeStatus === tab.value;
            const isFailed = tab.value === "failed";

            return (
              <button
                key={tab.value}
                onClick={() => onStatusChange(tab.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
                  "text-xs font-medium",
                  "border transition-all duration-200",
                  isActive
                    ? isFailed
                      ? tab.activeColor
                      : "border-teal-200/60 bg-white/90 text-teal-700 shadow-sm"
                    : "border-transparent bg-white/40 text-slate-600 hover:bg-white/60 hover:text-slate-800",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold tabular-nums",
                    isActive
                      ? isFailed
                        ? tab.countColor
                        : "bg-teal-100 text-teal-700"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Right: Search */}
      {onSearchChange && (
        <div className="relative w-48">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "h-7 w-full rounded-md border border-teal-200/50 bg-white/60 pr-10 pl-8 text-xs",
              "placeholder:text-slate-400",
              "transition-all duration-200",
              "hover:border-teal-300/60 hover:bg-white/80",
              "focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none",
            )}
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-medium text-slate-400 sm:inline-block">
            ⌘K
          </kbd>
        </div>
      )}
    </div>
  );
}
