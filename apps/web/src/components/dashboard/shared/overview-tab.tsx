"use client";

import type { ReactNode } from "react";
import { api } from "~/trpc/client";
import { Card, CardContent } from "@odis/ui/card";
import {
  FolderOpen,
  FileText,
  Phone,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { WeeklyActivityChart } from "../activity/weekly-activity-chart";
import { DailyActivityTimeline } from "../activity/daily-activity-timeline";
import { OverviewTabSkeleton } from "../shell/dashboard-skeleton";
import { NumberTicker } from "@odis/ui/number-ticker";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { DateFilterButtonGroup } from "../filters/date-filter-button-group";
import {
  getDateRangeFromPreset,
  type DateRangePreset,
} from "@odis/utils/date-ranges";
import { CasesNeedingAttentionCard } from "../cases/cases-needing-attention-card";
import { cn } from "@odis/utils";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  onClick,
  valueSuffix,
}: {
  title: string;
  value: string | number;
  subtitle?: string | ReactNode;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
  variant?: "default" | "warning" | "success";
  onClick?: () => void;
  valueSuffix?: string;
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-red-600"
        : "text-slate-400";

  const variantStyles = {
    default:
      "border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-teal-500/5 hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-teal-500/10",
    warning:
      "border-amber-200/40 bg-gradient-to-br from-amber-50/20 via-white/70 to-white/70 shadow-amber-500/5 hover:from-amber-50/25 hover:via-white/75 hover:to-white/75 hover:shadow-amber-500/10",
    success:
      "border-emerald-200/40 bg-gradient-to-br from-emerald-50/20 via-white/70 to-white/70 shadow-emerald-500/5 hover:from-emerald-50/25 hover:via-white/75 hover:to-white/75 hover:shadow-emerald-500/10",
  };

  return (
    <Card
      className={cn(
        "transition-smooth flex h-full flex-col rounded-xl border shadow-lg backdrop-blur-md",
        variantStyles[variant],
        onClick &&
          "group cursor-pointer hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl",
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="animate-card-content-in flex flex-1 items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {typeof value === "number" ? (
                  <>
                    <NumberTicker value={value} delay={800} />
                    {valueSuffix}
                  </>
                ) : (
                  value
                )}
              </p>
              {trend && trend !== "stable" && (
                <TrendIcon
                  className={`h-4 w-4 ${trendColor} transition-smooth flex-shrink-0`}
                />
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">
                {typeof subtitle === "string" ? subtitle : subtitle}
              </p>
            )}
          </div>
          <div className="transition-smooth ml-3 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#31aba3]/10 group-hover:bg-[#31aba3]/20">
            <Icon className="h-6 w-6 text-[#31aba3]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * OverviewTab - Dashboard overview with statistics and recent activity
 *
 * Note: The `startDate` and `endDate` props are kept for backward compatibility
 * but are ignored. Date filtering is now handled via URL query parameter "dateRange"
 * using the DateFilterButtonGroup component.
 */
export function OverviewTab({
  startDate: _startDate,
  endDate: _endDate,
}: {
  /** @deprecated Use dateRange URL query parameter instead */
  startDate?: string | null;
  /** @deprecated Use dateRange URL query parameter instead */
  endDate?: string | null;
}) {
  const [dateRange] = useQueryState("dateRange", {
    defaultValue: "all",
  });

  const { startDate: calculatedStartDate, endDate: calculatedEndDate } =
    getDateRangeFromPreset((dateRange as DateRangePreset) ?? "all");

  // Convert dates to ISO strings for API calls
  const startDate = calculatedStartDate?.toISOString() ?? null;
  const endDate = calculatedEndDate?.toISOString() ?? null;

  const { data: stats, isLoading: statsLoading } =
    api.dashboard.getCaseStats.useQuery({ startDate, endDate });

  const { isLoading: activitiesLoading } =
    api.dashboard.getRecentActivity.useQuery({ startDate, endDate });

  const { data: dailyActivities, isLoading: dailyActivitiesLoading } =
    api.dashboard.getDailyActivityAggregates.useQuery({
      startDate,
      endDate,
      days: 7,
    });

  const { data: weeklyData, isLoading: weeklyLoading } =
    api.dashboard.getWeeklyActivity.useQuery({ startDate, endDate });

  const router = useRouter();

  const isLoading =
    statsLoading ||
    activitiesLoading ||
    weeklyLoading ||
    dailyActivitiesLoading;

  if (isLoading) {
    return <OverviewTabSkeleton />;
  }

  return (
    <div className="animate-tab-content space-y-6">
      {/* Header */}
      <div className="animate-card-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Overview
          </h2>
          <p className="text-sm text-slate-600">
            View your case statistics and recent activity
          </p>
        </div>
        <DateFilterButtonGroup />
      </div>

      {/* Stats Cards */}
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-card-in h-full">
          <StatCard
            title="Total Cases"
            value={stats?.total ?? 0}
            subtitle={
              stats?.thisWeek ? (
                <span>
                  +<NumberTicker value={stats.thisWeek} delay={1000} /> this
                  week
                </span>
              ) : (
                "No change this week"
              )
            }
            icon={FolderOpen}
            trend={stats?.thisWeek ? ("up" as const) : ("stable" as const)}
          />
        </div>
        <div className="animate-card-in-delay-1 h-full">
          <StatCard
            title="Missing Discharges"
            value={stats?.casesNeedingDischarge?.thisWeek ?? 0}
            subtitle={`${stats?.casesNeedingDischarge?.total ?? 0} total`}
            icon={AlertCircle}
            variant="warning"
            onClick={() => {
              router.push("/dashboard?tab=cases&missingDischarge=true");
            }}
          />
        </div>
        <div className="animate-card-in-delay-2 h-full">
          <StatCard
            title="SOAP Coverage"
            value={stats?.soapCoverage?.percentage ?? 0}
            valueSuffix="%"
            subtitle={`${stats?.casesNeedingSoap?.total ?? 0} cases need SOAP`}
            icon={FileText}
            variant={
              (stats?.soapCoverage?.percentage ?? 0) >= 80
                ? "success"
                : "warning"
            }
            onClick={() => {
              router.push("/dashboard?tab=cases&missingSoap=true");
            }}
          />
        </div>
        <div className="animate-card-in-delay-3 h-full">
          <StatCard
            title="Communications"
            value={(stats?.callsCompleted ?? 0) + (stats?.emailsSent ?? 0)}
            subtitle={
              <span>
                <NumberTicker value={stats?.callsCompleted ?? 0} delay={1400} />{" "}
                calls,{" "}
                <NumberTicker value={stats?.emailsSent ?? 0} delay={1400} />{" "}
                emails
              </span>
            }
            icon={Phone}
          />
        </div>
      </div>

      {/* Weekly Activity Chart */}
      {weeklyData && (
        <div className="animate-card-in-delay-2">
          <WeeklyActivityChart data={weeklyData} />
        </div>
      )}

      {/* Cases Needing Attention */}
      <div className="animate-card-in-delay-1">
        <CasesNeedingAttentionCard
          casesNeedingDischarge={
            stats?.casesNeedingDischarge ?? {
              total: 0,
              thisWeek: 0,
              thisMonth: 0,
            }
          }
          casesNeedingSoap={
            stats?.casesNeedingSoap ?? { total: 0, thisWeek: 0, thisMonth: 0 }
          }
        />
      </div>

      {/* Daily Activity Timeline */}
      {dailyActivities && (
        <div className="animate-card-in-delay-3">
          <DailyActivityTimeline activities={dailyActivities} />
        </div>
      )}
    </div>
  );
}
