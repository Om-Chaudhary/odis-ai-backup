"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { BarChart3 } from "lucide-react";
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
  // Transform data for chart display
  const chartData = data.map((item) => ({
    date: format(parseISO(item.date), "MMM dd"),
    Cases: item.cases,
    Calls: item.completedCalls,
  }));

  return (
    <Card className="border-slate-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-slate-600" />
          Weekly Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No activity data</p>
          </div>
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
              />
              <Bar
                dataKey="Calls"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
