"use client";

import { useRef } from "react";
import {
  m,
  LazyMotion,
  domAnimation,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Link2,
  Settings,
  Rocket,
  Check,
  Sparkles,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { cn } from "@odis-ai/shared/util";

const steps = [
  {
    icon: Link2,
    step: "01",
    title: "Connect Your Systems",
    description:
      "We plug into your PIMS (IDEXX Neo, ezyVet, Cornerstone) and phone system. Takes 30 minutes.",
    highlights: [
      "No IT work required",
      "Real-time calendar sync",
      "Secure & HIPAA compliant",
    ],
    color: "teal",
  },
  {
    icon: Settings,
    step: "02",
    title: "We Train Odis For You",
    description:
      "Our team configures Odis with your services, hours, protocols, and voice preferences. You approve before go-live.",
    highlights: [
      "Custom to your clinic",
      "Your rules & workflows",
      "Test calls before launch",
    ],
    color: "emerald",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Go Live in 48 Hours",
    description:
      "Odis starts answering after-hours calls and making discharge follow-ups. Track results in your dashboard.",
    highlights: [
      "24/7 inbound coverage",
      "Automated discharge calls",
      "Real-time analytics",
    ],
    color: "cyan",
  },
];

interface TimelineStepProps {
  step: (typeof steps)[0];
  index: number;
  shouldReduceMotion: boolean | null;
}

const TimelineStep = ({
  step,
  index,
  shouldReduceMotion,
}: TimelineStepProps) => {
  const Icon = step.icon;
  const isEven = index % 2 === 0;
  const stepRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(stepRef, { once: true, margin: "-80px" });

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.7,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <div ref={stepRef} className="relative">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_100px_1fr] md:items-center md:gap-8">
        {/* Left Content (even indexes) */}
        <m.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...transition, delay: 0.2 }}
          className={cn("flex", isEven ? "justify-end" : "invisible")}
        >
          {isEven && <TimelineCard step={step} Icon={Icon} alignment="right" />}
        </m.div>

        {/* Center Node */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Top connector */}
          {index > 0 && (
            <m.div
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0 }}
              className="absolute -top-8 h-8 w-[2px] origin-top bg-gradient-to-b from-teal-300/50 to-teal-500"
            />
          )}

          {/* Node circle */}
          <m.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ ...transition, delay: 0.1 }}
            className="group relative z-10"
          >
            {/* Animated glow */}
            <m.div
              animate={
                isInView
                  ? {
                      scale: [1, 1.5, 1],
                      opacity: [0.4, 0, 0.4],
                    }
                  : {}
              }
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              }}
              className="absolute inset-0 rounded-full bg-teal-500/40"
            />

            {/* Main circle */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-teal-500/40 bg-gradient-to-br from-white via-teal-50/80 to-emerald-50/80 shadow-xl shadow-teal-500/20 transition-all duration-500 group-hover:border-teal-500/60 group-hover:shadow-2xl group-hover:shadow-teal-500/30">
              <Icon className="h-7 w-7 text-teal-600 transition-transform duration-300 group-hover:scale-110" />

              {/* Step badge */}
              <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-bold text-white shadow-lg shadow-teal-500/30">
                {step.step}
              </div>
            </div>
          </m.div>

          {/* Bottom connector */}
          {index < steps.length - 1 && (
            <m.div
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.4,
                delay: 0.3,
              }}
              className="absolute -bottom-8 h-8 w-[2px] origin-top bg-gradient-to-b from-teal-500 to-teal-300/50"
            />
          )}
        </div>

        {/* Right Content (odd indexes) */}
        <m.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...transition, delay: 0.2 }}
          className={cn("flex", !isEven ? "justify-start" : "invisible")}
        >
          {!isEven && <TimelineCard step={step} Icon={Icon} alignment="left" />}
        </m.div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex gap-6">
          {/* Timeline column */}
          <div className="relative flex flex-col items-center">
            {/* Top connector */}
            {index > 0 && (
              <m.div
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  delay: 0,
                }}
                className="absolute -top-6 h-6 w-[2px] origin-top bg-gradient-to-b from-teal-300/50 to-teal-500"
              />
            )}

            {/* Node */}
            <m.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ ...transition, delay: 0.1 }}
              className="group relative z-10"
            >
              <m.div
                animate={
                  isInView ? { scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] } : {}
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-teal-500/40"
              />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-teal-500/40 bg-gradient-to-br from-white via-teal-50 to-emerald-50 shadow-lg shadow-teal-500/20">
                <Icon className="h-5 w-5 text-teal-600" />
                <div className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-[10px] font-bold text-white shadow-md">
                  {step.step}
                </div>
              </div>
            </m.div>

            {/* Bottom connector */}
            {index < steps.length - 1 && (
              <m.div
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  delay: 0.3,
                }}
                className="absolute -bottom-6 h-6 w-[2px] origin-top bg-gradient-to-b from-teal-500 to-teal-300/50"
              />
            )}
          </div>

          {/* Card */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...transition, delay: 0.15 }}
            className="flex-1 pb-4"
          >
            <TimelineCard step={step} Icon={Icon} alignment="left" isMobile />
          </m.div>
        </div>
      </div>
    </div>
  );
};

interface TimelineCardProps {
  step: (typeof steps)[0];
  Icon: React.ElementType;
  alignment: "left" | "right";
  isMobile?: boolean;
}

const TimelineCard = ({
  step,
  Icon,
  alignment,
  isMobile,
}: TimelineCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative w-full max-w-md",
        alignment === "right" && "text-right",
      )}
    >
      {/* Card background */}
      <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-900/[0.04] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-teal-200/80 hover:shadow-2xl hover:shadow-teal-500/[0.08] sm:p-6">
        {/* Hover gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-50/60 via-transparent to-emerald-50/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Corner accent */}
        <div
          className={cn(
            "absolute top-0 h-20 w-20 bg-gradient-to-br from-teal-500/[0.08] to-transparent",
            alignment === "right" ? "right-0" : "left-0",
          )}
        />

        <div className="relative z-10">
          {/* Header */}
          <div
            className={cn(
              "mb-3 flex items-center gap-3",
              alignment === "right" && "flex-row-reverse",
            )}
          >
            {!isMobile && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/10 to-emerald-500/10 transition-all duration-300 group-hover:from-teal-500/15 group-hover:to-emerald-500/15">
                <Icon className="h-4 w-4 text-teal-600" />
              </div>
            )}
            <h3 className="font-display text-lg font-semibold tracking-tight text-slate-800 sm:text-xl">
              {step.title}
            </h3>
          </div>

          {/* Description */}
          <p
            className={cn(
              "mb-4 text-sm leading-relaxed text-slate-500 sm:text-[15px]",
              alignment === "right" && "ml-auto",
              "max-w-[320px]",
            )}
          >
            {step.description}
          </p>

          {/* Highlights */}
          <div
            className={cn(
              "space-y-2",
              alignment === "right" && "flex flex-col items-end",
            )}
          >
            {step.highlights.map((highlight, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: alignment === "right" ? 15 : -15 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.4,
                  delay: 0.3 + i * 0.08,
                  ease: "easeOut",
                }}
                className={cn(
                  "flex items-center gap-2",
                  alignment === "right" && "flex-row-reverse",
                )}
              >
                <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 shadow-sm shadow-teal-500/25">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </div>
                <span className="text-[13px] font-medium text-slate-600">
                  {highlight}
                </span>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const HowItWorksSection = () => {
  const sectionVisibilityRef =
    useSectionVisibility<HTMLElement>("how-it-works");
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Scroll-linked timeline animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineProgress = useTransform(
    scrollYProgress,
    [0.15, 0.85],
    ["0%", "100%"],
  );

  const sectionRef = (el: HTMLElement | null) => {
    (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (
      sectionVisibilityRef as React.MutableRefObject<HTMLElement | null>
    ).current = el;
  };

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <section
        ref={sectionRef as React.LegacyRef<HTMLElement>}
        id="how-it-works"
        className="relative w-full overflow-hidden py-20 sm:py-24 md:py-32 lg:py-40"
      >
        <SectionBackground variant="cool-blue" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...transition, delay: 0.1 }}
            className="mb-16 text-center sm:mb-20 lg:mb-24"
          >
            {/* Badge */}
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ ...transition, delay: 0.15 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-gradient-to-r from-teal-50/90 to-emerald-50/90 px-4 py-1.5 shadow-lg shadow-teal-500/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              <span className="text-xs font-semibold tracking-wide text-teal-700 uppercase">
                How It Works
              </span>
            </m.div>

            <h2 className="font-display mb-5 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
              Live in{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  48 Hours
                </span>
                <m.span
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                  className="absolute -bottom-1.5 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                />
              </span>
            </h2>

            <p className="text-muted-foreground mx-auto max-w-xl text-base sm:text-lg">
              Get OdisAI answering calls for your clinic in days, not weeks.
            </p>
          </m.div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical progress line (desktop only) */}
            <div className="pointer-events-none absolute top-0 left-1/2 hidden h-full w-[2px] -translate-x-1/2 overflow-hidden rounded-full md:block">
              <div className="h-full w-full bg-teal-200/40" />
              <m.div
                style={{ height: lineProgress }}
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-teal-500 via-emerald-500 to-teal-400"
              />
            </div>

            {/* Steps */}
            <div className="relative space-y-10 md:space-y-16">
              {steps.map((step, index) => (
                <TimelineStep
                  key={index}
                  step={step}
                  index={index}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ))}
            </div>
          </div>

          {/* Footer with CTA */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...transition, delay: 0.7 }}
            className="mt-16 flex flex-col items-center gap-6 sm:mt-20"
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-teal-100/80 bg-gradient-to-br from-white/90 to-teal-50/60 px-6 py-4 shadow-xl shadow-teal-500/[0.05] backdrop-blur-sm sm:gap-5 sm:px-8">
              {[
                "No lengthy contracts",
                "Cancel anytime",
                "Free trial available",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 shadow-sm shadow-teal-500/25">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              href="/demo"
              className={cn(
                "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full px-7 py-3",
                "bg-gradient-to-r from-teal-600 to-emerald-600",
                "text-sm font-semibold text-white shadow-lg shadow-teal-500/25",
                "transition-all duration-300",
                "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30",
              )}
            >
              {/* Shimmer effect */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <Calendar className="relative h-4 w-4" />
              <span className="relative">Get Started Today</span>
            </Link>
          </m.div>
        </div>
      </section>
    </LazyMotion>
  );
};
