"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  Phone,
  Calendar,
  CheckCircle2,
  Star,
  type LucideIcon,
} from "lucide-react";
import { NumberTicker } from "~/components/ui/number-ticker";

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
      <Icon className="mb-3 h-6 w-6 text-teal-400 transition-transform duration-300 group-hover:scale-110" />
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
      <div className="mt-1 text-xs text-white/60 sm:text-sm">{label}</div>
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

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-24 lg:py-32"
    >
      {/* Soft radial dark gradient - flows naturally with surrounding light sections */}
      <div className="pointer-events-none absolute inset-0">
        {/* Main radial "pool" of dark - soft edges fade to transparent */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 130% 90% at 50% 50%, 
                rgba(15, 32, 39, 0.82) 0%,
                rgba(18, 38, 45, 0.65) 35%,
                rgba(24, 48, 56, 0.4) 55%,
                rgba(32, 58, 68, 0.18) 72%,
                transparent 100%
              )
            `,
          }}
        />

        {/* Secondary radial for depth - slightly offset */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 70% at 50% 55%, 
                rgba(20, 40, 48, 0.5) 0%,
                rgba(25, 50, 58, 0.25) 40%,
                transparent 75%
              )
            `,
          }}
        />

        {/* Animated teal glow - top right */}
        <div
          className="absolute -top-10 right-[8%] h-[450px] w-[450px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(49, 171, 163, 0.12) 0%, transparent 55%)",
            animation: "float-slow 14s ease-in-out infinite",
          }}
        />

        {/* Animated teal glow - bottom left */}
        <div
          className="absolute -bottom-10 left-[8%] h-[400px] w-[400px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(49, 171, 163, 0.10) 0%, transparent 55%)",
            animation: "float-slow-reverse 16s ease-in-out infinite",
          }}
        />

        {/* Center teal accent - subtle glow */}
        <div
          className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%)",
            animation: "float-gentle 20s ease-in-out infinite",
          }}
        />

        {/* Subtle teal-tinted dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(49, 171, 163, 0.6) 0.5px, transparent 0.5px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-16 text-center lg:mb-20"
        >
          <motion.span
            variants={fadeUpVariant}
            className="font-display mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest text-teal-400 uppercase"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
            Real Results
          </motion.span>
          <motion.h2
            variants={fadeUpVariant}
            className="font-display mb-4 text-4xl font-medium tracking-tight text-white lg:text-5xl"
          >
            What changes with OdisAI
          </motion.h2>
          <motion.p
            variants={fadeUpVariant}
            className="mx-auto max-w-xl text-base text-white/60 sm:text-lg"
          >
            Average results per clinic in the last 30 days
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8"
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

        {/* Social Proof */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.6 }}
          className="mt-16 text-center lg:mt-20"
        >
          <p className="text-sm text-white/50 sm:text-base">
            Trusted by{" "}
            <span className="font-medium text-white/80">
              150+ veterinary clinics
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
