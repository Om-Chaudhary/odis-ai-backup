import { Suspense } from "react";
import { SystemHealthCard } from "~/components/admin/overview/system-health-card";
import { ClinicStatsGrid } from "~/components/admin/overview/clinic-stats-grid";
import { QuickActionsCard } from "~/components/admin/overview/quick-actions-card";
import { RecentActivityFeed } from "~/components/admin/overview/recent-activity-feed";
import { Skeleton } from "@odis-ai/shared/ui/skeleton";

/**
 * Admin Overview Page
 * Platform-wide health, stats, and quick actions
 */
export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* System Health */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <SystemHealthCard />
      </Suspense>

      {/* Stats Grid */}
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ClinicStatsGrid />
      </Suspense>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActionsCard />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <RecentActivityFeed />
        </Suspense>
      </div>
    </div>
  );
}
