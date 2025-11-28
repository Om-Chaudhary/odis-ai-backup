"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface StatusSummaryBarProps {
  totalCases: number;
  readyCases: number;
  pendingCases: number;
  completedCases: number;
  failedCases: number;
  scheduledCalls: number;
  scheduledEmails: number;
  onFilterChange?: (
    filter: "all" | "ready" | "pending" | "completed" | "failed",
  ) => void;
  activeFilter?: string;
}

export function StatusSummaryBar({
  totalCases,
  readyCases,
  pendingCases,
  completedCases,
  failedCases,
  scheduledCalls,
  scheduledEmails,
  onFilterChange,
  activeFilter = "all",
}: StatusSummaryBarProps) {
  return (
    <Card className="animate-card-in transition-smooth rounded-xl border border-teal-200/40 bg-gradient-to-br from-teal-50/20 via-white/70 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-teal-50/25 hover:via-white/75 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Summary Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">{totalCases}</span>
              <span className="text-slate-500"> cases</span>
            </div>
            <div>
              <span className="font-medium text-emerald-700">{readyCases}</span>
              <span className="text-slate-500"> ready</span>
            </div>
            <div>
              <span className="font-medium text-amber-700">{pendingCases}</span>
              <span className="text-slate-500"> pending</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">
                {completedCases}
              </span>
              <span className="text-slate-500"> completed</span>
            </div>
            <div>
              <span className="font-medium text-red-700">{failedCases}</span>
              <span className="text-slate-500"> failed</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">
                {scheduledCalls}
              </span>
              <span className="text-slate-500"> calls</span>
            </div>
            <div>
              <span className="font-medium text-blue-700">
                {scheduledEmails}
              </span>
              <span className="text-slate-500"> emails</span>
            </div>
          </div>

          {/* Quick Filters */}
          {onFilterChange && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1">
              <Button
                variant={activeFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("all")}
                className={cn(
                  "transition-smooth hover:scale-[1.01]",
                  activeFilter === "all" &&
                    "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
                )}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "ready" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("ready")}
                className={cn(
                  "transition-smooth hover:scale-[1.01]",
                  activeFilter === "ready" &&
                    "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
                )}
              >
                Ready
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("pending")}
                className={cn(
                  "transition-smooth hover:scale-[1.01]",
                  activeFilter === "pending" &&
                    "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
                )}
              >
                Pending
              </Button>
              <Button
                variant={activeFilter === "completed" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("completed")}
                className={cn(
                  "transition-smooth hover:scale-[1.01]",
                  activeFilter === "completed" &&
                    "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
                )}
              >
                Completed
              </Button>
              <Button
                variant={activeFilter === "failed" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("failed")}
                className={cn(
                  "transition-smooth hover:scale-[1.01]",
                  activeFilter === "failed" &&
                    "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
                )}
              >
                Failed
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
