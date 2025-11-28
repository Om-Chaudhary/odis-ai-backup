"use client";

import type { ReactNode } from "react";
import { api } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  FolderOpen,
  FileText,
  FileCheck,
  Phone,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from "lucide-react";
import { WeeklyActivityChart } from "./weekly-activity-chart";
import { ActivityTimeline } from "./activity-timeline";
import { OverviewTabSkeleton } from "./dashboard-skeleton";
import { NumberTicker } from "~/components/ui/number-ticker";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useQueryState } from "nuqs";
import { DateFilterButtonGroup } from "./date-filter-button-group";
import {
  getDateRangeFromPreset,
  isValidDateRangePreset,
} from "~/lib/utils/date-ranges";
import { CasesNeedingAttentionCard } from "./cases-needing-attention-card";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string | ReactNode;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-red-600"
        : "text-slate-400";

  return (
    <Card className="transition-smooth rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardContent className="p-6">
        <div className="animate-card-content-in flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {typeof value === "number" ? (
                  <NumberTicker value={value} delay={800} />
                ) : (
                  value
                )}
              </p>
              {trend && (
                <TrendIcon
                  className={`h-4 w-4 ${trendColor} transition-smooth`}
                />
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">
                {typeof subtitle === "string" ? subtitle : subtitle}
              </p>
            )}
          </div>
          <div className="transition-smooth flex h-12 w-12 items-center justify-center rounded-full bg-[#31aba3]/10 group-hover:bg-[#31aba3]/20">
            <Icon className="h-6 w-6 text-[#31aba3]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentCasesList({
  cases,
}: {
  cases: Array<{
    id: string;
    patient: { name: string; owner_name: string };
    created_at: string;
    status: string;
  }>;
}) {
  return (
    <Card className="transition-smooth rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Cases</CardTitle>
        <Link href="/dashboard?tab=cases">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#31aba3] hover:bg-[#31aba3]/5"
          >
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="animate-card-content-in">
        {cases.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No cases yet
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/cases/${c.id}`}
                className="block rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {c.patient.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {c.patient.owner_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-md border-0 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {c.status}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDistanceToNow(new Date(c.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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

  // Validate and safely convert preset to dates
  const preset = isValidDateRangePreset(dateRange) ? dateRange : "all";
  const { startDate: calculatedStartDate, endDate: calculatedEndDate } =
    getDateRangeFromPreset(preset);

  // Convert dates to ISO strings for API calls
  // Note: Dates are converted to UTC ISO strings. Backend should handle timezone appropriately.
  const startDate = calculatedStartDate?.toISOString() ?? null;
  const endDate = calculatedEndDate?.toISOString() ?? null;

  const { data: stats, isLoading: statsLoading } =
    api.dashboard.getCaseStats.useQuery({ startDate, endDate });

  const { data: activities, isLoading: activitiesLoading } =
    api.dashboard.getRecentActivity.useQuery({ startDate, endDate });

  const { data: weeklyData, isLoading: weeklyLoading } =
    api.dashboard.getWeeklyActivity.useQuery({ startDate, endDate });

  const { data: allCasesData } = api.dashboard.getAllCases.useQuery({
    page: 1,
    pageSize: 5,
    startDate,
    endDate,
  });

  const isLoading = statsLoading || activitiesLoading || weeklyLoading;

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-card-in">
          <StatCard
            title="Total Cases"
            value={stats?.total ?? 0}
            subtitle={
              <span>
                <NumberTicker value={stats?.thisWeek ?? 0} delay={1000} /> this
                week
              </span>
            }
            icon={FolderOpen}
            trend={stats?.thisWeek ? ("up" as const) : ("stable" as const)}
          />
        </div>
        <div className="animate-card-in-delay-1">
          <StatCard
            title="SOAP Notes"
            value={stats?.soapNotes ?? 0}
            subtitle="Generated"
            icon={FileText}
          />
        </div>
        <div className="animate-card-in-delay-2">
          <StatCard
            title="Discharge Summaries"
            value={stats?.dischargeSummaries ?? 0}
            subtitle="Created"
            icon={FileCheck}
          />
        </div>
        <div className="animate-card-in-delay-3">
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

      {/* Cases Needing Attention and Recent Cases */}
      <div className="grid gap-6 lg:grid-cols-2">
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
            totalCases={stats?.total ?? 0}
          />
        </div>
        {allCasesData && (
          <div className="animate-card-in-delay-2">
            <RecentCasesList cases={allCasesData.cases.slice(0, 5)} />
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      {activities && (
        <div className="animate-card-in-delay-3">
          <ActivityTimeline activities={activities} />
        </div>
      )}
    </div>
  );
}
