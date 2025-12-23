"use client";

import { api } from "~/trpc/client";
import {
  Users,
  Briefcase,
  PawPrint,
  Phone,
  Mail,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Badge } from "@odis-ai/ui/badge";
import { Skeleton } from "@odis-ai/ui/skeleton";

import type { LucideIcon } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  badge,
}: {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  badge?: { label: string; variant: "default" | "secondary" | "destructive" };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{value}</span>
          {badge && (
            <Badge variant={badge.variant} className="text-xs">
              {badge.label}
            </Badge>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading, error } = api.admin.getAdminStats.useQuery();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Failed to load admin stats
        </h2>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor your platform&apos;s health and activity
        </p>
      </div>

      {/* Recent Activity Banner */}
      {stats && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-900">
                Last 24 hours activity
              </p>
              <p className="text-xs text-emerald-700">
                {stats.recentActivity.cases} new cases,{" "}
                {stats.recentActivity.calls} calls,{" "}
                {stats.recentActivity.emails} emails
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Total Users"
              value={stats.users.total}
              icon={Users}
              description={`${stats.users.byRole.veterinarian ?? 0} veterinarians, ${stats.users.byRole.admin ?? 0} admins`}
            />
            <StatCard
              title="Total Cases"
              value={stats.cases.total}
              icon={Briefcase}
              description={`${stats.cases.byStatus.completed ?? 0} completed, ${stats.cases.byStatus.ongoing ?? 0} ongoing`}
            />
            <StatCard
              title="Total Patients"
              value={stats.patients.total}
              icon={PawPrint}
            />
            <StatCard
              title="Scheduled Calls"
              value={stats.calls.total}
              icon={Phone}
              badge={
                stats.calls.needsAttention > 0
                  ? {
                      label: `${stats.calls.needsAttention} need attention`,
                      variant: "destructive",
                    }
                  : undefined
              }
              description={`${stats.calls.byStatus.completed ?? 0} completed, ${stats.calls.byStatus.queued ?? 0} queued`}
            />
          </>
        ) : null}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Scheduled Emails"
              value={stats.emails.total}
              icon={Mail}
              description={`${stats.emails.byStatus.sent ?? 0} sent, ${stats.emails.byStatus.queued ?? 0} queued`}
            />
            <StatCard
              title="Failed Calls"
              value={stats.calls.byStatus.failed ?? 0}
              icon={Phone}
              badge={
                (stats.calls.byStatus.failed ?? 0) > 0
                  ? { label: "Needs review", variant: "destructive" }
                  : undefined
              }
            />
            <StatCard
              title="Failed Emails"
              value={stats.emails.byStatus.failed ?? 0}
              icon={Mail}
              badge={
                (stats.emails.byStatus.failed ?? 0) > 0
                  ? { label: "Needs review", variant: "destructive" }
                  : undefined
              }
            />
          </>
        ) : null}
      </div>

      {/* User Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Breakdown by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.users.byRole).map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm font-medium capitalize text-slate-700">
                    {role.replace("_", " ")}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
