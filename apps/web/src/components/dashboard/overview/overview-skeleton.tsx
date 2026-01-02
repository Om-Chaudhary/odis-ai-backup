"use client";

import { cn } from "@odis-ai/shared/util";

export function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Hero skeleton */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-8 py-10">
        <div className="flex items-start gap-5">
          <div className="h-14 w-14 rounded-full bg-stone-200" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-64 rounded bg-stone-200" />
            <div className="h-5 w-96 rounded bg-stone-200" />
          </div>
        </div>
      </div>

      {/* Value summary skeleton */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-stone-200" />
          <div className="h-9 w-48 rounded-lg bg-stone-100" />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-stone-200" />
              <div className="space-y-2">
                <div className="h-7 w-20 rounded bg-stone-200" />
                <div className="h-4 w-32 rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-stone-200" />
              <div className="h-6 w-8 rounded bg-stone-200" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-5 w-24 rounded bg-stone-200" />
              <div className="h-4 w-32 rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
