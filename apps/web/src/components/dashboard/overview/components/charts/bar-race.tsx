"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
import { Zap } from "lucide-react";

interface BarRaceComparison {
  metric: string;
  aiValue: string;
  aiWidth: number; // percentage 0-100
  staffValue: string;
  staffWidth: number; // percentage 0-100
  improvement: string;
  isInstant?: boolean;
  story: string;
}

interface BarRaceProps {
  comparisons: BarRaceComparison[];
  className?: string;
  animate?: boolean;
}

export function BarRace({
  comparisons,
  className,
  animate = true,
}: BarRaceProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {comparisons.map((comp, index) => (
        <div key={comp.metric} className="space-y-3">
          {/* Metric label */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">
              {comp.metric}
            </h4>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {comp.improvement}
            </span>
          </div>

          {/* ODIS bar */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-medium text-[#31aba3]">ODIS</span>
              <div className="relative flex-1">
                <div className="h-6 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="flex h-full items-center rounded-full bg-gradient-to-r from-[#31aba3] to-[#2dd4bf]"
                    initial={animate ? { width: 0 } : { width: `${comp.aiWidth}%` }}
                    animate={{ width: `${comp.aiWidth}%` }}
                    transition={{
                      duration: 1,
                      delay: index * 0.2,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>
              <span className="flex w-20 items-center justify-end gap-1 text-sm font-semibold text-slate-900">
                {comp.aiValue}
                {comp.isInstant && (
                  <Zap className="h-4 w-4 fill-amber-400 text-amber-400" />
                )}
              </span>
            </div>
          </div>

          {/* Staff bar */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-medium text-slate-400">Staff</span>
              <div className="relative flex-1">
                <div className="h-6 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-slate-300"
                    initial={animate ? { width: 0 } : { width: `${comp.staffWidth}%` }}
                    animate={{ width: `${comp.staffWidth}%` }}
                    transition={{
                      duration: 1,
                      delay: index * 0.2 + 0.3,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>
              <span className="w-20 text-right text-sm font-medium text-slate-500">
                {comp.staffValue}
              </span>
            </div>
          </div>

          {/* Story subtitle */}
          <p className="text-xs text-slate-500">{comp.story}</p>
        </div>
      ))}
    </div>
  );
}
