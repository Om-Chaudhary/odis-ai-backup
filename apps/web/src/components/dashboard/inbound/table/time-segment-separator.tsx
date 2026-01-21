import { Sun, Moon, Coffee } from "lucide-react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { cn } from "@odis-ai/shared/util";
import type { BusinessHoursStatus } from "./business-hours-badge";

interface TimeSegmentSeparatorProps {
  status: BusinessHoursStatus;
  timestamp: Date | string;
}

/**
 * Time Segment Separator Component
 *
 * Displays a horizontal divider with a badge showing the time segment
 * (Active, After Hours, or blocked period name like "Lunch Break").
 * Groups calls by their business hours status.
 */
export function TimeSegmentSeparator({
  status,
  timestamp,
}: TimeSegmentSeparatorProps) {
  // Format date intelligently
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  let dateLabel: string;

  if (isToday(date)) {
    dateLabel = "Today";
  } else if (isYesterday(date)) {
    dateLabel = "Yesterday";
  } else if (isThisWeek(date, { weekStartsOn: 0 })) {
    // Within this week - show day of week
    dateLabel = format(date, "EEEE"); // "Monday", "Tuesday", etc.
  } else {
    // Older than a week - show full date
    dateLabel = format(date, "MMM d, yyyy"); // "Jan 18, 2026"
  }

  let icon: typeof Sun;
  let label: string;
  let accentColor: string;
  let bgColor: string;
  let textColor: string;
  let borderColor: string;

  switch (status.type) {
    case "active":
      icon = Sun;
      label = "Active Hours";
      accentColor = "bg-emerald-500";
      bgColor = "bg-gradient-to-r from-emerald-50/60 to-transparent";
      textColor = "text-emerald-900";
      borderColor = "border-emerald-200/50";
      break;
    case "blocked":
      icon = Coffee;
      label = status.periodName; // e.g., "Lunch Break", "Staff Meeting"
      accentColor = "bg-amber-500";
      bgColor = "bg-gradient-to-r from-amber-50/60 to-transparent";
      textColor = "text-amber-900";
      borderColor = "border-amber-200/50";
      break;
    case "after-hours":
      icon = Moon;
      label = "After Hours";
      accentColor = "bg-slate-500";
      bgColor = "bg-gradient-to-r from-slate-50/60 to-transparent";
      textColor = "text-slate-900";
      borderColor = "border-slate-200/50";
      break;
  }

  const Icon = icon;

  return (
    <tr className="group/separator">
      <td colSpan={5} className="p-0">
        <div className="relative">
          {/* Section Header Container */}
          <div
            className={cn(
              "relative flex items-center gap-3 border-y py-3 pl-4 pr-6",
              bgColor,
              borderColor,
            )}
          >
            {/* Left Accent Bar */}
            <div className={cn("h-6 w-1 rounded-full", accentColor)} />

            {/* Icon */}
            <Icon className={cn("h-5 w-5 flex-shrink-0", textColor)} />

            {/* Label */}
            <span
              className={cn(
                "text-sm font-semibold uppercase tracking-wide",
                textColor,
              )}
            >
              {label}
            </span>

            {/* Date */}
            <span
              className={cn(
                "text-sm font-medium opacity-60",
                textColor,
              )}
            >
              · {dateLabel}
            </span>

            {/* Decorative line */}
            <div
              className={cn(
                "ml-auto h-px flex-1 opacity-30",
                accentColor.replace("bg-", "bg-gradient-to-r from-"),
                "to-transparent",
              )}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}
