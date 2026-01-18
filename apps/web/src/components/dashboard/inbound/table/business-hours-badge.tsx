/**
 * BusinessHoursBadge Component
 *
 * Displays whether a call occurred during active hours, lunch break, or after hours.
 * Uses clinic schedule config and blocked periods from the database.
 */

import { toZonedTime } from "date-fns-tz";
import { Sun, Moon, Coffee } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

export type BusinessHoursStatus = "active" | "lunch" | "after-hours";

interface ScheduleConfig {
  open_time: string;
  close_time: string;
  days_of_week: number[];
  timezone: string;
}

interface BlockedPeriod {
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
}

/**
 * Parse a time string (HH:MM:SS or HH:MM) into hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

/**
 * Check if a time falls within a time range
 */
function isTimeInRange(
  hours: number,
  minutes: number,
  startTime: string,
  endTime: string,
): boolean {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  const currentMinutes = hours * 60 + minutes;
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Determine the business hours status for a given timestamp
 */
export function getBusinessHoursStatus(
  timestamp: Date | string,
  scheduleConfig: ScheduleConfig,
  blockedPeriods: BlockedPeriod[],
): BusinessHoursStatus {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const timezone = scheduleConfig.timezone || "America/Los_Angeles";

  // Convert to clinic's timezone
  const zonedTime = toZonedTime(date, timezone);
  const hours = zonedTime.getHours();
  const minutes = zonedTime.getMinutes();
  const dayOfWeek = zonedTime.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Check if it's a closed day (not in days_of_week)
  if (!scheduleConfig.days_of_week.includes(dayOfWeek)) {
    return "after-hours";
  }

  // Check if within operating hours
  const withinOperatingHours = isTimeInRange(
    hours,
    minutes,
    scheduleConfig.open_time,
    scheduleConfig.close_time,
  );

  if (!withinOperatingHours) {
    return "after-hours";
  }

  // Check if within any blocked period (lunch break, etc.)
  for (const period of blockedPeriods) {
    // Check if this blocked period applies to this day
    if (!period.days_of_week.includes(dayOfWeek)) {
      continue;
    }

    if (isTimeInRange(hours, minutes, period.start_time, period.end_time)) {
      // Return "lunch" for lunch breaks, could extend for other types
      return "lunch";
    }
  }

  return "active";
}

interface BusinessHoursBadgeProps {
  status: BusinessHoursStatus;
  className?: string;
  showLabel?: boolean;
}

/**
 * Badge component that displays business hours status
 */
export function BusinessHoursBadge({
  status,
  className,
  showLabel = true,
}: BusinessHoursBadgeProps) {
  const config = {
    active: {
      icon: Sun,
      label: "Active",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconClassName: "text-emerald-500",
    },
    lunch: {
      icon: Coffee,
      label: "Lunch",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      iconClassName: "text-amber-500",
    },
    "after-hours": {
      icon: Moon,
      label: "After Hours",
      className: "bg-slate-50 text-slate-600 border-slate-200",
      iconClassName: "text-slate-400",
    },
  };

  const {
    icon: Icon,
    label,
    className: statusClassName,
    iconClassName,
  } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        statusClassName,
        className,
      )}
      title={`Call received during ${label.toLowerCase()}`}
    >
      <Icon className={cn("h-3 w-3", iconClassName)} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
