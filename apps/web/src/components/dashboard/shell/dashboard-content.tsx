"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/client";
import { DashboardStatsGrid } from "../stats/dashboard-stats";
import { ActivityTimeline } from "../activity/activity-timeline";
import { WeeklyActivityChart } from "../activity/weekly-activity-chart";
import { UpcomingItems } from "../stats/upcoming-items";
import { CallPerformanceMetricsComponent } from "../stats/call-performance-metrics";
import { QuickActionsPanel } from "../shared/quick-actions-panel";
import {
  DashboardCustomization,
  type DashboardSection,
} from "./dashboard-customization";
import { DashboardPresets } from "./dashboard-presets";
import {
  DashboardStatsSkeleton,
  ActivityTimelineSkeleton,
  WeeklyChartSkeleton,
  UpcomingItemsSkeleton,
  CallPerformanceSkeleton,
} from "./dashboard-skeleton";

const DEFAULT_VISIBLE_SECTIONS: DashboardSection[] = [
  "stats",
  "activity",
  "chart",
  "upcoming",
  "performance",
  "actions",
];

export function DashboardContent() {
  const [visibleSections, setVisibleSections] = useState<Set<DashboardSection>>(
    new Set(DEFAULT_VISIBLE_SECTIONS),
  );

  // Load saved preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-visible-sections");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DashboardSection[];
        setVisibleSections(new Set(parsed));
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, []);

  // Save preferences to localStorage
  const handleToggleSection = (section: DashboardSection) => {
    setVisibleSections((prev) => {
      const updated = new Set(prev);
      if (updated.has(section)) {
        updated.delete(section);
      } else {
        updated.add(section);
      }
      localStorage.setItem(
        "dashboard-visible-sections",
        JSON.stringify(Array.from(updated)),
      );
      return updated;
    });
  };

  // Apply a preset view
  const handleApplyPreset = (sections: Set<DashboardSection>) => {
    setVisibleSections(sections);
    localStorage.setItem(
      "dashboard-visible-sections",
      JSON.stringify(Array.from(sections)),
    );
  };

  // Fetch all dashboard data
  const { data: stats, isLoading: statsLoading } =
    api.dashboard.getStats.useQuery();

  const { data: activities, isLoading: activitiesLoading } =
    api.dashboard.getRecentActivity.useQuery({});

  const { data: weeklyData, isLoading: weeklyLoading } =
    api.dashboard.getWeeklyActivity.useQuery({});

  const { data: upcomingItems, isLoading: upcomingLoading } =
    api.dashboard.getUpcomingScheduled.useQuery();

  const { data: performance, isLoading: performanceLoading } =
    api.dashboard.getCallPerformance.useQuery();

  return (
    <div className="space-y-6">
      {/* Customization Controls */}
      <div className="flex items-center justify-between">
        <DashboardPresets
          currentSections={visibleSections}
          onApplyPreset={handleApplyPreset}
        />
        <DashboardCustomization
          visibleSections={visibleSections}
          onToggleSection={handleToggleSection}
        />
      </div>

      {/* Stats Grid - Compact */}
      {visibleSections.has("stats") &&
        (statsLoading ? (
          <DashboardStatsSkeleton />
        ) : stats ? (
          <DashboardStatsGrid stats={stats} />
        ) : null)}

      {/* Activity & Chart - Spacious Side by Side */}
      {(visibleSections.has("activity") || visibleSections.has("chart")) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {visibleSections.has("activity") &&
            (activitiesLoading ? (
              <ActivityTimelineSkeleton />
            ) : activities ? (
              <ActivityTimeline activities={activities} />
            ) : null)}

          {visibleSections.has("chart") &&
            (weeklyLoading ? (
              <WeeklyChartSkeleton />
            ) : weeklyData ? (
              <WeeklyActivityChart data={weeklyData} />
            ) : null)}
        </div>
      )}

      {/* Upcoming & Performance - Spacious Side by Side */}
      {(visibleSections.has("upcoming") ||
        visibleSections.has("performance")) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {visibleSections.has("upcoming") &&
            (upcomingLoading ? (
              <UpcomingItemsSkeleton />
            ) : upcomingItems ? (
              <UpcomingItems items={upcomingItems} />
            ) : null)}

          {visibleSections.has("performance") &&
            (performanceLoading ? (
              <CallPerformanceSkeleton />
            ) : performance ? (
              <CallPerformanceMetricsComponent metrics={performance} />
            ) : null)}
        </div>
      )}

      {/* Quick Actions - Full Width */}
      {visibleSections.has("actions") && <QuickActionsPanel />}
    </div>
  );
}
