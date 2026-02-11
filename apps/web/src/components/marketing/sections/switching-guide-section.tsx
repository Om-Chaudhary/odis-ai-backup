"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { cn } from "@odis-ai/shared/util";

export interface SwitchingGuideSectionProps {
  title: string;
  description: string;
  steps: string[];
  timeline: string;
  className?: string;
}

export function SwitchingGuideSection({
  title,
  description,
  steps,
  timeline,
  className,
}: SwitchingGuideSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
        className="space-y-6"
      >
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
            {title}
          </h3>
          <p className="mt-2 text-slate-600">{description}</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <BlurFade key={index} delay={index * 0.1} inView={isInView}>
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-slate-700">{step}</p>
              </div>
            </BlurFade>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
          <ArrowRight className="h-4 w-4" />
          {timeline}
        </div>
      </motion.div>
    </div>
  );
}
