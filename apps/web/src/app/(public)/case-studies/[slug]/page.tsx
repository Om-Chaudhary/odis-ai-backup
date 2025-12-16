import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Navigation from "~/components/layout/navigation";
import Footer from "~/components/layout/footer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@odis-ai/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@odis-ai/ui/avatar";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  MapPin,
  Users2,
  TrendingUp,
  CheckCircle2,
  Target,
  Lightbulb,
  Quote,
} from "lucide-react";
import { getCaseStudyBySlug, getAllCaseStudies } from "~/data/case-studies";

interface CaseStudyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    return {
      title: "Case Study Not Found",
    };
  }

  const hdrs = await headers();
  const host =
    hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;
  const canonical = `${origin}/case-studies/${caseStudy.slug}`;

  return {
    title: caseStudy.metaTitle ?? `${caseStudy.title} - Case Study | OdisAI`,
    description: caseStudy.metaDescription ?? caseStudy.summary,
    keywords: caseStudy.keywords?.join(", "),
    alternates: {
      canonical,
    },
    openGraph: {
      title: caseStudy.metaTitle ?? `${caseStudy.title} - Case Study`,
      description: caseStudy.metaDescription ?? caseStudy.summary,
      url: canonical,
      images: [{ url: caseStudy.image }],
      type: "article",
      publishedTime: caseStudy.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: caseStudy.metaTitle ?? `${caseStudy.title} - Case Study`,
      description: caseStudy.metaDescription ?? caseStudy.summary,
      images: [caseStudy.image],
    },
  };
}

export async function generateStaticParams() {
  const caseStudies = getAllCaseStudies();
  return caseStudies.map((study) => ({
    slug: study.slug,
  }));
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  const hdrs = await headers();
  const host =
    hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;
  const canonical = `${origin}/case-studies/${caseStudy.slug}`;
  const logoUrl = `${origin}/icon-128.png`;

  return (
    <div className="relative">
      <div className="dotted-background" />
      <Navigation />

      {/* Breadcrumb */}
      <div className="relative container mx-auto px-4 pt-24 pb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className="text-slate-600 transition-colors hover:text-teal-600"
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/case-studies"
                className="text-slate-600 transition-colors hover:text-teal-600"
              >
                Case Studies
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 text-slate-900">
                {caseStudy.client.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Category Badge */}
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <span className="text-sm font-semibold text-[#31aba3]">
              {caseStudy.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display mb-4 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
            {caseStudy.title}
          </h1>

          {/* Subtitle */}
          <p className="mb-8 font-serif text-xl leading-relaxed text-gray-600">
            {caseStudy.subtitle}
          </p>

          {/* Client Info Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                <Building2 className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="font-semibold text-gray-900">
                  {caseStudy.client.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-semibold text-gray-900">
                  {caseStudy.client.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Users2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Industry</p>
                <p className="font-semibold text-gray-900">
                  {caseStudy.client.industry}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Published</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(caseStudy.publishedAt), "MMM yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8 flex flex-wrap gap-2">
            {caseStudy.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Featured Image */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
            <div className="relative h-[400px] w-full">
              <Image
                src={caseStudy.image}
                alt={caseStudy.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              mainEntityOfPage: canonical,
              headline: caseStudy.metaTitle ?? caseStudy.title,
              description: caseStudy.metaDescription ?? caseStudy.summary,
              image: caseStudy.image,
              datePublished: caseStudy.publishedAt,
              author: {
                "@type": "Organization",
                name: "OdisAI",
              },
              publisher: {
                "@type": "Organization",
                name: "OdisAI",
                logo: { "@type": "ImageObject", url: logoUrl },
              },
            }),
          }}
        />

        {/* Overview */}
        <section className="mb-16">
          <h2 className="font-display mb-6 text-3xl font-bold text-gray-900">
            Overview
          </h2>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="font-serif text-lg leading-relaxed text-gray-700">
              {caseStudy.overview}
            </p>
          </div>
        </section>

        {/* Challenges */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
              <Target className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-gray-900">
              Challenges
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {caseStudy.challenges.map((challenge, index) => (
              <Card
                key={index}
                className="border-gray-200 transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">
                    {challenge.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{challenge.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Solutions */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
              <Lightbulb className="h-6 w-6 text-teal-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-gray-900">
              Solutions
            </h2>
          </div>

          <div className="space-y-8">
            {caseStudy.solutions.map((solution, index) => (
              <Card
                key={index}
                className="border-gray-200 transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <CardTitle className="mb-3 text-2xl text-gray-900">
                    {solution.title}
                  </CardTitle>
                  <p className="font-serif text-gray-600">
                    {solution.description}
                  </p>
                </CardHeader>
                {solution.features && solution.features.length > 0 && (
                  <CardContent>
                    <ul className="space-y-2">
                      {solution.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Results */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-gray-900">
              Results
            </h2>
          </div>

          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="font-serif text-lg leading-relaxed text-gray-700">
              {caseStudy.results.overview}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {caseStudy.results.metrics.map((metric, index) => (
              <Card
                key={index}
                className="border-gray-200 bg-gradient-to-br from-[#31aba3]/5 to-white transition-all hover:shadow-lg"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-2 text-4xl font-bold text-[#31aba3]">
                    {metric.value}
                  </div>
                  <div className="mb-2 font-semibold text-gray-900">
                    {metric.label}
                  </div>
                  {metric.description && (
                    <p className="text-sm text-gray-600">
                      {metric.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        {caseStudy.testimonial && (
          <section className="mb-16">
            <Card className="border-[#31aba3]/20 bg-gradient-to-br from-[#31aba3]/5 to-white shadow-lg">
              <CardContent className="p-8 sm:p-12">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#31aba3]/10">
                  <Quote className="h-6 w-6 text-[#31aba3]" />
                </div>
                <blockquote className="mb-8 font-serif text-xl leading-relaxed text-gray-700 italic sm:text-2xl">
                  &ldquo;{caseStudy.testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  {caseStudy.testimonial.image && (
                    <Avatar className="h-16 w-16 ring-2 ring-[#31aba3]/20">
                      <AvatarImage
                        src={caseStudy.testimonial.image}
                        alt={caseStudy.testimonial.author}
                      />
                      <AvatarFallback className="bg-[#31aba3]/10 text-[#31aba3]">
                        {caseStudy.testimonial.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {caseStudy.testimonial.author}
                    </p>
                    <p className="text-gray-600">
                      {caseStudy.testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Call to Action */}
        <section className="mb-16">
          <div className="rounded-2xl bg-gradient-to-br from-[#31aba3]/10 to-[#31aba3]/5 p-8 text-center sm:p-12">
            <h2 className="font-display mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Ready to Transform Your Practice?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl font-serif text-gray-600">
              See how OdisAI can help you achieve similar results. Schedule a
              personalized demo to learn how we can address your specific needs.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg bg-[#31aba3] px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-[#2a9589]"
              >
                Contact Us
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center rounded-lg border-2 border-[#31aba3] px-6 py-3 font-semibold text-[#31aba3] transition-all hover:scale-105 hover:bg-[#31aba3]/5"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Back to Case Studies */}
        <div className="flex justify-center">
          <Link
            href="/case-studies"
            className="group inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-8 py-4 font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <svg
              className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Case Studies
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
