"use client";

import { cn } from "@odis-ai/shared/util";
import { formatDistanceToNow } from "date-fns";
import type { SystemHealth } from "./types";

interface AIHealthCardProps {
  systemHealth: SystemHealth;
}

export function AIHealthCard({ systemHealth }: AIHealthCardProps) {
  const { status, lastActivity } = systemHealth;

  const statusConfig = {
    healthy: {
      label: "All Systems Operational",
      color: "bg-emerald-500",
      pulseColor: "bg-emerald-400",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
    },
    warning: {
      label: "Needs Attention",
      color: "bg-amber-500",
      pulseColor: "bg-amber-400",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
    },
    error: {
      label: "Issues Detected",
      color: "bg-red-500",
      pulseColor: "bg-red-400",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
    },
  };

  const config = statusConfig[status];

  const lastActivityText = lastActivity
    ? `Last call: ${formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}`
    : "No recent activity";

  return (
    <div className="rounded-xl border border-stone-200/60 bg-white p-5">
      <div className="flex items-center gap-4">
        {/* Animated status indicator */}
        <div className="relative flex h-12 w-12 items-center justify-center">
          {/* Pulse animation */}
          <span
            className={cn(
              "absolute h-full w-full animate-ping rounded-full opacity-20",
              config.pulseColor,
            )}
          />
          {/* Inner circle */}
          <span className={cn("relative h-8 w-8 rounded-full", config.color)} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-slate-500">
            AI Assistant Status
          </h3>
          <p className={cn("text-lg font-semibold", config.textColor)}>
            {config.label}
          </p>
          <p className="text-xs text-slate-500">{lastActivityText}</p>
        </div>
      </div>
    </div>
  );
}
