"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Compare } from "~/components/ui/compare";
import { X, Check } from "lucide-react";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const CompareSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const beforePoints = [
    "Missed calls during busy hours",
    "Overwhelmed front desk staff",
    "Lost appointment opportunities",
    "No after-hours coverage",
    "Manual discharge follow-ups",
  ];

  const afterPoints = [
    "Every call answered, 24/7",
    "Team focuses on in-clinic care",
    "Automated appointment booking",
    "Round-the-clock availability",
    "Automated follow-up calls",
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
      {/* Cohesive background */}
      <SectionBackground variant="accent-warm" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="font-display text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            The Difference
          </span>
          <h2 className="font-display text-foreground mb-4 text-4xl font-medium tracking-tight lg:text-5xl">
            Before & After OdisAI
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            See how veterinary clinics transform their phone operations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Before/After comparison list */}
          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h3 className="font-display text-foreground mb-6 flex items-center gap-3 text-2xl font-medium">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                  <X className="h-5 w-5 text-red-500" />
                </span>
                Without OdisAI
              </h3>
              <ul className="space-y-3">
                {beforePoints.map((point, index) => (
                  <li
                    key={index}
                    className="text-muted-foreground flex items-start gap-3"
                  >
                    <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-foreground mb-6 flex items-center gap-3 text-2xl font-medium">
                <span className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <Check className="text-primary h-5 w-5" />
                </span>
                With OdisAI
              </h3>
              <ul className="space-y-3">
                {afterPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#31aba3]" />
                    <span className="text-foreground font-medium">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Interactive compare slider */}
          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.3 }}
          >
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <Compare
                firstImage="/images/warm-veterinary-clinic-front-desk-with-phone-and-p.jpg"
                secondImage="/images/warm-veterinary-clinic-reception-with-phone-and-ha.jpg"
                firstImageClassName="object-cover object-center"
                secondImageClassname="object-cover object-center"
                className="h-[400px] w-full rounded-xl lg:h-[500px]"
                slideMode="hover"
                autoplay={true}
                autoplayDuration={8000}
              />
              <p className="text-muted-foreground mt-6 text-center text-sm">
                Hover to compare: Overwhelmed staff ← → Empowered team
              </p>
            </div>
          </motion.div>
        </div>

        {/* ROI highlight */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.4 }}
          className="mx-auto mt-12 max-w-3xl lg:mt-16"
        >
          <div className="glass-teal rounded-2xl p-6 text-center sm:p-8 lg:p-10">
            <h3 className="font-display text-foreground mb-3 text-2xl font-medium lg:text-3xl">
              Average clinic recovers{" "}
              <span className="text-primary">$12,000/month</span>
            </h3>
            <p className="text-muted-foreground">
              in previously missed appointment revenue after implementing OdisAI
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
