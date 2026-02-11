"use client";

import { Check } from "lucide-react";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { cn } from "@odis-ai/shared/util";

export interface BentoFeature {
  title: string;
  description: string;
  highlights: string[];
}

export interface BentoFeatureGridProps {
  features: BentoFeature[];
  className?: string;
}

export function BentoFeatureGrid({
  features,
  className,
}: BentoFeatureGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {features.map((feature, index) => {
        const isHero = index === 0;

        return (
          <BlurFade key={index} delay={index * 0.1} inView>
            <div
              className={cn(
                "group rounded-2xl border border-slate-200/80 bg-white/80 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/10 sm:p-8",
                isHero && "sm:col-span-2 lg:col-span-2",
              )}
            >
              <h3
                className={cn(
                  "font-display mb-2 font-semibold text-slate-900",
                  isHero ? "text-xl sm:text-2xl" : "text-lg",
                )}
              >
                {feature.title}
              </h3>
              <p
                className={cn(
                  "mb-4 text-slate-600",
                  isHero ? "text-base" : "text-sm",
                )}
              >
                {feature.description}
              </p>
              {feature.highlights.length > 0 && (
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, hi) => (
                    <li
                      key={hi}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BlurFade>
        );
      })}
    </div>
  );
}
