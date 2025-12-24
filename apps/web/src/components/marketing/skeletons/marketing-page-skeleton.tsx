"use client";

import { cn } from "@odis-ai/shared/util";

export interface MarketingPageSkeletonProps {
  /**
   * Whether to show the hero skeleton
   * @default true
   */
  showHero?: boolean;
  /**
   * Number of content sections to show
   * @default 3
   */
  sections?: number;
  /**
   * Whether to show the CTA skeleton
   * @default true
   */
  showCTA?: boolean;
  /**
   * Additional className
   */
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-200/60", className)}
    />
  );
}

function HeroSkeleton() {
  return (
    <section className="relative w-full overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <SkeletonPulse className="h-10 w-32" />
        </div>

        {/* Title */}
        <div className="mx-auto mb-6 max-w-3xl space-y-3">
          <SkeletonPulse className="mx-auto h-12 w-3/4" />
          <SkeletonPulse className="mx-auto h-12 w-1/2" />
        </div>

        {/* Subtitle */}
        <div className="mx-auto max-w-2xl space-y-2">
          <SkeletonPulse className="mx-auto h-6 w-full" />
          <SkeletonPulse className="mx-auto h-6 w-4/5" />
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex justify-center gap-4">
          <SkeletonPulse className="h-12 w-36 rounded-full" />
          <SkeletonPulse className="h-12 w-36 rounded-full" />
        </div>
      </div>
    </section>
  );
}

function SectionSkeleton({ cardCount = 3 }: { cardCount?: number }) {
  return (
    <section className="relative w-full overflow-hidden py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <SkeletonPulse className="mx-auto mb-4 h-10 w-32" />
          <SkeletonPulse className="mx-auto mb-4 h-10 w-64" />
          <SkeletonPulse className="mx-auto h-6 w-96" />
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cardCount }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200/60 bg-white p-6"
            >
              <SkeletonPulse className="mb-4 h-12 w-12 rounded-xl" />
              <SkeletonPulse className="mb-2 h-6 w-3/4" />
              <SkeletonPulse className="mb-4 h-4 w-full" />
              <SkeletonPulse className="mb-2 h-4 w-5/6" />
              <div className="mt-4 space-y-2">
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-4/5" />
                <SkeletonPulse className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASkeleton() {
  return (
    <section className="relative w-full overflow-hidden py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <SkeletonPulse className="mx-auto mb-4 h-10 w-32" />
        <SkeletonPulse className="mx-auto mb-4 h-12 w-3/4" />
        <SkeletonPulse className="mx-auto mb-10 h-6 w-1/2" />
        <div className="flex justify-center gap-4">
          <SkeletonPulse className="h-12 w-36 rounded-full" />
          <SkeletonPulse className="h-12 w-36 rounded-full" />
        </div>
      </div>
    </section>
  );
}

/**
 * MarketingPageSkeleton
 *
 * A loading skeleton for marketing pages.
 * Shows animated placeholder content while the page loads.
 *
 * @example
 * ```tsx
 * // In loading.tsx
 * export default function Loading() {
 *   return <MarketingPageSkeleton sections={2} />;
 * }
 * ```
 */
export function MarketingPageSkeleton({
  showHero = true,
  sections = 3,
  showCTA = true,
  className,
}: MarketingPageSkeletonProps) {
  return (
    <div className={cn("min-h-screen", className)}>
      {showHero && <HeroSkeleton />}

      {Array.from({ length: sections }).map((_, index) => (
        <SectionSkeleton
          key={index}
          cardCount={index === 0 ? 3 : index === 1 ? 4 : 3}
        />
      ))}

      {showCTA && <CTASkeleton />}
    </div>
  );
}

export default MarketingPageSkeleton;
