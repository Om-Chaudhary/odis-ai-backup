"use client";

import {
  Search,
  List,
  UserX,
  AlertTriangle,
  PhoneOff,
  Clock,
  Wifi,
  Voicemail,
  Mail,
  CircleAlert,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import type {
  StatusFilter,
  ViewMode,
  DischargeSummaryStats,
  FailureCategory,
} from "./types";
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
  // Main status tabs (non-failure)
  const mainStatusTabs: Array<{
    value: StatusFilter;
    label: string;
    count: number;
  }> = [
    { value: "all", label: "All", count: counts.total },
    { value: "ready_to_send", label: "Ready", count: counts.readyToSend },
    { value: "scheduled", label: "Scheduled", count: counts.scheduled },
    { value: "sent", label: "Sent", count: counts.sent },
  ];

  // Failure category tabs with icons
  const failureTabs: Array<{
    value: FailureCategory;
    label: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    {
      value: "all_failed",
      label: "All Failed",
      count: counts.failed,
      icon: <CircleAlert className="h-3 w-3" />,
    },
    {
      value: "silence_timeout",
      label: "Silence Timeout",
      count: counts.failureCategories?.silenceTimeout ?? 0,
      icon: <Clock className="h-3 w-3" />,
    },
    {
      value: "no_answer",
      label: "No Answer",
      count: counts.failureCategories?.noAnswer ?? 0,
      icon: <PhoneOff className="h-3 w-3" />,
    },
    {
      value: "connection_error",
      label: "Connection Error",
      count: counts.failureCategories?.connectionError ?? 0,
      icon: <Wifi className="h-3 w-3" />,
    },
    {
      value: "voicemail",
      label: "Voicemail",
      count: counts.failureCategories?.voicemail ?? 0,
      icon: <Voicemail className="h-3 w-3" />,
    },
    {
      value: "email_failed",
      label: "Email Failed",
      count: counts.failureCategories?.emailFailed ?? 0,
      icon: <Mail className="h-3 w-3" />,
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
          {/* Main status tabs */}
          {mainStatusTabs.map((tab) => {
            const isActive = activeStatus === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => onStatusChange(tab.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
                  "text-xs font-medium",
                  "border transition-all duration-200",
                  isActive
                    ? "border-teal-200/60 bg-white/90 text-teal-700 shadow-sm"
                    : "border-transparent bg-white/40 text-slate-600 hover:bg-white/60 hover:text-slate-800",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold tabular-nums",
                    isActive
                      ? "bg-teal-100 text-teal-700"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          {/* Separator */}
          <div className="mx-1 h-4 w-px bg-slate-200" />

          {/* Failure category tabs */}
          {failureTabs.map((tab) => {
            const isActive = activeStatus === tab.value;
            // Only show tabs with count > 0, except "All Failed"
            if (tab.count === 0 && tab.value !== "all_failed") return null;

            return (
              <button
                key={tab.value}
                onClick={() => onStatusChange(tab.value)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1",
                  "text-xs font-medium",
                  "border transition-all duration-200",
                  isActive
                    ? "border-red-200/60 bg-red-50/80 text-red-700 shadow-sm"
                    : "border-transparent bg-white/40 text-slate-600 hover:bg-red-50/50 hover:text-red-700",
                )}
              >
                {tab.icon}
                <span className="hidden lg:inline">{tab.label}</span>
                <span
                  className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold tabular-nums",
                    isActive
                      ? "bg-red-100 text-red-600"
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
