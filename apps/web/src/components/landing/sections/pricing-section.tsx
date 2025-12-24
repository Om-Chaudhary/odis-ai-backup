"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { NeonGradientCard } from "../ui/neon-gradient-card";
import { Calendar, Phone } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import {
  trackDemoPhoneClick,
  trackScheduleDemoClick,
} from "../shared/landing-analytics";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function PricingSection() {
  const posthog = usePostHog();
  const sectionVisibilityRef = useSectionVisibility<HTMLElement>("cta");
  const localRef = useRef<HTMLElement>(null);
  const isInView = useInView(localRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Combine refs for both visibility tracking and animation
  const sectionRef = (el: HTMLElement | null) => {
    (localRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (
      sectionVisibilityRef as React.MutableRefObject<HTMLElement | null>
    ).current = el;
  };

  const handleDemoPhoneClick = () => {
    trackDemoPhoneClick(posthog, "cta-section", DEMO_PHONE_NUMBER);
  };

  const handleScheduleDemoClick = () => {
    trackScheduleDemoClick(posthog, "cta-section");
  };

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef as React.LegacyRef<HTMLElement>}
      id="pricing"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Accent CTA background - vibrant, action-oriented, echoes hero */}
      <SectionBackground variant="accent-cta" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.35 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="font-display text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            Get Started
          </span>
          <h2 className="font-display mb-4 text-2xl font-medium tracking-tight text-slate-800 sm:text-3xl md:text-4xl lg:text-5xl">
            Let&apos;s Talk About Your Practice
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Every clinic is different. We&apos;ll create a custom plan that fits
            your call volume, integrations, and workflow.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.45 }}
        >
          <NeonGradientCard
            className="mx-auto max-w-2xl"
            neonColors={{
              firstColor: "#14b8a6",
              secondColor: "#10b981",
            }}
          >
            <div className="space-y-6 p-10 text-center sm:p-12 md:p-14">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/15 to-emerald-500/15">
                <Phone className="h-7 w-7 text-teal-600" />
              </div>

              <div>
                <h3 className="font-display mb-2 text-lg font-medium text-slate-900 sm:text-xl md:text-2xl">
                  Experience OdisAI
                </h3>
                <p className="text-base text-slate-600">
                  Schedule a personalized demo or call our demo line to hear
                  Odis in action right now.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                {/* Primary CTA - Schedule Demo */}
                <Link
                  href="/demo"
                  onClick={handleScheduleDemoClick}
                  className={cn(
                    "group inline-flex items-center justify-center gap-3 rounded-full px-8 py-4",
                    "bg-gradient-to-r from-teal-600 to-emerald-600",
                    "text-lg font-semibold text-white shadow-lg shadow-teal-500/25",
                    "transition-all duration-300",
                    "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
                  )}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Schedule a Demo</span>
                </Link>

                {/* Secondary CTA - Call Now */}
                <a
                  href={DEMO_PHONE_TEL}
                  onClick={handleDemoPhoneClick}
                  className={cn(
                    "group inline-flex items-center justify-center gap-3 rounded-full px-8 py-4",
                    "bg-white text-slate-700 ring-1 ring-slate-200",
                    "text-lg font-semibold shadow-lg",
                    "transition-all duration-300",
                    "hover:scale-[1.02] hover:bg-slate-50",
                  )}
                >
                  <Phone className="h-5 w-5" />
                  <span>Call: {DEMO_PHONE_NUMBER}</span>
                </a>
              </div>
            </div>
          </NeonGradientCard>
        </motion.div>
      </div>
    </section>
  );
}
