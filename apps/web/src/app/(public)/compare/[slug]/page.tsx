import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
  KeyAdvantagesBar,
  VerdictSection,
  AccordionFAQ,
  TestimonialCard,
  CrossLinkSection,
  SwitchingGuideSection,
  type CrossLinkItem,
} from "~/components/marketing";
import { Check, X } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@odis-ai/shared/ui/tabs";
import { comparisons, comparisonSlugs } from "../data";

export function generateStaticParams() {
  return comparisonSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = comparisons[slug];

  if (!data) {
    return { title: "Comparison Not Found" };
  }

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: { canonical: `/compare/${slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `/compare/${slug}`,
    },
  };
}

function ComparisonValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-teal-500" />
    ) : (
      <X className="h-5 w-5 text-slate-300" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = comparisons[slug];

  if (!data) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // JSON-LD: FAQPage
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
        name: "Compare",
        item: `${siteUrl}/compare`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `OdisAI vs ${data.competitorName}`,
        item: `${siteUrl}/compare/${slug}`,
      },
    ],
  };

  // Count OdisAI wins in comparison table
  const odisWins = data.comparisonTable.filter(
    (row) =>
      (typeof row.odis === "boolean" && row.odis && !row.competitor) ||
      (typeof row.odis === "string" &&
        typeof row.competitor === "string" &&
        row.odis !== row.competitor),
  ).length;

  // Build cross-link items
  const crossLinks: CrossLinkItem[] = [
    ...data.relatedSolutions.map((s) => ({
      slug: s.slug,
      label: s.label,
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
          __html: JSON.stringify([faqJsonLd, breadcrumbJsonLd]).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      {/* Hero with breadcrumbs + emotional headline */}
      <PageHero
        badge={data.hero.badge}
        title={data.hero.title}
        subtitle={data.hero.subtitle}
        backgroundVariant="hero-glow"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Compare", href: "/compare" },
          {
            label: `vs ${data.competitorName}`,
            href: `/compare/${slug}`,
          },
        ]}
      >
        <p className="text-lg font-medium text-teal-700 italic">
          {data.hero.headline}
        </p>
      </PageHero>

      {/* Key Advantages Bar */}
      <KeyAdvantagesBar advantages={data.keyAdvantages} />

      {/* Verdict Section (placed early for conversion) */}
      <SectionContainer
        id="verdict"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Our Verdict"
          badgeVariant="teal"
          title={`OdisAI vs ${data.competitorName}: The Bottom Line`}
          align="center"
        />
        <div className="mx-auto mt-12 max-w-4xl">
          <VerdictSection
            summary={data.verdict.summary}
            bestForOdis={data.verdict.bestForOdis}
            bestForCompetitor={data.verdict.bestForCompetitor}
            competitorName={data.competitorName}
          />
        </div>
      </SectionContainer>

      {/* Comparison Table (enhanced) */}
      <SectionContainer
        id="comparison-table"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader
          badge="Feature Comparison"
          title={`OdisAI vs ${data.competitorName}`}
          align="center"
        />
        <BlurFade delay={0.1} inView>
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
              <div className="p-4 text-sm font-semibold text-slate-900">
                Feature
              </div>
              <div className="border-l-2 border-teal-500 bg-teal-50/50 p-4 text-center text-sm font-semibold text-teal-700">
                OdisAI
              </div>
              <div className="p-4 text-center text-sm font-semibold text-slate-500">
                {data.competitorName}
              </div>
            </div>
            {/* Data rows */}
            {data.comparisonTable.map((row, i) => {
              const odisWinsRow =
                (typeof row.odis === "boolean" &&
                  row.odis &&
                  !row.competitor) ||
                (typeof row.odis === "string" &&
                  typeof row.competitor === "string" &&
                  row.odis !== row.competitor);

              return (
                <div
                  key={row.feature}
                  className={cn(
                    "grid grid-cols-3 border-b border-slate-100 last:border-b-0",
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                  )}
                >
                  <div className="p-4 text-sm font-medium text-slate-700">
                    {row.feature}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center p-4",
                      odisWinsRow && "bg-teal-50/30",
                    )}
                  >
                    <span
                      className={
                        typeof row.odis === "string"
                          ? "font-medium text-teal-700"
                          : ""
                      }
                    >
                      <ComparisonValue value={row.odis} />
                    </span>
                  </div>
                  <div className="flex items-center justify-center p-4">
                    <span
                      className={
                        typeof row.competitor === "string"
                          ? "text-slate-500"
                          : ""
                      }
                    >
                      <ComparisonValue value={row.competitor} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </BlurFade>

        {/* Summary badge */}
        <div className="mt-6 flex justify-center">
          <Badge
            variant="secondary"
            className="bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700"
          >
            OdisAI leads in {odisWins} of {data.comparisonTable.length}{" "}
            categories
          </Badge>
        </div>
      </SectionContainer>

      {/* Detailed Sections as Tabs */}
      {data.detailedSections.length > 0 && (
        <SectionContainer
          id="detailed-comparison"
          backgroundVariant="cool-blue"
          padding="default"
        >
          <SectionHeader
            badge="In Depth"
            title="Detailed Comparison"
            align="center"
          />
          <div className="mx-auto mt-12 max-w-4xl">
            <ComparisonTabs
              sections={data.detailedSections}
              competitorName={data.competitorName}
            />
          </div>
        </SectionContainer>
      )}

      {/* Why OdisAI — Differentiators */}
      <SectionContainer
        id="why-odisai"
        backgroundVariant="warm-violet"
        padding="default"
      >
        <SectionHeader
          badge="Why OdisAI"
          badgeVariant="teal"
          title={`Why Clinics Choose OdisAI Over ${data.competitorName}`}
          align="center"
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {data.differentiators.map((diff, index) => (
            <BlurFade key={diff.title} delay={index * 0.1} inView>
              <div className="flex items-start gap-4 rounded-xl border border-white/20 bg-white/60 p-5 backdrop-blur-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                  <span className="text-sm font-bold text-teal-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{diff.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {diff.description}
                  </p>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </SectionContainer>

      {/* Switching Guide */}
      <SectionContainer
        id="switching-guide"
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader
          badge="Easy Switch"
          badgeVariant="teal"
          title="Making the Switch"
          align="center"
        />
        <div className="mx-auto mt-12 max-w-3xl">
          <SwitchingGuideSection
            title={data.switchingGuide.title}
            description={data.switchingGuide.description}
            steps={data.switchingGuide.steps}
            timeline={data.switchingGuide.timeline}
          />
        </div>
      </SectionContainer>

      {/* Testimonial */}
      <SectionContainer
        id="testimonial"
        backgroundVariant="subtle-dark"
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
        backgroundVariant="cool-blue"
        padding="default"
      >
        <SectionHeader badge="FAQ" title="Common Questions" align="center" />
        <div className="mx-auto mt-12 max-w-3xl">
          <AccordionFAQ faqs={data.faqs} />
        </div>
      </SectionContainer>

      {/* Cross-Links */}
      <SectionContainer
        id="related"
        backgroundVariant="subtle-dark"
        padding="small"
      >
        <CrossLinkSection title="Explore More" links={crossLinks} />
      </SectionContainer>

      {/* CTA */}
      <CTASection
        badge={data.cta.badge ?? "Make the Switch"}
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

/* Client-side comparison tabs wrapper */
function ComparisonTabs({
  sections,
  competitorName,
}: {
  sections: Array<{ title: string; odis: string; competitor: string }>;
  competitorName: string;
}) {
  if (sections.length === 0) {
    return null;
  }

  if (sections.length === 1) {
    // Fallback: render as side-by-side cards without tabs
    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-4 text-center text-lg font-semibold text-slate-900">
              {section.title}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-teal-200/60 bg-teal-50/50 p-6">
                <div className="mb-2 text-xs font-semibold tracking-wider text-teal-700 uppercase">
                  OdisAI
                </div>
                <p className="text-sm text-slate-700">{section.odis}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                <div className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  {competitorName}
                </div>
                <p className="text-sm text-slate-600">{section.competitor}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const defaultTab = sections[0]?.title ?? "";
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-8 flex w-full flex-wrap justify-center gap-2">
        {sections.map((section) => (
          <TabsTrigger
            key={section.title}
            value={section.title}
            className="rounded-full px-4 py-2 text-sm"
          >
            {section.title}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map((section) => (
        <TabsContent key={section.title} value={section.title}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-teal-200/60 bg-teal-50/50 p-6">
              <div className="mb-2 text-xs font-semibold tracking-wider text-teal-700 uppercase">
                OdisAI
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                {section.odis}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {competitorName}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {section.competitor}
              </p>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
