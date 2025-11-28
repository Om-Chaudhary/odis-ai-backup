"use client";

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
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
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
    <Card className="transition-smooth rounded-xl border-slate-100 bg-white shadow-sm hover:border-slate-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {value}
              </p>
              {trend && (
                <TrendIcon
                  className={`h-4 w-4 ${trendColor} transition-smooth`}
                />
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
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

function SourceBreakdownCard({
  bySource,
}: {
  bySource: Record<string, number>;
}) {
  const sourceColors: Record<string, string> = {
    manual: "bg-slate-500",
    idexx_neo: "bg-blue-500",
    cornerstone: "bg-purple-500",
    ezyvet: "bg-green-500",
    avimark: "bg-orange-500",
  };

  const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const total = sources.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card className="rounded-xl border-slate-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Case Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map(([source, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const displayName =
              source === "manual"
                ? "Manual"
                : source
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());
            const color = sourceColors[source] ?? "bg-slate-400";

            return (
              <div key={source}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {displayName}
                  </span>
                  <span className="text-slate-600">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${color} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
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
    <Card className="rounded-xl border-slate-100 bg-white shadow-sm">
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
      <CardContent>
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

export function OverviewTab({
  startDate,
  endDate,
}: {
  startDate?: string | null;
  endDate?: string | null;
}) {
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
    <div className="animate-fade-in-up space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases"
          value={stats?.total ?? 0}
          subtitle={`${stats?.thisWeek ?? 0} this week`}
          icon={FolderOpen}
          trend={stats?.thisWeek ? ("up" as const) : ("stable" as const)}
        />
        <StatCard
          title="SOAP Notes"
          value={stats?.soapNotes ?? 0}
          subtitle="Generated"
          icon={FileText}
        />
        <StatCard
          title="Discharge Summaries"
          value={stats?.dischargeSummaries ?? 0}
          subtitle="Created"
          icon={FileCheck}
        />
        <StatCard
          title="Communications"
          value={(stats?.callsCompleted ?? 0) + (stats?.emailsSent ?? 0)}
          subtitle={`${stats?.callsCompleted ?? 0} calls, ${stats?.emailsSent ?? 0} emails`}
          icon={Phone}
        />
      </div>

      {/* Weekly Activity Chart */}
      {weeklyData && <WeeklyActivityChart data={weeklyData} />}

      {/* Source Breakdown and Recent Cases */}
      <div className="grid gap-6 lg:grid-cols-2">
        {stats?.bySource && Object.keys(stats.bySource).length > 0 && (
          <SourceBreakdownCard bySource={stats.bySource} />
        )}
        {allCasesData && (
          <RecentCasesList cases={allCasesData.cases.slice(0, 5)} />
        )}
      </div>

      {/* Activity Timeline */}
      {activities && <ActivityTimeline activities={activities} />}
    </div>
  );
}
