"use client";

import { useQueryState, parseAsStringLiteral } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import { BarChart3, FolderOpen, AlertTriangle } from "lucide-react";

const TAB_VALUES = ["overview", "cases", "needs-review"] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function DashboardNavigation() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TAB_VALUES).withDefault("overview"),
  );

  return (
    <div className="animate-fade-in-down">
      {/* Main Tab Navigation */}
      <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
          <TabsTrigger value="overview" className="gap-2" aria-label="Overview">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="cases" className="gap-2" aria-label="Cases">
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Cases</span>
          </TabsTrigger>
          <TabsTrigger value="needs-review" className="gap-2" aria-label="Needs Review">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Needs Review</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
