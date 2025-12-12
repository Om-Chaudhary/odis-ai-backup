"use client";

import { useQueryState, parseAsStringLiteral } from "nuqs";
import { DashboardNavigation } from "./dashboard-navigation";
import { OverviewTab } from "../shared/overview-tab";
import { CasesTab } from "../cases/cases-tab";
import { NeedsReviewTab } from "../cases/needs-review-tab";

const TAB_VALUES = ["overview", "cases", "needs_review"] as const;

export function DashboardContentWithTabs() {
  const [tab] = useQueryState(
    "tab",
    parseAsStringLiteral(TAB_VALUES).withDefault("overview"),
  );

  const [startDate] = useQueryState("startDate");
  const [endDate] = useQueryState("endDate");

  return (
    <div className="space-y-6">
      <DashboardNavigation />

      {tab === "overview" && (
        <OverviewTab startDate={startDate} endDate={endDate} />
      )}
      {tab === "cases" && <CasesTab startDate={startDate} endDate={endDate} />}
      {tab === "needs_review" && <NeedsReviewTab />}
    </div>
  );
}
