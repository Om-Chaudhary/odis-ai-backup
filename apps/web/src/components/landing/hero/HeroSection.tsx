"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Play, Check, ArrowRight } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { cn } from "~/lib/utils";
import { PhoneRingIcon } from "~/components/ui/phone-ring-icon";
import { LightRays } from "@odis-ai/ui/light-rays";
import { SafariFrame } from "~/components/ui/safari-frame";
import { ScrollIndicator } from "~/components/ui/scroll-indicator";
import { Logo } from "@odis-ai/ui/Logo";

const DEMO_PHONE_NUMBER = "(925) 678-5640";
const DEMO_PHONE_TEL = "tel:+19256785640";

// Feature bullets - comprehensive capabilities
const FEATURES = [
  "Answer every call, 24/7—even at 3am",
  "Automate discharge follow-ups & reminders",
  "Recover $12,000+/month in missed appointments",
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

  // Base transition - using tuple type for bezier easing
  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen min-h-[700px] w-full flex-col overflow-hidden"
    >
      {/* Ghost Navbar - Always visible in hero */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full px-4 pt-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="lg" className="h-8 w-8" />
            <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
              OdisAI
            </span>
          </div>
          <a
            href="mailto:hello@odis.ai?subject=Demo Request"
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold",
              "bg-slate-900 text-white",
              "transition-all duration-300",
              "hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20",
            )}
          >
            Book Demo
          </a>
        </div>
      </motion.nav>

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
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-start px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* Left Column - Content */}
          <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-6">
            {/* Headline */}
            <div className="mt-6 space-y-3">
              <motion.h1
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.2 }}
                className="font-display text-3xl leading-[1.15] font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
              >
                Your AI Receptionist That Never Takes a Day Off.
              </motion.h1>
              <motion.p
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.35 }}
                className="text-lg leading-relaxed font-medium text-slate-500 sm:text-xl lg:text-2xl"
              >
                Every call answered.{" "}
                <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Every pet parent reached.
                </span>{" "}
                24/7.
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
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {/* Primary CTA - Demo Phone */}
              <a
                href={DEMO_PHONE_TEL}
                onClick={handleDemoPhoneClick}
                aria-label={`Call demo line at ${DEMO_PHONE_NUMBER}`}
                className={cn(
                  "group relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 whitespace-nowrap sm:px-8",
                  "bg-gradient-to-r from-teal-600 to-emerald-600",
                  "text-sm font-semibold text-white shadow-lg shadow-teal-500/25 sm:text-base",
                  "transition-all duration-300 ease-out",
                  "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                {/* Glow effect on hover */}
                <span className="absolute inset-0 overflow-hidden rounded-full">
                  <span className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </span>
                <span className="relative flex items-center gap-2">
                  <PhoneRingIcon
                    size={16}
                    ringing
                    className="group-hover:animate-phone-ring shrink-0"
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
                  "group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 whitespace-nowrap sm:px-6",
                  "border border-slate-200 bg-white/80 backdrop-blur-sm",
                  "text-sm font-semibold text-slate-700 sm:text-base",
                  "transition-all duration-300 ease-out",
                  "hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700",
                  "focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-teal-100">
                  <Play className="h-3 w-3 fill-current text-slate-600 group-hover:text-teal-600" />
                </span>
                <span>Watch 2-min demo</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>

          {/* Right Column - Visual (positioned to the right) */}
          <div className="relative order-1 mx-auto w-full max-w-lg px-4 sm:max-w-xl sm:px-0 lg:order-2 lg:col-span-6 lg:ml-auto lg:max-w-[90%] xl:col-span-6">
            <motion.div
              variants={scaleUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.4 }}
              className="relative"
            >
              {/* Animated Glow Ring Behind Dashboard */}
              <div className="absolute -inset-4 sm:-inset-6 lg:-inset-8">
                {/* Primary glow layer */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-60 blur-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(49, 171, 163, 0.3) 50%, rgba(16, 185, 129, 0.4) 100%)",
                    animation: "glow-pulse 4s ease-in-out infinite",
                  }}
                />
                {/* Secondary rotating glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-40 blur-3xl"
                  style={{
                    background:
                      "conic-gradient(from 0deg, rgba(16, 185, 129, 0.3), rgba(49, 171, 163, 0.4), rgba(52, 211, 153, 0.3), rgba(16, 185, 129, 0.3))",
                    animation: "glow-rotate 8s linear infinite",
                  }}
                />
                {/* Inner highlight ring */}
                <div
                  className="absolute inset-2 rounded-xl opacity-50 blur-xl"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.2) 50%, rgba(49, 171, 163, 0.3) 100%)",
                    animation: "glow-pulse 3s ease-in-out infinite reverse",
                  }}
                />
              </div>

              {/* Safari Frame with Product UI */}
              <SafariFrame
                url="app.odis.ai/dashboard"
                className="relative mx-auto shadow-2xl ring-1 shadow-teal-500/20 ring-white/50"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src="/images/hero/hero-dashboard.png"
                    alt="Odis AI outbound calls dashboard showing patient follow-ups"
                    fill
                    className="object-cover object-left-top"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 55vw"
                  />
                </div>
              </SafariFrame>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Bottom center of hero */}
      <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center">
        <ScrollIndicator targetId="#features" label="Scroll" />
      </div>
    </section>
  );
}
