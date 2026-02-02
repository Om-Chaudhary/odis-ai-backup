"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { cn } from "@odis-ai/shared/util";
import { NumberTicker } from "@odis-ai/shared/ui";
import type { LucideIcon } from "lucide-react";

interface RadialGaugeProps {
  value: number;
  maxValue?: number;
  label?: string;
  sublabel?: string;
  icon?: LucideIcon;
  color?: string;
  size?: number;
  className?: string;
  showPercentage?: boolean;
}

export function RadialGauge({
  value,
  maxValue = 100,
  label,
  sublabel,
  icon: Icon,
  color = "#31aba3",
  size = 200,
  className,
  showPercentage = true,
}: RadialGaugeProps) {
  const percentage = Math.round((value / maxValue) * 100);

  const data = [
    {
      name: "value",
      value: percentage,
      fill: color,
    },
  ];

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background={{ fill: "#e2e8f0" }}
            dataKey="value"
            cornerRadius={10}
            isAnimationActive
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center content */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {Icon && (
          <Icon
            className="mb-1 h-6 w-6"
            style={{ color }}
          />
        )}
        {showPercentage && (
          <div className="flex items-baseline gap-0.5">
            <NumberTicker
              value={percentage}
              className="text-3xl font-bold text-slate-900"
            />
            <span className="text-lg font-semibold text-slate-500">%</span>
          </div>
        )}
        {!showPercentage && (
          <NumberTicker
            value={value}
            className="text-3xl font-bold text-slate-900"
          />
        )}
        {sublabel && (
          <span className="text-xs text-slate-500">{sublabel}</span>
        )}
      </div>

      {/* Label below */}
      {label && (
        <div className="absolute -bottom-1 left-0 right-0 text-center">
          <span className="text-sm font-medium text-slate-600">{label}</span>
        </div>
      )}
    </div>
  );
}
