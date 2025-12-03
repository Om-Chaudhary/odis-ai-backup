"use client";

import {
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";
import type { CallStatus, EmailStatus } from "~/types/dashboard";

interface DischargeStatusIndicatorProps {
  type: "call" | "email";
  calls?: Array<{
    status?: CallStatus;
    scheduled_for?: string | null;
    ended_at?: string | null;
    created_at?: string;
  }>;
  emails?: Array<{
    status?: EmailStatus;
    scheduled_for?: string | null;
    sent_at?: string | null;
    created_at?: string;
  }>;
  testMode?: boolean;
}

/**
 * Format a scheduled time for display
 * Shows relative time for near future, absolute time otherwise
 */
function formatScheduledTime(scheduledFor: string | null | undefined): string {
  if (!scheduledFor) return "";

  const date = new Date(scheduledFor);
  const now = new Date();

  // If scheduled in the past, show "overdue"
  if (date < now) {
    return "overdue";
  }

  // If within next hour, show relative time
  const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60000);
  if (diffMinutes < 60) {
    return `in ${diffMinutes}m`;
  }

  // If today, show time only
  if (isToday(date)) {
    return `at ${format(date, "h:mm a")}`;
  }

  // If tomorrow, show "tomorrow at time"
  if (isTomorrow(date)) {
    return `tomorrow ${format(date, "h:mm a")}`;
  }

  // Otherwise show date and time
  return format(date, "MMM d, h:mm a");
}

/**
 * Format a completion time for display
 */
function formatCompletionTime(completedAt: string | null | undefined): string {
  if (!completedAt) return "";

  return formatDistanceToNow(new Date(completedAt), { addSuffix: true });
}

export function DischargeStatusIndicator({
  type,
  calls,
  emails,
  testMode: _testMode = false,
}: DischargeStatusIndicatorProps) {
  const items = type === "call" ? calls : emails;
  const Icon = type === "call" ? Phone : Mail;

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="text-slate-500">Not scheduled</span>
      </div>
    );
  }

  // Get the latest item (most recent - items are sorted by created_at desc, so first is latest)
  const latest = items[0];
  if (!latest) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="text-slate-500">Not scheduled</span>
      </div>
    );
  }
  const status = latest.status;

  // Get completion/sent time based on type
  const completionTime =
    type === "call"
      ? (latest as { ended_at?: string | null }).ended_at
      : (latest as { sent_at?: string | null }).sent_at;

  // Handle completed/sent status
  if (status === "completed" || status === "sent") {
    const timeDisplay = formatCompletionTime(completionTime);
    return (
      <div
        className="flex items-center gap-1.5 text-xs"
        title={
          completionTime
            ? `${type === "call" ? "Completed" : "Sent"} ${format(new Date(completionTime), "MMM d, yyyy 'at' h:mm a")}`
            : undefined
        }
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="text-slate-700">
          {type === "call" ? "Call" : "Email"}{" "}
          {status === "sent" ? "sent" : "completed"}
          {timeDisplay && (
            <span className="ml-1 text-slate-500">({timeDisplay})</span>
          )}
        </span>
      </div>
    );
  }

  // Handle in_progress/ringing/queued status
  if (status === "in_progress" || status === "ringing" || status === "queued") {
    const isQueued = status === "queued";
    const scheduledTime = formatScheduledTime(latest.scheduled_for);

    return (
      <div
        className="flex items-center gap-1.5 text-xs"
        title={
          latest.scheduled_for
            ? `Scheduled for ${format(new Date(latest.scheduled_for), "MMM d, yyyy 'at' h:mm a")}`
            : undefined
        }
      >
        {isQueued ? (
          <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600" />
        )}
        <span className={isQueued ? "text-amber-700" : "text-blue-700"}>
          {isQueued
            ? type === "call"
              ? "Call queued"
              : "Email queued"
            : type === "call"
              ? "In progress"
              : "Sending"}
          {isQueued && scheduledTime && (
            <span className="ml-1 text-amber-600">({scheduledTime})</span>
          )}
        </span>
      </div>
    );
  }

  // Handle failed status
  if (status === "failed" || status === "cancelled") {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
        <span className="text-red-700">
          {type === "call" ? "Call" : "Email"}{" "}
          {status === "cancelled" ? "cancelled" : "failed"}
        </span>
      </div>
    );
  }

  // Default/unknown status
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="text-slate-600">
        {type === "call" ? "Call" : "Email"} {status ?? "unknown"}
      </span>
    </div>
  );
}
