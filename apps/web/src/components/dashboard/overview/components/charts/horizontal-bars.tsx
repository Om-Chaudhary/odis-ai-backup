"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
import {
  Calendar,
  Phone,
  Info,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface BarData {
  label: string;
  value: number;
  color: string;
  icon: string;
  percentage?: number;
}

interface HorizontalBarsProps {
  data: BarData[];
  maxValue?: number;
  className?: string;
  onBarClick?: (label: string) => void;
  animate?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Phone,
  PhoneCallback: Phone,
  Info,
  AlertTriangle,
};

export function HorizontalBars({
  data,
  maxValue,
  className,
  onBarClick,
  animate = true,
}: HorizontalBarsProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value));

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        const Icon = iconMap[item.icon] ?? Info;
        const widthPercent = (item.value / max) * 100;

        return (
          <button
            key={item.label}
            onClick={() => onBarClick?.(item.label)}
            className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
          >
            <Icon
              className="h-5 w-5 shrink-0"
              style={{ color: item.color }}
            />
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {item.value}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={animate ? { width: 0 } : { width: `${widthPercent}%` }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
