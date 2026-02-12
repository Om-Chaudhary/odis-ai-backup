"use client";

import { GitCompare } from "lucide-react";
import { DotPattern } from "~/components/landing/ui/dot-pattern";

interface CompareHeroProps {
  competitorTypes: Array<{ id: string; label: string }>;
}

export function CompareHero({ competitorTypes }: CompareHeroProps) {
  return (
    <header className="relative isolate overflow-hidden bg-white pt-32 pb-16">
      {/* ── Layered background treatment ──────────────────────── */}

      {/* Large asymmetric violet wash — positioned upper-right for editorial feel */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-[600px] w-[900px] rounded-full bg-violet-500/7 blur-[80px]" />

      {/* Secondary smaller accent — lower-left for depth */}
      <div className="pointer-events-none absolute bottom-0 -left-16 h-[300px] w-[500px] rounded-full bg-teal-400/5 blur-[60px]" />

      {/* Dot pattern — violet tinted, fades outward from center-right */}
      <DotPattern
        width={28}
        height={28}
        cr={1}
        className="mask-[radial-gradient(ellipse_60%_50%_at_70%_40%,black_20%,transparent_100%)] text-violet-500/10"
      />

      {/* Thin violet accent line at top of hero for sharp brand signal */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-violet-400/40 to-transparent" />

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3.5 py-1.5 text-xs font-semibold tracking-widest text-violet-700 uppercase">
            <GitCompare className="h-3.5 w-3.5" />
            Compare
          </p>

          <h1 className="font-display mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Why Clinics Are Switching to OdisAI
          </h1>

          <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
            Detailed comparisons with the alternatives so you can make an
            informed decision for your veterinary practice.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mt-10 space-y-5">
          {/* Filter pills */}
          <nav className="flex flex-wrap gap-2" aria-label="Filter by type">
            <button className="rounded-full border border-violet-300 bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-violet-700 hover:shadow-md">
              All Comparisons
            </button>
            {competitorTypes.map((type) => (
              <button
                key={type.id}
                className="rounded-full border border-violet-200/60 bg-white/80 px-4 py-2 text-xs font-medium text-violet-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md"
              >
                {type.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom border — violet-tinted divider to the content sections */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-violet-200/60 to-transparent" />
    </header>
  );
}
