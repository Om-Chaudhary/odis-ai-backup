"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Trophy } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

export interface VerdictSectionProps {
  summary: string;
  bestForOdis: string[];
  bestForCompetitor: string[];
  competitorName: string;
  className?: string;
}

export function VerdictSection({
  summary,
  bestForOdis,
  bestForCompetitor,
  competitorName,
  className,
}: VerdictSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-white to-teal-50/50 p-8 shadow-lg shadow-teal-500/10 sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
              <Trophy className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Our Verdict
            </h3>
          </div>

          <p className="mb-8 text-base leading-relaxed text-slate-700 sm:text-lg">
            {summary}
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Choose OdisAI */}
            <div className="rounded-xl border border-teal-200 bg-white p-6">
              <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-teal-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
                  <Check className="h-3.5 w-3.5 text-teal-600" />
                </span>
                Choose OdisAI if...
              </h4>
              <ul className="space-y-3">
                {bestForOdis.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Choose Competitor */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                  <Check className="h-3.5 w-3.5 text-slate-400" />
                </span>
                Choose {competitorName} if...
              </h4>
              <ul className="space-y-3">
                {bestForCompetitor.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
