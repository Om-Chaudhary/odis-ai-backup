"use client";

/**
 * Schedule Preview Component
 *
 * Shows next N scheduled run times
 */

import { Clock, AlertCircle } from "lucide-react";
import { useSchedulePreview } from "./hooks/use-schedule-preview";

interface SchedulePreviewProps {
  cron: string;
  timezone?: string;
  count?: number;
}

export function SchedulePreview({
  cron,
  timezone = "America/Los_Angeles",
  count = 3,
}: SchedulePreviewProps) {
  const { items, error } = useSchedulePreview({ cron, timezone, count });

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <div>
          <p className="text-xs font-medium text-amber-900">Cannot preview schedule</p>
          <p className="text-xs text-amber-700">{error}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-600" />
        <h4 className="text-sm font-medium text-slate-900">
          Next {count} Sync Times
        </h4>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-sm text-slate-700"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
              {i + 1}
            </span>
            <span className="font-mono text-xs">{item.date}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Times shown in {timezone}
      </p>
    </div>
  );
}
