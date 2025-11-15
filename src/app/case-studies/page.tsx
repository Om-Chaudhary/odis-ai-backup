"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";
import { BookOpen, TrendingUp, Users, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { getAllCaseStudies, getAllCategories } from "~/data/case-studies";

const highlights = [
  {
    icon: TrendingUp,
    title: "Proven Results",
    description: "Real outcomes from veterinary practices across the country",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  {
    icon: Users,
    title: "Diverse Practices",
    description: "From single clinics to multi-location enterprises",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Award,
    title: "Industry Leaders",
    description:
      "Success stories from award-winning veterinary professionals",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: BookOpen,
    title: "Detailed Insights",
    description: "In-depth analysis of challenges, solutions, and results",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export default function CaseStudiesPage() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const caseStudies = getAllCaseStudies();
  const categories = getAllCategories();

  useEffect(() => {
    posthog.capture("case_studies_page_viewed", {
      timestamp: Date.now(),
      device_type: deviceInfo.device_type,
      viewport_width: deviceInfo.viewport_width,
      viewport_height: deviceInfo.viewport_height,
    });
  }, [posthog, deviceInfo]);

  return (
    <main className="relative">
      <div className="dotted-background" />
      <Navigation />

      {/* Hero Section */}
      <section className="relative px-4 pb-16 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <BookOpen className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">
              Success Stories
            </span>
          </div>
          <h1 className="font-display mb-6 text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Real Results from Real Practices
          </h1>
          <p className="mx-auto max-w-3xl font-serif text-lg leading-relaxed text-gray-700 sm:text-xl">
            Discover how veterinary practices across the country are using
            OdisAI to transform their operations, improve patient care, and grow
            their businesses.
          </p>
        </div>
      </section>

      {/* Highlights Section */}
      <section
        className="mt-8 px-4 sm:mt-12 sm:px-6 md:mt-16"
        aria-label="Case study highlights"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <Card
                  key={index}
                  className="border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardHeader className="text-center">
                    <div
                      className={`mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${highlight.bgColor}`}
                    >
                      <Icon className={`h-6 w-6 ${highlight.color}`} />
                    </div>
                    <CardTitle className="text-lg text-gray-900">
                      {highlight.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {highlight.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="mt-8 px-4 sm:mt-12 sm:px-6 md:mt-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="font-display mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Browse by Category
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <button className="rounded-full border-2 border-[#31aba3] bg-[#31aba3] px-6 py-2 font-semibold text-white transition-all hover:bg-[#2a9589]">
                All Case Studies
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className="rounded-full border-2 border-gray-300 bg-white px-6 py-2 font-semibold text-gray-700 transition-all hover:border-[#31aba3] hover:text-[#31aba3]"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section
        className="mt-8 px-4 sm:mt-12 sm:px-6 md:mt-16"
        aria-label="Case studies"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {caseStudies.map((study, index) => (
              <Link
                key={study.id}
                href={`/case-studies/${study.slug}`}
                className="group"
              >
                <Card className="h-full border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  {/* Image */}
                  <div className="overflow-hidden">
                    <div className="relative h-48 w-full">
                      <Image
                        src={study.image}
                        alt={study.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  <CardHeader>
                    {/* Category Badge */}
                    <div className="mb-3 inline-flex items-center rounded-full bg-[#31aba3]/10 px-3 py-1 text-xs font-semibold text-[#31aba3]">
                      {study.category}
                    </div>

                    <CardTitle className="mb-2 line-clamp-2 text-xl text-gray-900 transition-colors group-hover:text-[#31aba3]">
                      {study.title}
                    </CardTitle>

                    <CardDescription className="mb-4 line-clamp-3 text-gray-600">
                      {study.summary}
                    </CardDescription>

                    {/* Client Info */}
                    <div className="mb-4 border-t border-gray-100 pt-4">
                      <p className="mb-1 font-semibold text-gray-900">
                        {study.client.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {study.client.location}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {study.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{study.readTime}</span>
                      <span>{format(new Date(study.publishedAt), "MMM yyyy")}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        className="mt-8 px-4 sm:mt-12 sm:px-6 md:mt-16"
        aria-label="Call to action"
      >
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-gradient-to-br from-[#31aba3]/10 to-[#31aba3]/5 p-8 text-center sm:p-12">
            <h2 className="font-display mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Ready to Write Your Success Story?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl font-serif text-gray-600">
              Join hundreds of veterinary practices that have transformed their
              operations with OdisAI. Let&apos;s discuss how we can help you
              achieve similar results.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg bg-[#31aba3] px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-[#2a9589]"
              >
                Get Started Today
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center rounded-lg border-2 border-[#31aba3] px-6 py-3 font-semibold text-[#31aba3] transition-all hover:scale-105 hover:bg-[#31aba3]/5"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-8 sm:mt-12 md:mt-16">
        <Footer />
      </footer>
    </main>
  );
}
