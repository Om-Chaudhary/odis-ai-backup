"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
  FeatureCard,
} from "~/components/marketing";
import { Button } from "@odis-ai/ui/button";
import type { Integration } from "~/data/integrations";

interface IntegrationDetailPageProps {
  integration: Integration;
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function IntegrationDetailPage({
  integration,
}: IntegrationDetailPageProps) {
  const overviewRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const isOverviewInView = useInView(overviewRef, {
    once: true,
    margin: "-100px",
  });
  const isFeaturesInView = useInView(featuresRef, {
    once: true,
    margin: "-100px",
  });
  const isHowItWorksInView = useInView(howItWorksRef, {
    once: true,
    margin: "-100px",
  });

  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* Hero Section */}
      <PageHero
        badge={
          integration.status === "active" ? "Active Integration" : "Coming Soon"
        }
        title={`${integration.name} + OdisAI`}
        subtitle={integration.description || ""} // TODO: Add description to integration data
        backgroundVariant="hero-glow"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Integrations", href: "/integrations" },
          {
            label: integration.name,
            href: `/integrations/${integration.slug}`,
          },
        ]}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 rounded-full px-8"
          >
            <Link href="/demo">
              Book a Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8"
          >
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </PageHero>

      {/* Overview Section */}
      <SectionContainer
        id="overview"
        backgroundVariant="cool-blue"
        padding="large"
      >
        <div
          ref={overviewRef}
          className="grid gap-12 lg:grid-cols-2 lg:items-center"
        >
          {/* Logo/Image */}
          <motion.div
            initial="hidden"
            animate={isOverviewInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={transition}
            className="flex items-center justify-center"
          >
            <div className="flex h-48 w-48 items-center justify-center rounded-3xl bg-white shadow-lg sm:h-64 sm:w-64">
              {integration.logoSrc ? (
                <Image
                  src={integration.logoSrc}
                  alt={`${integration.name} logo`}
                  width={160}
                  height={160}
                  className="h-40 w-40 object-contain"
                />
              ) : (
                <span className="text-6xl font-bold text-slate-300">
                  {integration.name.charAt(0)}
                </span>
              )}
            </div>
          </motion.div>

          {/* Overview Content */}
          <motion.div
            initial="hidden"
            animate={isOverviewInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0.2 }}
          >
            <h2 className="font-display mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
              Overview
            </h2>
            <p className="text-muted-foreground mb-6">
              {/* TODO: Add overview content to integration data */}
              {integration.description ||
                `Learn how OdisAI integrates seamlessly with ${integration.name} to automate your veterinary practice communications.`}
            </p>

            {/* Quick features list */}
            {integration.features.length > 0 && (
              <ul className="space-y-3">
                {integration.features.slice(0, 4).map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-slate-700"
                  >
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>
      </SectionContainer>

      {/* Features Section */}
      {integration.features.length > 0 && (
        <SectionContainer
          id="features"
          backgroundVariant="warm-violet"
          padding="large"
        >
          <SectionHeader
            badge="Features"
            badgeVariant="violet"
            title={`${integration.name} Integration Features`}
            subtitle="" // TODO: Add subtitle
          />

          <div
            ref={featuresRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {integration.features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature}
                description="" // TODO: Add feature descriptions to integration data
                isInView={isFeaturesInView}
                delay={index * 0.1}
              />
            ))}
          </div>
        </SectionContainer>
      )}

      {/* How It Works Section */}
      {integration.howItWorks && integration.howItWorks.length > 0 && (
        <SectionContainer
          id="how-it-works"
          backgroundVariant="subtle-dark"
          padding="large"
        >
          <SectionHeader
            badge="How It Works"
            title="Getting Started"
            subtitle="" // TODO: Add subtitle
          />

          <div ref={howItWorksRef} className="mx-auto max-w-3xl">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-slate-200" />

              {/* Steps */}
              <div className="space-y-8">
                {integration.howItWorks.map((step, index) => (
                  <motion.div
                    key={index}
                    initial="hidden"
                    animate={isHowItWorksInView ? "visible" : "hidden"}
                    variants={fadeUpVariant}
                    transition={{ ...transition, delay: index * 0.15 }}
                    className="relative flex gap-6"
                  >
                    {/* Step number */}
                    <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-500 text-lg font-semibold text-white">
                      {index + 1}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6">
                      <h3 className="mb-2 font-semibold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {step.description || "Description coming soon"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </SectionContainer>
      )}

      {/* Requirements Section */}
      {integration.requirements && integration.requirements.length > 0 && (
        <SectionContainer id="requirements" padding="default">
          <SectionHeader
            badge="Requirements"
            title="What You'll Need"
            subtitle="" // TODO: Add subtitle
          />

          <div className="mx-auto max-w-2xl">
            <ul className="space-y-4">
              {integration.requirements.map((requirement, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" />
                  <span className="text-slate-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionContainer>
      )}

      {/* CTA Section */}
      <CTASection
        badge="Get Started"
        title={`Ready to Connect ${integration.name}?`}
        subtitle="" // TODO: Add subtitle
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
      />
    </MarketingLayout>
  );
}
