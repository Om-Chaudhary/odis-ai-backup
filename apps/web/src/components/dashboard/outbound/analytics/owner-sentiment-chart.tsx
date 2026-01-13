"use client";

/**
 * Owner Sentiment Chart
 *
 * Horizontal bar chart showing distribution of owner sentiments
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Smile, Meh, Frown, AlertTriangle, Heart } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface OwnerSentimentChartProps {
  data: Record<string, number>;
}

const sentimentConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: typeof Smile }
> = {
  positive: {
    label: "Positive",
    color: "bg-green-500",
    bgColor: "bg-green-100",
    icon: Smile,
  },
  grateful: {
    label: "Grateful",
    color: "bg-pink-500",
    bgColor: "bg-pink-100",
    icon: Heart,
  },
  neutral: {
    label: "Neutral",
    color: "bg-slate-400",
    bgColor: "bg-slate-100",
    icon: Meh,
  },
  anxious: {
    label: "Anxious",
    color: "bg-amber-500",
    bgColor: "bg-amber-100",
    icon: AlertTriangle,
  },
  frustrated: {
    label: "Frustrated",
    color: "bg-orange-500",
    bgColor: "bg-orange-100",
    icon: AlertTriangle,
  },
  negative: {
    label: "Negative",
    color: "bg-red-500",
    bgColor: "bg-red-100",
    icon: Frown,
  },
};

export function OwnerSentimentChart({ data }: OwnerSentimentChartProps) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return null;
  }

  // Sort by predefined order (positive first)
  const order = [
    "positive",
    "grateful",
    "neutral",
    "anxious",
    "frustrated",
    "negative",
  ];
  const sortedEntries = entries.sort(
    ([a], [b]) => order.indexOf(a) - order.indexOf(b),
  );

  // Calculate positive sentiment rate
  const positiveCount = (data.positive ?? 0) + (data.grateful ?? 0);
  const positiveRate = Math.round((positiveCount / total) * 100);

  // Calculate satisfaction indicator
  const getSatisfactionIndicator = () => {
    if (positiveRate >= 80)
      return { label: "Excellent", color: "text-green-600" };
    if (positiveRate >= 60) return { label: "Good", color: "text-emerald-600" };
    if (positiveRate >= 40)
      return { label: "Moderate", color: "text-amber-600" };
    return { label: "Needs Improvement", color: "text-red-600" };
  };

  const satisfaction = getSatisfactionIndicator();

  return (
    <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className="rounded-md bg-emerald-100 p-1.5 dark:bg-emerald-900/50">
            <Smile className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          Owner Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Satisfaction score */}
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Satisfaction Score
          </span>
          <span className={cn("text-sm font-bold", satisfaction.color)}>
            {satisfaction.label}
          </span>
        </div>

        {/* Sentiment bars */}
        <div className="space-y-2">
          {sortedEntries.map(([sentiment, count]) => {
            const config = sentimentConfig[sentiment] ?? {
              label: sentiment.replace(/_/g, " "),
              color: "bg-slate-500",
              bgColor: "bg-slate-100",
              icon: Meh,
            };
            const percentage = Math.round((count / total) * 100);
            const Icon = config.icon;

            return (
              <div key={sentiment} className="space-y-1">
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

        {/* Positive rate highlight */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Positive Rate
          </span>
          <span className="font-bold text-green-600 dark:text-green-400">
            {positiveRate}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
