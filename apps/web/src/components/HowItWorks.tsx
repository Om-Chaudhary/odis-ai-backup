"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Link2, Settings, Rocket } from "lucide-react";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants - consistent with hero
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
      description: "Link OdisAI to your phone system and PIMS in minutes.",
    },
    {
      icon: Settings,
      step: "02",
      title: "Customize",
      description:
        "We train your AI on your clinic's services, hours, and scheduling rules.",
    },
    {
      icon: Rocket,
      step: "03",
      title: "Go Live",
      description:
        "Start answering calls and booking appointments automatically.",
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
      className="relative w-full overflow-hidden py-24 lg:py-32"
    >
      {/* Cohesive background */}
      <SectionBackground variant="accent-cool" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.2 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="font-display text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            Getting Started
          </span>
          <h2 className="font-display text-foreground mb-4 text-4xl font-medium tracking-tight lg:text-5xl">
            Up and Running in 3 Steps
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Get OdisAI answering calls for your clinic in days, not weeks
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={fadeUpVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ ...transition, delay: 0.3 + index * 0.1 }}
              className="group relative h-full"
            >
              <div className="glass-card h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#31aba3]/10 sm:p-8">
                {/* Step number */}
                <span className="font-display text-primary/10 absolute top-6 right-6 text-6xl font-bold">
                  {step.step}
                </span>

                {/* Icon */}
                <div className="bg-primary/10 group-hover:bg-primary/15 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300">
                  <step.icon className="text-primary h-7 w-7" />
                </div>

                <h3 className="font-display text-foreground mb-3 text-2xl font-medium">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="from-primary/50 absolute top-1/2 -right-4 z-10 hidden h-px w-8 bg-gradient-to-r to-transparent md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
