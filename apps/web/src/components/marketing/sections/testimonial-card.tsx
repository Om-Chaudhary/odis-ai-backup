"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { NeonGradientCard } from "~/components/landing/ui/neon-gradient-card";
import { cn } from "@odis-ai/shared/util";

export interface TestimonialCardProps {
  quote: string;
  attribution: string;
  proofLine: string;
  className?: string;
}

export function TestimonialCard({
  quote,
  attribution,
  proofLine,
  className,
}: TestimonialCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn("mx-auto max-w-3xl", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
      >
        <NeonGradientCard className="relative overflow-hidden">
          <div className="relative p-8 sm:p-10">
            <Quote className="mb-4 h-8 w-8 text-teal-400/60" />

            <blockquote className="mb-6 text-lg leading-relaxed font-medium text-slate-800 italic sm:text-xl">
              &ldquo;{quote}&rdquo;
            </blockquote>

            <div className="mb-4 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-700">
                {attribution}
              </p>
              <span className="inline-flex w-fit items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {proofLine}
              </span>
            </div>
          </div>
        </NeonGradientCard>
      </motion.div>
    </div>
  );
}
