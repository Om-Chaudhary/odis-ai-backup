"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
  SectionHeader,
  CTASection,
} from "~/components/marketing";
import { Button } from "@odis-ai/ui/button";
import Link from "next/link";
import { cn } from "~/lib/utils";

// TODO: Replace with actual pricing data
const pricingTiers = [
  {
    name: "Starter",
    description: "", // TODO: Add description
    price: "", // TODO: Add price (e.g., "$299/mo")
    features: [
      // TODO: Add features
      "Feature 1",
      "Feature 2",
      "Feature 3",
    ],
    cta: "Get Started",
    href: "/demo",
    featured: false,
  },
  {
    name: "Professional",
    description: "", // TODO: Add description
    price: "", // TODO: Add price
    features: [
      // TODO: Add features
      "Everything in Starter",
      "Feature 4",
      "Feature 5",
      "Feature 6",
    ],
    cta: "Get Started",
    href: "/demo",
    featured: true,
  },
  {
    name: "Enterprise",
    description: "", // TODO: Add description
    price: "Custom",
    features: [
      // TODO: Add features
      "Everything in Professional",
      "Feature 7",
      "Feature 8",
      "Feature 9",
    ],
    cta: "Contact Sales",
    href: "/contact",
    featured: false,
  },
];

// TODO: Add FAQ items
const pricingFAQs = [
  {
    question: "", // TODO: Add question
    answer: "", // TODO: Add answer
  },
];

function PricingCard({
  tier,
  index,
  isInView,
}: {
  tier: (typeof pricingTiers)[0];
  index: number;
  isInView: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-8",
        tier.featured
          ? "border-teal-200 shadow-xl ring-2 ring-teal-500/20"
          : "border-slate-200/80 shadow-sm",
      )}
    >
      {tier.featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-teal-500 px-4 py-1 text-sm font-medium text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-display text-xl font-semibold text-slate-900">
          {tier.name}
        </h3>
        {tier.description && (
          <p className="text-muted-foreground mt-2 text-sm">
            {tier.description}
          </p>
        )}
      </div>

      <div className="mb-6">
        <span className="font-display text-4xl font-bold text-slate-900">
          {tier.price || "Contact us"}
        </span>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {tier.features.map((feature, featureIndex) => (
          <li
            key={featureIndex}
            className="flex items-start gap-3 text-sm text-slate-600"
          >
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant={tier.featured ? "default" : "outline"}
        className={cn(
          "w-full rounded-full py-3",
          tier.featured && "bg-primary hover:bg-primary/90",
        )}
      >
        <Link href={tier.href}>{tier.cta}</Link>
      </Button>
    </motion.div>
  );
}

export default function PricingPage() {
  const pricingRef = useRef<HTMLDivElement>(null);
  const isPricingInView = useInView(pricingRef, {
    once: true,
    margin: "-100px",
  });

  return (
    <MarketingLayout navbar={{ variant: "transparent" }} showScrollProgress>
      {/* Hero Section */}
      <PageHero
        badge="Pricing"
        title="Simple, Transparent Pricing"
        subtitle="" // TODO: Add subtitle
        backgroundVariant="hero-glow"
      />

      {/* Pricing Tiers */}
      <SectionContainer
        id="pricing-tiers"
        backgroundVariant="cool-blue"
        padding="large"
      >
        <div ref={pricingRef} className="grid gap-8 md:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <PricingCard
              key={tier.name}
              tier={tier}
              index={index}
              isInView={isPricingInView}
            />
          ))}
        </div>

        {/* TODO: Add feature comparison table */}
        <div className="mt-16">
          <SectionHeader
            title="Compare Plans"
            subtitle="" // TODO: Add subtitle
            align="center"
          />
          {/* TODO: Add comparison table */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-muted-foreground">
              {/* TODO: Add feature comparison table */}
              Feature comparison table coming soon
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* FAQ Section */}
      <SectionContainer
        id="pricing-faq"
        backgroundVariant="subtle-dark"
        padding="large"
      >
        <SectionHeader
          badge="FAQ"
          title="Pricing Questions"
          subtitle="" // TODO: Add subtitle
        />

        {/* TODO: Add FAQ accordion */}
        <div className="mx-auto max-w-3xl space-y-4">
          {pricingFAQs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <h3 className="font-medium text-slate-900">
                {faq.question || `FAQ Question ${index + 1}`}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {faq.answer || "Answer coming soon"}
              </p>
            </div>
          ))}
        </div>
      </SectionContainer>

      {/* CTA Section */}
      <CTASection
        badge="Get Started"
        title="Ready to Transform Your Practice?"
        subtitle="" // TODO: Add subtitle
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
      />
    </MarketingLayout>
  );
}
