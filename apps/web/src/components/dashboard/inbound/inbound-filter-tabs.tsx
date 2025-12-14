"use client";

import {
  Search,
  Phone,
  Calendar as CalendarIcon,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays, subDays, isToday, isYesterday } from "date-fns";
import { cn } from "@odis-ai/utils";
import type {
  ViewMode,
  InboundStats,
  CallStatusFilter,
  AppointmentStatusFilter,
  MessageStatusFilter,
} from "./types";

interface InboundFilterTabsProps {
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Call status filter
  callStatus: CallStatusFilter;
  onCallStatusChange: (status: CallStatusFilter) => void;
  // Appointment status filter
  appointmentStatus: AppointmentStatusFilter;
  onAppointmentStatusChange: (status: AppointmentStatusFilter) => void;
  // Message status filter
  messageStatus: MessageStatusFilter;
  onMessageStatusChange: (status: MessageStatusFilter) => void;
  // Stats
  stats: InboundStats;
  // Search
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  // Date navigation
  currentDate: Date;
  onDateChange: (date: Date | null) => void;
  isLoading?: boolean;
}

/**
 * Inbound Filter Tabs - Compact Glassmorphism Layout
 *
 * Structure (single row):
 * Date navigation | View tabs (Calls/Appointments/Messages) | Status filters | Search
 */
export function InboundFilterTabs({
  viewMode,
  onViewModeChange,
  callStatus,
  onCallStatusChange,
  appointmentStatus,
  onAppointmentStatusChange,
  messageStatus,
  onMessageStatusChange,
  stats,
  searchTerm = "",
  onSearchChange,
  currentDate,
  onDateChange,
  isLoading = false,
}: InboundFilterTabsProps) {
  // Date navigation
  const goToPreviousDay = () => onDateChange(subDays(currentDate, 1));
  const goToNextDay = () => onDateChange(addDays(currentDate, 1));
  const goToToday = () => onDateChange(new Date());
  const isAtToday = isToday(currentDate);

  const dateLabel = isToday(currentDate)
    ? "Today"
    : isYesterday(currentDate)
      ? "Yesterday"
      : format(currentDate, "EEE, MMM d");

  // Call status tabs
  const callStatusTabs: Array<{
    value: CallStatusFilter;
    label: string;
    count: number;
  }> = [
    { value: "all", label: "All", count: stats.calls.total },
    { value: "completed", label: "Completed", count: stats.calls.completed },
    { value: "in_progress", label: "Active", count: stats.calls.inProgress },
    { value: "failed", label: "Failed", count: stats.calls.failed },
  ];

  // Appointment status tabs
  const appointmentStatusTabs: Array<{
    value: AppointmentStatusFilter;
    label: string;
    count: number;
    highlight?: boolean;
  }> = [
    { value: "all", label: "All", count: stats.appointments.total },
    {
      value: "pending",
      label: "Pending",
      count: stats.appointments.pending,
      highlight: true,
    },
    {
      value: "confirmed",
      label: "Confirmed",
      count: stats.appointments.confirmed,
    },
    {
      value: "rejected",
      label: "Rejected",
      count: stats.appointments.rejected,
    },
  ];

  // Message status tabs
  const messageStatusTabs: Array<{
    value: MessageStatusFilter;
    label: string;
    count: number;
    highlight?: boolean;
    urgent?: boolean;
  }> = [
    { value: "all", label: "All", count: stats.messages.total },
    { value: "new", label: "New", count: stats.messages.new, highlight: true },
    {
      value: "urgent",
      label: "Urgent",
      count: stats.messages.urgent,
      urgent: true,
    },
    { value: "read", label: "Read", count: stats.messages.read },
    { value: "resolved", label: "Resolved", count: stats.messages.resolved },
  ];

  // Get current status filter based on view mode
  const renderStatusFilters = () => {
    switch (viewMode) {
      case "calls":
        return (
          <div className="flex items-center gap-1">
            {callStatusTabs.map((tab) => {
              const isActive = callStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onCallStatusChange(tab.value)}
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
          </div>
        );

      case "appointments":
        return (
          <div className="flex items-center gap-1">
            {appointmentStatusTabs.map((tab) => {
              const isActive = appointmentStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onAppointmentStatusChange(tab.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
                    "text-xs font-medium",
                    "border transition-all duration-200",
                    isActive
                      ? tab.highlight
                        ? "border-amber-200/60 bg-amber-50/80 text-amber-700 shadow-sm"
                        : "border-teal-200/60 bg-white/90 text-teal-700 shadow-sm"
                      : "border-transparent bg-white/40 text-slate-600 hover:bg-white/60 hover:text-slate-800",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold tabular-nums",
                      isActive
                        ? tab.highlight
                          ? "bg-amber-100 text-amber-700"
                          : "bg-teal-100 text-teal-700"
                        : tab.highlight && tab.count > 0
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case "messages":
        return (
          <div className="flex items-center gap-1">
            {messageStatusTabs.map((tab) => {
              const isActive = messageStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onMessageStatusChange(tab.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
                    "text-xs font-medium",
                    "border transition-all duration-200",
                    isActive
                      ? tab.urgent
                        ? "border-red-200/60 bg-red-50/80 text-red-700 shadow-sm"
                        : tab.highlight
                          ? "border-amber-200/60 bg-amber-50/80 text-amber-700 shadow-sm"
                          : "border-teal-200/60 bg-white/90 text-teal-700 shadow-sm"
                      : "border-transparent bg-white/40 text-slate-600 hover:bg-white/60 hover:text-slate-800",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold tabular-nums",
                      isActive
                        ? tab.urgent
                          ? "bg-red-100 text-red-700"
                          : tab.highlight
                            ? "bg-amber-100 text-amber-700"
                            : "bg-teal-100 text-teal-700"
                        : tab.urgent && tab.count > 0
                          ? "bg-red-100 text-red-600"
                          : tab.highlight && tab.count > 0
                            ? "bg-amber-100 text-amber-600"
                            : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left: Date nav + View tabs */}
      <div className="flex items-center gap-4">
        {/* Date Navigation - Optional filtering by date */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDateChange(null)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium transition-all duration-200",
              "border",
              !currentDate || isAtToday
                ? "border-teal-200/60 bg-white/90 text-teal-700 shadow-sm"
                : "border-transparent bg-white/40 text-slate-600 hover:bg-white/60",
            )}
          >
            All Dates
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-teal-200/50 bg-white/60">
              <button
                onClick={goToPreviousDay}
                disabled={isLoading}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-l-lg text-slate-600 transition-all duration-200",
                  isLoading
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-teal-50 hover:text-teal-700",
                )}
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-teal-200/50" />
              <button
                onClick={goToToday}
                className={cn(
                  "flex h-8 items-center justify-center px-2 text-xs font-medium text-slate-600 transition-all duration-200",
                  isLoading
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-teal-50 hover:text-teal-700",
                )}
                aria-label="Today"
              >
                {dateLabel}
              </button>
              <div className="h-4 w-px bg-teal-200/50" />
              <button
                onClick={goToNextDay}
                disabled={isAtToday || isLoading}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-r-lg text-slate-600 transition-all duration-200",
                  isAtToday || isLoading
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-teal-50 hover:text-teal-700",
                )}
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-0.5 rounded-lg border border-teal-100/50 bg-white/40 p-0.5">
          <button
            onClick={() => onViewModeChange("appointments")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200",
              viewMode === "appointments"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Appointments
            {stats.appointments.pending > 0 && (
              <span
                className={cn(
                  "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold tabular-nums",
                  viewMode === "appointments"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-amber-100 text-amber-600",
                )}
              >
                {stats.appointments.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => onViewModeChange("messages")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200",
              viewMode === "messages"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
            {stats.messages.new > 0 && (
              <span
                className={cn(
                  "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-semibold tabular-nums",
                  viewMode === "messages"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-amber-100 text-amber-600",
                )}
              >
                {stats.messages.new}
              </span>
            )}
          </button>
          <button
            onClick={() => onViewModeChange("calls")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200",
              viewMode === "calls"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Phone className="h-3.5 w-3.5" />
            Calls
          </button>
        </div>
      </div>

      {/* Center: Status filters */}
      {renderStatusFilters()}

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
