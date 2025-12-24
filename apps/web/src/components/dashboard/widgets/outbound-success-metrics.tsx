"use client";

import { api } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import { Skeleton } from "@odis-ai/shared/ui/skeleton";
import { NumberTicker } from "@odis-ai/shared/ui/number-ticker";
import {
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Voicemail,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

export function OutboundSuccessMetrics() {
  const { data, isLoading } = api.dashboard.getTodayOutboundSuccess.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
    },
  );

  if (isLoading) {
    return <OutboundSuccessMetricsSkeleton />;
  }

  if (!data) {
    return null;
  }

  // Don't show if no activity today
  if (data.combined.totalAttempts === 0) {
    return null;
  }

  const callSuccessRate = data.calls.successRate;
  const emailSuccessRate = data.emails.successRate;

  return (
    <Card className="animate-card-in overflow-hidden rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/10 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Today&apos;s Outbound
              </CardTitle>
              <p className="text-sm text-slate-500">Real-time performance</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              <NumberTicker value={data.combined.overallSuccessRate} />%
            </div>
            <p className="text-xs text-slate-500">Overall Success</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Calls Section */}
          <div className="rounded-xl border border-slate-100 bg-white/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Calls</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricItem
                icon={CheckCircle2}
                label="Completed"
                value={data.calls.completed}
                color="green"
              />
              <MetricItem
                icon={XCircle}
                label="Failed"
                value={data.calls.failed}
                color={data.calls.failed > 0 ? "red" : "slate"}
              />
              <MetricItem
                icon={Voicemail}
                label="Voicemail"
                value={data.calls.voicemails}
                subValue={`${data.calls.voicemailRate}%`}
                color="amber"
              />
              <MetricItem
                icon={Clock}
                label="Queued"
                value={data.calls.queued}
                color="blue"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <DollarSign className="h-3 w-3" />
                <span>${data.calls.totalCost.toFixed(2)} spent</span>
              </div>
              <div
                className={cn(
                  "text-sm font-semibold",
                  callSuccessRate >= 70
                    ? "text-green-600"
                    : callSuccessRate >= 50
                      ? "text-amber-600"
                      : "text-red-600",
                )}
              >
                {callSuccessRate}% success
              </div>
            </div>
          </div>

          {/* Emails Section */}
          <div className="rounded-xl border border-slate-100 bg-white/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">Emails</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricItem
                icon={CheckCircle2}
                label="Sent"
                value={data.emails.sent}
                color="green"
              />
              <MetricItem
                icon={XCircle}
                label="Failed"
                value={data.emails.failed}
                color={data.emails.failed > 0 ? "red" : "slate"}
              />
              <MetricItem
                icon={Clock}
                label="Queued"
                value={data.emails.queued}
                color="blue"
              />
              <div className="flex flex-col items-center justify-center">
                <div
                  className={cn(
                    "text-lg font-bold",
                    emailSuccessRate >= 80
                      ? "text-green-600"
                      : emailSuccessRate >= 60
                        ? "text-amber-600"
                        : "text-red-600",
                  )}
                >
                  {emailSuccessRate}%
                </div>
                <span className="text-xs text-slate-500">Success</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>
              <strong>{data.combined.totalAttempts}</strong> total attempts
            </span>
            <span>
              <strong>{data.combined.successfulContacts}</strong> successful
            </span>
          </div>
          {data.calls.avgDuration > 0 && (
            <div className="text-xs text-slate-500">
              Avg call: {formatDuration(data.calls.avgDuration)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  subValue?: string;
  color: "green" | "red" | "amber" | "blue" | "slate";
}) {
  const colorStyles: Record<
    "green" | "red" | "amber" | "blue" | "slate",
    string
  > = {
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
    slate: "text-slate-400",
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", colorStyles[color])} />
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold text-slate-800">
            <NumberTicker value={value} />
          </span>
          {subValue && (
            <span className="text-xs text-slate-500">{subValue}</span>
          )}
        </div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function OutboundSuccessMetricsSkeleton() {
  return (
    <Card className="animate-pulse rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50/80 via-white/70 to-slate-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-1 h-3 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-10 rounded-lg" />
      </CardContent>
    </Card>
  );
}
