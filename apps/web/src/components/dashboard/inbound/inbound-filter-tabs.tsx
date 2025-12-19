"use client";

import {
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
  searchTerm: _searchTerm = "",
  onSearchChange: _onSearchChange,
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
                        ? "border-red-200/60 bg-red-50/80 text-red-700 shadow-sm"
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
                          ? "bg-red-100 text-red-700"
                          : "bg-teal-100 text-teal-700"
                        : tab.highlight && tab.count > 0
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
                          ? "border-red-200/60 bg-red-50/80 text-red-700 shadow-sm"
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
                            ? "bg-red-100 text-red-700"
                            : "bg-teal-100 text-teal-700"
                        : tab.urgent && tab.count > 0
                          ? "bg-red-100 text-red-600"
                          : tab.highlight && tab.count > 0
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between gap-6">
      {/* Left: Date Navigator */}
      <div className="flex items-center">
        <div className="flex items-center gap-4">
          {/* Arrow buttons grouped */}
          <div className="flex items-center rounded-lg border border-teal-200/50 bg-white/60">
            <button
              onClick={goToPreviousDay}
              disabled={isLoading}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-l-lg text-slate-600 transition-all duration-200",
                isLoading
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-teal-50 hover:text-teal-700",
              )}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px bg-teal-200/50" />
            <button
              onClick={goToNextDay}
              disabled={isAtToday || isLoading}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-r-lg text-slate-600 transition-all duration-200",
                isAtToday || isLoading
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-teal-50 hover:text-teal-700",
              )}
              aria-label="Next day"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Date info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-800">
                {dateLabel}
              </span>
            </div>
            {!isAtToday && (
              <>
                <span className="text-slate-300">·</span>
                <button
                  onClick={goToToday}
                  disabled={isLoading}
                  className={cn(
                    "text-base font-medium text-teal-600 transition-colors",
                    "hover:text-teal-700 hover:underline",
                  )}
                >
                  Today
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: View Mode Filter Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-teal-100/50 bg-white/40 p-1">
        <button
          onClick={() => onViewModeChange("calls")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200",
            viewMode === "calls"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <Phone className="h-5 w-5" />
          Calls
          {stats.calls.inProgress > 0 && (
            <span
              className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
                viewMode === "calls"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-blue-100 text-blue-600",
              )}
            >
              {stats.calls.inProgress}
            </span>
          )}
        </button>
        <button
          onClick={() => onViewModeChange("appointments")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200",
            viewMode === "appointments"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <CalendarIcon className="h-5 w-5" />
          Appointments
          {stats.appointments.pending > 0 && (
            <span
              className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
                viewMode === "appointments"
                  ? "bg-red-100 text-red-700"
                  : "bg-red-100 text-red-600",
              )}
            >
              {stats.appointments.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => onViewModeChange("messages")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200",
            viewMode === "messages"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <MessageSquare className="h-5 w-5" />
          Messages
          {stats.messages.new > 0 && (
            <span
              className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
                viewMode === "messages"
                  ? "bg-red-100 text-red-700"
                  : "bg-red-100 text-red-600",
              )}
            >
              {stats.messages.new}
            </span>
          )}
        </button>
      </div>

      {/* Right: Status filters */}
      {renderStatusFilters()}
    </div>
  );
}
