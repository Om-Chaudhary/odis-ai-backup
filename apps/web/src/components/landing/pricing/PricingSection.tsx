"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { usePostHog } from "posthog-js/react";
import { NeonGradientCard } from "~/components/ui/neon-gradient-card";
import { ShimmerButton } from "~/components/ui/shimmer-button";
import { Calendar, ArrowRight, Phone } from "lucide-react";
import { cn } from "~/lib/utils";
import { SectionBackground } from "~/components/ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import {
  trackDemoPhoneClick,
  trackScheduleDemoClick,
} from "../LandingAnalytics";

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
                  Try It Right Now
                </h3>
                <p className="text-base text-slate-600">
                  Call our demo line and hear Odis handle a veterinary call
                  live.
                </p>
              </div>

              {/* Primary CTA - Demo Phone */}
              <a
                href={DEMO_PHONE_TEL}
                onClick={handleDemoPhoneClick}
                className={cn(
                  "group inline-flex items-center justify-center gap-3 rounded-full px-8 py-4",
                  "bg-gradient-to-r from-teal-600 to-emerald-600",
                  "text-lg font-semibold text-white shadow-lg shadow-teal-500/25",
                  "transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
                )}
              >
                <Phone className="h-5 w-5" />
                <span>Call Demo: {DEMO_PHONE_NUMBER}</span>
              </a>

              <p className="text-sm text-slate-500">or</p>

              {/* Secondary CTA - Schedule Demo */}
              <div className="flex justify-center">
                <ShimmerButton
                  background="linear-gradient(135deg, #14b8a6 0%, #10b981 100%)"
                  shimmerColor="rgba(255, 255, 255, 0.5)"
                  className="group relative overflow-hidden px-6 py-3 text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all hover:shadow-xl hover:shadow-teal-500/30"
                  onClick={() => {
                    handleScheduleDemoClick();
                    window.location.href =
                      "mailto:hello@odis.ai?subject=Demo Request&body=Hi, I'd like to schedule a demo to learn more about OdisAI for my veterinary practice.";
                  }}
                >
                  <span className="flex items-center gap-2 text-white">
                    <Calendar className="h-4 w-4" />
                    Schedule a personalized demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </ShimmerButton>
              </div>

              <p className="text-xs text-slate-500">No commitment required</p>
            </div>
          </NeonGradientCard>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.55 }}
          className="mt-12 text-center lg:mt-16"
        >
          <p className="mb-6 text-sm font-medium text-slate-600">
            Trusted by veterinary teams nationwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {/* Integration logos placeholder */}
            <div className="text-xs font-medium text-slate-500">IDEXX</div>
            <div className="text-xs font-medium text-slate-500">ezyVet</div>
            <div className="text-xs font-medium text-slate-500">
              Cornerstone
            </div>
            <div className="text-xs font-medium text-slate-500">Avimark</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
