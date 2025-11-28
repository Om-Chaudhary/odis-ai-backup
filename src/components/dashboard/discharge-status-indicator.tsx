"use client";

import {
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
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

export function DischargeStatusIndicator({
  type,
  calls,
  emails,
  testMode = false,
}: DischargeStatusIndicatorProps) {
  const items = type === "call" ? calls : emails;
  const Icon = type === "call" ? Phone : Mail;

  if (!items || items.length === 0) {
    return (
      <div className="transition-smooth flex items-center gap-2 text-sm">
        <Icon className="transition-smooth h-4 w-4 shrink-0 text-slate-400" />
        <span className="text-slate-600">Not scheduled</span>
      </div>
    );
  }

  // Get the latest item (most recent)
  const latest = items[items.length - 1];
  if (!latest) {
    return (
      <div className="transition-smooth flex items-center gap-2 text-sm">
        <Icon className="transition-smooth h-4 w-4 shrink-0 text-slate-400" />
        <span className="text-slate-600">Not scheduled</span>
      </div>
    );
  }
  const status = latest.status;

  // Handle completed/sent status
  if (status === "completed" || status === "sent") {
    const timestamp =
      type === "call"
        ? (latest as { ended_at?: string | null }).ended_at
        : ((latest as { sent_at?: string | null }).sent_at ??
          latest.scheduled_for);
    return (
      <div className="transition-smooth flex items-center gap-2 text-sm">
        <CheckCircle2 className="transition-smooth h-4 w-4 shrink-0 text-emerald-600" />
        <span className="text-slate-700">
          {type === "call" ? "Call" : "Email"} completed
        </span>
        {timestamp && (
          <span className="text-xs text-slate-500">
            ({format(new Date(timestamp), "MMM d, h:mm a")})
          </span>
        )}
        {testMode && <span className="text-xs text-slate-500">(Test)</span>}
      </div>
    );
  }

  // Handle in_progress/ringing status
  if (status === "in_progress" || status === "ringing" || status === "queued") {
    const isQueued = status === "queued";
    const scheduledFor = latest.scheduled_for;
    return (
      <div className="transition-smooth flex items-center gap-2 text-sm">
        {isQueued ? (
          <Clock className="transition-smooth h-4 w-4 shrink-0 text-slate-500" />
        ) : (
          <Loader2 className="transition-smooth h-4 w-4 shrink-0 animate-spin text-blue-600" />
        )}
        <span className={isQueued ? "text-slate-600" : "text-blue-700"}>
          {isQueued
            ? "Queued"
            : type === "call"
              ? "Call in progress"
              : "Email sending"}
        </span>
        {scheduledFor && isQueued && (
          <span className="text-xs text-slate-500">
            ({format(new Date(scheduledFor), "MMM d, h:mm a")})
          </span>
        )}
        {testMode && <span className="text-xs text-slate-500">(Test)</span>}
      </div>
    );
  }

  // Handle failed status
  if (status === "failed" || status === "cancelled") {
    return (
      <div className="transition-smooth flex items-center gap-2 text-sm">
        <AlertCircle className="transition-smooth h-4 w-4 shrink-0 text-red-600" />
        <span className="text-red-700">
          {type === "call" ? "Call" : "Email"} failed
        </span>
        {testMode && <span className="text-xs text-slate-500">(Test)</span>}
      </div>
    );
  }

  // Default/unknown status
  return (
    <div className="transition-smooth flex items-center gap-2 text-sm">
      <Icon className="transition-smooth h-4 w-4 shrink-0 text-slate-400" />
      <span className="text-slate-600">
        {type === "call" ? "Call" : "Email"} status: {status ?? "unknown"}
      </span>
      {testMode && <span className="text-xs text-slate-500">(Test)</span>}
    </div>
  );
}
