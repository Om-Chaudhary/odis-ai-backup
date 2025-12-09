"use client";

import { useQueryState, parseAsStringLiteral } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import { BarChart3, FolderOpen, Phone } from "lucide-react";

const TAB_VALUES = ["overview", "cases", "discharges"] as const;
type TabValue = (typeof TAB_VALUES)[number];

/**
 * @deprecated Use DashboardNavigation instead, which includes date range presets
 */
export function DashboardTabs() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TAB_VALUES).withDefault("overview"),
  );

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
      <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
        <TabsTrigger value="overview" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="cases" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Cases</span>
        </TabsTrigger>
        <TabsTrigger value="discharges" className="gap-2">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Discharges</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
