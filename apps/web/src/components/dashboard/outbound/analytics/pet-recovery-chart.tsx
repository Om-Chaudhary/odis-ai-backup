"use client";

/**
 * Pet Recovery Chart
 *
 * Bar chart showing distribution of pet recovery statuses
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface PetRecoveryChartProps {
  data: Record<string, number>;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: typeof Heart }
> = {
  fully_recovered: {
    label: "Fully Recovered",
    color: "bg-green-500",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  improving: {
    label: "Improving",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-100",
    icon: TrendingUp,
  },
  same: {
    label: "Same",
    color: "bg-amber-500",
    bgColor: "bg-amber-100",
    icon: Minus,
  },
  declining: {
    label: "Declining",
    color: "bg-red-500",
    bgColor: "bg-red-100",
    icon: TrendingDown,
  },
  unknown: {
    label: "Unknown",
    color: "bg-slate-400",
    bgColor: "bg-slate-100",
    icon: Heart,
  },
  not_discussed: {
    label: "Not Discussed",
    color: "bg-slate-300",
    bgColor: "bg-slate-100",
    icon: Heart,
  },
};

export function PetRecoveryChart({ data }: PetRecoveryChartProps) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return null;
  }

  // Sort by a predefined order
  const order = [
    "fully_recovered",
    "improving",
    "same",
    "declining",
    "unknown",
    "not_discussed",
  ];
  const sortedEntries = entries.sort(
    ([a], [b]) => order.indexOf(a) - order.indexOf(b),
  );

  // Calculate positive outcomes
  const positiveCount = (data.fully_recovered ?? 0) + (data.improving ?? 0);
  const positiveRate = Math.round((positiveCount / total) * 100);

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className="rounded-md bg-pink-100 p-1.5 dark:bg-pink-900/50">
            <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </div>
          Pet Recovery Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Positive outcome highlight */}
        <div className="flex items-center justify-between rounded-lg bg-green-50 p-2 dark:bg-green-950/30">
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Positive Outcomes
          </span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {positiveRate}%
          </span>
        </div>

        {/* Status bars */}
        <div className="space-y-2">
          {sortedEntries.map(([status, count]) => {
            const config = statusConfig[status] ?? {
              label: status.replace(/_/g, " "),
              color: "bg-slate-500",
              bgColor: "bg-slate-100",
              icon: Heart,
            };
            const percentage = Math.round((count / total) * 100);
            const Icon = config.icon;

            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Icon className="h-3 w-3" />
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
            Total Reported
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {total}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
