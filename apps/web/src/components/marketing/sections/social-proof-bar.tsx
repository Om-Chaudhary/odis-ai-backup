"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Star, TrendingUp } from "lucide-react";
import { NumberTicker } from "~/components/landing/ui/number-ticker";
import { cn } from "@odis-ai/shared/util";

export interface SocialProofBarProps {
  clinicCount?: number;
  switchedText?: string;
  className?: string;
}

export function SocialProofBar({
  clinicCount = 50,
  switchedText = "30+ clinics switched this month",
  className,
}: SocialProofBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full border-y border-slate-200/60 bg-white/80 backdrop-blur-sm",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-4 sm:gap-8 sm:px-6 lg:gap-12 lg:px-8"
      >
        {/* Divider */}
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Star rating */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm font-medium text-slate-700">4.9/5</span>
        </div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-slate-200 lg:block" />

        {/* Trending stat */}
        <div className="hidden items-center gap-2 text-sm text-slate-600 lg:flex">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          <span>{switchedText}</span>
        </div>
      </motion.div>
    </div>
  );
}
