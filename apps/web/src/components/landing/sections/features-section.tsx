"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Phone, Share2 } from "lucide-react";

import { cn } from "@odis-ai/shared/util";
import { Calendar } from "@odis-ai/shared/ui";
import { SectionBackground } from "../ui/section-background";
import { Marquee } from "../ui/marquee";
import { NumberTicker } from "../ui/number-ticker";
import { BlurFade } from "../ui/blur-fade";

// =============================================================================
// Animation Variants
// =============================================================================

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

// =============================================================================
// Skeleton Components
// =============================================================================

// Voice Wave Animation - Pulsing concentric circles
const VoiceWaveSkeleton = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute h-32 w-32 rounded-full border-2 border-teal-400/40 shadow-lg shadow-teal-500/10"
            style={{
              animation: `pulse ${2 + i * 0.5}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
              animationDelay: `${i * 0.2}s`,
              scale: 1 + i * 0.3,
            }}
          />
        ))}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-xl shadow-teal-500/30">
          <Phone className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );
};

// Call Activity List - Live notifications
const CallActivitySkeleton = () => {
  const notifications = [
    {
      name: "Discharge call completed",
      description: "Max (Golden Retriever)",
      time: "2m ago",
      icon: "✅",
      color: "#10b981",
    },
    {
      name: "Appointment booked",
      description: "Luna - Follow-up checkup",
      time: "4m ago",
      icon: "📅",
      color: "#14b8a6",
    },
    {
      name: "Owner sentiment: Grateful",
      description: "Bella's post-op call",
      time: "6m ago",
      icon: "💚",
      color: "#8b5cf6",
    },
    {
      name: "Follow-up reminder sent",
      description: "Charlie - Medication refill",
      time: "8m ago",
      icon: "🔔",
      color: "#0ea5e9",
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-col gap-3 p-6">
      {notifications.map((notif, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.2 }}
          className="group flex items-start gap-3 rounded-lg border border-teal-100/50 bg-gradient-to-br from-white/95 to-teal-50/30 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-teal-200 hover:shadow-md hover:shadow-teal-500/10"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${notif.color}20` }}
          >
            {notif.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">{notif.name}</p>
            <p className="text-xs text-slate-500">{notif.description}</p>
          </div>
          <span className="text-xs text-slate-400">{notif.time}</span>
        </motion.div>
      ))}
    </div>
  );
};

// PIMS Integration - Animated connection beams
const PimsIntegrationSkeleton = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg">
          <Share2 className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-slate-700">IDEXX Neo</p>
          <p className="text-[10px] text-slate-500">ezyVet · Cornerstone</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="h-0.5 w-16 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: 1.5,
              delay: i * 0.3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{ transformOrigin: "left" }}
          />
        ))}
      </div>

      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xl">
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
        </svg>
      </div>
    </div>
  );
};

// Analytics Preview - Metrics dashboard
const AnalyticsSkeleton = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-around p-8">
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl font-bold text-teal-600">
          <NumberTicker value={47} />
        </div>
        <p className="text-xs font-medium text-slate-600">Calls Today</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl font-bold text-emerald-600">
          <NumberTicker value={94} />%
        </div>
        <p className="text-xs font-medium text-slate-600">Connected</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1 text-4xl font-bold text-violet-600">
          <NumberTicker value={4.9} decimalPlaces={1} />
          <span className="text-2xl text-slate-400">/5</span>
        </div>
        <p className="text-xs font-medium text-slate-600">Satisfaction</p>
      </div>
    </div>
  );
};

// Discharge Cards Marquee
const dischargeCases = [
  { name: "Max", breed: "Golden Retriever", procedure: "Post-surgery" },
  { name: "Luna", breed: "Siamese Cat", procedure: "Dental cleaning" },
  { name: "Bella", breed: "Labrador", procedure: "Vaccination" },
  { name: "Charlie", breed: "Beagle", procedure: "Neuter recovery" },
  { name: "Daisy", breed: "Poodle", procedure: "Allergy treatment" },
];

function DischargeCard({ pet }: { pet: (typeof dischargeCases)[0] }) {
  return (
    <figure
      className={cn(
        "relative w-36 cursor-pointer overflow-hidden rounded-xl border p-3",
        "border-slate-100 bg-white/90 hover:bg-white",
        "transform-gpu transition-all duration-300 ease-out hover:scale-105",
      )}
    >
      <div className="flex flex-col gap-1">
        <figcaption className="text-sm font-medium text-slate-800">
          {pet.name}
        </figcaption>
        <p className="text-xs text-slate-500">{pet.breed}</p>
        <span className="mt-1 inline-flex w-fit rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
          {pet.procedure}
        </span>
      </div>
    </figure>
  );
}

const DischargeMarqueeSkeleton = () => {
  return (
    <div className="relative flex h-full w-full items-center py-8">
      <Marquee pauseOnHover className="[--duration:25s]">
        {dischargeCases.map((pet, idx) => (
          <DischargeCard key={idx} pet={pet} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[100] h-full w-20 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[100] h-full w-20 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
};

// Smart Scheduling Calendar
const SchedulingSkeleton = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-4">
      <Calendar
        mode="single"
        selected={new Date()}
        className="rounded-md border border-slate-200 bg-white shadow-sm"
      />
    </div>
  );
};

// =============================================================================
// Feature Card Components
// =============================================================================

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-teal-200/30 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 sm:p-8",
        // Glassmorphic background with teal gradient
        "bg-gradient-to-br from-white/80 via-teal-50/50 to-emerald-50/30",
        // Hover effects
        "hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/10",
        "hover:from-white/90 hover:via-teal-50/60 hover:to-emerald-50/40",
        // Animated gradient border effect
        "before:absolute before:inset-0 before:-z-10 before:rounded-2xl",
        "before:bg-gradient-to-br before:from-teal-400/0 before:via-teal-400/5 before:to-emerald-400/10",
        "before:opacity-0 before:transition-opacity before:duration-500",
        "hover:before:opacity-100",
        className,
      )}
    >
      {/* Subtle animated shimmer effect */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -inset-[100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,rgba(20,184,166,0.1)_50%,transparent_100%)]" />
      </div>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="font-display mb-2 text-left text-xl font-medium tracking-tight text-slate-900 md:text-2xl">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="mb-4 max-w-sm text-left text-sm font-normal text-slate-600 md:text-base">
      {children}
    </p>
  );
};

// =============================================================================
// Features Data
// =============================================================================

const features = [
  {
    title: "24/7 AI Voice Assistant",
    description:
      "Never miss a call. Our AI handles every inquiry with natural conversation.",
    skeleton: <VoiceWaveSkeleton />,
    className: "col-span-1 border-b lg:col-span-4 lg:border-r",
  },
  {
    title: "Real-Time Call Activity",
    description:
      "Monitor all calls as they happen with live status updates and outcomes.",
    skeleton: <CallActivitySkeleton />,
    className: "col-span-1 border-b lg:col-span-2",
  },
  {
    title: "Seamless PIMS Integration",
    description:
      "Connect directly with IDEXX Neo, ezyVet, Cornerstone, and more.",
    skeleton: <PimsIntegrationSkeleton />,
    className: "col-span-1 lg:col-span-3 lg:border-r",
  },
  {
    title: "Actionable Insights",
    description:
      "Track connection rates, satisfaction scores, and revenue impact in real-time.",
    skeleton: <AnalyticsSkeleton />,
    className: "col-span-1 border-b lg:col-span-3 lg:border-none",
  },
  {
    title: "Smart Appointment Booking",
    description:
      "Patients book directly during calls with real-time calendar sync.",
    skeleton: <SchedulingSkeleton />,
    className: "col-span-1 lg:col-span-2 lg:border-r",
  },
  {
    title: "Automated Discharge Calls",
    description:
      "Batch schedule and execute follow-up calls with intelligent retry logic.",
    skeleton: <DischargeMarqueeSkeleton />,
    className: "col-span-1 lg:col-span-4",
  },
];

// =============================================================================
// Main Section Component
// =============================================================================

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative z-20 w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Background */}
      <SectionBackground variant="hero-glow" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-12 text-center lg:mb-16"
        >
          <motion.span
            variants={fadeUpVariant}
            className="font-display mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest text-teal-600 uppercase"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
            Platform Features
          </motion.span>
          <motion.h2
            variants={fadeUpVariant}
            className="font-display mb-4 text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl"
          >
            Everything you need to transform patient follow-up
          </motion.h2>
          <motion.p
            variants={fadeUpVariant}
            className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg"
          >
            A complete platform that handles calls, schedules appointments, and
            keeps your team informed—all powered by AI.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="relative">
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-6">
            {features.map((feature, idx) => (
              <BlurFade
                key={feature.title}
                delay={0.15 + idx * 0.1}
                inView
                inViewMargin="-50px"
                className={feature.className}
              >
                <FeatureCard>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                  <div className="flex-1">{feature.skeleton}</div>
                </FeatureCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
