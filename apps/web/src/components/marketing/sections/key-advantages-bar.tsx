"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";

export interface KeyAdvantage {
  value: string;
  label: string;
}

export interface KeyAdvantagesBarProps {
  advantages: KeyAdvantage[];
  className?: string;
}

export function KeyAdvantagesBar({
  advantages,
  className,
}: KeyAdvantagesBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      className={cn(
        "w-full border-b border-slate-200/60 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/80",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
        className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-slate-200 px-4 py-6 sm:px-6"
      >
        {advantages.map((advantage, index) => (
          <div
            key={index}
            className="flex flex-col items-center px-4 text-center"
          >
            <span className="text-2xl font-bold text-teal-600 sm:text-3xl">
              {advantage.value}
            </span>
            <span className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 sm:text-sm">
              {advantage.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
