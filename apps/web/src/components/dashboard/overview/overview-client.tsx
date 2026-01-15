"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { ValueSummary } from "./value-summary";
import { AttentionItems } from "./attention-items";
import { QuickLinks } from "./quick-links";
import { OverviewSkeleton } from "./overview-skeleton";
import { SystemStatusBanner } from "./system-status-banner";
import { AIHealthCard } from "./ai-health-card";
import { TodaySnapshot } from "./today-snapshot";
import {
  InboundPerformanceCard,
  OutboundPerformanceCard,
  CaseCoverageCard,
} from "./performance-cards";
import type { DateRangeOption } from "./types";

interface OverviewClientProps {
  clinicSlug?: string;
}

export function OverviewClient({ clinicSlug }: OverviewClientProps) {
  const [days, setDays] = useState<DateRangeOption>(7);

  const {
    data: overview,
    isLoading,
    isError,
  } = api.dashboard.getOverview.useQuery(
    { days, clinicSlug },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 10000,
    },
  );

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (isError || !overview) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">
          Unable to load dashboard data. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Handler for system status banner "Review Now" button
  const handleReviewClick = () => {
    // Scroll to attention items if they exist
    const attentionSection = document.getElementById("attention-items");
    if (attentionSection) {
      attentionSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Banner - Only show if there are issues */}
      <SystemStatusBanner
        systemHealth={overview.systemHealth}
        onReviewClick={handleReviewClick}
      />

      {/* AI Health + Today's Snapshot */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AIHealthCard systemHealth={overview.systemHealth} />
        <TodaySnapshot activity={overview.todayActivity} />
      </div>

      {/* Value Summary - What the AI has accomplished */}
      <ValueSummary
        value={overview.value}
        period={overview.period}
        selectedDays={days}
        onDaysChange={setDays}
      />

      {/* Performance Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <InboundPerformanceCard stats={overview.stats} />
        <OutboundPerformanceCard
          outboundPerformance={overview.outboundPerformance}
        />
        <CaseCoverageCard caseCoverage={overview.caseCoverage} />
      </div>

      {/* Attention Items - Only show if there are flagged items */}
      {overview.flaggedItems.length > 0 && (
        <div id="attention-items">
          <AttentionItems
            items={overview.flaggedItems}
            totalCount={overview.totalFlaggedCount}
          />
        </div>
      )}

      {/* Quick Links - Navigate to detailed views */}
      <QuickLinks stats={overview.stats} />
    </div>
  );
}
