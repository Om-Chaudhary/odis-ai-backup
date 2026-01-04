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
            AI voice assistance that picks up every call, follows-up with every
            client, and{" "}
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

          {/* Feature Bullets - Centered */}
          {/* <motion.ul
            variants={itemVariants}
            className="mt-7 inline-flex flex-col items-start space-y-3 text-left"
          >
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
          </motion.ul> */}

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

        {/* Video Demo - Below Content */}
        <motion.div
          className="relative mt-16 w-full max-w-6xl lg:mt-20"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={
            shouldAnimate
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.96 }
          }
          transition={{ ...transition, delay: 0.4 }}
        >
          {/* Glassmorphic Background Container */}
          <div className="relative rounded-3xl bg-gradient-to-br from-teal-100 via-slate-200/90 to-cyan-100 p-6 shadow-2xl ring-1 shadow-slate-500/15 ring-slate-300/80 backdrop-blur-md sm:p-8 lg:p-12">
            {/* Glow Effects - Darker Accent */}
            <div className="pointer-events-none absolute -inset-2 rounded-3xl opacity-50 blur-3xl">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-teal-500/50 via-slate-400/40 to-cyan-500/50" />
            </div>

            {/* Inner Shadow for Depth */}
            <div className="absolute inset-0 rounded-3xl shadow-inner shadow-slate-900/5" />

            {/* Video Container */}
            <div className="relative rounded-2xl bg-white/60 shadow-2xl ring-1 shadow-slate-900/15 ring-slate-200/90 backdrop-blur-md">
              <HeroVideoDialog
                animationStyle="from-center"
                videoSrc="https://www.youtube-nocookie.com/embed/_EGLsdwlde8?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&color=white&autoplay=1"
                thumbnailSrc="https://img.youtube.com/vi/_EGLsdwlde8/maxresdefault.jpg"
                thumbnailAlt="OdisAI Demo - AI Voice Assistant for Veterinary Practices"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
