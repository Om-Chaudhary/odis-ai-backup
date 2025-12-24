"use client";

/**
 * Call Outcomes Chart
 *
 * Pie chart showing the distribution of how calls ended
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { PhoneCall } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface CallOutcomesChartProps {
  data: Record<string, number>;
}

const outcomeConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  completed: {
    label: "Completed",
    color: "bg-green-500",
    bgColor: "bg-green-100",
  },
  voicemail: {
    label: "Voicemail",
    color: "bg-amber-500",
    bgColor: "bg-amber-100",
  },
  no_answer: { label: "No Answer", color: "bg-red-500", bgColor: "bg-red-100" },
  wrong_number: {
    label: "Wrong Number",
    color: "bg-slate-500",
    bgColor: "bg-slate-100",
  },
  declined_to_talk: {
    label: "Declined",
    color: "bg-orange-500",
    bgColor: "bg-orange-100",
  },
  busy: { label: "Busy", color: "bg-yellow-500", bgColor: "bg-yellow-100" },
  pet_deceased: {
    label: "Pet Deceased",
    color: "bg-slate-400",
    bgColor: "bg-slate-100",
  },
  transferred: {
    label: "Transferred",
    color: "bg-blue-500",
    bgColor: "bg-blue-100",
  },
  disconnected: {
    label: "Disconnected",
    color: "bg-red-400",
    bgColor: "bg-red-100",
  },
};

export function CallOutcomesChart({ data }: CallOutcomesChartProps) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return null;
  }

  // Sort by count descending
  const sortedEntries = entries.sort(([, a], [, b]) => b - a);

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className="rounded-md bg-blue-100 p-1.5 dark:bg-blue-900/50">
            <PhoneCall className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          Call Outcomes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Horizontal bar chart */}
        <div className="space-y-2">
          {sortedEntries.map(([outcome, count]) => {
            const config = outcomeConfig[outcome] ?? {
              label: outcome.replace(/_/g, " "),
              color: "bg-slate-500",
              bgColor: "bg-slate-100",
            };
            const percentage = Math.round((count / total) * 100);

            return (
              <div key={outcome} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {config.label}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      config.color,
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Total Calls
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {total}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
