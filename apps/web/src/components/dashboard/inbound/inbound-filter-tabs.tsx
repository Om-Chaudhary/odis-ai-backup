"use client";

import { Calendar as CalendarIcon, MessageSquare, Phone } from "lucide-react";
import { cn } from "@odis-ai/utils";
import type { ViewMode, InboundStats } from "./types";

interface InboundFilterTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  stats: InboundStats;
}

/**
 * Inbound Filter Tabs - Simple view mode switcher
 */
export function InboundFilterTabs({
  viewMode,
  onViewModeChange,
  stats,
}: InboundFilterTabsProps) {
  return (
    <div className="flex items-center">
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
          {stats.calls.total > 0 && (
            <span
              className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
                viewMode === "calls"
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {stats.calls.total}
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
          {stats.appointments.total > 0 && (
            <span
              className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
                viewMode === "appointments"
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {stats.appointments.total}
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
          {stats.messages.total > 0 && (
            <span
              className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
                viewMode === "messages"
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {stats.messages.total}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
