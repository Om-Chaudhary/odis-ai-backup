"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { cn } from "@odis-ai/shared/util";
import { NumberTicker } from "@odis-ai/shared/ui";

interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  centerValue?: number;
  centerLabel?: string;
  className?: string;
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  onSegmentClick?: (name: string) => void;
}

// Custom active shape for hover effect
const renderActiveShape = (props: PieSectorDataItem) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={(outerRadius ?? 0) + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-lg transition-all duration-200"
      />
    </g>
  );
};

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  className,
  size = 280,
  innerRadius = 70,
  outerRadius = 100,
  onSegmentClick,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            activeIndex={activeIndex ?? undefined}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={(entry) => onSegmentClick?.(entry.name)}
            className="cursor-pointer outline-none"
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="transparent"
                className="transition-opacity duration-200"
                style={{
                  opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center content */}
      {(centerValue !== undefined || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue !== undefined && (
            <NumberTicker
              value={centerValue}
              className="text-4xl font-bold text-slate-900"
            />
          )}
          {centerLabel && (
            <span className="text-sm text-slate-500">{centerLabel}</span>
          )}
        </div>
      )}

      {/* Hover tooltip */}
      {activeIndex !== null && data[activeIndex] && (
        <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: data[activeIndex].color }}
            />
            <span className="font-medium">{data[activeIndex].name}</span>
            <span className="text-slate-500">{data[activeIndex].value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
