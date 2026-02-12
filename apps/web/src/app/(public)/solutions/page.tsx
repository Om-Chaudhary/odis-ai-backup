import type { Metadata } from "next";
import Link from "next/link";
import { Circle, ArrowRight } from "lucide-react";
import {
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
} from "lucide-react";
import { MarketingLayout } from "~/components/marketing";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { solutions } from "./data";
import { comparisons } from "../compare/data";

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
      {/* Simple editorial header */}
      <header className="border-b border-slate-200 bg-white pt-32 pb-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xs font-semibold tracking-widest text-teal-600 uppercase">
            Solutions
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Stop Losing Revenue to Missed Calls
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-500">
            From 24/7 answering to post-discharge follow-ups, OdisAI handles
            every call so your team can focus on patients.
          </p>
        </div>
      </header>

      {/* Featured Solution — full-width card */}
      {featured && (
        <section className="border-b border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-5xl px-6">
            <BlurFade delay={0.1} inView>
              <Link
                href={`/solutions/${featured.slug}`}
                className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/10"
              >
                <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-2">
                  <div>
                    <span className="text-xs font-medium text-teal-600">
                      {featured.hero.badge}
                    </span>
                    <h2 className="font-display mt-3 mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                      {featured.hero.title}
                    </h2>
                    <p className="mb-6 text-slate-600">
                      {featured.cardDescription}
                    </p>
                    {featured.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-3">
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
                    <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-50">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-teal-600">
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
            </BlurFade>
          </div>
        </section>
      )}

      {/* Solutions Grid */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {remaining.map((solution, index) => {
              const Icon = getLucideIcon(solution.iconName);
              return (
                <BlurFade key={solution.slug} delay={index * 0.1} inView>
                  <Link
                    href={`/solutions/${solution.slug}`}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/10"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                        <Icon className="h-5 w-5 text-teal-600" />
                      </div>
                      <span className="text-xs font-medium text-teal-600">
                        {solution.hero.badge}
                      </span>
                    </div>

                    <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
                      {solution.hero.title}
                    </h3>
                    <p className="mb-4 text-sm text-slate-600">
                      {solution.cardDescription}
                    </p>

                    {solution.metrics.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {solution.metrics.slice(0, 3).map((metric) => (
                          <span
                            key={metric.label}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs"
                          >
                            {metric.value} {metric.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 transition-colors group-hover:text-teal-700">
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </BlurFade>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cross-link to Compare */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display mb-2 text-center text-xl font-bold text-slate-900">
            See How We Compare
          </h2>
          <p className="mb-8 text-center text-sm text-slate-500">
            Detailed side-by-side comparisons with the alternatives.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>

      {/* Soft CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl border border-slate-200 px-8 py-10 text-center">
            <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Every Hour Without OdisAI Is Revenue Walking Out the Door
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500">
              Most clinics go live within 48 hours of signing up. See how OdisAI
              handles calls for clinics like yours.
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
