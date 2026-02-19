import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MarketingLayout,
  KeyAdvantagesBar,
  VerdictSection,
  AccordionFAQ,
  TestimonialCard,
  CrossLinkSection,
  SwitchingGuideSection,
  type CrossLinkItem,
} from "~/components/marketing";
import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@odis-ai/shared/ui/tabs";
import { comparisons, comparisonSlugs } from "../data";
import { getPublicPageRobots } from "~/lib/metadata";

const contentNavigation = [
  { name: "Resources", href: "/resources" },
  { name: "Solutions", href: "/solutions" },
  { name: "Compare", href: "/compare" },
];

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://odisai.net";

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: { canonical: `${siteUrl}/compare/${slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `${siteUrl}/compare/${slug}`,
    },
    robots: getPublicPageRobots(),
  };
}

function ComparisonValue({
  value,
  variant = "default",
}: {
  value: boolean | string;
  variant?: "odis" | "default";
}) {
  if (typeof value === "boolean") {
    return value ? (
      <div
        className={cn(
          "mx-auto flex h-7 w-7 items-center justify-center rounded-full",
          variant === "odis" ? "bg-teal-100" : "bg-teal-50",
        )}
      >
        <Check
          className={cn(
            "h-4 w-4",
            variant === "odis" ? "text-teal-600" : "text-teal-500",
          )}
          strokeWidth={variant === "odis" ? 3 : 2.5}
        />
      </div>
    ) : (
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
        <X className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
      </div>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
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
    <MarketingLayout
      navbar={{ variant: "solid", navigation: contentNavigation }}
      showScrollProgress
    >
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
              href="/compare"
              className="transition-colors hover:text-slate-600"
            >
              Compare
            </Link>
            <span>/</span>
            <span className="text-slate-600">vs {data.competitorName}</span>
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
          {data.hero.headline && (
            <p className="mt-4 text-base font-medium text-teal-600 italic">
              {data.hero.headline}
            </p>
          )}
        </div>
      </header>

      {/* Key Advantages Bar */}
      <KeyAdvantagesBar advantages={data.keyAdvantages} />

      {/* Verdict Section */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-semibold tracking-widest text-teal-600 uppercase">
            Our Verdict
          </p>
          <h2 className="font-display mt-2 text-center text-2xl font-bold text-slate-900">
            OdisAI vs {data.competitorName}: The Bottom Line
          </h2>
          <div className="mx-auto mt-12 max-w-4xl">
            <VerdictSection
              summary={data.verdict.summary}
              bestForOdis={data.verdict.bestForOdis}
              bestForCompetitor={data.verdict.bestForCompetitor}
              competitorName={data.competitorName}
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-b border-slate-100 bg-slate-50/30 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display mb-8 text-center text-2xl font-bold text-slate-900">
            Feature-by-Feature Comparison
          </h2>
          <BlurFade delay={0.1} inView>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_140px_140px] border-b border-slate-200 sm:grid-cols-3">
                <div className="bg-slate-50 p-4 text-sm font-semibold text-slate-900">
                  Feature
                </div>
                <div className="flex flex-col items-center justify-center gap-1 bg-teal-50 p-4">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                    O
                  </span>
                  <span className="text-xs font-bold text-teal-700 sm:text-sm">
                    OdisAI
                  </span>
                </div>
                <div className="flex items-center justify-center bg-slate-50 p-4 text-xs font-medium text-slate-500 sm:text-sm">
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
                      "grid grid-cols-[1fr_140px_140px] border-b border-slate-100 last:border-b-0 sm:grid-cols-3",
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/30",
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
                            ? "text-center text-sm font-medium text-teal-700"
                            : ""
                        }
                      >
                        <ComparisonValue value={row.odis} variant="odis" />
                      </span>
                    </div>
                    <div className="flex items-center justify-center p-4">
                      <span
                        className={
                          typeof row.competitor === "string"
                            ? "text-center text-sm text-slate-500"
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

          {/* Summary line */}
          <p className="mt-6 text-center text-sm font-medium text-teal-600">
            OdisAI leads in {odisWins} of {data.comparisonTable.length}{" "}
            categories
          </p>
        </div>
      </section>

      {/* Detailed Sections as Tabs */}
      {data.detailedSections.length > 0 && (
        <section className="border-b border-slate-100 bg-white py-12">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-display mb-8 text-center text-2xl font-bold text-slate-900">
              Detailed Comparison
            </h2>
            <div className="mx-auto max-w-4xl">
              <ComparisonTabs
                sections={data.detailedSections}
                competitorName={data.competitorName}
              />
            </div>
          </div>
        </section>
      )}

      {/* Why OdisAI — Differentiators */}
      <section className="border-b border-slate-100 bg-slate-50/50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display mb-8 text-center text-2xl font-bold text-slate-900">
            Why Clinics Choose OdisAI Over {data.competitorName}
          </h2>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {data.differentiators.map((diff, index) => (
              <BlurFade key={diff.title} delay={index * 0.1} inView>
                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                    <span className="text-sm font-bold text-teal-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {diff.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {diff.description}
                    </p>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Switching Guide */}
      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display mb-8 text-center text-2xl font-bold text-slate-900">
            Making the Switch
          </h2>
          <div className="mx-auto max-w-3xl">
            <SwitchingGuideSection
              title={data.switchingGuide.title}
              description={data.switchingGuide.description}
              steps={data.switchingGuide.steps}
              timeline={data.switchingGuide.timeline}
            />
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
