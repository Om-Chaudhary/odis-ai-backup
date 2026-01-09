"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { Calendar, Play } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { usePageLoaded } from "~/hooks/use-page-loaded";
import { Logo } from "@odis-ai/shared/ui/Logo";
import { WordRotate } from "../ui/word-rotate";
import { AnimatedGradientText } from "../ui/animated-gradient-text";
import { DotPattern } from "@odis-ai/shared/ui";

// Rotating words for dynamic headline - benefit-focused
const ROTATING_WORDS = [
  "Never Misses a Call",
  "Saves 10+ Hours Weekly",
  "Works 24/7",
  "Books More Appointments",
];

// Animation variants - slower, more noticeable
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

  const handleScheduleDemoClick = () => {
    posthog?.capture("schedule_demo_clicked", {
      location: "hero_secondary_cta",
    });
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate flex min-h-screen w-full flex-col overflow-hidden bg-teal-950"
    >
      {/* Background: Hero image - base layer */}
      <img
        alt=""
        src="/images/hero/bg.png"
        className="absolute inset-0 -z-20 size-full object-cover object-center opacity-70"
      />

      {/* Primary gradient overlay - stronger on left for text area */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-teal-950/95 via-teal-900/80 to-teal-950/50" />

      {/* Vertical gradient for depth and vignette effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-teal-950/40 via-transparent to-teal-950/70" />

      {/* Radial gradient for center focus - spotlight effect */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,transparent_20%,rgba(4,47,46,0.6)_100%)]" />

      {/* Noise texture overlay for premium feel */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Dot pattern - teal tinted */}
      <DotPattern
        width={32}
        height={32}
        cx={1}
        cy={1}
        cr={0.8}
        className={cn(
          "mask-[linear-gradient(to_bottom,black,transparent_60%)]",
          "-z-10 fill-teal-400/8",
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
            <Logo size="lg" className="h-8 w-8 drop-shadow-lg" />
            <span className="font-display text-xl font-semibold tracking-tight text-white drop-shadow-md">
              OdisAI
            </span>
          </div>
          <Link
            href="/demo"
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-medium",
              "bg-white/95 text-teal-900 backdrop-blur-sm",
              "shadow-lg shadow-teal-950/20",
              "transition-all duration-300",
              "hover:scale-[1.02] hover:bg-white hover:shadow-xl hover:shadow-teal-950/25",
            )}
          >
            Book Demo
          </Link>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        {/* Subtle ambient glow behind content */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[100px]"
          aria-hidden="true"
        />

        {/* Centered Content */}
        <motion.div
          className="-mt-16 flex w-full max-w-5xl flex-col items-center text-center sm:-mt-20"
          variants={containerVariants}
          initial="hidden"
          animate={shouldAnimate ? "visible" : "hidden"}
        >
          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-5xl leading-[1.08] font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)] sm:text-6xl lg:text-7xl"
          >
            Your AI Assistant <br className="hidden sm:block" />
            <WordRotate
              words={ROTATING_WORDS}
              duration={4000}
              className="text-teal-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
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
            className="mt-8 max-w-3xl text-lg leading-relaxed text-teal-50/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.15)] sm:text-xl sm:leading-8"
          >
            Enterprise Veterinary AI voice assistance that picks up every call,
            follows-up with every client, and{" "}
            <AnimatedGradientText
              speed={2}
              colorFrom="#5eead4"
              colorVia="#99f6e4"
              colorTo="#a7f3d0"
              className="font-semibold"
            >
              free your team to focus on in-clinic care.
            </AnimatedGradientText>
          </motion.p>

          {/* CTA Buttons - Centered */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
          >
            {/* Primary CTA - Schedule Demo */}
            <Link
              href="/demo"
              onClick={handleScheduleDemoClick}
              className={cn(
                "group relative inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4",
                "bg-white text-teal-900",
                "text-base font-semibold",
                "shadow-xl shadow-teal-950/30",
                "transition-all duration-300",
                "hover:scale-[1.03] hover:bg-white hover:shadow-2xl hover:shadow-teal-400/25",
                "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-900 focus-visible:outline-none",
              )}
            >
              {/* Glow effect on hover */}
              <span className="pointer-events-none absolute inset-0 rounded-full bg-white opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30" />
              <Calendar className="relative h-5 w-5 shrink-0" />
              <span className="relative">Schedule Demo</span>
            </Link>

            {/* Secondary CTA - Hear Odis */}
            <a
              href="#sample-calls"
              className={cn(
                "group relative inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4",
                "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm",
                "text-base font-semibold",
                "transition-all duration-300",
                "hover:bg-white/15 hover:shadow-lg hover:shadow-teal-400/10 hover:ring-white/30",
                "focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-900 focus-visible:outline-none",
              )}
            >
              <Play className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span>Hear Odis</span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade for smooth transition */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-teal-950 to-transparent" />
    </section>
  );
}
