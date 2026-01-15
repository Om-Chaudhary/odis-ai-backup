"use client";

import { Phone, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { TodayActivity } from "./types";

interface TodaySnapshotProps {
  activity: TodayActivity;
}

export function TodaySnapshot({ activity }: TodaySnapshotProps) {
  const stats = [
    {
      label: "Calls Handled",
      value: activity.callsHandled,
      icon: Phone,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "Appts Booked",
      value: activity.appointmentsBooked,
      icon: Calendar,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Messages",
      value: activity.messagesCaptured,
      icon: MessageSquare,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
    },
  ];

  return (
    <div className="rounded-xl border border-stone-200/60 bg-white p-5">
      <h3 className="mb-4 text-sm font-medium text-slate-500">
        Today&apos;s Activity
      </h3>
      <div className="flex items-center justify-between gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                stat.iconBg,
              )}
            >
              <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
