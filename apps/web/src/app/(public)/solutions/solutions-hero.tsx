"use client";

import { Zap } from "lucide-react";
import { DotPattern } from "~/components/landing/ui/dot-pattern";

interface SolutionsHeroProps {
  solutionCategories: Array<{ id: string; label: string }>;
}

export function SolutionsHero({ solutionCategories }: SolutionsHeroProps) {
  return (
    <header className="relative isolate overflow-hidden bg-white pt-32 pb-16">
      {/* ── Layered background treatment ──────────────────────── */}

      {/* Large asymmetric cyan wash — positioned center for balanced feel */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/7 blur-[80px]" />

      {/* Secondary smaller accent — lower-right for depth */}
      <div className="pointer-events-none absolute -right-16 bottom-0 h-[300px] w-[500px] rounded-full bg-teal-400/5 blur-[60px]" />

      {/* Dot pattern — cyan tinted, fades outward from center */}
      <DotPattern
        width={28}
        height={28}
        cr={1}
        className="mask-[radial-gradient(ellipse_60%_50%_at_50%_40%,black_20%,transparent_100%)] text-cyan-500/10"
      />

      {/* Thin cyan accent line at top of hero for sharp brand signal */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50/80 px-3.5 py-1.5 text-xs font-semibold tracking-widest text-cyan-700 uppercase">
            <Zap className="h-3.5 w-3.5" />
            Solutions
          </p>

          <h1 className="font-display mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Stop Losing Revenue to Missed Calls
          </h1>

          <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
            From 24/7 answering to post-discharge follow-ups, OdisAI handles
            every call so your team can focus on patients.
          </p>
        </div>
        {/* Filter bar */}
        <div className="mt-10 space-y-5">
          {/* Filter pills */}
          <nav className="flex flex-wrap gap-2" aria-label="Filter by category">
            <button className="rounded-full border border-cyan-300 bg-cyan-600 px-4 py-2 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-cyan-700 hover:shadow-md">
              All Solutions
            </button>
            {solutionCategories.map((category) => (
              <button
                key={category.id}
                className="rounded-full border border-cyan-200/60 bg-white/80 px-4 py-2 text-xs font-medium text-cyan-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-50 hover:shadow-md"
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom border — cyan-tinted divider to the content sections */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-cyan-200/60 to-transparent" />
    </header>
  );
}
