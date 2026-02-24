"use client";

import { useRef, type Ref } from "react";
import {
  m,
  LazyMotion,
  domAnimation,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  Phone,
  PhoneOff,
  ArrowRight,
  Calendar,
  Stethoscope,
} from "lucide-react";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
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
    <m.div
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
    </m.div>
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
    <LazyMotion features={domAnimation} strict>
      <section
        ref={sectionRef as Ref<HTMLElement>}
        id="problem"
        className="relative w-full overflow-hidden py-20 sm:py-24 md:py-28 lg:py-36"
      >
        <SectionBackground variant="subtle-dark" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Section Header - Impactful Statement */}
          <m.div
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
              Missed Calls Cost Vet Clinics
              <br className="hidden sm:block" />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Every Month
                </span>
                <m.span
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                  className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-gradient-to-r from-red-500/30 via-orange-500/30 to-amber-500/30"
                />
              </span>
            </h2>

            {/* Supporting Text */}
            <p className="mx-auto max-w-2xl text-lg text-slate-600 sm:text-xl">
              One missed call = one lost client. One skipped follow-up = one
              missed recheck. It adds up faster than you think.
            </p>
          </m.div>

          {/* What This Actually Means - Three Cards */}
          <m.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <MissedOpportunityCard
              icon={<PhoneOff className="h-6 w-6 text-white" />}
              title="After-Hours Calls Going to Voicemail"
              description="That 9PM call about a limping dog? They called the 24-hour clinic instead. That's a new client you'll never see."
              stat="High"
              statLabel="impact per missed new client"
              delay={0.3}
              accentColor="red"
            />

            <MissedOpportunityCard
              icon={<Calendar className="h-6 w-6 text-white" />}
              title="Discharge Follow-ups That Never Happen"
              description="Your team meant to call, but got busy. Now that recheck won't get scheduled and post-op concerns go unaddressed."
              stat="Significant"
              statLabel="impact per missed recheck"
              delay={0.4}
              accentColor="amber"
            />

            <MissedOpportunityCard
              icon={<Stethoscope className="h-6 w-6 text-white" />}
              title="Staff Buried in Phone Tag"
              description="3+ hours daily playing phone tag with owners who don't pick up. That's time your techs could spend on actual patient care."
              stat="15+ hrs"
              statLabel="wasted weekly on callbacks"
              delay={0.5}
              accentColor="orange"
            />
          </m.div>

          {/* Transition to Solution */}
          <m.div
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
                  What if every call was answered—and every discharge got a
                  follow-up?
                </p>
                <p className="text-sm text-teal-700">
                  AI that sounds like your best CSR. Live in 48 hours.
                </p>
              </div>
              <a
                href="#sample-calls"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/30"
              >
                <span>Hear a Real Call</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </m.div>
        </div>
      </section>
    </LazyMotion>
  );
}
