"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Phone, X, Check, type LucideIcon } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { NumberTicker } from "../ui/number-ticker";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";

// Before/After comparison data
const COMPARISON_ROWS = [
  {
    metric: "Discharge calls/day",
    before: "12 attempted",
    after: "47 completed",
    improvement: "+292%",
  },
  {
    metric: "Staff time on calls",
    before: "3+ hours",
    after: "15 minutes",
    improvement: "-92%",
  },
  {
    metric: "Connection rate",
    before: "32%",
    after: "94%",
    improvement: "+194%",
  },
  {
    metric: "Pet parent satisfaction",
    before: "Unknown",
    after: "4.9/5",
    improvement: "Measured",
  },
];

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const statVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const tableRowVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const CompareSection = () => {
  const sectionVisibilityRef = useSectionVisibility<HTMLElement>("stats");
  const localRef = useRef<HTMLElement>(null);
  const isInView = useInView(localRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Combine refs for both visibility tracking and animation
  const sectionRef = (el: HTMLElement | null) => {
    (localRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (
      sectionVisibilityRef as React.MutableRefObject<HTMLElement | null>
    ).current = el;
  };

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef as React.LegacyRef<HTMLElement>}
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Subtle tinted background - soft slate with smooth transitions */}
      <SectionBackground variant="subtle-dark" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-16 text-center lg:mb-20"
        >
          <motion.span
            variants={fadeUpVariant}
            className="font-display mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest text-teal-600 uppercase"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
            Real Results
          </motion.span>
          <motion.h2
            variants={fadeUpVariant}
            className="font-display mb-4 text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl"
          >
            What changes with OdisAI
          </motion.h2>
        </motion.div>

        {/* Before/After Comparison Table */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.4 }}
          className="mt-16 lg:mt-20"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-xs font-semibold tracking-wider text-slate-600 uppercase sm:px-6">
              <div className="col-span-1">Metric</div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <X className="h-3 w-3 text-red-400" />
                  Without
                </span>
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center gap-1 text-teal-600">
                  <Check className="h-3 w-3" />
                  With OdisAI
                </span>
              </div>
              <div className="col-span-1 text-right">Impact</div>
            </div>

            {/* Table Rows */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {COMPARISON_ROWS.map((row, i) => (
                <motion.div
                  key={row.metric}
                  variants={tableRowVariant}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.4,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.08,
                  }}
                  className={cn(
                    "grid grid-cols-4 items-center gap-4 px-4 py-4 sm:px-6",
                    i < COMPARISON_ROWS.length - 1 &&
                      "border-b border-slate-100",
                  )}
                >
                  <div className="col-span-1 text-sm font-medium text-slate-700">
                    {row.metric}
                  </div>
                  <div className="col-span-1 text-center text-sm text-slate-500">
                    {row.before}
                  </div>
                  <div className="col-span-1 text-center text-sm font-semibold text-teal-600">
                    {row.after}
                  </div>
                  <div className="col-span-1 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                        row.improvement.startsWith("+")
                          ? "bg-emerald-100 text-emerald-700"
                          : row.improvement.startsWith("-")
                            ? "bg-teal-100 text-teal-700"
                            : "bg-teal-100 text-teal-700",
                      )}
                    >
                      {row.improvement}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.7 }}
          className="mt-12 text-center lg:mt-16"
        >
          <p className="text-sm text-slate-500 sm:text-base">
            Trusted by{" "}
            <span className="font-medium text-slate-700">
              veterinary teams nationwide
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
