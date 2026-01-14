"use client";

import { useRef, type Ref } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Clock,
  DollarSign,
  ArrowRight,
  Users,
  Calendar,
  Stethoscope,
} from "lucide-react";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { NumberTicker } from "../ui/number-ticker";
import { cn } from "@odis-ai/shared/util";

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

interface MissedOpportunityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
  delay: number;
  accentColor: "red" | "amber" | "orange";
}

function MissedOpportunityCard({
  icon,
  title,
  description,
  stat,
  statLabel,
  delay,
  accentColor,
}: MissedOpportunityCardProps) {
  const colorClasses = {
    red: {
      bg: "from-red-500/10 to-rose-500/5",
      border: "border-red-200/60",
      icon: "from-red-500 to-rose-600",
      stat: "text-red-600",
      accent: "bg-red-500/10",
    },
    amber: {
      bg: "from-amber-500/10 to-orange-500/5",
      border: "border-amber-200/60",
      icon: "from-amber-500 to-orange-600",
      stat: "text-amber-600",
      accent: "bg-amber-500/10",
    },
    orange: {
      bg: "from-orange-500/10 to-red-500/5",
      border: "border-orange-200/60",
      icon: "from-orange-500 to-red-600",
      stat: "text-orange-600",
      accent: "bg-orange-500/10",
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <motion.div
      variants={scaleInVariant}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        colors.bg,
        colors.border,
      )}
    >
      {/* Background accent */}
      <div
        className={cn(
          "absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-50 blur-3xl transition-opacity group-hover:opacity-70",
          colors.accent,
        )}
      />

      <div className="relative">
        {/* Icon */}
        <div
          className={cn(
            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
            colors.icon,
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          {description}
        </p>

        {/* Stat */}
        <div className="flex items-baseline gap-1.5">
          <span className={cn("text-2xl font-bold", colors.stat)}>{stat}</span>
          <span className="text-sm text-slate-500">{statLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function ProblemSection() {
  const sectionVisibilityRef = useSectionVisibility<HTMLElement>("problem");
  const localRef = useRef<HTMLElement>(null);
  const isInView = useInView(localRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const sectionRef = (el: HTMLElement | null) => {
    localRef.current = el;
    sectionVisibilityRef.current = el;
  };

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.7,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef as Ref<HTMLElement>}
      id="problem"
      className="relative w-full overflow-hidden py-20 sm:py-24 md:py-28 lg:py-36"
    >
      <SectionBackground variant="subtle-dark" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header - Impactful Statement */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-16 text-center lg:mb-20"
        >
          {/* Badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200/60 bg-red-50/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-red-700 uppercase backdrop-blur-sm">
            <PhoneOff className="h-3.5 w-3.5" />
            The Silent Revenue Killer
          </span>

          {/* Main Headline */}
          <h2 className="font-display mb-6 text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-tight">
            Every Day, Your Clinic Loses
            <br className="hidden sm:block" />
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                Thousands in Revenue
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-gradient-to-r from-red-500/30 via-orange-500/30 to-amber-500/30"
              />
            </span>
          </h2>

          {/* Supporting Text */}
          <p className="mx-auto max-w-2xl text-lg text-slate-600 sm:text-xl">
            While you're focused on patient care, missed calls are quietly
            sending clients—and their pets—to your competitors.
          </p>
        </motion.div>

        {/* Hero Stat - The Big Number */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.25 }}
          className="mb-16 text-center"
        >
          <div className="relative mx-auto inline-block">
            {/* Glow effect */}
            <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-r from-red-500/20 via-orange-500/20 to-amber-500/20 blur-3xl" />

            <div className="relative rounded-3xl border border-slate-200/60 bg-white/80 px-10 py-8 shadow-xl backdrop-blur-sm sm:px-16 sm:py-10">
              <p className="mb-2 text-sm font-medium tracking-wider text-slate-500 uppercase">
                Average Veterinary Clinic Misses
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <NumberTicker
                  value={47}
                  delay={0.4}
                  className="font-display text-6xl font-bold text-slate-900 sm:text-7xl md:text-8xl"
                />
                <span className="font-display text-4xl font-bold text-slate-400 sm:text-5xl">
                  %
                </span>
              </div>
              <p className="mt-3 text-base text-slate-600 sm:text-lg">
                of after-hours &amp; overflow calls
              </p>
            </div>
          </div>
        </motion.div>

        {/* What This Actually Means - Three Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <MissedOpportunityCard
            icon={<PhoneOff className="h-6 w-6 text-white" />}
            title="Unanswered Emergency Calls"
            description="Pet parents calling after hours need immediate answers. When they can't reach you, they call your competitor down the street."
            stat="30%"
            statLabel="of calls go unanswered"
            delay={0.3}
            accentColor="red"
          />

          <MissedOpportunityCard
            icon={<Calendar className="h-6 w-6 text-white" />}
            title="Missed Follow-Up Appointments"
            description="Discharge calls that never happen mean rechecks that never get scheduled. Each one is $150-400 in lost care."
            stat="3+ hrs"
            statLabel="spent playing phone tag daily"
            delay={0.4}
            accentColor="amber"
          />

          <MissedOpportunityCard
            icon={<Stethoscope className="h-6 w-6 text-white" />}
            title="Lost Medication Refills"
            description="When clients can't easily request refills, they forget or go elsewhere. Chronic medications mean recurring revenue—lost."
            stat="15-20%"
            statLabel="of clients lost to competitors"
            delay={0.5}
            accentColor="orange"
          />
        </motion.div>

        {/* The Math - Monthly Impact */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.6 }}
          className="mb-16"
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl sm:p-10 lg:p-12">
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #fff 0.5px, transparent 0.5px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative">
              <h3 className="mb-8 text-center text-xl font-semibold text-white sm:text-2xl">
                Here's What That Costs You
              </h3>

              {/* Impact Grid */}
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Monthly Lost */}
                <div className="text-center">
                  <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-red-400 sm:text-4xl">
                      $
                    </span>
                    <NumberTicker
                      value={3200}
                      delay={0.7}
                      className="text-3xl font-bold text-white sm:text-4xl"
                    />
                    <span className="text-lg font-medium text-slate-400">
                      +
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Lost monthly revenue
                  </p>
                </div>

                {/* Staff Hours */}
                <div className="text-center">
                  <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <NumberTicker
                      value={60}
                      delay={0.8}
                      className="text-3xl font-bold text-white sm:text-4xl"
                    />
                    <span className="text-lg font-medium text-slate-400">
                      + hrs
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Monthly phone time wasted
                  </p>
                </div>

                {/* Clients Lost */}
                <div className="text-center">
                  <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <NumberTicker
                      value={12}
                      delay={0.9}
                      className="text-3xl font-bold text-white sm:text-4xl"
                    />
                    <span className="text-lg font-medium text-slate-400">
                      -15
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Clients lost per month
                  </p>
                </div>
              </div>

              {/* Annual Impact */}
              <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                <p className="mb-2 text-sm font-medium tracking-wider text-red-300 uppercase">
                  Annual Impact
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-red-400 sm:text-3xl">
                    $
                  </span>
                  <NumberTicker
                    value={38400}
                    delay={1.0}
                    className="text-4xl font-bold text-white sm:text-5xl"
                  />
                  <span className="text-2xl font-bold text-slate-400 sm:text-3xl">
                    +
                  </span>
                </div>
                <p className="mt-2 text-slate-400">
                  in preventable revenue loss
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transition to Solution */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.75 }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center gap-4 rounded-3xl border border-teal-200/50 bg-gradient-to-br from-teal-50/90 to-emerald-50/70 px-10 py-8 shadow-lg backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="mb-1 text-lg font-semibold text-teal-900">
                What if every call was answered?
              </p>
              <p className="text-sm text-teal-700">
                AI that sounds human. Available 24/7. Ready now.
              </p>
            </div>
            <a
              href="#sample-calls"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30"
            >
              <span>Hear Real Calls</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
