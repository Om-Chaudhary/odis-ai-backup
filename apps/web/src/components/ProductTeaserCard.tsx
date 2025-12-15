"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Play, Check, ArrowRight } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { cn } from "~/lib/utils";
import { NumberTicker } from "~/components/ui/number-ticker";
import { AnimatedGlassCard } from "~/components/ui/glass-card";
import { PhoneRingIcon } from "~/components/ui/phone-ring-icon";
import { LightRays } from "@odis-ai/ui/light-rays";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

// Feature bullets data - focused on follow-up calls
const FEATURES = [
  "Automate post-visit follow-up calls",
  "Reach every pet parent, every time",
  "Boost compliance & client retention",
];

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const scaleUpVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export function ProductTeaserCard() {
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

  // Base transition - using tuple type for bezier easing
  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen min-h-[700px] w-full items-center overflow-hidden"
    >
      {/* Enhanced Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/40 to-emerald-50/30" />

        {/* Animated gradient overlay - primary */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 40%, transparent 70%)",
            animation: "gradient-move 20s ease-in-out infinite",
          }}
        />

        {/* Animated gradient overlay - secondary */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 70% 60%, rgba(49, 171, 163, 0.10) 0%, rgba(49, 171, 163, 0.03) 50%, transparent 80%)",
            animation: "gradient-move-reverse 25s ease-in-out infinite",
          }}
        />

        {/* Floating accent orb - top left */}
        <div
          className="absolute top-1/4 left-[15%] h-[500px] w-[500px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 60%)",
            animation: "float-slow 12s ease-in-out infinite",
          }}
        />

        {/* Floating accent orb - bottom right */}
        <div
          className="absolute right-[10%] bottom-1/4 h-[400px] w-[400px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(49, 171, 163, 0.12) 0%, transparent 60%)",
            animation: "float-slow-reverse 15s ease-in-out infinite",
          }}
        />

        {/* Floating accent orb - center */}
        <div
          className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
            animation: "float-gentle 18s ease-in-out infinite",
          }}
        />

        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #31aba3 0.5px, transparent 0.5px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Radial glow behind content area */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(49, 171, 163, 0.08) 0%, transparent 60%)",
          }}
        />

        {/* Light Rays Effect */}
        <LightRays className="opacity-50" />

        {/* Subtle grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20">
          {/* Left Column - Content (55% on desktop) */}
          <div className="order-2 lg:order-1 lg:col-span-7">
            {/* Eyebrow Badge */}
            <motion.div
              variants={fadeUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.1 }}
            >
              <span className="inline-flex items-center rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-teal-700 uppercase backdrop-blur-sm">
                AI-Powered Client Communications
              </span>
            </motion.div>

            {/* Headline */}
            <div className="mt-6 space-y-2">
              <motion.h1
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.2 }}
                className="font-display-premium text-4xl leading-[1.1] font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] xl:text-6xl"
              >
                Never miss a follow-up.
              </motion.h1>
              <motion.p
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.35 }}
                className="font-display-premium text-3xl leading-[1.2] font-medium text-slate-500 sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
              >
                Your{" "}
                <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  AI assistant
                </span>{" "}
                for post-visit care calls.
              </motion.p>
            </div>

            {/* Feature Bullets */}
            <motion.ul
              className="mt-8 space-y-3 sm:mt-10"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.5,
                  },
                },
              }}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {FEATURES.map((feature, i) => (
                <motion.li
                  key={i}
                  variants={fadeUpVariant}
                  transition={transition}
                  className="flex items-center gap-3 text-base text-slate-600 sm:text-lg"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 shadow-sm shadow-teal-500/20">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </span>
                  {feature}
                </motion.li>
              ))}
            </motion.ul>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.8 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              {/* Primary CTA - Demo Phone */}
              <a
                href={DEMO_PHONE_TEL}
                onClick={handleDemoPhoneClick}
                aria-label={`Call demo line at ${DEMO_PHONE_NUMBER}`}
                className={cn(
                  "group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-7 py-4",
                  "bg-gradient-to-r from-teal-600 to-emerald-600",
                  "text-base font-semibold text-white shadow-lg shadow-teal-500/25",
                  "transition-all duration-300 ease-out",
                  "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                {/* Glow effect on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative flex items-center gap-3">
                  <PhoneRingIcon
                    size={18}
                    ringing
                    className="group-hover:animate-phone-ring"
                  />
                  <span>Try Demo: {DEMO_PHONE_NUMBER}</span>
                </span>
              </a>

              {/* Secondary CTA - Watch Demo */}
              <a
                href="#demo-video"
                onClick={handleWatchDemoClick}
                aria-label="Watch a 2-minute product demo video"
                className={cn(
                  "group inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-4",
                  "border border-slate-200 bg-white/80 backdrop-blur-sm",
                  "text-base font-semibold text-slate-700",
                  "transition-all duration-300 ease-out",
                  "hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-teal-100">
                  <Play className="h-3.5 w-3.5 fill-current text-slate-600 group-hover:text-teal-600" />
                </span>
                <span>Watch 2-min demo</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>

          {/* Right Column - Visual (45% on desktop) */}
          <div className="relative order-1 mx-auto w-full max-w-md px-8 sm:px-12 lg:order-2 lg:col-span-5 lg:max-w-none lg:px-0">
            <motion.div
              variants={scaleUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.4 }}
              className="relative"
            >
              {/* Hero Image Container */}
              <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl ring-1 shadow-slate-900/15 ring-slate-900/5">
                  <Image
                    src="/images/warm-veterinary-clinic-reception-with-phone-and-ha.jpg"
                    alt="Friendly veterinary receptionist greeting pet parents"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 45vw"
                  />
                  {/* Subtle gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent" />
                </div>
              </div>

              {/* Floating Stat Card - Follow-up Rate (Top Right) */}
              <AnimatedGlassCard
                floating
                floatDuration={3.5}
                floatDistance={10}
                initial={{ opacity: 0, x: 30, y: -20 }}
                animate={
                  isInView
                    ? { opacity: 1, x: 0, y: 0 }
                    : { opacity: 0, x: 30, y: -20 }
                }
                transition={{ ...transition, delay: 0.8 }}
                className="absolute -top-2 right-0 z-10 p-3 sm:-top-4 sm:-right-4 sm:p-4 lg:-top-6 lg:-right-8 xl:-right-12"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10">
                    <span className="text-lg font-bold text-teal-600">
                      <NumberTicker value={98} className="text-teal-600" />%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Follow-up rate
                    </p>
                    <p className="text-xs text-slate-500">
                      Every patient reached
                    </p>
                  </div>
                </div>
              </AnimatedGlassCard>

              {/* Floating Stat Card - Compliance (Bottom Left) */}
              <AnimatedGlassCard
                floating
                floatDuration={4}
                floatDistance={8}
                initial={{ opacity: 0, x: -30, y: 20 }}
                animate={
                  isInView
                    ? { opacity: 1, x: 0, y: 0 }
                    : { opacity: 0, x: -30, y: 20 }
                }
                transition={{ ...transition, delay: 1.0 }}
                className="absolute -bottom-2 left-0 z-10 p-3 sm:-bottom-4 sm:-left-4 sm:p-4 lg:-bottom-6 lg:-left-8 xl:-left-12"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                    <span className="text-lg font-bold text-emerald-600">
                      <NumberTicker value={3} className="text-emerald-600" />x
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Better compliance
                    </p>
                    <p className="text-xs text-slate-500">vs. manual calls</p>
                  </div>
                </div>
              </AnimatedGlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
