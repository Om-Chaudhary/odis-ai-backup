"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { PhoneOff, Clock, TrendingDown, ArrowDown } from "lucide-react";
import { SectionBackground } from "../ui/section-background";
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
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

// Pain points data
const PAIN_POINTS = [
  {
    icon: Clock,
    stat: "3+ hours",
    title: "Lost to Phone Tag",
    description:
      "Staff spend hours on hold, leaving voicemails that go unanswered. Every missed connection is time away from pets in the clinic.",
  },
  {
    icon: PhoneOff,
    stat: "30%",
    title: "Calls Never Happen",
    description:
      "Post-discharge follow-ups fall through the cracks when the clinic gets busy. Compliance suffers, and pet parents feel forgotten.",
  },
  {
    icon: TrendingDown,
    stat: "$2,400+",
    title: "Revenue Left on the Table",
    description:
      "Missed follow-ups mean missed appointments. Every unreached pet parent is a potential recheck, medication refill, or wellness visit lost.",
  },
];

export function ProblemSection() {
  const sectionVisibilityRef = useSectionVisibility<HTMLElement>("problem");
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

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef as React.LegacyRef<HTMLElement>}
      id="problem"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Subtle warm background */}
      <SectionBackground variant="subtle-warm" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="font-display mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest text-amber-600 uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            The Challenge
          </span>
          <h2 className="font-display mb-4 text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
            Discharge Follow-Up is{" "}
            <span className="text-amber-600">Broken</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
            Every veterinary practice knows the struggle. When the clinic gets
            busy, follow-up calls are the first thing to slip.
          </p>
        </motion.div>

        {/* Pain Points Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid gap-6 md:grid-cols-3 lg:gap-8"
        >
          {PAIN_POINTS.map((point) => (
            <motion.div
              key={point.title}
              variants={cardVariant}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/10"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition-transform duration-300 group-hover:scale-110">
                <point.icon className="h-6 w-6" />
              </div>

              {/* Stat */}
              <div className="font-display mb-2 text-3xl font-bold text-slate-900">
                {point.stat}
              </div>

              {/* Title */}
              <h3 className="font-display mb-2 text-lg font-semibold text-slate-800">
                {point.title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed text-slate-600">
                {point.description}
              </p>

              {/* Decorative gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </motion.div>
          ))}
        </motion.div>

        {/* Transition to Solution */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.6 }}
          className="mt-12 text-center lg:mt-16"
        >
          <p className="mb-4 text-lg font-medium text-slate-700">
            There&apos;s a better way.
          </p>
          <a
            href="#sample-calls"
            className="inline-flex items-center gap-2 text-teal-600 transition-colors hover:text-teal-700"
          >
            <span className="text-sm font-medium">
              See how Odis solves this
            </span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
