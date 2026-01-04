"use client";

import { useRef, useMemo } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { Calendar, Play } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { usePageLoaded } from "~/hooks/use-page-loaded";
import { PhoneRingIcon } from "../ui/phone-ring-icon";
import { ScrollIndicator } from "../ui/scroll-indicator";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { WordRotate } from "../ui/word-rotate";
import { AnimatedGradientText } from "../ui/animated-gradient-text";
import { HeroVideoDialog } from "~/components/ui/hero-video-dialog";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

// Rotating words for dynamic headline - benefit-focused
const ROTATING_WORDS = [
  "Never Misses a Call",
  "Saves 10+ Hours Weekly",
  "Works 24/7",
  "Books More Appointments",
];

// Feature bullets - quantified benefits
const FEATURES = [
  {
    text: "Save 10+ hours per week on discharge calls",
    highlight: "10+ hours",
  },
  { text: "94% first-attempt connection rate", highlight: "94%" },
  {
    text: "Recover $2,400+/month in missed appointments",
    highlight: "$2,400+",
  },
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
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pt-8 pb-16 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
          {/* Left Column - Content */}
          <motion.div
            className="order-1 lg:col-span-5"
            variants={containerVariants}
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
          >
            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]"
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
              className="mt-6 text-[1.0625rem] leading-relaxed text-slate-600"
            >
              AI voice calls that complete post-discharge check-ins, capture
              patient outcomes, and{" "}
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

            {/* Feature Bullets - With highlighted metrics */}
            <motion.ul variants={itemVariants} className="mt-7 space-y-3">
              {FEATURES.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[0.9375rem] text-slate-700"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span>
                    {feature.text
                      .split(feature.highlight)
                      .map((part, j, arr) => (
                        <span key={j}>
                          {part}
                          {j < arr.length - 1 && (
                            <span className="font-semibold text-teal-600">
                              {feature.highlight}
                            </span>
                          )}
                        </span>
                      ))}
                  </span>
                </li>
              ))}
            </motion.ul>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {/* Primary CTA - Schedule Demo */}
              <Link
                href="/demo"
                onClick={handleScheduleDemoClick}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3",
                  "bg-teal-600 text-white",
                  "text-sm font-medium",
                  "transition-all duration-200",
                  "hover:scale-[1.02] hover:bg-teal-700",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Schedule Demo</span>
              </Link>

              {/* Secondary CTA - See How It Works */}
              <a
                href="#sample-calls"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3",
                  "bg-white text-slate-700 ring-1 ring-slate-200",
                  "text-sm font-medium",
                  "transition-all duration-200",
                  "hover:bg-slate-50 hover:ring-slate-300",
                  "focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                <Play className="h-4 w-4 shrink-0" />
                <span>Hear Odis</span>
              </a>
            </motion.div>

            {/* Tertiary CTA - Try Now Phone */}
            <motion.div variants={itemVariants} className="mt-4">
              <a
                href={DEMO_PHONE_TEL}
                onClick={handleDemoPhoneClick}
                aria-label={`Call demo line at ${DEMO_PHONE_NUMBER}`}
                className={cn(
                  "inline-flex items-center gap-2 text-sm text-slate-600",
                  "transition-colors duration-200",
                  "hover:text-teal-600",
                )}
              >
                <PhoneRingIcon size={14} ringing className="shrink-0" />
                <span>
                  Try now:{" "}
                  <span className="font-medium">{DEMO_PHONE_NUMBER}</span>
                </span>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column - Video Demo */}
          <motion.div
            className="relative order-2 lg:col-span-7"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={
              shouldAnimate
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.96 }
            }
            transition={{ ...transition, delay: 0.4 }}
          >
            <HeroVideoDialog
              animationStyle="from-center"
              videoSrc="https://www.youtube-nocookie.com/embed/_EGLsdwlde8?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&color=white&autoplay=1"
              thumbnailSrc="https://img.youtube.com/vi/_EGLsdwlde8/maxresdefault.jpg"
              thumbnailAlt="OdisAI Demo - AI Voice Assistant for Veterinary Practices"
            />
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
