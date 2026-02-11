import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
  SocialProofBar,
} from "~/components/marketing";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { comparisons } from "./data";
import { solutions } from "../solutions/data";

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
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "OdisAI vs Competitors | Veterinary Answering Comparison",
    description:
      "Why clinics are switching to OdisAI. Compare to GuardianVets, VetTriage, Smith.ai, Ruby, and Dialzara.",
    url: "/compare",
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
  "vet-specific": "bg-teal-50 text-teal-700",
  "general-receptionist": "bg-violet-50 text-violet-700",
  "general-ai": "bg-blue-50 text-blue-700",
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
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* Hero — Updated copy */}
      <PageHero
        badge="Compare"
        title="Why Clinics Are Switching to OdisAI"
        subtitle="Detailed comparisons with the alternatives so you can make an informed decision for your veterinary practice."
        backgroundVariant="hero-glow"
      />

      {/* Social Proof Bar */}
      <SocialProofBar switchedText="30+ clinics switched this month" />

      {/* Comparison Cards Grid */}
      <SectionContainer
        id="comparisons-grid"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Head-to-Head"
          title="Detailed Comparisons"
          align="center"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {comparisonEntries.map((comparison, index) => (
            <BlurFade key={comparison.slug} delay={index * 0.1} inView>
              <Link
                href={`/compare/${comparison.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/10"
              >
                {/* Category badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "mb-3 w-fit",
                    typeColorMap[comparison.competitorType] ??
                      "bg-slate-50 text-slate-700",
                  )}
                >
                  {typeLabelMap[comparison.competitorType] ?? "Competitor"}
                </Badge>

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
                      <Badge
                        key={adv.label}
                        variant="outline"
                        className="text-xs"
                      >
                        <span className="font-semibold text-teal-600">
                          {adv.value}
                        </span>{" "}
                        {adv.label}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 text-sm font-medium text-teal-600 group-hover:text-teal-700">
                  View comparison &rarr;
                </div>
              </Link>
            </BlurFade>
          ))}
        </div>
      </SectionContainer>

      {/* Quick Comparison Matrix */}
      <SectionContainer
        id="comparison-matrix"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader
          badge="At a Glance"
          title="Quick Comparison Matrix"
          subtitle="See how OdisAI compares across key features."
          align="center"
        />
        <BlurFade delay={0.1} inView>
          <div className="mx-auto mt-12 max-w-5xl overflow-x-auto">
            <table className="w-full min-w-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 text-left text-sm font-semibold text-slate-900">
                    Feature
                  </th>
                  <th className="border-l-2 border-teal-500 bg-teal-50/50 p-4 text-center text-sm font-semibold text-teal-700">
                    OdisAI
                  </th>
                  {comparisonEntries.map((c) => (
                    <th
                      key={c.slug}
                      className="p-4 text-center text-sm font-semibold text-slate-500"
                    >
                      {c.competitorName}
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
                      fi % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                    )}
                  >
                    <td className="p-4 text-sm font-medium text-slate-700">
                      {feature}
                    </td>
                    <td className="bg-teal-50/20 p-4 text-center">
                      <Check className="mx-auto h-5 w-5 text-teal-500" />
                    </td>
                    {comparisonEntries.map((c) => {
                      const row = c.comparisonTable.find(
                        (r) => r.feature === feature,
                      );
                      const val = row?.competitor ?? false;
                      return (
                        <td key={c.slug} className="p-4 text-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="mx-auto h-5 w-5 text-teal-500" />
                            ) : (
                              <X className="mx-auto h-5 w-5 text-slate-300" />
                            )
                          ) : (
                            <span className="text-xs text-slate-500">
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
      </SectionContainer>

      {/* Cross-link to Solutions */}
      <SectionContainer
        id="solutions-crosslink"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Solutions"
          title="Explore What OdisAI Can Do"
          subtitle="Purpose-built AI solutions for every veterinary phone need."
          align="center"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solutionEntries.map((solution, index) => (
            <BlurFade key={solution.slug} delay={index * 0.1} inView>
              <Link
                href={`/solutions/${solution.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-teal-200 hover:shadow-md"
              >
                <Badge
                  variant="secondary"
                  className="mb-2 bg-teal-50 text-teal-700"
                >
                  {solution.hero.badge}
                </Badge>
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
      </SectionContainer>

      {/* CTA */}
      <CTASection
        badge="Make the Switch"
        title="Join the Clinics That Already Made the Smart Choice"
        subtitle="See why practices are switching to OdisAI for their phone automation."
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
        urgencyLine="Most clinics go live within 48 hours of signing up"
        useShimmerButton
      />
    </MarketingLayout>
  );
}
