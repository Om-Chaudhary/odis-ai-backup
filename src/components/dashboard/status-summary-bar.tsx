"use client";

import { Card, CardContent } from "~/components/ui/card";
import { FilterButtonGroup } from "./filter-button-group";

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
            <FilterButtonGroup
              options={[
                { value: "all", label: "All" },
                { value: "ready", label: "Ready" },
                { value: "pending", label: "Pending" },
                { value: "completed", label: "Completed" },
                { value: "failed", label: "Failed" },
              ]}
              value={activeFilter}
              onChange={(value) =>
                onFilterChange(
                  value as "all" | "ready" | "pending" | "completed" | "failed",
                )
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
