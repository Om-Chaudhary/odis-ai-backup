"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";

export interface MetricItem {
  value: string;
  label: string;
  description: string;
}

export interface AnimatedMetricsSectionProps {
  metrics: MetricItem[];
  className?: string;
}

export function AnimatedMetricsSection({
  metrics,
  className,
}: AnimatedMetricsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: index * 0.1,
            }}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-8 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-teal-500/10"
          >
            {/* Value */}
            <div className="mb-2 text-3xl font-bold text-teal-600 sm:text-4xl">
              {metric.value}
            </div>

            {/* Label */}
            <div className="mb-1 text-base font-semibold text-slate-900">
              {metric.label}
            </div>

            {/* Description */}
            <div className="text-sm text-slate-500">{metric.description}</div>

            {/* Subtle gradient accent */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
