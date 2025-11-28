"use client";

import { useQueryState, parseAsStringLiteral } from "nuqs";
import { DashboardNavigation } from "./dashboard-navigation";
import { OverviewTab } from "./overview-tab";
import { CasesTab } from "./cases-tab";
import { DischargesTab } from "./discharges-tab";

const TAB_VALUES = ["overview", "cases", "discharges"] as const;

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
      {tab === "discharges" && (
        <DischargesTab startDate={startDate} endDate={endDate} />
      )}
    </div>
  );
}
