"use client";

import { format, formatDistanceToNow, isValid } from "date-fns";
import { Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import { cn } from "@odis-ai/shared/util";

interface TimestampBadgeProps {
  timestamp: string;
  duration?: number | null;
  size?: "sm" | "md";
  showRelative?: boolean;
  label?: string;
}

/**
 * Formats seconds into a readable duration string
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Safely parse a date string
 */
function safeParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isValid(date) ? date : null;
}

/**
 * Timestamp Badge - Shows formatted timestamp with optional duration
 * Hover shows full timestamp details
 */
export function TimestampBadge({
  timestamp,
  duration,
  size = "md",
  showRelative = false,
  label,
}: TimestampBadgeProps) {
  const date = safeParseDate(timestamp);

  if (!date) {
    return null;
  }

  const formattedDate = format(date, "MMM d, yyyy");
  const formattedTime = format(date, "h:mm a");
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  const fullTimestamp = format(date, "EEEE, MMMM d, yyyy 'at' h:mm:ss a");

  const textSizeClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400",
              textSizeClass,
            )}
          >
            <Clock
              className={cn(
                "shrink-0",
                size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
              )}
            />
            <span>
              {label && <span className="font-medium">{label} </span>}
              {showRelative
                ? relativeTime
                : `${formattedDate} at ${formattedTime}`}
              {duration != null && duration > 0 && (
                <span className="ml-1.5 text-slate-400 dark:text-slate-500">
                  · {formatDuration(duration)}
                </span>
              )}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <div>{fullTimestamp}</div>
            {duration != null && duration > 0 && (
              <div className="text-slate-400">
                Duration: {formatDuration(duration)}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
