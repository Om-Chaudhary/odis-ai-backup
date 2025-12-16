"use client";

import { useRef, useMemo } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Play, ArrowRight } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { cn } from "~/lib/utils";
import { PhoneRingIcon } from "../ui/phone-ring-icon";
import { ScrollIndicator } from "../ui/scroll-indicator";
import { Logo } from "@odis-ai/ui/Logo";
import { WordRotate } from "../ui/word-rotate";
import { AnimatedGradientText } from "../ui/animated-gradient-text";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

// Rotating words for dynamic headline
const ROTATING_WORDS = [
  "Never Misses a Call",
  "Works While You Sleep",
  "Handles After-Hours",
  "Is Always Available",
];

// Feature bullets - simplified
const FEATURES = [
  "Answer every call, 24/7—even at 3am",
  "Automate discharge follow-ups & reminders",
  "Recover $12,000+/month in missed appointments",
];

// Animation variants - clean, subtle
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function HeroSection() {
  const posthog = usePostHog();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const handleDemoPhoneClick = () => {
    posthog?.capture("demo_phone_clicked", {
      location: "hero_primary_cta",
      phone_number: DEMO_PHONE_NUMBER,
    });
  };

  const handleWatchDemoClick = () => {
    posthog?.capture("watch_demo_clicked", {
      location: "hero_secondary_cta",
    });
  };

  const transition = useMemo(
    () => ({
      duration: shouldReduceMotion ? 0 : 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    }),
    [shouldReduceMotion],
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f8fafb]"
    >
      {/* Minimal Background - Single subtle gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 70% at 70% 20%, rgba(15, 118, 110, 0.06) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full px-4 pt-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="lg" className="h-8 w-8" />
            <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
              OdisAI
            </span>
          </div>
          <a
            href="mailto:hello@odis.ai?subject=Demo Request"
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-medium",
              "bg-slate-900 text-white",
              "transition-all duration-200",
              "hover:bg-slate-800",
            )}
          >
            Book Demo
          </a>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pt-8 pb-16 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content */}
          <motion.div
            className="order-1"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Your AI Receptionist
              <br />
              <WordRotate
                words={ROTATING_WORDS}
                duration={4000}
                className="text-teal-600"
                motionProps={{
                  initial: { opacity: 0, y: 12 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -12 },
                  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                }}
              />
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600"
            >
              <AnimatedGradientText
                speed={2}
                colorFrom="#0d9488"
                colorVia="#10b981"
                colorTo="#14b8a6"
                className="font-semibold"
              >
                Every call answered. Every pet parent reached.
              </AnimatedGradientText>{" "}
              <span className="font-semibold text-slate-700">24/7.</span>
            </motion.p>

            {/* Feature Bullets - Clean, minimal */}
            <motion.ul variants={itemVariants} className="mt-8 space-y-3">
              {FEATURES.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </motion.ul>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {/* Primary CTA */}
              <a
                href={DEMO_PHONE_TEL}
                onClick={handleDemoPhoneClick}
                aria-label={`Call demo line at ${DEMO_PHONE_NUMBER}`}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5",
                  "bg-teal-600 text-white",
                  "text-sm font-medium",
                  "transition-all duration-200",
                  "hover:bg-teal-700",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                <PhoneRingIcon size={16} ringing className="shrink-0" />
                <span>Try Demo: {DEMO_PHONE_NUMBER}</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column - Image */}
          <motion.div
            className="relative order-2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }
            }
            transition={{ ...transition, delay: 0.3 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-slate-200/50 ring-slate-200/50">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/hero/hero-1.png"
                  alt="Odis AI outbound calls dashboard showing patient follow-ups"
                  fill
                  className="object-cover object-center"
                  priority
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 60vw, 50vw"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center">
        <ScrollIndicator targetId="#features" label="Scroll" />
      </div>
    </section>
  );
}
