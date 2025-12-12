"use client";

import { AlertTriangle, List, UserX, ClipboardCheck } from "lucide-react";
import { cn } from "@odis-ai/utils";
import type { ViewMode } from "./types";

interface OutboundViewTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  needsReviewCount: number;
}

/**
 * View Mode Tabs - Glassmorphism Header
 *
 * [All Discharges] [Missing Contacts (4)] [Needs Review - placeholder]
 */
export function OutboundViewTabs({
  viewMode,
  onViewModeChange,
  needsReviewCount,
}: OutboundViewTabsProps) {
  return (
    <div className="flex shrink-0 border-b border-teal-100/50 bg-gradient-to-r from-white/50 to-teal-50/30">
      {/* All Discharges Tab */}
      <button
        onClick={() => onViewModeChange("all")}
        className={cn(
          "relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200",
          viewMode === "all"
            ? "text-teal-700"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        <List className="h-4 w-4" />
        All Discharges
        {viewMode === "all" && (
          <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-teal-500" />
        )}
      </button>

      {/* Missing Contacts Tab (formerly Needs Review) */}
      <button
        onClick={() => onViewModeChange("needs_review")}
        className={cn(
          "relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200",
          viewMode === "needs_review"
            ? "text-amber-700"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        <UserX className="h-4 w-4" />
        Missing Contacts
        {needsReviewCount > 0 && (
          <span
            className={cn(
              "inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums",
              viewMode === "needs_review"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {needsReviewCount}
          </span>
        )}
        {viewMode === "needs_review" && (
          <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-amber-500" />
        )}
      </button>

      {/* Needs Review Tab (placeholder for future) */}
      <button
        disabled
        className={cn(
          "relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200",
          "cursor-not-allowed text-slate-400",
        )}
        title="Coming soon"
      >
        <ClipboardCheck className="h-4 w-4" />
        Needs Review
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          Soon
        </span>
      </button>
    </div>
  );
}
