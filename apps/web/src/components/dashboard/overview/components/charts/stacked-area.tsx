"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { cn } from "@odis-ai/shared/util";

interface StackedAreaData {
  day: string;
  critical: number;
  voicemail: number;
  recheck: number;
  clear: number;
}

interface StackedAreaProps {
  data: StackedAreaData[];
  className?: string;
  height?: number;
}

const COLORS = {
  critical: "#ef4444",
  voicemail: "#f59e0b",
  recheck: "#10b981",
  clear: "#14b8a6",
};

export function StackedArea({
  data,
  className,
  height = 200,
}: StackedAreaProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <defs>
            <linearGradient id="colorClear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.clear} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.clear} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorRecheck" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.recheck} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.recheck} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorVoicemail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.voicemail} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.voicemail} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.critical} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.critical} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="clear"
            stackId="1"
            stroke={COLORS.clear}
            fill="url(#colorClear)"
            name="All Clear"
          />
          <Area
            type="monotone"
            dataKey="recheck"
            stackId="1"
            stroke={COLORS.recheck}
            fill="url(#colorRecheck)"
            name="Rechecks"
          />
          <Area
            type="monotone"
            dataKey="voicemail"
            stackId="1"
            stroke={COLORS.voicemail}
            fill="url(#colorVoicemail)"
            name="Voicemails"
          />
          <Area
            type="monotone"
            dataKey="critical"
            stackId="1"
            stroke={COLORS.critical}
            fill="url(#colorCritical)"
            name="Critical"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
