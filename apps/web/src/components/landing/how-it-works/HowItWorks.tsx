"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Link2, Settings, Rocket, Check } from "lucide-react";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
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
      description:
        "We integrate with your PIMS and phone system—usually in under 48 hours.",
      highlights: ["PIMS Integration", "Phone System", "Calendar Sync"],
    },
    {
      icon: Settings,
      step: "02",
      title: "Customize",
      description:
        "Our team trains Odis on your clinic's services, appointment types, and scheduling rules.",
      highlights: ["Services Setup", "Protocols", "Custom Rules"],
    },
    {
      icon: Rocket,
      step: "03",
      title: "Go Live",
      description:
        "Start answering calls 24/7, booking appointments, and automating discharge follow-ups.",
      highlights: ["24/7 Coverage", "Auto-booking", "Follow-ups"],
    },
  ];

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      <SectionBackground variant="transition" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-16 text-center lg:mb-20"
        >
          <span className="font-display text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            How It Works
          </span>

          <h2 className="font-display mb-4 text-2xl font-medium tracking-tight text-slate-800 sm:text-3xl md:text-4xl lg:text-5xl">
            Live in{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              48 Hours
            </span>
          </h2>

          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Get OdisAI answering calls for your clinic in days, not weeks
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                variants={fadeUpVariant}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ ...transition, delay: 0.2 + index * 0.1 }}
                className="group relative"
              >
                {/* Card */}
                <div className="border-border/50 bg-background/60 relative h-full overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/15 sm:p-8">
                  {/* Step indicator */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 transition-all duration-300 group-hover:scale-105 group-hover:bg-teal-500/15">
                      <Icon className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                        Step {step.step}
                      </span>
                      <h3 className="font-display text-lg font-semibold text-slate-800 sm:text-xl md:text-2xl">
                        {step.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    {step.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-2.5">
                    {step.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <Check
                          className="h-4 w-4 flex-shrink-0 text-teal-500"
                          strokeWidth={2.5}
                        />
                        <span className="text-sm text-slate-600">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Simple footer note */}
        <motion.p
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.6 }}
          className="text-muted-foreground mt-12 text-center text-sm"
        >
          No lengthy contracts · Cancel anytime · Trusted by{" "}
          <span className="font-medium text-slate-700">100+ clinics</span>
        </motion.p>
      </div>
    </section>
  );
};
