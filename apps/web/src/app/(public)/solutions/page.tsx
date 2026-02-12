import type { Metadata } from "next";
import Link from "next/link";
import {
  Circle,
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
} from "lucide-react";
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
import { NumberTicker } from "~/components/landing/ui/number-ticker";
import { solutions } from "./data";
import { comparisons } from "../compare/data";

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
  Circle,
};

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
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* Hero — Updated copy */}
      <PageHero
        badge="Solutions"
        title="Stop Losing Revenue to Missed Calls"
        subtitle="From 24/7 answering to post-discharge follow-ups, OdisAI handles every call so your team can focus on patients."
        backgroundVariant="hero-glow"
      />

      {/* Social Proof Bar */}
      <SocialProofBar />

      {/* Featured Solution — Full-width card */}
      {featured && (
        <SectionContainer
          id="featured"
          backgroundVariant="cool-blue"
          padding="default"
        >
          <BlurFade delay={0.1} inView>
            <Link
              href={`/solutions/${featured.slug}`}
              className="group block overflow-hidden rounded-2xl border border-teal-200/60 bg-white shadow-lg shadow-teal-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/15"
            >
              <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-2">
                <div>
                  <Badge
                    variant="secondary"
                    className="mb-4 bg-teal-50 text-teal-700"
                  >
                    {featured.hero.badge}
                  </Badge>
                  <h2 className="font-display mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                    {featured.hero.title}
                  </h2>
                  <p className="mb-6 text-slate-600">
                    {featured.cardDescription}
                  </p>
                  {featured.metrics.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {featured.metrics.slice(0, 3).map((metric) => (
                        <Badge
                          key={metric.label}
                          variant="outline"
                          className="px-3 py-1.5"
                        >
                          <span className="font-semibold text-teal-600">
                            {metric.value}
                          </span>{" "}
                          {metric.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-6 text-sm font-semibold text-teal-600 group-hover:text-teal-700">
                    Learn more &rarr;
                  </div>
                </div>
                <div className="hidden items-center justify-center lg:flex">
                  <div className="flex h-48 w-full items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-teal-600">
                        <NumberTicker value={98} />%
                      </div>
                      <p className="mt-2 text-sm font-medium text-teal-700">
                        Call Answer Rate
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </BlurFade>
        </SectionContainer>
      )}

      {/* Solutions Grid — Remaining solutions */}
      <SectionContainer
        id="solutions-grid"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader
          badge="All Solutions"
          title="Purpose-Built for Veterinary Clinics"
          align="center"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {remaining.map((solution, index) => {
            const Icon = getLucideIcon(solution.iconName);
            return (
              <BlurFade key={solution.slug} delay={index * 0.1} inView>
                <Link
                  href={`/solutions/${solution.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/10"
                >
                  {/* Icon + Badge */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100">
                      <Icon className="h-6 w-6 text-teal-600" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-teal-50 text-teal-700"
                    >
                      {solution.hero.badge}
                    </Badge>
                  </div>

                  <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                    {solution.hero.title}
                  </h3>
                  <p className="mb-4 text-sm text-slate-600">
                    {solution.cardDescription}
                  </p>

                  {/* Mini metrics */}
                  {solution.metrics.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      {solution.metrics.slice(0, 3).map((metric) => (
                        <Badge
                          key={metric.label}
                          variant="outline"
                          className="text-xs"
                        >
                          {metric.value} {metric.label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 text-sm font-medium text-teal-600 group-hover:text-teal-700">
                    Learn more &rarr;
                  </div>
                </Link>
              </BlurFade>
            );
          })}
        </div>
      </SectionContainer>

      {/* Cross-link to Compare */}
      <SectionContainer
        id="compare-crosslink"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Not Sure?"
          title="See How We Compare"
          subtitle="Detailed side-by-side comparisons with the alternatives."
          align="center"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comparisonEntries.slice(0, 3).map((comparison, index) => (
            <BlurFade key={comparison.slug} delay={index * 0.1} inView>
              <Link
                href={`/compare/${comparison.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-teal-200 hover:shadow-md"
              >
                <p className="mb-1 text-xs font-medium text-slate-400">
                  Comparison
                </p>
                <h4 className="font-semibold text-slate-900 group-hover:text-teal-700">
                  OdisAI vs {comparison.competitorName}
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  {comparison.cardDescription}
                </p>
              </Link>
            </BlurFade>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/compare"
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View all comparisons &rarr;
          </Link>
        </div>
      </SectionContainer>

      {/* CTA */}
      <CTASection
        badge="Get Started"
        title="Every Hour Without OdisAI Is Revenue Walking Out the Door"
        subtitle="See how OdisAI handles calls for clinics like yours."
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
