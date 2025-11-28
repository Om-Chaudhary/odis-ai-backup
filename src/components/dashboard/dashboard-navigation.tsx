"use client";

import { useQueryState, parseAsStringLiteral } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { BarChart3, FolderOpen, Phone } from "lucide-react";
import { DateRangePresets } from "./date-range-filter";

const TAB_VALUES = ["overview", "cases", "discharges"] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function DashboardNavigation() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TAB_VALUES).withDefault("overview"),
  );

  return (
    <div className="animate-fade-in-down flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Main Tab Navigation */}
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

      {/* Date Range Presets */}
      <DateRangePresets />
    </div>
  );
}
