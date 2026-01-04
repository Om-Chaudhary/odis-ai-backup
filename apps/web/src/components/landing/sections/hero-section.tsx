"use client";

import { useRef, useMemo } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { Calendar, Play } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { usePageLoaded } from "~/hooks/use-page-loaded";
import { PhoneRingIcon } from "../ui/phone-ring-icon";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { WordRotate } from "../ui/word-rotate";
import { AnimatedGradientText } from "../ui/animated-gradient-text";
import { DotPattern } from "@odis-ai/shared/ui";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

// Rotating words for dynamic headline - benefit-focused
const ROTATING_WORDS = [
  "Never Misses a Call",
  "Saves 10+ Hours Weekly",
  "Works 24/7",
  "Books More Appointments",
];

// Animation variants - slower, more noticeable
// Increased durations and stagger for better visual impact
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function HeroSection() {
  const posthog = usePostHog();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const isPageLoaded = usePageLoaded(150); // Wait for page load + 150ms
  const shouldReduceMotion = useReducedMotion();

  // Only start animations once page is loaded AND section is in view
  const shouldAnimate = isPageLoaded && isInView;

  const handleDemoPhoneClick = () => {
    posthog?.capture("demo_phone_clicked", {
      location: "hero_primary_cta",
      phone_number: DEMO_PHONE_NUMBER,
    });
  };

  const handleScheduleDemoClick = () => {
    posthog?.capture("schedule_demo_clicked", {
      location: "hero_secondary_cta",
    });
  };

  const transition = useMemo(
    () => ({
      duration: shouldReduceMotion ? 0 : 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    }),
    [shouldReduceMotion],
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f8fafb]"
    >
      {/* Subtle Dot Pattern Background */}
      <DotPattern
        width={30}
        height={30}
        cx={1}
        cy={1}
        cr={0.8}
        className={cn(
          "[mask-image:linear-gradient(to_bottom,white,transparent_60%)]",
          "fill-blue-300/50",
        )}
      />

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full px-4 pt-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="lg" className="h-8 w-8" />
            <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
              OdisAI
            </span>
          </div>
          <Link
            href="/demo"
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-medium",
              "bg-slate-900 text-white",
              "transition-all duration-200",
              "hover:bg-slate-800",
            )}
          >
            Book Demo
          </Link>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        {/* Centered Content */}
        <motion.div
          className="flex w-full max-w-5xl flex-col items-center text-center"
          variants={containerVariants}
          initial="hidden"
          animate={shouldAnimate ? "visible" : "hidden"}
        >
          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-5xl leading-[1.08] font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
          >
            Your AI Assistant <br className="hidden sm:block" />
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
            className="mt-8 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl sm:leading-8"
          >
            Enterprise Veterinary AI voice assistance that picks up every call,
            follows-up with every client, and{" "}
            <AnimatedGradientText
              speed={2}
              colorFrom="#0d9488"
              colorVia="#10b981"
              colorTo="#14b8a6"
              className="font-semibold"
            >
              free your team to focus on in-clinic care.
            </AnimatedGradientText>
          </motion.p>
          {/* CTA Buttons - Centered */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4"
          >
            {/* Primary CTA - Schedule Demo */}
            <Link
              href="/demo"
              onClick={handleScheduleDemoClick}
              className={cn(
                "inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4",
                "bg-teal-600 text-white",
                "text-base font-semibold",
                "transition-all duration-200",
                "hover:scale-[1.02] hover:bg-teal-700",
                "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
            >
              <Calendar className="h-5 w-5 shrink-0" />
              <span>Schedule Demo</span>
            </Link>

            {/* Secondary CTA - See How It Works */}
            <a
              href="#sample-calls"
              className={cn(
                "inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4",
                "bg-white text-slate-700 ring-1 ring-slate-200",
                "text-base font-semibold",
                "transition-all duration-200",
                "hover:bg-slate-50 hover:ring-slate-300",
                "focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
            >
              <Play className="h-5 w-5 shrink-0" />
              <span>Hear Odis</span>
            </a>
          </motion.div>

          {/* Tertiary CTA - Try Now Phone */}
          <motion.div variants={itemVariants} className="mt-6">
            <a
              href={DEMO_PHONE_TEL}
              onClick={handleDemoPhoneClick}
              aria-label={`Call demo line at ${DEMO_PHONE_NUMBER}`}
              className={cn(
                "inline-flex items-center gap-2 text-base text-slate-600",
                "transition-colors duration-200",
                "hover:text-teal-600",
              )}
            >
              <PhoneRingIcon size={16} ringing className="shrink-0" />
              <span>
                Try now:{" "}
                <span className="font-medium">{DEMO_PHONE_NUMBER}</span>
              </span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
