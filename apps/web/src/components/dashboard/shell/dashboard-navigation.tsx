"use client";

import { useQueryState, parseAsStringLiteral } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import { BarChart3, FolderOpen, UserX } from "lucide-react";
import { api } from "~/trpc/client";
import { cn } from "@odis-ai/utils";

const TAB_VALUES = ["overview", "cases", "needs_review"] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function DashboardNavigation() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TAB_VALUES).withDefault("overview"),
  );

  // Fetch count for needs review badge
  const { data: needsReviewCases } =
    api.dashboard.getCasesNeedingAttention.useQuery({ limit: 20 });
  const needsReviewCount = needsReviewCases?.length ?? 0;

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
          <TabsTrigger
            value="needs_review"
            className="gap-2"
            aria-label="Needs Review"
          >
            <UserX className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Needs Review</span>
            {needsReviewCount > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                  tab === "needs_review"
                    ? "bg-amber-500 text-white"
                    : "bg-amber-100 text-amber-700",
                )}
              >
                {needsReviewCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
