"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { NeonGradientCard } from "../ui/neon-gradient-card";
import { Calendar, Phone, Sparkles, CheckCircle2, Shield } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { trackScheduleDemoClick } from "../shared/landing-analytics";

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
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-teal-700 uppercase backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Get Started
          </span>
          <h2 className="font-display mb-4 text-2xl font-medium tracking-tight text-slate-800 sm:text-3xl md:text-4xl lg:text-5xl">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            See how Odis can handle your clinic&apos;s calls. We&apos;d love to
            hear from you.
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
                  Contact Us
                </h3>
                <p className="text-base text-slate-600">
                  Book a demo and we&apos;ll show you how Odis works for your
                  clinic.
                </p>
              </div>

              {/* CTA Button with shimmer */}
              <div className="flex justify-center">
                <Link
                  href="/demo"
                  onClick={handleScheduleDemoClick}
                  className={cn(
                    "group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-8 py-4",
                    "bg-gradient-to-r from-teal-600 to-emerald-600",
                    "text-lg font-semibold text-white shadow-lg shadow-teal-500/25",
                    "transition-all duration-300",
                    "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
                  )}
                >
                  {/* Shimmer effect */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <Calendar className="relative h-5 w-5" />
                  <span className="relative">Contact Us</span>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-teal-500" />
                  HIPAA Compliant
                </span>
              </div>
            </div>
          </NeonGradientCard>
        </motion.div>
      </div>
    </section>
  );
}
