"use client";

import {
  Phone,
  Calendar,
  MessageSquare,
  Voicemail,
  ChevronRight,
} from "lucide-react";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";
import { Progress } from "@odis-ai/shared/ui";
import Link from "next/link";
import type { OverviewStats } from "../types";

interface InboundPerformanceCardProps {
  stats: OverviewStats;
}

export function InboundPerformanceCard({ stats }: InboundPerformanceCardProps) {
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug ?? null;
  const inboundUrl = clinicSlug
    ? `/dashboard/${clinicSlug}/inbound`
    : "/dashboard/inbound";

  const total = stats.calls.total;
  const completed = stats.calls.completed;
  const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-stone-200/60 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">Inbound Calls</h3>
        <div className="rounded-lg bg-blue-50 p-2">
          <Phone className="h-4 w-4 text-blue-600" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-semibold text-slate-900 tabular-nums">
          {completed}
        </p>
        <p className="text-sm text-slate-500">calls answered</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Resolution Rate</span>
          <span className="font-medium text-slate-900">{resolutionRate}%</span>
        </div>
        <Progress value={resolutionRate} className="mt-2 h-2" />
      </div>

      <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-600">Appointments</span>
          </div>
          <span className="font-medium text-slate-900 tabular-nums">
            {stats.appointments.total}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-violet-500" />
            <span className="text-slate-600">Messages</span>
          </div>
          <span className="font-medium text-slate-900 tabular-nums">
            {stats.messages.total}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Voicemail className="h-4 w-4 text-amber-500" />
            <span className="text-slate-600">In Progress</span>
          </div>
          <span className="font-medium text-slate-900 tabular-nums">
            {stats.calls.inProgress}
          </span>
        </div>
      </div>

      <Link
        href={inboundUrl}
        className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        View Details
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
