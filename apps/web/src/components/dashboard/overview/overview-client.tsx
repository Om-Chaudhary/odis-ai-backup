"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import { HeroSection } from "./hero-section";
import { ValueSummary } from "./value-summary";
import { AttentionItems } from "./attention-items";
import { QuickLinks } from "./quick-links";
import { OverviewSkeleton } from "./overview-skeleton";
import { AfterhourAgentStats } from "./afterhours-agent-stats";
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

  return (
    <div className="space-y-8">
      {/* Hero - Status at a glance */}
      <HeroSection
        status={overview.status}
        period={overview.period}
        callsAnswered={overview.value.callsAnswered}
      />

      {/* After-hours Agent Stats */}
      <AfterhourAgentStats />

      {/* Attention Items - Only show if there are flagged items */}
      {overview.flaggedItems.length > 0 && (
        <AttentionItems
          items={overview.flaggedItems}
          totalCount={overview.totalFlaggedCount}
        />
      )}

      {/* Value Summary - What the AI has accomplished */}
      <ValueSummary
        value={overview.value}
        period={overview.period}
        selectedDays={days}
        onDaysChange={setDays}
      />

      {/* Quick Links - Navigate to detailed views */}
      <QuickLinks stats={overview.stats} />
    </div>
  );
}
