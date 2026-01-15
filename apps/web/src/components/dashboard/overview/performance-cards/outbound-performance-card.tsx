"use client";

import {
  PhoneOutgoing,
  Check,
  AlertCircle,
  Voicemail,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
import { Progress } from "@odis-ai/shared/ui";
import Link from "next/link";
import type { OutboundPerformance } from "../types";

interface OutboundPerformanceCardProps {
  outboundPerformance: OutboundPerformance;
}

export function OutboundPerformanceCard({
  outboundPerformance,
}: OutboundPerformanceCardProps) {
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug ?? null;
  const outboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/outbound`
    : "/dashboard/outbound";

  const { completed, failed, voicemails, queued, successRate } =
    outboundPerformance;

  return (
    <div className="rounded-xl border border-stone-200/60 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">
          Discharge Follow-ups
        </h3>
        <div className="rounded-lg bg-teal-50 p-2">
          <PhoneOutgoing className="h-4 w-4 text-teal-600" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-semibold text-slate-900 tabular-nums">
          {completed}
        </p>
        <p className="text-sm text-slate-500">calls completed</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Success Rate</span>
          <span className="font-medium text-slate-900">{successRate}%</span>
        </div>
        <Progress
          value={successRate}
          className={cn(
            "mt-2 h-2",
            successRate >= 70
              ? "[&>div]:bg-emerald-500"
              : "[&>div]:bg-amber-500",
          )}
        />
      </div>

      <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-600">Successful</span>
          </div>
          <span className="font-medium text-slate-900 tabular-nums">
            {completed - voicemails}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Voicemail className="h-4 w-4 text-amber-500" />
            <span className="text-slate-600">Voicemails</span>
          </div>
          <span className="font-medium text-slate-900 tabular-nums">
            {voicemails}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-slate-600">Failed</span>
          </div>
          <span className="font-medium text-slate-900 tabular-nums">
            {failed}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-slate-600">Scheduled</span>
          </div>
          <span className="font-medium text-slate-900 tabular-nums">
            {queued}
          </span>
        </div>
      </div>

      <Link
        href={outboundUrl}
        className="mt-4 flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700"
      >
        View Details
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
