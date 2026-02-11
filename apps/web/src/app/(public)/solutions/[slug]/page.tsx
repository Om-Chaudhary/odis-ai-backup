import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
  SocialProofBar,
  AccordionFAQ,
  TestimonialCard,
  CrossLinkSection,
  HowItWorksSection,
  BentoFeatureGrid,
  AnimatedMetricsSection,
  type CrossLinkItem,
} from "~/components/marketing";
import { AlertTriangle, Check } from "lucide-react";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { Badge } from "@odis-ai/shared/ui/badge";
import { solutions, solutionSlugs } from "../data";

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

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: { canonical: `/solutions/${slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `/solutions/${slug}`,
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
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
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

      {/* Hero with breadcrumbs */}
      <PageHero
        badge={data.hero.badge}
        title={data.hero.title}
        subtitle={data.hero.subtitle}
        backgroundVariant="hero-glow"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Solutions", href: "/solutions" },
          { label: data.hero.badge, href: `/solutions/${slug}` },
        ]}
      >
        {data.heroStat && (
          <Badge
            variant="secondary"
            className="bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700"
          >
            {data.heroStat.value} {data.heroStat.label}
          </Badge>
        )}
      </PageHero>

      {/* Social Proof Bar */}
      <SocialProofBar />

      {/* Problem Section — 2 col layout */}
      <SectionContainer
        id="problem"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <SectionHeader
                badge="The Problem"
                badgeVariant="slate"
                title={data.problem.title}
                align="left"
              />
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
      </SectionContainer>

      {/* Solution + How It Works (merged) */}
      <SectionContainer
        id="solution"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="The Solution"
          badgeVariant="teal"
          title={data.solution.title}
          align="center"
        />
        <div className="mx-auto mt-8 max-w-3xl">
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
      </SectionContainer>

      {/* Bento Feature Grid */}
      <SectionContainer
        id="features"
        backgroundVariant="warm-violet"
        padding="default"
      >
        <SectionHeader
          badge="Features"
          badgeVariant="violet"
          title="What You Get"
          align="center"
        />
        <div className="mt-12">
          <BentoFeatureGrid features={data.features} />
        </div>
      </SectionContainer>

      {/* Animated Metrics */}
      <SectionContainer
        id="metrics"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="By the Numbers"
          title="Real Results"
          align="center"
        />
        <div className="mt-12">
          <AnimatedMetricsSection metrics={data.metrics} />
        </div>
      </SectionContainer>

      {/* Benefits — 2-col grid with teal left border */}
      <SectionContainer
        id="benefits"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader
          badge="Benefits"
          title="Why Clinics Choose OdisAI"
          align="center"
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {data.benefits.map((benefit, index) => (
            <BlurFade key={benefit} delay={index * 0.08} inView>
              <div className="flex items-start gap-3 rounded-lg border-l-4 border-teal-500 bg-white p-4">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" />
                <span className="text-slate-700">{benefit}</span>
              </div>
            </BlurFade>
          ))}
        </div>
      </SectionContainer>

      {/* Testimonial */}
      <SectionContainer
        id="testimonial"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <TestimonialCard
          quote={data.socialProof.quote}
          attribution={data.socialProof.attribution}
          proofLine={data.socialProof.proofLine}
        />
      </SectionContainer>

      {/* FAQ — Accordion */}
      <SectionContainer
        id="faq"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader badge="FAQ" title="Common Questions" align="center" />
        <div className="mx-auto mt-12 max-w-3xl">
          <AccordionFAQ faqs={data.faqs} />
        </div>
      </SectionContainer>

      {/* Migration/ROI Section (conditional) */}
      {data.migrationSupport && (
        <SectionContainer
          id="migration"
          backgroundVariant="cool-blue"
          padding="default"
        >
          <SectionHeader
            badge="Migration"
            badgeVariant="teal"
            title={data.migrationSupport.title}
            subtitle={data.migrationSupport.description}
            align="center"
          />
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
        </SectionContainer>
      )}

      {/* Cross-Links */}
      <SectionContainer
        id="related"
        backgroundVariant="cool-blue"
        padding="small"
      >
        <CrossLinkSection title="Explore More" links={crossLinks} />
      </SectionContainer>

      {/* CTA */}
      <CTASection
        badge={data.cta.badge ?? "Get Started"}
        title={data.cta.title}
        subtitle={data.cta.subtitle}
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
        urgencyLine={data.cta.urgencyLine}
        useShimmerButton
      />
    </MarketingLayout>
  );
}
