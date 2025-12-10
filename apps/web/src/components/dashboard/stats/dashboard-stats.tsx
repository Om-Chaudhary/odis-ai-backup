"use client";

import { FileText, PhoneCall, Clock, CheckCircle } from "lucide-react";
import { StatsCard } from "@odis-ai/ui";
import type { DashboardStats } from "@odis-ai/types";

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Active Cases"
        value={stats.activeCases}
        icon={FileText}
        trend={stats.trends.cases}
        subtitle="Ongoing & Draft"
      />
      <StatsCard
        title="Calls Completed"
        value={stats.completedCalls}
        icon={PhoneCall}
        trend={stats.trends.calls}
        subtitle="Total successful"
      />
      <StatsCard
        title="Pending Calls"
        value={stats.pendingCalls}
        icon={Clock}
        subtitle="Scheduled"
        iconColor="text-amber-600"
        iconBgColor="bg-amber-600/10"
      />
      <StatsCard
        title="Success Rate"
        value={`${stats.successRate}%`}
        icon={CheckCircle}
        subtitle="Call completion"
        iconColor="text-green-600"
        iconBgColor="bg-green-600/10"
      />
    </div>
  );
}
