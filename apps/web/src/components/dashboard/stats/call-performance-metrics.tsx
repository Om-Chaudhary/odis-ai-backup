"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@odis/ui/card";
import { EmptyState } from "@odis/ui";
import { TrendingUp, Clock, DollarSign, Smile, Meh, Frown } from "lucide-react";
import type { CallPerformanceMetrics } from "~/types/dashboard";

interface CallPerformanceMetricsProps {
  metrics: CallPerformanceMetrics;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function CallPerformanceMetricsComponent({
  metrics,
}: CallPerformanceMetricsProps) {
  const {
    totalCalls,
    averageDuration,
    totalCost,
    successRate,
    sentimentBreakdown,
  } = metrics;

  if (totalCalls === 0) {
    return (
      <Card className="rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md transition-all hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-slate-600" />
            Call Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="No completed calls yet"
            description="Performance metrics will appear here once calls are completed"
            size="sm"
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md transition-all hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-slate-600" />
          Call Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Average Duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              Average Duration
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatDuration(averageDuration)}
            </div>
            <p className="text-xs text-slate-500">
              Across {totalCalls} {totalCalls === 1 ? "call" : "calls"}
            </p>
          </div>

          {/* Total Cost */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500">
              ${(totalCost / totalCalls).toFixed(2)} per call avg
            </p>
          </div>

          {/* Success Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <TrendingUp className="h-4 w-4" />
              Success Rate
            </div>
            <div className="text-2xl font-bold text-green-600">
              {successRate}%
            </div>
            <p className="text-xs text-slate-500">Call completion rate</p>
          </div>

          {/* Sentiment Breakdown */}
          <div className="space-y-2">
            <div className="text-sm text-slate-600">User Sentiment</div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <Smile className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-slate-900">
                  {sentimentBreakdown.positive}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Meh className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-900">
                  {sentimentBreakdown.neutral}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Frown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-slate-900">
                  {sentimentBreakdown.negative}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Positive, neutral, negative
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
