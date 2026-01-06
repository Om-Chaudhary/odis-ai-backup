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
import { Button } from "@odis-ai/shared/ui/button";
import Link from "next/link";
import { cn } from "@odis-ai/shared/util";

const pricingTiers = [
  {
    name: "Starter",
    description:
      "Perfect for small practices getting started with AI voice agents",
    price: "$499/mo",
    features: [
      "Up to 200 AI-handled calls per month",
      "Automated discharge calls",
      "Basic appointment scheduling",
      "Standard AI voice quality",
      "Email support (48hr response)",
      "Basic analytics dashboard",
      "HIPAA-compliant data handling",
    ],
    cta: "Get Started",
    href: "/demo",
    featured: false,
  },
  {
    name: "Professional",
    description: "Ideal for growing practices with higher call volumes",
    price: "$899/mo",
    features: [
      "Up to 500 AI-handled calls per month",
      "Everything in Starter, plus:",
      "Advanced sentiment analysis",
      "Multi-language support (English & Spanish)",
      "IDEXX Neo integration & sync",
      "Custom AI voice training",
      "Priority email & chat support (24hr response)",
      "Advanced analytics & reporting",
      "Custom workflow automation",
    ],
    cta: "Get Started",
    href: "/demo",
    featured: true,
  },
  {
    name: "Enterprise",
    description: "For multi-location clinics and large veterinary groups",
    price: "Custom",
    features: [
      "Unlimited AI-handled calls",
      "Everything in Professional, plus:",
      "Multi-location management",
      "Dedicated account manager",
      "Custom AI model training",
      "API access for custom integrations",
      "24/7 priority support with phone access",
      "Service level agreement (SLA)",
      "On-premise deployment options",
      "Custom billing & invoicing",
    ],
    cta: "Contact Sales",
    href: "/contact",
    featured: false,
  },
];

const comparisonFeatures = [
  {
    category: "Call Volume",
    features: [
      {
        name: "Monthly AI-handled calls",
        starter: "Up to 200",
        professional: "Up to 500",
        enterprise: "Unlimited",
      },
      {
        name: "Overage rate per call",
        starter: "$2.50",
        professional: "$2.00",
        enterprise: "N/A",
      },
    ],
  },
  {
    category: "Core Features",
    features: [
      {
        name: "Automated discharge calls",
        starter: true,
        professional: true,
        enterprise: true,
      },
      {
        name: "Appointment scheduling",
        starter: "Basic",
        professional: "Advanced",
        enterprise: "Advanced",
      },
      {
        name: "Analytics dashboard",
        starter: "Basic",
        professional: "Advanced",
        enterprise: "Custom",
      },
      {
        name: "HIPAA compliance",
        starter: true,
        professional: true,
        enterprise: true,
      },
    ],
  },
  {
    category: "AI Capabilities",
    features: [
      {
        name: "AI voice quality",
        starter: "Standard",
        professional: "Premium",
        enterprise: "Premium",
      },
      {
        name: "Sentiment analysis",
        starter: false,
        professional: true,
        enterprise: true,
      },
      {
        name: "Multi-language support",
        starter: false,
        professional: "English & Spanish",
        enterprise: "Custom",
      },
      {
        name: "Custom AI voice training",
        starter: false,
        professional: true,
        enterprise: "Dedicated model",
      },
    ],
  },
  {
    category: "Integrations",
    features: [
      {
        name: "Phone system integration",
        starter: "Basic",
        professional: "Basic",
        enterprise: "Advanced",
      },
      {
        name: "IDEXX Neo sync",
        starter: false,
        professional: true,
        enterprise: true,
      },
      {
        name: "API access",
        starter: false,
        professional: false,
        enterprise: true,
      },
      {
        name: "Custom integrations",
        starter: false,
        professional: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Support",
    features: [
      {
        name: "Email support",
        starter: "48hr response",
        professional: "24hr priority",
        enterprise: "24hr priority",
      },
      {
        name: "Chat support",
        starter: false,
        professional: true,
        enterprise: true,
      },
      {
        name: "Phone support",
        starter: false,
        professional: false,
        enterprise: "24/7",
      },
      {
        name: "Dedicated account manager",
        starter: false,
        professional: false,
        enterprise: true,
      },
      {
        name: "Service level agreement (SLA)",
        starter: false,
        professional: false,
        enterprise: true,
      },
    ],
  },
];

const pricingFAQs = [
  {
    question: "What happens if I exceed my monthly call limit?",
    answer:
      "If you approach your call limit, we'll notify you in advance. You can either upgrade to the next tier or purchase additional call blocks at a discounted rate. We'll never cut off service mid-month - overage calls are billed at $2.50 per call for Starter and $2.00 per call for Professional plans.",
  },
  {
    question: "Can I try OdisAI before committing to a plan?",
    answer:
      "Yes! We offer a 14-day free trial on our Starter and Professional plans. During the trial, you'll have full access to all features in your chosen tier. You can also schedule a personalized demo or call our demo line anytime to experience Odis in action.",
  },
  {
    question: "How does billing work?",
    answer:
      "All plans are billed monthly in advance. We accept all major credit cards and offer net-30 terms for Enterprise customers. You can upgrade, downgrade, or cancel anytime with changes taking effect at the start of your next billing cycle.",
  },
  {
    question: "What integrations are included?",
    answer:
      "All plans include basic integrations with common veterinary phone systems. Professional and Enterprise plans include our IDEXX Neo Chrome extension for automatic case syncing. Enterprise customers can access our API for custom integrations with any practice management software.",
  },
  {
    question: "Is my data secure and HIPAA compliant?",
    answer:
      "Absolutely. All plans include HIPAA-compliant data handling, encryption at rest and in transit, and regular security audits. We sign Business Associate Agreements (BAAs) with all customers. Enterprise customers can opt for on-premise deployment for maximum data control.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "Starter plans include email support with 48-hour response times. Professional plans get priority support via email and chat with 24-hour response. Enterprise customers receive 24/7 support with phone access and a dedicated account manager who knows your practice.",
  },
  {
    question: "Can I customize the AI voice and responses?",
    answer:
      "Yes! Professional and Enterprise plans include custom AI voice training, where we can adjust tone, personality, and specific responses to match your clinic's brand. Enterprise customers get dedicated model training for maximum customization and accuracy.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "You maintain full access to your account through the end of your billing period. We provide a 30-day grace period to export all call recordings, transcripts, and analytics data. After 90 days, data is securely deleted per our retention policy and HIPAA guidelines.",
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

export function PricingContent() {
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
        subtitle="Choose the perfect plan for your veterinary practice. All plans include HIPAA-compliant infrastructure, 14-day free trial, and no hidden fees."
        backgroundVariant="hero-glow"
      />

      {/* Pricing Tiers */}
      <SectionContainer
        id="pricing-tiers"
        backgroundVariant="cool-blue"
        padding="default"
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

        <div className="mt-16">
          <SectionHeader
            title="Compare Plans"
            subtitle="See what's included in each plan at a glance"
            align="center"
          />
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Features
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Starter
                    </th>
                    <th className="relative px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Professional
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-1 text-xs font-medium whitespace-nowrap text-white">
                        Most Popular
                      </span>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, categoryIndex) => (
                    <>
                      <tr
                        key={`category-${categoryIndex}`}
                        className="border-b border-slate-200 bg-slate-50/50"
                      >
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featureIndex) => (
                        <tr
                          key={`feature-${categoryIndex}-${featureIndex}`}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {feature.name}
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            {typeof feature.starter === "boolean" ? (
                              feature.starter ? (
                                <Check className="mx-auto h-5 w-5 text-teal-500" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span className="text-slate-600">
                                {feature.starter}
                              </span>
                            )}
                          </td>
                          <td className="bg-teal-50/30 px-6 py-4 text-center text-sm">
                            {typeof feature.professional === "boolean" ? (
                              feature.professional ? (
                                <Check className="mx-auto h-5 w-5 text-teal-500" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span className="font-medium text-slate-700">
                                {feature.professional}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            {typeof feature.enterprise === "boolean" ? (
                              feature.enterprise ? (
                                <Check className="mx-auto h-5 w-5 text-teal-500" />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span className="text-slate-600">
                                {feature.enterprise}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* FAQ Section */}
      <SectionContainer
        id="pricing-faq"
        backgroundVariant="subtle-dark"
        padding="default"
      >
        <SectionHeader
          badge="FAQ"
          title="Pricing Questions"
          subtitle="Common questions about our pricing, billing, and plans"
        />

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
        subtitle="Join hundreds of veterinary practices using AI to deliver better client experiences and reduce staff workload"
        primaryCTAText="Book a Demo"
        primaryCTAHref="/demo"
        secondaryCTAText="Contact Sales"
        secondaryCTAHref="/contact"
      />
    </MarketingLayout>
  );
}
