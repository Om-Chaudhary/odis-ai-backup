import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MarketingLayout,
  AccordionFAQ,
  TestimonialCard,
  CrossLinkSection,
  HowItWorksSection,
  BentoFeatureGrid,
  AnimatedMetricsSection,
  type CrossLinkItem,
} from "~/components/marketing";
import { AlertTriangle, Check, ArrowRight } from "lucide-react";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { solutions, solutionSlugs } from "../data";

const contentNavigation = [
  { name: "Resources", href: "/resources" },
  { name: "Solutions", href: "/solutions" },
  { name: "Compare", href: "/compare" },
];

export function generateStaticParams() {
  return solutionSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = solutions[slug];

  if (!data) {
    return { title: "Solution Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://odisai.net";

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: { canonical: `${siteUrl}/solutions/${slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `${siteUrl}/solutions/${slug}`,
    },
  };
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = solutions[slug];

  if (!data) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // JSON-LD: Service schema with AggregateRating
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: data.hero.title,
    description: data.metaDescription,
    provider: {
      "@type": "Organization",
      name: "OdisAI",
      url: siteUrl,
    },
    serviceType: "Veterinary AI Voice Agent",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "50",
      bestRating: "5",
    },
  };

  // JSON-LD: FAQPage schema
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Solutions",
        item: `${siteUrl}/solutions`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.hero.title,
        item: `${siteUrl}/solutions/${slug}`,
      },
    ],
  };

  // Build cross-link items
  const crossLinks: CrossLinkItem[] = [
    ...data.relatedSolutions.map((s) => ({
      slug: s.slug,
      label: s.label,
      description: s.description,
      type: "solution" as const,
    })),
    ...data.relatedComparisons.map((c) => ({
      slug: c.slug,
      label: c.label,
      type: "comparison" as const,
    })),
  ];

  return (
    <MarketingLayout
      navbar={{ variant: "solid", navigation: contentNavigation }}
      showScrollProgress
    >
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            serviceJsonLd,
            faqJsonLd,
            breadcrumbJsonLd,
          ]).replace(/</g, "\\u003c"),
        }}
      />

      {/* Simple article header — white bg with breadcrumbs */}
      <header className="border-b border-slate-200 bg-white pt-32 pb-10">
        <div className="mx-auto max-w-5xl px-6">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-600">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/solutions"
              className="transition-colors hover:text-slate-600"
            >
              Solutions
            </Link>
            <span>/</span>
            <span className="text-slate-600">{data.hero.badge}</span>
          </nav>

          <p className="text-xs font-semibold tracking-widest text-teal-600 uppercase">
            {data.hero.badge}
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {data.hero.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-500">
            {data.hero.subtitle}
          </p>
          {data.heroStat && (
            <p className="mt-4 text-sm font-semibold text-teal-600">
              {data.heroStat.value} {data.heroStat.label}
            </p>
          )}
        </div>
      </header>

      {/* Problem Section — 2 col layout */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                The Problem
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold text-slate-900">
                {data.problem.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                {data.problem.description}
              </p>
            </div>

            <div className="space-y-4">
              {data.problem.painPoints.map((point, index) => (
                <BlurFade key={point} delay={index * 0.1} inView>
                  <div className="flex items-start gap-4 rounded-xl border border-amber-200/60 bg-amber-50/80 p-5">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                    <span className="text-slate-700">{point}</span>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution + How It Works */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-semibold tracking-widest text-teal-600 uppercase">
            The Solution
          </p>
          <h2 className="font-display mt-2 text-center text-2xl font-bold text-slate-900">
            {data.solution.title}
          </h2>
          <div className="mx-auto mt-6 max-w-3xl">
            <p className="text-center text-lg leading-relaxed text-slate-600">
              {data.solution.description}
            </p>
          </div>

          {data.howItWorks.length > 0 && (
            <div className="mt-16">
              <h3 className="font-display mb-10 text-center text-xl font-semibold text-slate-900 sm:text-2xl">
                How It Works
              </h3>
              <HowItWorksSection steps={data.howItWorks} />
            </div>
          )}
        </div>
      </section>

      {/* Bento Feature Grid */}
      <section className="border-b border-slate-100 bg-slate-50/50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-semibold tracking-widest text-teal-600 uppercase">
            Features
          </p>
          <h2 className="font-display mt-2 text-center text-2xl font-bold text-slate-900">
            What You Get
          </h2>
          <div className="mt-12">
            <BentoFeatureGrid features={data.features} />
          </div>
        </div>
      </section>

      {/* Animated Metrics */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-semibold tracking-widest text-slate-400 uppercase">
            By the Numbers
          </p>
          <h2 className="font-display mt-2 text-center text-2xl font-bold text-slate-900">
            Real Results
          </h2>
          <div className="mt-12">
            <AnimatedMetricsSection metrics={data.metrics} />
          </div>
        </div>
      </section>

      {/* Benefits — 2-col grid */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display mb-8 text-center text-2xl font-bold text-slate-900">
            Why Clinics Choose OdisAI
          </h2>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {data.benefits.map((benefit, index) => (
              <BlurFade key={benefit} delay={index * 0.08} inView>
                <div className="flex items-start gap-3 rounded-lg border-l-4 border-teal-500 bg-white p-4">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" />
                  <span className="text-slate-700">{benefit}</span>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-b border-slate-100 bg-slate-50/50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <TestimonialCard
            quote={data.socialProof.quote}
            attribution={data.socialProof.attribution}
            proofLine={data.socialProof.proofLine}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display mb-8 text-center text-xl font-bold text-slate-900 sm:text-2xl">
            Common Questions
          </h2>
          <AccordionFAQ faqs={data.faqs} />
        </div>
      </section>

      {/* Migration/ROI Section (conditional) */}
      {data.migrationSupport && (
        <section className="border-b border-slate-100 bg-white py-12">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-center text-xs font-semibold tracking-widest text-teal-600 uppercase">
              Migration
            </p>
            <h2 className="font-display mt-2 text-center text-2xl font-bold text-slate-900">
              {data.migrationSupport.title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">
              {data.migrationSupport.description}
            </p>
            <div className="mx-auto mt-8 max-w-2xl space-y-4">
              {data.migrationSupport.steps.map((step, index) => (
                <BlurFade key={step} delay={index * 0.1} inView>
                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-slate-700">{step}</p>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cross-Links */}
      {crossLinks.length > 0 && (
        <section className="border-b border-slate-100 bg-white py-8">
          <div className="mx-auto max-w-5xl px-6">
            <CrossLinkSection title="Explore More" links={crossLinks} />
          </div>
        </section>
      )}

      {/* Soft CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl border border-slate-200 px-8 py-10 text-center">
            <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              {data.cta.title}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500">
              {data.cta.subtitle}
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
            {data.cta.urgencyLine && (
              <p className="mt-4 text-xs text-slate-400">
                {data.cta.urgencyLine}
              </p>
            )}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
