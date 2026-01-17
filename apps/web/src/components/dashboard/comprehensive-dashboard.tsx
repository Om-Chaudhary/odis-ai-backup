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
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface ComprehensiveDashboardProps {
  clinicSlug?: string;
}

export function ComprehensiveDashboard({
  clinicSlug,
}: ComprehensiveDashboardProps) {
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

  // Use the dedicated daily stats for accurate today vs yesterday comparison
  const { inbound, outbound } = dailyStats;
  const inboundTrend = inbound.trend;
  const outboundTrend = outbound.trend;

  return (
    <div className="space-y-8">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .dashboard-container {
          font-family:
            "Plus Jakarta Sans",
            system-ui,
            -apple-system,
            sans-serif;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-soft {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .card-gradient-sage {
          background: linear-gradient(135deg, #f7f9f8 0%, #e8f0ed 100%);
        }

        .card-gradient-terracotta {
          background: linear-gradient(135deg, #fef8f6 0%, #fdeee9 100%);
        }

        .noise-texture {
          position: relative;
        }

        .noise-texture::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>

      <div
        className={cn("dashboard-container", mounted && "animate-fade-in-up")}
      >
        {/* Header with Date */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Today's Metrics - Side by Side */}
        <div
          className="grid gap-6 md:grid-cols-2"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Inbound Today Card */}
          <Card
            className={cn(
              "noise-texture card-gradient-sage border-sage-200/50 shadow-sage-900/5 hover:shadow-sage-900/10 overflow-hidden p-6 shadow-lg transition-all duration-300 hover:shadow-xl",
              mounted && "animate-fade-in-up",
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-sage-600 shadow-sage-900/20 rounded-2xl p-3 shadow-md">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-sage-700 text-sm font-semibold tracking-wider uppercase">
                    Inbound Today
                  </h2>
                </div>
              </div>
              <TrendBadge trend={inboundTrend} />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-slate-800">
                    {inbound.today.completed}
                  </span>
                  <span className="text-lg text-slate-600">calls handled</span>
                </div>
              </div>

              <div className="border-sage-200/50 grid grid-cols-2 gap-4 border-t pt-4">
                <StatItem
                  icon={CheckCircle}
                  label="AI Handled"
                  value={`${inbound.today.aiHandledRate}%`}
                  color="sage"
                />
                <StatItem
                  icon={PhoneForwarded}
                  label="Transferred"
                  value={inbound.today.transferred}
                  color="amber"
                />
              </div>
            </div>
          </Card>

          {/* Outbound Today Card */}
          <Card
            className={cn(
              "noise-texture card-gradient-terracotta border-terracotta-200/50 shadow-terracotta-900/5 hover:shadow-terracotta-900/10 overflow-hidden p-6 shadow-lg transition-all duration-300 hover:shadow-xl",
              mounted && "animate-fade-in-up",
            )}
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-terracotta-600 shadow-terracotta-900/20 rounded-2xl p-3 shadow-md">
                  <PhoneOutgoing className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-terracotta-700 text-sm font-semibold tracking-wider uppercase">
                    Outbound Today
                  </h2>
                </div>
              </div>
              <TrendBadge trend={outboundTrend} />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-slate-800">
                    {outbound.today.completed}
                  </span>
                  <span className="text-lg text-slate-600">
                    calls completed
                  </span>
                </div>
              </div>

              <div className="border-terracotta-200/50 grid grid-cols-2 gap-4 border-t pt-4">
                <StatItem
                  icon={CheckCircle}
                  label="Success Rate"
                  value={`${outbound.today.successRate}%`}
                  color="emerald"
                />
                <StatItem
                  icon={Voicemail}
                  label="Voicemail"
                  value={outbound.today.voicemail}
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
              "noise-texture overflow-hidden border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-6 shadow-lg shadow-amber-900/5",
              mounted && "animate-fade-in-up",
            )}
            style={{ animationDelay: "0.3s" }}
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
        <Card
          className={cn(
            "noise-texture overflow-hidden border-slate-200/50 bg-white p-6 shadow-lg shadow-slate-900/5",
            mounted && "animate-fade-in-up",
          )}
          style={{ animationDelay: "0.4s" }}
        >
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
                <CheckCircle className="text-sage-400 mx-auto h-12 w-12" />
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
    </div>
  );
}

// Helper Components

function TrendBadge({ trend }: { trend: "up" | "down" | "stable" }) {
  const config = {
    up: {
      icon: TrendingUp,
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    down: {
      icon: TrendingDown,
      className: "bg-red-100 text-red-700 border-red-200",
    },
    stable: {
      icon: Minus,
      className: "bg-slate-100 text-slate-700 border-slate-200",
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
    sage: "text-sage-600",
    terracotta: "text-terracotta-600",
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
      bg: "bg-red-100 hover:bg-red-200",
      text: "text-red-700",
      icon: "text-red-600",
      border: "border-red-200",
    },
    warning: {
      bg: "bg-amber-100 hover:bg-amber-200",
      text: "text-amber-700",
      icon: "text-amber-600",
      border: "border-amber-200",
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
      iconBg: "bg-sage-100",
      iconColor: "text-sage-600",
    },
    outbound: {
      icon: PhoneOutgoing,
      iconBg: "bg-terracotta-100",
      iconColor: "text-terracotta-600",
    },
    flagged: {
      icon: Flag,
      iconBg:
        severity === "critical" || severity === "urgent"
          ? "bg-red-100"
          : "bg-amber-100",
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
    <div className="animate-pulse space-y-8">
      <div className="h-10 w-64 rounded-lg bg-slate-200" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
      <div className="h-40 rounded-2xl bg-slate-200" />
      <div className="h-96 rounded-2xl bg-slate-200" />
    </div>
  );
}
