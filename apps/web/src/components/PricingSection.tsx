"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { NeonGradientCard } from "~/components/ui/neon-gradient-card";
import { ShimmerButton } from "~/components/ui/shimmer-button";
import { Calendar, ArrowRight } from "lucide-react";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative w-full overflow-hidden py-24 lg:py-32"
    >
      {/* Cohesive background */}
      <SectionBackground variant="accent-warm" />

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
          <h2 className="font-display text-foreground mb-4 text-4xl font-medium tracking-tight lg:text-5xl">
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
          <NeonGradientCard className="mx-auto max-w-3xl">
            <div className="space-y-6 p-6 text-center sm:space-y-8 sm:p-10 lg:p-12">
              <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <Calendar className="text-primary h-8 w-8" />
              </div>

              <div>
                <h3 className="font-display text-foreground mb-3 text-3xl font-medium lg:text-4xl">
                  Book a 15-Minute Demo
                </h3>
                <p className="text-muted-foreground mx-auto max-w-xl text-lg">
                  See OdisAI in action. We&apos;ll walk through how it works for
                  your clinic and answer all your questions—no sales pitch.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 text-left sm:grid-cols-2 sm:gap-4">
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      ✓ See live call demo
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Hear how natural it sounds
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      ✓ Discuss your PIMS
                    </p>
                    <p className="text-muted-foreground text-xs">
                      We integrate with major systems
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      ✓ Custom pricing
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Based on your call volume
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-foreground text-sm font-semibold">
                      ✓ Go live in days
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Not weeks or months
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                  <ShimmerButton
                    className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#31aba3] to-[#2da096] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:shadow-[#31aba3]/20"
                    onClick={() => {
                      window.location.href =
                        "mailto:hello@odis.ai?subject=Demo Request&body=Hi, I'd like to schedule a demo to learn more about OdisAI for my veterinary practice.";
                    }}
                  >
                    <span className="flex items-center gap-2">
                      Book Your Demo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </ShimmerButton>

                  <a
                    href="tel:+1234567890"
                    className="border-border bg-background/50 inline-flex items-center justify-center gap-2 rounded-full border px-8 py-4 text-base font-medium backdrop-blur-sm transition-all hover:border-[#31aba3]/50 hover:bg-[#31aba3]/5"
                  >
                    Or call us directly
                  </a>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                <strong className="text-foreground">
                  No commitment required.
                </strong>{" "}
                See if it&apos;s a good fit first.
              </p>
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
          <p className="text-muted-foreground mb-6 text-sm font-medium">
            Trusted by 100+ veterinary clinics
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
            {/* Integration logos placeholder */}
            <div className="text-muted-foreground text-xs">IDEXX</div>
            <div className="text-muted-foreground text-xs">ezyVet</div>
            <div className="text-muted-foreground text-xs">Cornerstone</div>
            <div className="text-muted-foreground text-xs">Avimark</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
