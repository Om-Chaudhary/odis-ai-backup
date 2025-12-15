"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  Phone,
  Calendar,
  CheckCircle2,
  Star,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SectionBackground } from "~/components/ui/section-background";
import { NumberTicker } from "~/components/ui/number-ticker";
import { cn } from "~/lib/utils";

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const statVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const transformVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

interface LiveStatProps {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
  decimals?: number;
  isInView: boolean;
  shouldReduceMotion: boolean | null;
}

function LiveStat({
  icon: Icon,
  value,
  suffix = "",
  label,
  decimals = 0,
  isInView,
  shouldReduceMotion,
}: LiveStatProps) {
  return (
    <motion.div
      variants={statVariant}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex flex-col items-center text-center"
    >
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-white/20">
        <Icon className="h-5 w-5 text-teal-300" />
      </div>
      <div className="font-display text-2xl font-bold text-white tabular-nums sm:text-3xl">
        {isInView && (
          <NumberTicker
            value={value}
            decimalPlaces={decimals}
            className="text-white"
          />
        )}
        <span className="text-teal-300">{suffix}</span>
      </div>
      <div className="mt-0.5 text-xs text-white/60 sm:text-sm">{label}</div>
    </motion.div>
  );
}

interface TransformItemProps {
  beforeValue: string;
  beforeLabel: string;
  afterValue: string | number;
  afterSuffix?: string;
  afterLabel: string;
  progress: number;
  accentColor: string;
  glowColor: string;
  isInView: boolean;
  shouldReduceMotion: boolean | null;
  index: number;
}

function TransformItem({
  beforeValue,
  beforeLabel,
  afterValue,
  afterSuffix = "",
  afterLabel,
  progress,
  accentColor,
  glowColor,
  isInView,
  shouldReduceMotion,
  index,
}: TransformItemProps) {
  return (
    <motion.div
      variants={transformVariant}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative"
    >
      {/* Main container with glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all duration-500 hover:border-white/20 hover:bg-white/10">
        {/* Animated glow on hover */}
        <div
          className={cn(
            "absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100",
            glowColor,
          )}
        />

        <div className="relative">
          {/* Before/After Row */}
          <div className="mb-4 flex items-center justify-between">
            {/* Before */}
            <div className="flex-1">
              <div className="mb-1 text-[10px] font-medium tracking-wider text-white/40 uppercase">
                Before
              </div>
              <div className="font-display text-lg font-medium text-white/50 line-through decoration-white/30">
                {beforeValue}
              </div>
              <div className="text-xs text-white/30">{beforeLabel}</div>
            </div>

            {/* Animated Arrow/Sparkle */}
            <div className="mx-4 flex flex-col items-center">
              <motion.div
                animate={
                  isInView
                    ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  accentColor,
                )}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
            </div>

            {/* After */}
            <div className="flex-1 text-right">
              <div
                className={cn(
                  "mb-1 text-[10px] font-medium tracking-wider uppercase",
                  accentColor.replace("bg-", "text-").replace("/20", ""),
                )}
              >
                With OdisAI
              </div>
              <div className="font-display text-xl font-bold text-white sm:text-2xl">
                {typeof afterValue === "number" && isInView ? (
                  <>
                    <NumberTicker value={afterValue} className="text-white" />
                    <span
                      className={cn(
                        accentColor.replace("bg-", "text-").replace("/20", ""),
                      )}
                    >
                      {afterSuffix}
                    </span>
                  </>
                ) : (
                  <>
                    {afterValue}
                    <span
                      className={cn(
                        accentColor.replace("bg-", "text-").replace("/20", ""),
                      )}
                    >
                      {afterSuffix}
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-white/60">{afterLabel}</div>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: `${progress}%` } : { width: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 1.5,
                delay: 0.5 + index * 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                accentColor.replace("/20", ""),
              )}
            />
            {/* Shimmer effect */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={isInView ? { x: "200%" } : { x: "-100%" }}
              transition={{
                duration: 1.5,
                delay: 1.5 + index * 0.2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const CompareSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const liveStats = [
    { icon: Phone, value: 847, label: "Calls handled", suffix: "" },
    { icon: Calendar, value: 126, label: "Appointments", suffix: "" },
    { icon: CheckCircle2, value: 94, label: "Answer rate", suffix: "%" },
    {
      icon: Star,
      value: 4.9,
      label: "Satisfaction",
      suffix: "/5",
      decimals: 1,
    },
  ];

  const transformations = [
    {
      beforeValue: "23%",
      beforeLabel: "calls missed",
      afterValue: 100,
      afterSuffix: "%",
      afterLabel: "calls answered",
      progress: 100,
      accentColor: "bg-teal-500/20",
      glowColor: "bg-teal-500/20",
    },
    {
      beforeValue: "$0",
      beforeLabel: "after-hours revenue",
      afterValue: "$12k",
      afterSuffix: "",
      afterLabel: "monthly recovered",
      progress: 85,
      accentColor: "bg-emerald-500/20",
      glowColor: "bg-emerald-500/20",
    },
    {
      beforeValue: "2hrs",
      beforeLabel: "manual work",
      afterValue: "5min",
      afterSuffix: "",
      afterLabel: "automated",
      progress: 96,
      accentColor: "bg-cyan-500/20",
      glowColor: "bg-cyan-500/20",
    },
  ];

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-20 lg:py-28"
    >
      <SectionBackground variant="accent-warm" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Unified Dark Container */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
        >
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
            {/* Decorative elements */}
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
              {/* Section Header */}
              <div className="mb-12 text-center lg:mb-14">
                <motion.span
                  variants={fadeUpVariant}
                  className="mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-teal-400 uppercase"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                  Real Results
                </motion.span>
                <motion.h2
                  variants={fadeUpVariant}
                  className="font-display mb-3 text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl"
                >
                  What changes with OdisAI
                </motion.h2>
                <motion.p
                  variants={fadeUpVariant}
                  className="mx-auto max-w-md text-sm text-white/50 sm:text-base"
                >
                  Average results per clinic in the last 30 days
                </motion.p>
              </div>

              {/* Stats Grid */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8 lg:mb-14"
              >
                {liveStats.map((stat) => (
                  <LiveStat
                    key={stat.label}
                    icon={stat.icon}
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                    decimals={stat.decimals}
                    isInView={isInView}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ))}
              </motion.div>

              {/* Visual Connector */}
              <div className="relative mb-8 flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60">
                  <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                  The transformation
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* Transformation Items */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="grid gap-4 sm:grid-cols-3"
              >
                {transformations.map((item, index) => (
                  <TransformItem
                    key={item.afterLabel}
                    {...item}
                    isInView={isInView}
                    shouldReduceMotion={shouldReduceMotion}
                    index={index}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Social Proof - Outside the card */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-500">
            Trusted by{" "}
            <span className="font-semibold text-slate-700">
              150+ veterinary clinics
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
