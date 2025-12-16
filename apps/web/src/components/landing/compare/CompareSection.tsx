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
import { SectionBackground } from "~/components/ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";

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
      <div className="mt-1 text-xs text-white/75 sm:text-sm">{label}</div>
    </motion.div>
  );
}

export const CompareSection = () => {
  const sectionVisibilityRef = useSectionVisibility<HTMLElement>("stats");
  const localRef = useRef<HTMLElement>(null);
  const isInView = useInView(localRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Combine refs for both visibility tracking and animation
  const sectionRef = (el: HTMLElement | null) => {
    (localRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (
      sectionVisibilityRef as React.MutableRefObject<HTMLElement | null>
    ).current = el;
  };

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
      ref={sectionRef as React.LegacyRef<HTMLElement>}
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Subtle dark background - soft navy/slate with smooth transitions */}
      <SectionBackground variant="subtle-dark" />

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
            className="font-display mb-4 text-2xl font-medium tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
          >
            What changes with OdisAI
          </motion.h2>
          <motion.p
            variants={fadeUpVariant}
            className="mx-auto max-w-xl text-base text-white/80 sm:text-lg"
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
          <p className="text-sm text-white/70 sm:text-base">
            Trusted by{" "}
            <span className="font-medium text-white/90">
              150+ veterinary clinics
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
