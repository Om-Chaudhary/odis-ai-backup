"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Link2, Settings, Rocket, Clock, Check, Zap } from "lucide-react";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
};

const slideInLeftVariant = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

const slideInRightVariant = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

export const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      icon: Link2,
      step: "01",
      title: "Connect",
      subtitle: "Integration Setup",
      duration: "Day 1",
      description:
        "We integrate with your PIMS (ezyVet, Cornerstone, IDEXX Neo, etc.) and phone system—usually in under 48 hours.",
      highlights: ["PIMS Integration", "Phone System", "Calendar Sync"],
      gradient: "from-teal-500 via-cyan-500 to-blue-500",
      glowColor: "shadow-teal-500/40",
      bgGlow: "bg-teal-500/20",
    },
    {
      icon: Settings,
      step: "02",
      title: "Customize",
      subtitle: "AI Training",
      duration: "Day 2",
      description:
        "Our team trains Odis on your clinic's services, appointment types, emergency protocols, and scheduling rules.",
      highlights: ["Services Setup", "Protocols", "Custom Rules"],
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      glowColor: "shadow-violet-500/40",
      bgGlow: "bg-violet-500/20",
    },
    {
      icon: Rocket,
      step: "03",
      title: "Go Live",
      subtitle: "Launch",
      duration: "Day 3",
      description:
        "Start answering calls 24/7, booking appointments, and automating discharge follow-ups immediately.",
      highlights: ["24/7 Coverage", "Auto-booking", "Follow-ups"],
      gradient: "from-emerald-500 via-green-500 to-lime-500",
      glowColor: "shadow-emerald-500/40",
      bgGlow: "bg-emerald-500/20",
    },
  ];

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.7,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative w-full overflow-hidden py-24 lg:py-32"
    >
      <SectionBackground variant="accent-cool" />

      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Large gradient orbs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-violet-400/15 to-purple-400/15 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-400/20 to-green-400/20 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-16 text-center lg:mb-20"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={
              isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: 0.2,
              type: "spring",
            }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30"
          >
            <Zap className="h-8 w-8 text-white" />
          </motion.div>

          <span className="font-display mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest text-teal-600 uppercase">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-teal-500" />
            Getting Started
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-teal-500" />
          </span>

          <h2 className="font-display mb-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl xl:text-6xl">
            Up and Running in{" "}
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              3 Steps
            </span>
          </h2>

          <p className="text-muted-foreground mx-auto max-w-2xl text-lg lg:text-xl">
            Get OdisAI answering calls for your clinic in days, not weeks
          </p>

          {/* Animated timeline badge */}
          <motion.div
            variants={scaleInVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.3 }}
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-teal-200/60 bg-white/80 px-5 py-2.5 shadow-lg shadow-teal-500/10 backdrop-blur-sm"
          >
            <div className="relative">
              <Clock className="h-5 w-5 text-teal-600" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 animate-ping rounded-full bg-teal-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal-500" />
            </div>
            <span className="text-sm font-medium text-slate-600">
              Average setup time:
            </span>
            <span className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-3 py-0.5 text-sm font-bold text-white">
              48 hours
            </span>
          </motion.div>
        </motion.div>

        {/* Steps - Staggered Bento Layout */}
        <div className="relative">
          {/* Connecting line - desktop */}
          <div className="pointer-events-none absolute top-24 right-0 left-0 hidden lg:block">
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={
                isInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 1.5,
                delay: 0.5,
                ease: "easeOut",
              }}
              className="mx-auto h-1 w-2/3 origin-left rounded-full bg-gradient-to-r from-teal-400 via-violet-400 to-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={
                  index === 1
                    ? fadeUpVariant
                    : index === 0
                      ? slideInLeftVariant
                      : slideInRightVariant
                }
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.4 + index * 0.15 }}
                className={`group relative ${index === 1 ? "lg:mt-12" : ""}`}
              >
                {/* Animated step number */}
                <motion.div
                  variants={scaleInVariant}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  transition={{
                    ...transition,
                    delay: 0.5 + index * 0.15,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="absolute -top-6 left-1/2 z-20 -translate-x-1/2"
                >
                  <div
                    className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} text-lg font-bold text-white shadow-xl ${step.glowColor} transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <span className="relative z-10">{step.step}</span>
                    {/* Glow effect */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60`}
                    />
                  </div>
                </motion.div>

                {/* Card */}
                <div className="relative h-full overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-1 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                  {/* Gradient border on hover */}
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  />

                  {/* Inner card */}
                  <div className="relative h-full rounded-[22px] bg-white/95 p-6 pt-12 backdrop-blur-sm sm:p-8 sm:pt-14">
                    {/* Ambient glow */}
                    <div
                      className={`absolute -top-20 -right-20 h-40 w-40 rounded-full ${step.bgGlow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Duration badge */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={
                        isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }
                      }
                      transition={{ ...transition, delay: 0.6 + index * 0.15 }}
                      className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1.5"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-700">
                        {step.duration}
                      </span>
                    </motion.div>

                    {/* Icon */}
                    <div
                      className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} shadow-lg ${step.glowColor} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      <step.icon
                        className="h-8 w-8 text-white"
                        strokeWidth={1.5}
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <span
                        className={`bg-gradient-to-r text-xs font-bold tracking-wider uppercase ${step.gradient} bg-clip-text text-transparent`}
                      >
                        {step.subtitle}
                      </span>

                      <h3 className="font-display text-2xl font-bold text-slate-900 lg:text-3xl">
                        {step.title}
                      </h3>

                      <p className="text-muted-foreground text-sm leading-relaxed lg:text-base">
                        {step.description}
                      </p>
                    </div>

                    {/* Highlights */}
                    <div className="mt-6 space-y-2">
                      {step.highlights.map((highlight, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={
                            isInView
                              ? { opacity: 1, x: 0 }
                              : { opacity: 0, x: -20 }
                          }
                          transition={{
                            ...transition,
                            delay: 0.7 + index * 0.15 + i * 0.1,
                          }}
                          className="flex items-center gap-2.5"
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient}`}
                          >
                            <Check
                              className="h-3 w-3 text-white"
                              strokeWidth={3}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {highlight}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom section with completion indicator */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.9 }}
          className="mt-16 lg:mt-20"
        >
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/80 via-white/80 to-emerald-50/80 p-8 text-center backdrop-blur-sm">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : { scale: 0 }}
                    transition={{
                      delay: 1 + i * 0.1,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30"
                  >
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </motion.div>
                ))}
              </div>

              <p className="text-lg font-medium text-slate-800">
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text font-bold text-transparent">
                  No lengthy contracts.
                </span>{" "}
                Cancel anytime if you&apos;re not completely satisfied.
              </p>

              <p className="text-muted-foreground mt-2 text-sm">
                Join 100+ veterinary clinics already using OdisAI
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
