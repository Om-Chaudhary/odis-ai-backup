"use client";

import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import { Badge } from "@odis-ai/ui/badge";
import { Input } from "@odis-ai/ui/input";
import { DayPaginationControls } from "@odis-ai/ui";
import { cn } from "@odis-ai/utils";
import type { DischargeCaseStatus, DischargeSummaryStats } from "./types";

interface OutboundFilterTabsProps {
  activeTab: DischargeCaseStatus | "all";
  onTabChange: (tab: DischargeCaseStatus | "all") => void;
  counts: DischargeSummaryStats;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  // Date navigation props
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
}

/**
 * Filter Tabs Component
 *
 * Tab bar for filtering the case table:
 * [All] [Pending] [Scheduled] [Ready] [In Progress] [Completed] [Failed]
 *
 * Includes:
 * - Day pagination controls for date navigation
 * - Search input (Cmd+K to focus)
 */
export function OutboundFilterTabs({
  activeTab,
  onTabChange,
  counts,
  searchTerm = "",
  onSearchChange,
  currentDate,
  onDateChange,
  isLoading = false,
}: OutboundFilterTabsProps) {
  const tabs: Array<{
    value: DischargeCaseStatus | "all";
    label: string;
    count: number;
    colorClass?: string;
  }> = [
    { value: "all", label: "All", count: counts.total },
    {
      value: "pending_review",
      label: "Pending",
      count: counts.pendingReview,
      colorClass:
        "data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900",
    },
    {
      value: "scheduled",
      label: "Scheduled",
      count: counts.scheduled,
      colorClass:
        "data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900",
    },
    {
      value: "ready",
      label: "Ready",
      count: counts.ready,
      colorClass:
        "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900",
    },
    {
      value: "in_progress",
      label: "In Progress",
      count: counts.inProgress,
      colorClass:
        "data-[state=active]:bg-teal-100 data-[state=active]:text-teal-900",
    },
    {
      value: "completed",
      label: "Completed",
      count: counts.completed,
      colorClass:
        "data-[state=active]:bg-green-100 data-[state=active]:text-green-900",
    },
    {
      value: "failed",
      label: "Failed",
      count: counts.failed,
      colorClass:
        "data-[state=active]:bg-red-100 data-[state=active]:text-red-900",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Date Navigation */}
      <DayPaginationControls
        currentDate={currentDate}
        onDateChange={onDateChange}
        totalItems={counts.total}
        isLoading={isLoading}
        className="w-full max-w-md"
      />

      {/* Status Tabs and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as DischargeCaseStatus | "all")}
        >
          <TabsList className="h-auto flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn("gap-1.5", tab.colorClass)}
              >
                {tab.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-0.5 h-5 min-w-5 px-1.5 text-xs",
                    activeTab === tab.value && "bg-background/50",
                  )}
                >
                  {tab.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {onSearchChange && (
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
            <kbd className="text-muted-foreground bg-muted pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border px-1.5 text-xs sm:inline-block">
              ⌘K
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}
