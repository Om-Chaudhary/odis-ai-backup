"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@odis-ai/shared/util";

interface SparklineAreaProps {
  data: Array<{ value: number }>;
  color?: string;
  gradientId?: string;
  className?: string;
  height?: number;
  animate?: boolean;
}

export function SparklineArea({
  data,
  color = "#31aba3",
  gradientId = "sparkline-gradient",
  className,
  height = 60,
  animate = true,
}: SparklineAreaProps) {
  const uniqueId = `${gradientId}-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${uniqueId})`}
            isAnimationActive={animate}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
