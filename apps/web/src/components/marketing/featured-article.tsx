"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock,
  TrendingUp,
  ChevronDown,
  Phone,
  Moon,
  DollarSign,
  FileText,
  Cpu,
  GitCompare,
  Pin,
} from "lucide-react";
import type { ResourcePageData } from "~/app/(public)/resources/data/types";

interface FeaturedArticleProps {
  resource: {
    slug: string;
    data: ResourcePageData;
  };
  categoryConfig: {
    iconName: string;
    accentBorder: string;
    accentText: string;
    iconBg: string;
    tagBg: string;
    tagText: string;
  };
  categoryLabel: string;
  readTime: number;
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

export function FeaturedArticle({
  resource,
  categoryConfig,
  categoryLabel,
  readTime,
}: FeaturedArticleProps) {
  const Icon =
    iconMap[categoryConfig.iconName as keyof typeof iconMap] ?? FileText;
  const firstStat = resource.data.stats?.[0];

  // Extract gradient colors from the iconBg class for the visual element
  const gradientMap: Record<string, string> = {
    "bg-teal-100": "from-teal-400 via-teal-500 to-cyan-600",
    "bg-indigo-100": "from-indigo-400 via-indigo-500 to-purple-600",
    "bg-amber-100": "from-amber-400 via-orange-500 to-red-500",
    "bg-emerald-100": "from-emerald-400 via-teal-500 to-green-600",
    "bg-cyan-100": "from-cyan-400 via-blue-500 to-indigo-600",
    "bg-violet-100": "from-violet-400 via-purple-500 to-fuchsia-600",
  };

  const gradientClass =
    gradientMap[categoryConfig.iconBg] ?? "from-teal-400 to-cyan-600";

  return (
    <Link
      href={`/resources/${resource.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/10"
    >
      {/* Prestigious pinned badge - top right corner */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/90 via-amber-600/90 to-amber-700/90 px-2 py-0.5 shadow-sm shadow-amber-900/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-amber-900/30">
          <Pin className="h-2.5 w-2.5 rotate-45 text-white" />
          <span className="text-[8px] font-medium tracking-widest text-white uppercase">
            Pinned
          </span>
        </div>
      </div>

      {/* Featured article layout - horizontal split */}
      <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
        {/* Left: Visual element with gradient + icon */}
        <div className="relative overflow-hidden">
          {/* Gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}
          />

          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                                 radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Icon */}
          <div className="relative flex h-full min-h-[160px] items-center justify-center p-6">
            <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <div className="rounded-2xl bg-white/20 p-5 shadow-xl backdrop-blur-sm">
                <Icon className="h-12 w-12 text-white drop-shadow-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="relative flex flex-col justify-between p-6 lg:p-7">
          {/* Top section */}
          <div>
            {/* Category tag + read time */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] font-medium tracking-wider uppercase ${categoryConfig.tagBg} ${categoryConfig.tagText} shadow-sm`}
              >
                <Icon className="h-3.5 w-3.5" />
                {categoryLabel}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <Clock className="h-4 w-4" />
                {readTime} min read
              </span>
            </div>

            {/* Title - editorial sizing */}
            <h3 className="font-display mb-3 text-xl leading-tight font-medium tracking-tight text-slate-900 transition-colors group-hover:text-teal-900 lg:text-2xl">
              {resource.data.hero.title}
            </h3>

            {/* Description - more prominent */}
            <p className="mb-4 text-base leading-relaxed text-slate-600 lg:text-lg">
              {resource.data.cardDescription}
            </p>

            {/* Key stat (if available) - refined styling */}
            {firstStat && (
              <div
                className={`mb-4 inline-flex items-start gap-3 rounded-xl border-l-4 ${categoryConfig.accentBorder} bg-slate-50 px-4 py-2.5 shadow-sm`}
              >
                <TrendingUp
                  className={`mt-0.5 h-5 w-5 ${categoryConfig.accentText}`}
                />
                <div>
                  <div
                    className={`text-base font-semibold tabular-nums ${categoryConfig.accentText}`}
                  >
                    {firstStat.value}
                  </div>
                  <div className="text-sm text-slate-600">
                    {firstStat.label}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Arrow indicator - bottom right */}
          <div className="flex items-center justify-end pt-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-900 group-hover:shadow-lg">
              <ArrowRight className="h-4 w-4 text-slate-600 transition-colors duration-300 group-hover:text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface ViewAllLinkProps {
  totalCount: number;
  categoryLabel: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ViewAllLink({
  totalCount,
  categoryLabel,
  isExpanded,
  onToggle,
}: ViewAllLinkProps) {
  if (totalCount <= 1) return null;

  return (
    <button
      onClick={onToggle}
      className="group mt-8 flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-teal-600"
    >
      <span>
        {isExpanded
          ? "Show less"
          : `View all ${totalCount} ${categoryLabel} guides`}
      </span>
      <ChevronDown
        className={`h-4 w-4 transition-all group-hover:text-teal-600 ${
          isExpanded ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}
