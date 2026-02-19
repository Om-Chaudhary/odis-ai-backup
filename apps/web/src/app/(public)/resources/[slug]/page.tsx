import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MarketingLayout,
  AccordionFAQ,
  CrossLinkSection,
  ArticleRenderer,
  type CrossLinkItem,
} from "~/components/marketing";
import { ArticleTableOfContents } from "~/components/marketing/sections/article-toc";
import { Download, ArrowRight, Sparkles, Clock } from "lucide-react";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { resources, resourceSlugs } from "../data";
import { getPublicPageRobots } from "~/lib/metadata";

const contentNavigation = [
  { name: "Resources", href: "/resources" },
  { name: "Solutions", href: "/solutions" },
  { name: "Compare", href: "/compare" },
];

export function generateStaticParams() {
  return resourceSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = resources[slug];

  if (!data) {
    return { title: "Resource Not Found" };
  }

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: { canonical: `/resources/${slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `/resources/${slug}`,
    },
    robots: getPublicPageRobots(),
  };
}

function getReadTime(sectionsCount: number) {
  return Math.max(4, sectionsCount * 4);
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = resources[slug];

  if (!data) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Build JSON-LD based on schemaType
  const schemaJsonLd =
    data.schemaType === "Article"
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.hero.title,
          description: data.metaDescription,
          author: {
            "@type": "Organization",
            name: "OdisAI",
            url: siteUrl,
          },
          publisher: {
            "@type": "Organization",
            name: "OdisAI",
            url: siteUrl,
          },
        }
      : data.schemaType === "HowTo"
        ? {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: data.hero.title,
            description: data.metaDescription,
            step: data.sections.map((section, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: section.title,
              text: section.content.replace(/<[^>]*>/g, ""),
            })),
          }
        : null;

  // Always include FAQPage if there are FAQs
  const faqJsonLd =
    data.faqs.length > 0
      ? {
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
        }
      : null;

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
        name: "Resources",
        item: `${siteUrl}/resources`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.hero.title,
        item: `${siteUrl}/resources/${slug}`,
      },
    ],
  };

  const jsonLdSchemas = [schemaJsonLd, faqJsonLd, breadcrumbJsonLd].filter(
    Boolean,
  );

  // Build cross-link items (handle both string slugs and objects)
  const crossLinks: CrossLinkItem[] = [
    ...(data.relatedResources ?? []).map((r) => {
      const slug = typeof r === "string" ? r : r.slug;
      const label = typeof r === "string" ? r.replace(/-/g, " ") : r.label;
      return { slug, label, type: "resource" as const };
    }),
    ...(data.relatedSolutions ?? []).map((s) => {
      const slug = typeof s === "string" ? s : s.slug;
      const label = typeof s === "string" ? s.replace(/-/g, " ") : s.label;
      return { slug, label, type: "solution" as const };
    }),
  ];

  // Build TOC items from sections
  const tocItems = data.sections.map((section, index) => ({
    id: `section-${index}`,
    title: section.title,
  }));

  const readTime = getReadTime(data.sections.length);

  return (
    <MarketingLayout
      navbar={{ variant: "solid", navigation: contentNavigation }}
      showScrollProgress
    >
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdSchemas).replace(/</g, "\\u003c"),
        }}
      />

      {/* Simple article header — white bg */}
      <header className="border-b border-slate-200 bg-white pt-32 pb-10">
        <div className="mx-auto max-w-5xl px-6">
          {/* Breadcrumbs */}
          <nav className="mb-10 flex items-center gap-1.5 text-sm text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-600">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/resources"
              className="transition-colors hover:text-slate-600"
            >
              Resources
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
          <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            {readTime} min read
          </div>

          {/* Key stats — compact highlight grid */}
          {data.stats && data.stats.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-8 sm:grid-cols-3 lg:grid-cols-4">
              {data.stats.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <p className="font-display text-lg font-bold text-teal-600 sm:text-xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Article Body — centered content with margin-positioned sticky TOC ── */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/*
            3-column grid: equal side columns keep the article centered.
            TOC lives in the left column with natural sticky behavior.
            Right column is empty — purely for centering balance.
          */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_768px_1fr]">
            {/* Left margin — TOC */}
            <div className="hidden pr-10 xl:block">
              <ArticleTableOfContents
                items={tocItems}
                className="!block h-full"
              />
            </div>

            {/* Article — center column */}
            <div className="mx-auto w-full max-w-3xl xl:mx-0 xl:max-w-none">
              <ArticleRenderer sections={data.sections} />
            </div>

            {/* Right margin — empty for balance */}
            <div className="hidden xl:block" />
          </div>
        </div>
      </section>

      {/* ── Asset Download Banner ── */}
      {data.asset && (
        <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-5xl px-6 py-14 sm:px-8 sm:py-16">
            <BlurFade delay={0.1} inView>
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <Download className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                      {data.asset.title}
                    </h3>
                    <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-teal-100/90 sm:text-base">
                      {data.asset.description}
                    </p>
                  </div>
                </div>
                <Link
                  href="/demo"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-700 shadow-lg shadow-teal-900/20 transition-all hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-xl"
                >
                  {data.asset.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </BlurFade>
          </div>
        </section>
      )}

      {/* ── Product Tie-In — warm slate panel ── */}
      <section className="bg-slate-50/80 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <BlurFade delay={0.1} inView>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-8 py-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="text-sm font-semibold text-teal-700">
                    How OdisAI Helps
                  </span>
                </div>
              </div>
              <div className="px-8 py-6">
                <h3 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  {data.productTieIn.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  {data.productTieIn.description}
                </p>
                <Link
                  href={`/solutions/${data.productTieIn.solutionSlug}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700"
                >
                  Learn more about this solution
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ── FAQ — teal-tinted background for visual separation ── */}
      {data.faqs.length > 0 && (
        <section className="relative bg-white py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-teal-50/40 via-teal-50/20 to-transparent" />
          <div className="relative mx-auto max-w-3xl px-6">
            <p className="mb-2 text-center text-xs font-semibold tracking-widest text-teal-600/70 uppercase">
              FAQ
            </p>
            <h2 className="font-display mb-10 text-center text-xl font-bold text-slate-900 sm:text-2xl">
              Common Questions
            </h2>
            <AccordionFAQ faqs={data.faqs} />
          </div>
        </section>
      )}

      {/* ── Cross-Links — clean white with decorative divider ── */}
      {crossLinks.length > 0 && (
        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-4xl px-6">
            {/* Decorative divider */}
            <div className="mb-12 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-xs font-semibold tracking-widest text-slate-300 uppercase">
                Keep reading
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>
            <CrossLinkSection title="Continue Reading" links={crossLinks} />
          </div>
        </section>
      )}

      {/* ── CTA — full teal gradient ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            See how OdisAI automates these workflows
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-teal-100/70">
            Most clinics go live within 48 hours. Book a quick demo to see it in
            action.
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
