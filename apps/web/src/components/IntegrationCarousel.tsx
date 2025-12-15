/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

interface IntegrationApp {
  name: string;
  logo: string;
}

interface IntegrationCarouselProps {
  buttonText?: string;
  buttonHref?: string;
  title?: string;
  subtitle?: string;
  topRowApps?: IntegrationApp[];
  bottomRowApps?: IntegrationApp[];
}
const defaultTopRowApps: IntegrationApp[] = [
  {
    name: "Integration 1",
    logo: "/images/logoipsum-389.png",
  },
  {
    name: "Integration 2",
    logo: "/images/logoipsum-407.png",
  },
  {
    name: "Integration 3",
    logo: "/images/logoipsum-379.png",
  },
  {
    name: "Integration 4",
    logo: "/images/logoipsum-374.png",
  },
  {
    name: "Integration 5",
    logo: "/images/logoipsum-381.png",
  },
  {
    name: "Integration 6",
    logo: "/images/logoipsum-401.png",
  },
  {
    name: "Integration 7",
    logo: "/images/logoipsum-403.png",
  },
  {
    name: "Integration 1",
    logo: "/images/logoipsum-389.png",
  },
  {
    name: "Integration 2",
    logo: "/images/logoipsum-407.png",
  },
  {
    name: "Integration 3",
    logo: "/images/logoipsum-379.png",
  },
  {
    name: "Integration 4",
    logo: "/images/logoipsum-374.png",
  },
  {
    name: "Integration 5",
    logo: "/images/logoipsum-381.png",
  },
];
const defaultBottomRowApps: IntegrationApp[] = [
  {
    name: "Integration 6",
    logo: "/images/logoipsum-401.png",
  },
  {
    name: "Integration 7",
    logo: "/images/logoipsum-403.png",
  },
  {
    name: "Integration 1",
    logo: "/images/logoipsum-389.png",
  },
  {
    name: "Integration 2",
    logo: "/images/logoipsum-407.png",
  },
  {
    name: "Integration 3",
    logo: "/images/logoipsum-379.png",
  },
  {
    name: "Integration 4",
    logo: "/images/logoipsum-374.png",
  },
  {
    name: "Integration 5",
    logo: "/images/logoipsum-381.png",
  },
  {
    name: "Integration 6",
    logo: "/images/logoipsum-401.png",
  },
  {
    name: "Integration 7",
    logo: "/images/logoipsum-403.png",
  },
  {
    name: "Integration 1",
    logo: "/images/logoipsum-389.png",
  },
  {
    name: "Integration 2",
    logo: "/images/logoipsum-407.png",
  },
  {
    name: "Integration 3",
    logo: "/images/logoipsum-379.png",
  },
];

export const IntegrationCarousel = ({
  buttonText = "See All Integrations",
  buttonHref = "#",
  title = "Connects with your practice management system.",
  subtitle = "OdisAI integrates with the tools you already use—so every call syncs seamlessly with your patient records.",
  topRowApps = defaultTopRowApps,
  bottomRowApps = defaultBottomRowApps,
}: IntegrationCarouselProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  useEffect(() => {
    if (shouldReduceMotion) return;

    let topAnimationId: number;
    let bottomAnimationId: number;
    let topPosition = 0;
    let bottomPosition = 0;

    const animateTopRow = () => {
      if (topRowRef.current) {
        topPosition -= 0.5;
        if (Math.abs(topPosition) >= topRowRef.current.scrollWidth / 2) {
          topPosition = 0;
        }
        topRowRef.current.style.transform = `translateX(${topPosition}px)`;
      }
      topAnimationId = requestAnimationFrame(animateTopRow);
    };

    const animateBottomRow = () => {
      if (bottomRowRef.current) {
        bottomPosition -= 0.65;
        if (Math.abs(bottomPosition) >= bottomRowRef.current.scrollWidth / 2) {
          bottomPosition = 0;
        }
        bottomRowRef.current.style.transform = `translateX(${bottomPosition}px)`;
      }
      bottomAnimationId = requestAnimationFrame(animateBottomRow);
    };

    topAnimationId = requestAnimationFrame(animateTopRow);
    bottomAnimationId = requestAnimationFrame(animateBottomRow);

    return () => {
      cancelAnimationFrame(topAnimationId);
      cancelAnimationFrame(bottomAnimationId);
    };
  }, [shouldReduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="integrations"
      className="relative w-full overflow-hidden py-24 lg:py-32"
    >
      {/* Cohesive background */}
      <SectionBackground variant="subtle-warm" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.3 }}
          className="mb-12 flex flex-col items-center text-center lg:mb-16"
        >
          <span className="font-display text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            Integrations
          </span>
          <h2 className="font-display text-foreground mb-4 max-w-2xl text-4xl font-medium tracking-tight lg:text-5xl">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-xl text-lg">{subtitle}</p>
          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.4 }}
            className="mt-8"
          >
            <a
              href={buttonHref}
              className="border-border bg-background/80 text-foreground hover:border-primary/30 hover:bg-primary/5 inline-block cursor-pointer rounded-full border px-6 py-2.5 text-center text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
            >
              {buttonText}
            </a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ ...transition, delay: 0.5 }}
        className="relative h-[268px] overflow-hidden"
      >
        <div
          ref={topRowRef}
          className="absolute top-6 flex items-start gap-6 whitespace-nowrap"
          style={{ willChange: "transform" }}
        >
          {[...topRowApps, ...topRowApps].map((app, index) => (
            <div
              key={`top-${index}`}
              className="glass-card flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-3xl"
            >
              <img
                src={app.logo || "/placeholder.svg"}
                alt={app.name}
                className="block h-9 w-9 object-contain"
              />
            </div>
          ))}
        </div>

        {/* Gradient overlays - using transparent to blend with background */}
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-48 bg-gradient-to-l to-transparent lg:w-60" />
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-48 bg-gradient-to-r to-transparent lg:w-60" />

        <div
          ref={bottomRowRef}
          className="absolute top-[148px] flex items-start gap-6 whitespace-nowrap"
          style={{ willChange: "transform" }}
        >
          {[...bottomRowApps, ...bottomRowApps].map((app, index) => (
            <div
              key={`bottom-${index}`}
              className="glass-card flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-3xl"
            >
              <img
                src={app.logo || "/placeholder.svg"}
                alt={app.name}
                className="block h-9 w-9 object-contain"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
