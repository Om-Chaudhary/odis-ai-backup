"use client";

import { BookOpen } from "lucide-react";
import { DotPattern } from "~/components/landing/ui/dot-pattern";
import type { ResourceCategory } from "./categorize-resources";

interface ResourcesHeroProps {
  filterCategories: ResourceCategory[];
}

export function ResourcesHero({ filterCategories }: ResourcesHeroProps) {
  return (
    <header className="relative isolate overflow-hidden bg-white pt-32 pb-16">
      {/* ── Layered background treatment ──────────────────────── */}

      {/* Large asymmetric teal wash — positioned upper-left for editorial feel */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[600px] w-[900px] rounded-full bg-teal-500/7 blur-[80px]" />

      {/* Secondary smaller accent — lower-right for depth */}
      <div className="pointer-events-none absolute -right-16 bottom-0 h-[300px] w-[500px] rounded-full bg-teal-400/5 blur-[60px]" />

      {/* Dot pattern — teal tinted, fades outward from center-left */}
      <DotPattern
        width={28}
        height={28}
        cr={1}
        className="mask-[radial-gradient(ellipse_60%_50%_at_30%_40%,black_20%,transparent_100%)] text-teal-500/10"
      />

      {/* Thin teal accent line at top of hero for sharp brand signal */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-teal-400/40 to-transparent" />

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50/80 px-3.5 py-1.5 text-xs font-semibold tracking-widest text-teal-700 uppercase">
            <BookOpen className="h-3.5 w-3.5" />
            Resource Library
          </p>

          <h1 className="font-display mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Veterinary Practice Operations Library
          </h1>

          <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
            Research, templates, and practical guides to help small animal
            clinics reduce phone overwhelm, recover revenue, and improve client
            compliance.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mt-10 space-y-5">
          {/* Filter pills */}
          <nav className="flex flex-wrap gap-2" aria-label="Jump to category">
            {filterCategories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="rounded-full border border-teal-200/60 bg-white/80 px-4 py-2 text-xs font-medium text-teal-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-teal-300 hover:bg-teal-50 hover:shadow-md"
              >
                {cat.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom border — teal-tinted divider to the content sections */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-teal-200/60 to-transparent" />
    </header>
  );
}
