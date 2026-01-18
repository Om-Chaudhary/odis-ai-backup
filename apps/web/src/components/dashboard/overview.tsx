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
  DashboardToolbar,
} from "~/components/dashboard/shared";

interface DashboardOverviewProps {
  clinicSlug?: string;
}

export function DashboardOverview({ clinicSlug }: DashboardOverviewProps) {
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
    return <DashboardSkeleton />;
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

  return (
    <PageContainer>
      <DashboardPageHeader
        title="Dashboard Overview"
        subtitle="Real-time performance and activity"
        icon={LayoutDashboard}
      >
        <DashboardToolbar
          showDateNav={false}
          currentDate={new Date()}
          isDateLoading={false}
          isLoading={false}
        />
      </DashboardPageHeader>

      <PageContent className="p-6">
        <div
          className={cn(
            "space-y-8 transition-all duration-700",
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          {/* Today's Metrics - Side by Side */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Inbound Today Card */}
            <Card
              className={cn(
                "shadow-card overflow-hidden border-slate-200/50 bg-gradient-to-br from-white to-teal-50/30 p-6 shadow-lg transition-all duration-500 hover:shadow-xl",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-teal-600 p-3 shadow-md shadow-teal-900/20">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
                      Inbound Today
                    </h2>
                  </div>
                </div>
                <TrendBadge trend={dailyStats.inbound.trend} />
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-800">
                      {dailyStats.inbound.today.completed}
                    </span>
                    <span className="text-lg text-slate-600">
                      calls handled
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-teal-100/50 pt-4">
                  <StatItem
                    icon={CheckCircle}
                    label="AI Handled"
                    value={`${dailyStats.inbound.today.aiHandledRate}%`}
                    color="teal"
                  />
                  <StatItem
                    icon={PhoneForwarded}
                    label="Transferred"
                    value={dailyStats.inbound.today.transferred}
                    color="amber"
                  />
                </div>
              </div>
            </Card>

            {/* Outbound Today Card */}
            <Card
              className={cn(
                "shadow-card overflow-hidden border-slate-200/50 bg-gradient-to-br from-white to-slate-50/30 p-6 shadow-lg transition-all duration-500 hover:shadow-xl",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-700 p-3 shadow-md shadow-slate-900/20">
                    <PhoneOutgoing className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                      Outbound Today
                    </h2>
                  </div>
                </div>
                <TrendBadge trend={dailyStats.outbound.trend} />
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-800">
                      {dailyStats.outbound.today.completed}
                    </span>
                    <span className="text-lg text-slate-600">
                      calls completed
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100/50 pt-4">
                  <StatItem
                    icon={CheckCircle}
                    label="Success Rate"
                    value={`${dailyStats.outbound.today.successRate}%`}
                    color="teal"
                  />
                  <StatItem
                    icon={Voicemail}
                    label="Voicemail"
                    value={dailyStats.outbound.today.voicemail}
                    color="amber"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Needs Attention Panel */}
          {(overview.status.totalFlagged > 0 ||
            overview.stats.calls.failed > 0) && (
            <Card
              className={cn(
                "shadow-card overflow-hidden border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-lg",
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-amber-500 p-2.5 shadow-md shadow-amber-900/20">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  Needs Attention
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
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
          <Card className="shadow-card overflow-hidden border-slate-200/50 bg-white/50 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-slate-700 p-2.5 shadow-md shadow-slate-900/20">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Recent Activity
              </h2>
            </div>

            <div className="space-y-3">
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
                  severity={item.severity}
                  delay={index * 0.05}
                />
              ))}

              {overview.flaggedItems.length === 0 && (
                <div className="py-12 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-teal-400" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
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
      className: "bg-teal-50 text-teal-700 border-teal-100",
    },
    down: {
      icon: TrendingDown,
      className: "bg-red-50 text-red-700 border-red-100",
    },
    stable: {
      icon: Minus,
      className: "bg-slate-50 text-slate-700 border-slate-100",
    },
  };

  const { icon: Icon, className } = config[trend];

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
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
    teal: "text-teal-600",
    slate: "text-slate-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", colorClasses[color])} />
      <div>
        <p className="text-xs text-slate-600">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
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
      bg: "bg-red-50 hover:bg-red-100",
      text: "text-red-700",
      icon: "text-red-600",
      border: "border-red-100",
    },
    warning: {
      bg: "bg-amber-50 hover:bg-amber-100",
      text: "text-amber-700",
      icon: "text-amber-600",
      border: "border-amber-100",
    },
  };

  const config = severityConfig[severity];

  return (
    <button
      className={cn(
        "group flex w-full items-center justify-between rounded-xl border p-4 transition-all duration-200",
        config.bg,
        config.border,
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5", config.icon)} />
        <div className="text-left">
          <p className={cn("text-2xl font-bold", config.text)}>{count}</p>
          <p className="text-sm text-slate-700">{label}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 group-hover:text-slate-800">
        {action}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
      iconColor: "text-teal-600",
    },
    outbound: {
      icon: PhoneOutgoing,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
    flagged: {
      icon: Flag,
      iconBg:
        severity === "critical" || severity === "urgent"
          ? "bg-red-50"
          : "bg-amber-50",
      iconColor:
        severity === "critical" || severity === "urgent"
          ? "text-red-600"
          : "text-amber-600",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className="group flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={cn("mt-0.5 rounded-lg p-2 shadow-sm", config.iconBg)}>
        <Icon className={cn("h-4 w-4", config.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{subtitle}</p>
      </div>
      <div className="shrink-0 text-xs font-medium text-slate-500">
        {timestamp}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <PageContainer>
      <DashboardPageHeader
        title="Dashboard Overview"
        subtitle="Real-time performance and activity"
        icon={LayoutDashboard}
      />
      <PageContent className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 rounded-2xl bg-slate-100" />
            <div className="h-64 rounded-2xl bg-slate-100" />
          </div>
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="h-96 rounded-2xl bg-slate-100" />
        </div>
      </PageContent>
    </PageContainer>
  );
}
