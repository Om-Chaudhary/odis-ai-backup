"use client";

import { useRef, type Ref, type RefObject } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  PhoneMissed,
  PhoneOutgoing,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { NumberTicker } from "../ui/number-ticker";

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

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
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      <SectionBackground variant="subtle-warm" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-14 text-center lg:mb-20"
        >
          {/* Urgency Badge */}
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-700 uppercase backdrop-blur-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            The Hidden Problem
          </span>
          <h2 className="font-display text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Your Phone Lines Are{" "}
            <span className="bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Leaking Revenue
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            While your team focuses on patients, missed calls silently drain
            your bottom line
          </p>
        </motion.div>

        {/* Main Visual - Side by Side with Unique Styling */}
        <div className="relative">
          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {/* Inbound - Left Side */}
            <motion.div
              variants={scaleInVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.2 }}
              className="relative"
            >
              {/* Gradient glow behind */}
              <div className="absolute -inset-4 rounded-3xl bg-linear-to-br from-amber-200/40 via-orange-100/20 to-transparent blur-2xl" />

              {/* Content */}
              <div className="relative rounded-2xl bg-linear-to-br from-white via-amber-50/50 to-orange-50/30 p-8 ring-1 ring-amber-200/50 backdrop-blur-sm">
                {/* Icon with animated ring */}
                <div className="relative mb-6 inline-flex">
                  <div
                    className="absolute inset-0 animate-ping rounded-full bg-amber-400/20"
                    style={{ animationDuration: "3s" }}
                  />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
                    <PhoneMissed className="h-7 w-7 text-white" />
                  </div>
                </div>

                <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                  Missed Inbound
                </h3>
                <p className="mb-6 text-sm text-slate-500">
                  After-hours, hold times, busy staff
                </p>

                {/* Stats with animated numbers */}
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm text-slate-600">
                        Calls that never connect
                      </span>
                      <div className="flex items-baseline">
                        <NumberTicker
                          value={30}
                          delay={0.3}
                          className="font-display text-2xl font-bold text-amber-600"
                        />
                        <span className="font-display text-2xl font-bold text-amber-600">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm text-slate-600">
                        Daily phone tag
                      </span>
                      <div className="flex items-baseline gap-1">
                        <NumberTicker
                          value={3}
                          delay={0.5}
                          className="font-display text-xl font-bold text-slate-700"
                        />
                        <span className="font-display text-xl font-bold text-slate-700">
                          + hrs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Outbound - Right Side */}
            <motion.div
              variants={scaleInVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.35 }}
              className="relative"
            >
              {/* Gradient glow behind */}
              <div className="absolute -inset-4 rounded-3xl bg-linear-to-bl from-amber-200/40 via-orange-100/20 to-transparent blur-2xl" />

              {/* Content */}
              <div className="relative rounded-2xl bg-linear-to-bl from-white via-amber-50/50 to-orange-50/30 p-8 ring-1 ring-amber-200/50 backdrop-blur-sm">
                {/* Icon with animated ring */}
                <div className="relative mb-6 inline-flex">
                  <div
                    className="absolute inset-0 animate-ping rounded-full bg-amber-400/20"
                    style={{ animationDuration: "3s", animationDelay: "1.5s" }}
                  />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
                    <PhoneOutgoing className="h-7 w-7 text-white" />
                  </div>
                </div>

                <h3 className="font-display mb-2 text-xl font-semibold text-slate-900">
                  Missed Follow-Ups
                </h3>
                <p className="mb-6 text-sm text-slate-500">
                  Discharge calls that never happen
                </p>

                {/* Stats with animated numbers */}
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm text-slate-600">
                        Revenue lost monthly
                      </span>
                      <div className="flex items-baseline">
                        <span className="font-display text-2xl font-bold text-amber-600">
                          $
                        </span>
                        <NumberTicker
                          value={2400}
                          delay={0.4}
                          className="font-display text-2xl font-bold text-amber-600"
                        />
                        <span className="font-display text-2xl font-bold text-amber-600">
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm text-slate-600">
                        Lost to competitors
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <NumberTicker
                          value={15}
                          delay={0.6}
                          className="font-display text-xl font-bold text-slate-700"
                        />
                        <span className="font-display text-xl font-bold text-slate-700">
                          -20%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Connecting Visual - Leak Funnel */}
          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.5 }}
            className="relative mx-auto mt-10 flex flex-col items-center"
          >
            {/* Converging lines with drip effect */}
            <div className="relative flex w-full max-w-lg items-center justify-center">
              {/* Left line */}
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-amber-300 to-amber-400" />
              {/* Right line */}
              <div className="h-px flex-1 bg-linear-to-l from-transparent via-amber-300 to-amber-400" />
            </div>

            {/* Impact Statement */}
            <div className="mt-20 max-w-2xl text-center">
              <p className="text-lg leading-relaxed font-medium text-slate-700">
                Every unreached pet parent is a{" "}
                <span className="text-amber-600">missed recheck</span>,{" "}
                <span className="text-amber-600">unfilled prescription</span>,
                and <span className="text-amber-600">wellness visit</span> that
                goes to your competitor.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Transition to Solution */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.6 }}
          className="mt-12 text-center lg:mt-16"
        >
          <div className="inline-flex flex-col items-center gap-3 rounded-2xl border border-teal-200/50 bg-gradient-to-br from-teal-50/80 to-emerald-50/60 px-8 py-5 backdrop-blur-sm">
            <p className="text-sm font-medium text-teal-800">
              There&apos;s a better way
            </p>
            <a
              href="#sample-calls"
              className="group inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] hover:bg-teal-700 hover:shadow-xl"
            >
              <span>Hear the solution</span>
              <ArrowDown className="h-4 w-4 animate-bounce transition-transform group-hover:translate-y-0.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
