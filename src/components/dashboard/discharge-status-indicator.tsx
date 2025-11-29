"use client";

import {
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
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

  // Get the latest item (most recent)
  const latest = items[items.length - 1];
  if (!latest) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="text-slate-500">Not scheduled</span>
      </div>
    );
  }
  const status = latest.status;

  // Handle completed/sent status
  if (status === "completed" || status === "sent") {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="text-slate-700">
          {type === "call" ? "Call" : "Email"} completed
        </span>
      </div>
    );
  }

  // Handle in_progress/ringing status
  if (status === "in_progress" || status === "ringing" || status === "queued") {
    const isQueued = status === "queued";
    return (
      <div className="flex items-center gap-1.5 text-xs">
        {isQueued ? (
          <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600" />
        )}
        <span className={isQueued ? "text-slate-600" : "text-blue-700"}>
          {isQueued ? "Queued" : type === "call" ? "In progress" : "Sending"}
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
          {type === "call" ? "Call" : "Email"} failed
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
