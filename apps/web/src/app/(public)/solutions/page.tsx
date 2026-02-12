import type { Metadata } from "next";
import Link from "next/link";
import {
  Circle,
  ArrowRight,
  Phone,
  Clock,
  Heart,
  Bot,
  Moon,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  Plug,
  PhoneCall,
  BarChart3,
  PhoneForwarded,
  PhoneIncoming,
  Stethoscope,
  Siren,
  Users,
  Zap,
  MessageSquare,
  AlertTriangle,
  Headset,
  Workflow,
  GitCompare,
} from "lucide-react";
import { MarketingLayout } from "~/components/marketing";
import { solutions } from "./data";
import { comparisons } from "../compare/data";
import { SolutionsHero } from "./solutions-hero";

const contentNavigation = [
  { name: "Resources", href: "/resources" },
  { name: "Solutions", href: "/solutions" },
  { name: "Compare", href: "/compare" },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  Clock,
  Heart,
  Bot,
  Moon,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  Plug,
  PhoneCall,
  BarChart3,
  PhoneForwarded,
  PhoneIncoming,
  Stethoscope,
  Siren,
  Users,
  Zap,
  MessageSquare,
  AlertTriangle,
  Headset,
  Workflow,
  Circle,
};

// Solution categories for hero filter
const solutionCategories = [
  { id: "24-7", label: "24/7 Coverage" },
  { id: "after-hours", label: "After Hours" },
  { id: "follow-up", label: "Follow-Up Calls" },
  { id: "reception", label: "AI Reception" },
];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://odisai.net";

export const metadata: Metadata = {
  title: "Veterinary AI Solutions | Phone Automation for Vet Clinics | OdisAI",
  description:
    "Stop losing revenue to missed calls. OdisAI's veterinary AI solutions handle 24/7 answering, after-hours coverage, discharge follow-ups, emergency triage, and AI reception. See a demo.",
  keywords: [
    "veterinary answering service",
    "vet clinic AI solutions",
    "veterinary phone automation",
    "AI veterinary receptionist",
    "veterinary discharge follow up",
    "emergency vet call center",
    "vet clinic phone service",
    "animal hospital answering service",
  ],
  alternates: { canonical: `${siteUrl}/solutions` },
  openGraph: {
    title: "OdisAI Solutions | AI Voice Agents for Veterinary Clinics",
    description:
      "Stop losing revenue to missed calls. 24/7 answering, after-hours coverage, discharge follow-ups, emergency triage, and AI reception.",
    url: `${siteUrl}/solutions`,
  },
};

const solutionEntries = Object.entries(solutions).map(([slug, data]) => ({
  slug,
  ...data,
}));

const comparisonEntries = Object.entries(comparisons).map(([slug, data]) => ({
  slug,
  ...data,
}));

function getLucideIcon(name: string) {
  return iconMap[name] ?? Circle;
}

export default function SolutionsPage() {
  const [featured, ...remaining] = solutionEntries;

  return (
    <MarketingLayout
      navbar={{ variant: "solid", navigation: contentNavigation }}
      showScrollProgress
    >
      {/* HERO — DotPattern bg */}
      <SolutionsHero solutionCategories={solutionCategories} />

      {/* Featured Solution — full-width card */}
      {featured && (
        <section className="scroll-mt-20 border-b border-slate-100 bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            {/* Section header with colored left accent */}
            <div className="mb-10 flex items-start gap-4 border-l-4 border-l-cyan-500 pl-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100">
                <Zap className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Featured Solution
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                  Our most popular AI solution for veterinary practices.
                </p>
              </div>
            </div>

            <Link
              href={`/solutions/${featured.slug}`}
              className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/8"
            >
              {/* Colored top accent bar */}
              <div className="h-1 w-full bg-cyan-100" />

              <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-2">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                    <Zap className="h-3 w-3" />
                    {featured.hero.badge}
                  </span>
                  <h3 className="font-display mt-4 mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                    {featured.hero.title}
                  </h3>
                  <p className="mb-6 leading-relaxed text-slate-600">
                    {featured.cardDescription}
                  </p>
                  {featured.metrics.length > 0 && (
                    <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                      {featured.metrics.slice(0, 3).map((metric) => (
                        <span
                          key={metric.label}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                        >
                          <span className="font-semibold text-teal-600">
                            {metric.value}
                          </span>{" "}
                          {metric.label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 transition-colors group-hover:text-teal-700">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
                <div className="hidden items-center justify-center lg:flex">
                  <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-50/5">
                    <div className="text-center">
                      <div className="font-display text-5xl font-bold text-teal-600">
                        98%
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Call Answer Rate
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Solutions Grid */}
      <section className="scroll-mt-20 border-b border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {remaining.map((solution) => {
              const Icon = getLucideIcon(solution.iconName);
              return (
                <Link
                  key={solution.slug}
                  href={`/solutions/${solution.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/8"
                >
                  {/* Colored top accent bar */}
                  <div className="h-1 w-full bg-teal-100" />

                  <div className="flex flex-1 flex-col p-6">
                    {/* Icon + badge */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                        <Icon className="h-5 w-5 text-teal-600" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                        {solution.hero.badge}
                      </span>
                    </div>

                    <h3 className="font-display mb-2 line-clamp-2 text-lg leading-snug font-semibold text-slate-900">
                      {solution.hero.title}
                    </h3>
                    <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                      {solution.cardDescription}
                    </p>

                    {solution.metrics.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {solution.metrics.slice(0, 2).map((metric) => (
                          <span
                            key={metric.label}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs"
                          >
                            {metric.value} {metric.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-teal-600 transition-colors group-hover:text-teal-700">
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cross-link to Compare */}
      <section className="scroll-mt-20 border-b border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 text-center">
            <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              See How We Compare
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Detailed side-by-side comparisons with the alternatives.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comparisonEntries.slice(0, 3).map((comparison) => (
              <Link
                key={comparison.slug}
                href={`/compare/${comparison.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-teal-200 hover:shadow-md"
              >
                <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                  <GitCompare className="h-3 w-3" />
                  Comparison
                </span>
                <h4 className="mt-2 font-semibold text-slate-900 transition-colors group-hover:text-teal-700">
                  OdisAI vs {comparison.competitorName}
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  {comparison.cardDescription}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              View all comparisons
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA — teal gradient */}
      <section className="relative overflow-hidden bg-linear-to-br from-teal-900 via-teal-800 to-teal-900 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Every Hour Without OdisAI Is Revenue Walking Out the Door
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-teal-100/70">
            Most clinics go live within 48 hours. See how OdisAI handles calls
            for clinics like yours.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Book a Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compare"
              className="text-sm font-medium text-teal-200 transition-colors hover:text-white"
            >
              View Comparisons
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
