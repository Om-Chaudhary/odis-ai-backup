import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight, GitCompare } from "lucide-react";
import { MarketingLayout } from "~/components/marketing";
import { cn } from "@odis-ai/shared/util";
import { comparisons } from "./data";
import { solutions } from "../solutions/data";
import { CompareHero } from "./compare-hero";

const contentNavigation = [
  { name: "Resources", href: "/resources" },
  { name: "Solutions", href: "/solutions" },
  { name: "Compare", href: "/compare" },
];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://odisai.net";

export const metadata: Metadata = {
  title:
    "Compare OdisAI vs Competitors | Veterinary Answering Service Alternatives",
  description:
    "Why clinics are switching to OdisAI. Compare OdisAI to GuardianVets, VetTriage, Smith.ai, Ruby Receptionists, and Dialzara for veterinary phone automation. See the difference.",
  keywords: [
    "veterinary answering service comparison",
    "guardianvets alternative",
    "vettriage competitor",
    "smith ai veterinary",
    "ruby receptionists vet",
    "dialzara alternative",
    "best vet answering service",
    "vet clinic phone automation comparison",
  ],
  alternates: { canonical: `${siteUrl}/compare` },
  openGraph: {
    title: "OdisAI vs Competitors | Veterinary Answering Comparison",
    description:
      "Why clinics are switching to OdisAI. Compare to GuardianVets, VetTriage, Smith.ai, Ruby, and Dialzara.",
    url: `${siteUrl}/compare`,
  },
};

const comparisonEntries = Object.entries(comparisons).map(([slug, data]) => ({
  slug,
  ...data,
}));

const solutionEntries = Object.entries(solutions)
  .slice(0, 3)
  .map(([slug, data]) => ({
    slug,
    ...data,
  }));

// Competitor type configuration — icon + color per type
const typeConfig: Record<
  string,
  {
    label: string;
    accentBorder: string;
    accentText: string;
    iconBg: string;
    tagBg: string;
    tagText: string;
  }
> = {
  "vet-specific": {
    label: "Vet-Specific",
    accentBorder: "border-l-teal-500",
    accentText: "text-teal-700",
    iconBg: "bg-teal-100",
    tagBg: "bg-teal-50",
    tagText: "text-teal-700",
  },
  "general-receptionist": {
    label: "General Receptionist",
    accentBorder: "border-l-violet-500",
    accentText: "text-violet-700",
    iconBg: "bg-violet-100",
    tagBg: "bg-violet-50",
    tagText: "text-violet-700",
  },
  "general-ai": {
    label: "General AI",
    accentBorder: "border-l-blue-500",
    accentText: "text-blue-700",
    iconBg: "bg-blue-100",
    tagBg: "bg-blue-50",
    tagText: "text-blue-700",
  },
};

const defaultConfig = {
  label: "Competitor",
  accentBorder: "border-l-slate-400",
  accentText: "text-slate-700",
  iconBg: "bg-slate-100",
  tagBg: "bg-slate-50",
  tagText: "text-slate-600",
};

// Competitor types for hero filter
const competitorTypes = [
  { id: "vet-specific", label: "Vet-Specific" },
  { id: "general-receptionist", label: "General Receptionist" },
  { id: "general-ai", label: "General AI" },
];

// Top 6 features for the quick comparison matrix
const matrixFeatures = [
  "24/7 Availability",
  "Appointment Booking",
  "PIMS Integration",
  "Emergency Triage",
  "Discharge Follow-Up Calls",
  "Flat Monthly Pricing",
];

export default function ComparePage() {
  return (
    <MarketingLayout
      navbar={{ variant: "solid", navigation: contentNavigation }}
      showScrollProgress
    >
      {/* HERO — DotPattern bg */}
      <CompareHero competitorTypes={competitorTypes} />

      {/* Quick Comparison Matrix */}
      <section className="scroll-mt-20 border-b border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          {/* Section header with colored left accent */}
          <div className="mb-10 flex items-start gap-4 border-l-4 border-l-violet-500 pl-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <GitCompare className="h-5 w-5 text-violet-700" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Quick Comparison Matrix
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                See how OdisAI compares across key features at a glance.
              </p>
            </div>
          </div>

          <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="sticky left-0 z-10 w-[180px] bg-slate-50 p-3 text-left text-xs font-semibold text-slate-900 sm:p-4 sm:text-sm">
                    Feature
                  </th>
                  <th className="w-[100px] bg-teal-50 p-3 text-center sm:p-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                        O
                      </span>
                      <span className="text-xs font-bold text-teal-700 sm:text-sm">
                        OdisAI
                      </span>
                    </div>
                  </th>
                  {comparisonEntries.map((c) => (
                    <th
                      key={c.slug}
                      className="w-[100px] bg-slate-50 p-3 text-center sm:p-4"
                    >
                      <span className="text-xs font-medium text-slate-500">
                        {c.competitorName}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixFeatures.map((feature, fi) => (
                  <tr
                    key={feature}
                    className={cn(
                      "border-b border-slate-100 last:border-b-0",
                      fi % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-inherit p-3 text-xs font-medium text-slate-700 sm:p-4 sm:text-sm">
                      {feature}
                    </td>
                    <td className="bg-teal-50/40 p-3 text-center sm:p-4">
                      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-teal-100">
                        <Check
                          className="h-4 w-4 text-teal-600"
                          strokeWidth={3}
                        />
                      </div>
                    </td>
                    {comparisonEntries.map((c) => {
                      const row = c.comparisonTable.find(
                        (r) => r.feature === feature,
                      );
                      const val = row?.competitor ?? false;
                      return (
                        <td key={c.slug} className="p-3 text-center sm:p-4">
                          {typeof val === "boolean" ? (
                            val ? (
                              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-teal-50">
                                <Check
                                  className="h-4 w-4 text-teal-500"
                                  strokeWidth={2.5}
                                />
                              </div>
                            ) : (
                              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                                <X
                                  className="h-3.5 w-3.5 text-slate-400"
                                  strokeWidth={2.5}
                                />
                              </div>
                            )
                          ) : (
                            <span className="text-xs font-medium text-slate-500">
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Comparison Cards Grid */}
      <section className="scroll-mt-20 border-b border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {comparisonEntries.map((comparison) => {
              const config =
                typeConfig[comparison.competitorType] ?? defaultConfig;

              return (
                <Link
                  key={comparison.slug}
                  href={`/compare/${comparison.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/8"
                >
                  {/* Colored top accent bar */}
                  <div className={`h-1 w-full ${config.iconBg}`} />

                  <div className="flex flex-1 flex-col p-6">
                    {/* Category tag */}
                    <div className="mb-4 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${config.tagBg} ${config.tagText}`}
                      >
                        <GitCompare className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>

                    <h3 className="font-display mb-2 line-clamp-2 text-lg leading-snug font-semibold text-slate-900">
                      OdisAI vs {comparison.competitorName}
                    </h3>
                    <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                      {comparison.cardDescription}
                    </p>

                    {/* Key advantage stats */}
                    {comparison.keyAdvantages.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {comparison.keyAdvantages.slice(0, 2).map((adv) => (
                          <span
                            key={adv.label}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs"
                          >
                            <span className="font-semibold text-teal-600">
                              {adv.value}
                            </span>{" "}
                            {adv.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-teal-600 transition-colors group-hover:text-teal-700">
                      View comparison
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cross-link to Solutions */}
      <section className="scroll-mt-20 border-b border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 text-center">
            <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Explore What OdisAI Can Do
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Purpose-built AI solutions for every veterinary phone need.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {solutionEntries.map((solution) => (
              <Link
                key={solution.slug}
                href={`/solutions/${solution.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-teal-200 hover:shadow-md"
              >
                <span className="mb-2 block text-xs font-medium text-teal-600">
                  {solution.hero.badge}
                </span>
                <h4 className="font-semibold text-slate-900 transition-colors group-hover:text-teal-700">
                  {solution.hero.title}
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  {solution.cardDescription}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/solutions"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              View all solutions
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA — teal gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Join the Clinics That Already Made the Smart Choice
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-teal-100/70">
            Most clinics go live within 48 hours. See why practices are
            switching to OdisAI.
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
              href="/solutions"
              className="text-sm font-medium text-teal-200 transition-colors hover:text-white"
            >
              View Solutions
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
