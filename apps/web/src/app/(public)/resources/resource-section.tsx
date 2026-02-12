"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
  Phone,
  Moon,
  DollarSign,
  FileText,
  Cpu,
  GitCompare,
  ChevronDown,
  Pin,
  TrendingUp,
} from "lucide-react";
import type { ResourcePageData } from "./data/types";

function getReadTime(sectionsCount: number) {
  return Math.max(4, sectionsCount * 4);
}

// Icon mapping for client component
const iconMap = {
  Phone,
  Moon,
  DollarSign,
  FileText,
  Cpu,
  GitCompare,
};

interface ResourceSectionProps {
  sectionResources: Array<{
    slug: string;
    data: ResourcePageData;
    category: string;
  }>;
  categoryConfig: {
    iconName: string;
    accentBorder: string;
    accentText: string;
    iconBg: string;
    tagBg: string;
    tagText: string;
  };
  categoryLabel: string;
}

export function ResourceSection({
  sectionResources,
  categoryConfig,
  categoryLabel,
}: ResourceSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon =
    iconMap[categoryConfig.iconName as keyof typeof iconMap] ?? FileText;

  if (sectionResources.length === 0) return null;

  // Show 6 cards initially: 1 featured (2-col span) + 5 regular
  // Grid layout: Row 1: Featured (2 cols) + Regular (1 col)
  //              Row 2: Regular, Regular, Regular (3 cols)
  const INITIAL_VISIBLE_COUNT = 6;
  const initialCards = sectionResources.slice(0, INITIAL_VISIBLE_COUNT);
  const remainingCards = sectionResources.slice(INITIAL_VISIBLE_COUNT);
  const hasMoreCards = remainingCards.length > 0;

  const featuredCard = initialCards[0] ?? null;
  const regularCards = initialCards.slice(1);

  return (
    <>
      {/* Integrated grid with featured article as 2-column span */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Featured article - 2-column span on large screens */}
        <Link
          href={`/resources/${featuredCard?.slug}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/8 sm:col-span-2 lg:col-span-2"
        >
          {/* Colored top accent bar - same as regular cards */}
          <div className={`h-1 w-full ${categoryConfig.iconBg}`} />

          {/* Small PINNED badge - top right */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-500/90 via-amber-600/90 to-amber-700/90 px-2.5 py-1 shadow-sm">
              <Pin className="h-3 w-3 rotate-45 text-white" />
              <span className="text-[10px] font-medium tracking-widest text-white uppercase">
                Pinned
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-6">
            {/* Category tag + read time */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide ${categoryConfig.tagBg} ${categoryConfig.tagText}`}
              >
                <Icon className="h-3 w-3" />
                {categoryLabel}
              </span>
              <span className="text-slate-300">&middot;</span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {getReadTime(featuredCard?.data.sections.length ?? 0)} min
              </span>
            </div>

            {/* Title - slightly larger than regular cards */}
            <h3 className="font-display mb-3 line-clamp-2 text-xl leading-snug font-medium tracking-tight text-slate-900 transition-colors group-hover:text-teal-900 lg:text-2xl">
              {featuredCard?.data.hero.title}
            </h3>

            {/* Description - more space than regular cards */}
            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
              {featuredCard?.data.cardDescription}
            </p>

            {/* Optional key stat */}
            {featuredCard?.data.stats?.[0] && (
              <div
                className={`mb-4 inline-flex items-start gap-2 rounded-lg border-l-4 ${categoryConfig.accentBorder} bg-slate-50 px-3 py-2 shadow-sm`}
              >
                <TrendingUp
                  className={`mt-0.5 h-4 w-4 ${categoryConfig.accentText}`}
                />
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-sm font-semibold tabular-nums ${categoryConfig.accentText}`}
                  >
                    {featuredCard?.data.stats[0].value}
                  </span>
                  <span className="text-xs text-slate-600">
                    {featuredCard?.data.stats[0].label}
                  </span>
                </div>
              </div>
            )}

            {/* Read guide link */}
            <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-teal-600 transition-colors group-hover:text-teal-700">
              Read guide
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* Regular cards */}
        {regularCards.map((resource) => {
          const readTime = getReadTime(resource.data.sections.length);

          return (
            <Link
              key={resource.slug}
              href={`/resources/${resource.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/8"
            >
              {/* Colored top accent bar */}
              <div className={`h-1 w-full ${categoryConfig.iconBg}`} />

              <div className="flex flex-1 flex-col p-6">
                {/* Category tag + read time */}
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide ${categoryConfig.tagBg} ${categoryConfig.tagText}`}
                  >
                    <Icon className="h-3 w-3" />
                    {categoryLabel}
                  </span>
                  <span className="text-slate-300">&middot;</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {readTime} min
                  </span>
                </div>

                <h3 className="font-display tracking-snug mb-2 line-clamp-2 text-lg leading-snug font-medium text-slate-900">
                  {resource.data.hero.title}
                </h3>
                <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                  {resource.data.cardDescription}
                </p>

                <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-teal-600 transition-colors group-hover:text-teal-700">
                  Read guide
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Remaining cards (shown when expanded) */}
      {isExpanded && hasMoreCards && (
        <div className="animate-in fade-in slide-in-from-top-4 mt-5 duration-500">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {remainingCards.map((resource) => {
              const readTime = getReadTime(resource.data.sections.length);

              return (
                <Link
                  key={resource.slug}
                  href={`/resources/${resource.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/8"
                >
                  {/* Colored top accent bar */}
                  <div className={`h-1 w-full ${categoryConfig.iconBg}`} />

                  <div className="flex flex-1 flex-col p-6">
                    {/* Category tag + read time */}
                    <div className="mb-4 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide ${categoryConfig.tagBg} ${categoryConfig.tagText}`}
                      >
                        <Icon className="h-3 w-3" />
                        {categoryLabel}
                      </span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {readTime} min
                      </span>
                    </div>

                    <h3 className="font-display tracking-snug mb-2 line-clamp-2 text-base leading-snug font-medium text-slate-900">
                      {resource.data.hero.title}
                    </h3>
                    <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                      {resource.data.cardDescription}
                    </p>

                    <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-teal-600 transition-colors group-hover:text-teal-700">
                      Read guide
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* View more button - only show if there are cards beyond initial 6 */}
      {hasMoreCards && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <span>
            {isExpanded
              ? "Show less"
              : `View ${remainingCards.length} more ${categoryLabel} guide${remainingCards.length === 1 ? "" : "s"}`}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-all ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </>
  );
}
