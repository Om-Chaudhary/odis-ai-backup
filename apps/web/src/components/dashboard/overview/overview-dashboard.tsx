"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/client";
import { Card } from "@odis-ai/shared/ui";
import {
  Phone,
  PhoneOutgoing,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  Voicemail,
  PhoneForwarded,
  XCircle,
  Timer,
  Flag,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { PageContainer, PageContent } from "~/components/dashboard/layout";
import {
  DashboardPageHeader,
} from "~/components/dashboard/shared";

interface OverviewDashboardProps {
  clinicSlug?: string;
}

export function OverviewDashboard({ clinicSlug }: OverviewDashboardProps) {
  const [mounted, setMounted] = useState(false);

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
  } = api.dashboard.getOverview.useQuery(
    { days: 7, clinicSlug },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 10000,
    },
  );

  const {
    data: dailyStats,
    isLoading: dailyStatsLoading,
    isError: dailyStatsError,
  } = api.dashboard.getTodayStats.useQuery(
    { clinicSlug },
    {
      refetchInterval: 30000,
      staleTime: 10000,
    },
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoading = overviewLoading || dailyStatsLoading;
  const isError = overviewError || dailyStatsError;

  if (isLoading) {
    return <OverviewDashboardSkeleton />;
  }

  if (isError || !overview || !dailyStats) {
    return (
      <div className="rounded-2xl border border-red-200/50 bg-red-50/50 p-8 text-center backdrop-blur-sm">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
        <p className="text-lg font-medium text-red-800">
          Unable to load dashboard data
        </p>
        <p className="mt-1 text-sm text-red-600">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  // Use the dedicated daily stats for accurate today vs yesterday comparison
  const { inbound, outbound } = dailyStats;
  const inboundTrend = inbound.trend;
  const outboundTrend = outbound.trend;

  return (
    <PageContainer>
      <DashboardPageHeader
        title="Dashboard Overview"
        subtitle="Real-time performance and activity"
        icon={LayoutDashboard}
      />

      <PageContent className="p-5">
        <div
          className={cn(
            "space-y-5 transition-all duration-700",
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          {/* Today's Metrics - Side by Side */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Inbound Today Card */}
            <Card className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm shadow-teal-500/25">
                    <Phone className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <h2 className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
                    Inbound Today
                  </h2>
                </div>
                <TrendBadge trend={inboundTrend} />
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-slate-800">
                    {inbound.today.completed}
                  </span>
                  <span className="text-sm text-slate-500">calls handled</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <StatItem
                    icon={CheckCircle}
                    label="AI Handled"
                    value={`${inbound.today.aiHandledRate}%`}
                    color="teal"
                  />
                  <StatItem
                    icon={PhoneForwarded}
                    label="Transferred"
                    value={inbound.today.transferred}
                    color="slate"
                  />
                </div>
              </div>
            </Card>

            {/* Outbound Today Card */}
            <Card className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-sm shadow-slate-500/25">
                    <PhoneOutgoing
                      className="h-5 w-5 text-white"
                      strokeWidth={2}
                    />
                  </div>
                  <h2 className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                    Outbound Today
                  </h2>
                </div>
                <TrendBadge trend={outboundTrend} />
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-slate-800">
                    {outbound.today.completed}
                  </span>
                  <span className="text-sm text-slate-500">
                    calls completed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <StatItem
                    icon={CheckCircle}
                    label="Success Rate"
                    value={`${outbound.today.successRate}%`}
                    color="teal"
                  />
                  <StatItem
                    icon={Voicemail}
                    label="Voicemail"
                    value={outbound.today.voicemail}
                    color="slate"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Needs Attention Panel */}
          {(overview.status.totalFlagged > 0 ||
            overview.stats.calls.failed > 0) && (
            <Card className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm shadow-amber-500/20">
                  <AlertCircle
                    className="h-[18px] w-[18px] text-white"
                    strokeWidth={2}
                  />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Needs Attention
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {overview.stats.calls.failed > 0 && (
                  <AttentionItem
                    icon={XCircle}
                    label="Failed Calls"
                    count={overview.stats.calls.failed}
                    action="View All"
                    severity="error"
                  />
                )}
                {overview.stats.calls.inProgress > 0 && (
                  <AttentionItem
                    icon={Timer}
                    label="In Progress"
                    count={overview.stats.calls.inProgress}
                    action="View"
                    severity="warning"
                  />
                )}
                {overview.status.totalFlagged > 0 && (
                  <AttentionItem
                    icon={Flag}
                    label="Flagged Items"
                    count={overview.status.totalFlagged}
                    action="Review"
                    severity="warning"
                  />
                )}
              </div>
            </Card>
          )}

          {/* Recent Activity Feed */}
          <Card className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 shadow-sm shadow-slate-500/20">
                <Clock
                  className="h-[18px] w-[18px] text-white"
                  strokeWidth={2}
                />
              </div>
              <h2 className="text-sm font-semibold text-slate-800">
                Recent Activity
              </h2>
            </div>

            <div className="space-y-2">
              {overview.flaggedItems.slice(0, 5).map((item, index) => (
                <ActivityItem
                  key={item.id}
                  type="flagged"
                  title={`${item.petName} (${item.ownerName})`}
                  subtitle={item.summary}
                  timestamp={new Date(item.createdAt).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                  severity={item.severity ?? undefined}
                  delay={index * 0.05}
                />
              ))}

              {overview.flaggedItems.length === 0 && (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
                    <CheckCircle className="h-6 w-6 text-teal-500" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    All caught up!
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No recent activity to show
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
}

// Helper Components

function TrendBadge({ trend }: { trend: "up" | "down" | "stable" }) {
  const config = {
    up: {
      icon: TrendingUp,
      className: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
    },
    down: {
      icon: TrendingDown,
      className: "bg-rose-50 text-rose-600 border-rose-100/50",
    },
    stable: {
      icon: Minus,
      className: "bg-slate-50 text-slate-500 border-slate-100/50",
    },
  };

  const { icon: Icon, className } = config[trend];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      <span>vs yesterday</span>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    teal: "text-teal-500",
    slate: "text-slate-400",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
  };

  return (
    <div className="flex items-center gap-2.5">
      <Icon className={cn("h-4 w-4", colorClasses[color])} strokeWidth={2} />
      <div>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="text-base font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function AttentionItem({
  icon: Icon,
  label,
  count,
  action,
  severity,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  action: string;
  severity: "error" | "warning";
}) {
  const severityConfig = {
    error: {
      bg: "bg-rose-50/80 hover:bg-rose-50",
      text: "text-rose-600",
      icon: "text-rose-500",
      border: "border-rose-100/60",
    },
    warning: {
      bg: "bg-amber-50/80 hover:bg-amber-50",
      text: "text-amber-600",
      icon: "text-amber-500",
      border: "border-amber-100/60",
    },
  };

  const config = severityConfig[severity];

  return (
    <button
      className={cn(
        "group flex w-full items-center justify-between rounded-lg border p-3.5 transition-all duration-200",
        config.bg,
        config.border,
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn("h-[18px] w-[18px]", config.icon)}
          strokeWidth={2}
        />
        <div className="text-left">
          <p className={cn("text-xl font-bold tabular-nums", config.text)}>
            {count}
          </p>
          <p className="text-xs text-slate-600">{label}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 group-hover:text-slate-700">
        {action}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function ActivityItem({
  type,
  title,
  subtitle,
  timestamp,
  severity,
  delay = 0,
}: {
  type: "inbound" | "outbound" | "flagged";
  title: string;
  subtitle: string;
  timestamp: string;
  severity?: string;
  delay?: number;
}) {
  const typeConfig = {
    inbound: {
      icon: Phone,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-500",
    },
    outbound: {
      icon: PhoneOutgoing,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-500",
    },
    flagged: {
      icon: Flag,
      iconBg:
        severity === "critical" || severity === "urgent"
          ? "bg-rose-50"
          : "bg-amber-50",
      iconColor:
        severity === "critical" || severity === "urgent"
          ? "text-rose-500"
          : "text-amber-500",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className="group flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-all duration-200 hover:border-slate-200/80 hover:bg-white hover:shadow-sm"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={cn("rounded-lg p-1.5", config.iconBg)}>
        <Icon className={cn("h-3.5 w-3.5", config.iconColor)} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="shrink-0 text-[11px] font-medium text-slate-400">
        {timestamp}
      </div>
    </div>
  );
}

function OverviewDashboardSkeleton() {
  return (
    <PageContainer>
      <DashboardPageHeader
        title="Dashboard Overview"
        subtitle="Real-time performance and activity"
        icon={LayoutDashboard}
      />
      <PageContent className="p-5">
        <div className="animate-pulse space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-48 rounded-xl bg-slate-100/60" />
            <div className="h-48 rounded-xl bg-slate-100/60" />
          </div>
          <div className="h-32 rounded-xl bg-slate-100/60" />
          <div className="h-64 rounded-xl bg-slate-100/60" />
        </div>
      </PageContent>
    </PageContainer>
  );
}
