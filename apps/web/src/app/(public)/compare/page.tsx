import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "~/components/marketing";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { comparisons } from "./data";
import { solutions } from "../solutions/data";

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

// Color map for competitor types
const typeColorMap: Record<string, string> = {
  "vet-specific": "text-teal-600",
  "general-receptionist": "text-violet-600",
  "general-ai": "text-blue-600",
};

const typeLabelMap: Record<string, string> = {
  "vet-specific": "Vet-Specific",
  "general-receptionist": "General Receptionist",
  "general-ai": "General AI",
};

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
      {/* Simple editorial header */}
      <header className="border-b border-slate-200 bg-white pt-32 pb-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xs font-semibold tracking-widest text-teal-600 uppercase">
            Compare
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why Clinics Are Switching to OdisAI
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-500">
            Detailed comparisons with the alternatives so you can make an
            informed decision for your veterinary practice.
          </p>
        </div>
      </header>

      {/* Quick Comparison Matrix */}
      <section className="border-b border-slate-100 bg-slate-50/30 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display mb-2 text-center text-xl font-bold text-slate-900">
            Quick Comparison Matrix
          </h2>
          <p className="mb-8 text-center text-sm text-slate-500">
            See how OdisAI compares across key features.
          </p>
          <BlurFade delay={0.1} inView>
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
          </BlurFade>
        </div>
      </section>

      {/* Comparison Cards Grid */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {comparisonEntries.map((comparison, index) => (
              <BlurFade key={comparison.slug} delay={index * 0.1} inView>
                <Link
                  href={`/compare/${comparison.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/10"
                >
                  {/* Category label */}
                  <span
                    className={cn(
                      "mb-3 text-xs font-medium",
                      typeColorMap[comparison.competitorType] ??
                        "text-slate-500",
                    )}
                  >
                    {typeLabelMap[comparison.competitorType] ?? "Competitor"}
                  </span>

                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    OdisAI vs {comparison.competitorName}
                  </h3>
                  <p className="mb-4 text-sm text-slate-600">
                    {comparison.cardDescription}
                  </p>

                  {/* Key advantage stats */}
                  {comparison.keyAdvantages.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      {comparison.keyAdvantages.slice(0, 3).map((adv) => (
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

                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 transition-colors group-hover:text-teal-700">
                    View comparison
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-link to Solutions */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display mb-2 text-center text-xl font-bold text-slate-900">
            Explore What OdisAI Can Do
          </h2>
          <p className="mb-8 text-center text-sm text-slate-500">
            Purpose-built AI solutions for every veterinary phone need.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {solutionEntries.map((solution, index) => (
              <BlurFade key={solution.slug} delay={index * 0.1} inView>
                <Link
                  href={`/solutions/${solution.slug}`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-teal-200 hover:shadow-md"
                >
                  <span className="mb-2 block text-xs font-medium text-teal-600">
                    {solution.hero.badge}
                  </span>
                  <h4 className="font-semibold text-slate-900 group-hover:text-teal-700">
                    {solution.hero.title}
                  </h4>
                  <p className="mt-2 text-sm text-slate-500">
                    {solution.cardDescription}
                  </p>
                </Link>
              </BlurFade>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/solutions"
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              View all solutions &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Soft CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl border border-slate-200 px-8 py-10 text-center">
            <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Join the Clinics That Already Made the Smart Choice
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500">
              Most clinics go live within 48 hours of signing up. See why
              practices are switching to OdisAI.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Book a Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-slate-500 transition-colors hover:text-teal-600"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
