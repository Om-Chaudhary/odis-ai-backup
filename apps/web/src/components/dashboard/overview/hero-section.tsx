"use client";

import { Check, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { OverviewStatus, OverviewPeriod } from "./types";
import Link from "next/link";

interface HeroSectionProps {
  status: OverviewStatus;
  period: OverviewPeriod;
  callsAnswered: number;
}

export function HeroSection({
  status,
  period,
  callsAnswered,
}: HeroSectionProps) {
  if (status.inProgressCalls > 0) {
    return <LiveCallsHero inProgressCount={status.inProgressCalls} />;
  }

  if (status.hasUrgentItems) {
    return (
      <AttentionHero
        period={period}
        callsAnswered={callsAnswered}
        flaggedCount={status.totalFlagged}
        criticalCount={status.criticalCount}
      />
    );
  }

  return <AllClearHero period={period} callsAnswered={callsAnswered} />;
}

function AllClearHero({
  period,
  callsAnswered,
}: {
  period: OverviewPeriod;
  callsAnswered: number;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 px-8 py-10">
      <div className="flex items-start gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100/80">
          <Check className="h-7 w-7 text-emerald-600" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Everything's running smoothly
          </h2>
          <p className="mt-1.5 text-base text-slate-600">
            {callsAnswered > 0 ? (
              <>
                <span className="font-medium text-slate-700">
                  {callsAnswered} call{callsAnswered !== 1 ? "s" : ""}
                </span>{" "}
                handled since {period.startDate}
              </>
            ) : (
              <>No new calls since {period.startDate}</>
            )}{" "}
            <span className="text-slate-400">·</span> No urgent items
          </p>
        </div>
      </div>
    </div>
  );
}

function AttentionHero({
  period,
  callsAnswered,
  flaggedCount,
  criticalCount,
}: {
  period: OverviewPeriod;
  callsAnswered: number;
  flaggedCount: number;
  criticalCount: number;
}) {
  const hasCritical = criticalCount > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border px-8 py-10",
        hasCritical
          ? "border-red-100 bg-gradient-to-br from-red-50/80 via-white to-red-50/40"
          : "border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40",
      )}
    >
      <div className="flex items-start gap-5">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
            hasCritical ? "bg-red-100/80" : "bg-amber-100/80",
          )}
        >
          <AlertTriangle
            className={cn(
              "h-7 w-7",
              hasCritical ? "text-red-600" : "text-amber-600",
            )}
            strokeWidth={2}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {flaggedCount} item{flaggedCount !== 1 ? "s" : ""} flagged for your
            review
          </h2>
          <p className="mt-1.5 text-base text-slate-600">
            Plus{" "}
            <span className="font-medium text-slate-700">{callsAnswered}</span>{" "}
            call{callsAnswered !== 1 ? "s" : ""} handled since{" "}
            {period.startDate}
          </p>
          <Link
            href="#flagged-items"
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
              hasCritical
                ? "text-red-700 hover:text-red-800"
                : "text-amber-700 hover:text-amber-800",
            )}
          >
            View flagged items
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function LiveCallsHero({ inProgressCount }: { inProgressCount: number }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 px-8 py-10">
      <div className="flex items-start gap-5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100/80">
          <Activity className="h-7 w-7 text-blue-600" strokeWidth={2} />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-500"></span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {inProgressCount} call{inProgressCount !== 1 ? "s" : ""} in progress
          </h2>
          <p className="mt-1.5 text-base text-slate-600">
            AI assistant is currently handling incoming calls
          </p>
          <Link
            href="/dashboard/inbound"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 transition-colors hover:text-blue-800"
          >
            View live calls
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
