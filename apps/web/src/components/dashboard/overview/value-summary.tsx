"use client";

import {
  Phone,
  Calendar,
  MessageSquare,
  Clock,
  DollarSign,
  Timer,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
import type { OverviewValue, OverviewPeriod, DateRangeOption } from "./types";
import Link from "next/link";

interface ValueSummaryProps {
  value: OverviewValue;
  period: OverviewPeriod;
  selectedDays: DateRangeOption;
  onDaysChange: (days: DateRangeOption) => void;
}

function formatTimeSaved(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `~${minutes}m saved`;
  }
  return `~${hours}h saved`;
}

export function ValueSummary({
  value,
  period,
  selectedDays,
  onDaysChange,
}: ValueSummaryProps) {
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug ?? null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const inboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/inbound`
    : "/dashboard/inbound";

  return (
    <div className="rounded-xl border border-stone-200/60 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-slate-900">
          Since {period.startDate}
        </h3>
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              onClick={() => onDaysChange(days)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                selectedDays === days
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Last {days}D
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ValueStat
          icon={Phone}
          value={value.callsAnswered}
          label="calls answered"
          description="After-hours coverage while your team was away"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <ValueStat
          icon={Calendar}
          value={value.appointmentsBooked}
          label="appointments booked"
          description="Scheduled directly by the AI assistant"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <ValueStat
          icon={MessageSquare}
          value={value.messagesCapured}
          label="messages captured"
          description="Voicemails and callback requests"
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <ValueStat
          icon={Clock}
          value={formatDuration(value.avgCallDuration)}
          label="average call"
          description="Callers got help quickly"
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <ValueStat
          icon={Timer}
          value={formatTimeSaved(value.timeSavedHours)}
          label="staff time"
          description="Hours your team didn't spend on calls"
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
        />
        <ValueStat
          icon={DollarSign}
          value={`$${value.costSaved}`}
          label="estimated savings"
          description="vs manual call handling"
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
      </div>

      {/* Contextual summary */}
      {value.callsAnswered > 0 && (
        <div className="mt-6 rounded-lg bg-stone-50 p-4">
          <p className="text-sm text-slate-700">
            <span className="font-medium">Summary:</span> Your AI assistant
            handled{" "}
            <span className="font-semibold text-slate-900">
              {value.callsAnswered} calls
            </span>{" "}
            this period, saving your team approximately{" "}
            <span className="font-semibold text-teal-700">
              {value.timeSavedHours} hours
            </span>{" "}
            of phone time.
          </p>
        </div>
      )}

      <Link
        href={inboundUrl}
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        View detailed activity
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}

interface ValueStatProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
  description: string;
  iconColor: string;
  iconBg: string;
}

function ValueStat({
  icon: Icon,
  value,
  label,
  description,
  iconColor,
  iconBg,
}: ValueStatProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          iconBg,
        )}
      >
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-slate-900 tabular-nums">
            {value}
          </span>
          <span className="text-sm text-slate-500">{label}</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}
