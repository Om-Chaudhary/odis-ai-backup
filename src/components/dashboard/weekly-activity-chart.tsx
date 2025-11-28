"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "../dashboard/empty-state";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { WeeklyActivityData } from "~/types/dashboard";

interface WeeklyActivityChartProps {
  data: WeeklyActivityData[];
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Trigger animation after numbers start (1500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Transform data for chart display
  const chartData = data.map((item) => ({
    date: format(parseISO(item.date), "MMM dd"),
    Cases: item.cases,
    Calls: item.completedCalls,
  }));

  return (
    <Card className="transition-smooth rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <BarChart3 className="h-5 w-5 text-slate-600" />
          Weekly Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="animate-card-content-in pt-0">
        {data.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No activity data"
            description="Activity data will appear here once cases and calls are recorded"
            size="sm"
            className="min-h-[200px]"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                itemStyle={{ color: "#64748b" }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  paddingTop: "16px",
                }}
              />
              <Bar
                dataKey="Cases"
                fill="#31aba3"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                isAnimationActive={shouldAnimate}
                animationBegin={0}
                animationDuration={1000}
              />
              <Bar
                dataKey="Calls"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                isAnimationActive={shouldAnimate}
                animationBegin={200}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
