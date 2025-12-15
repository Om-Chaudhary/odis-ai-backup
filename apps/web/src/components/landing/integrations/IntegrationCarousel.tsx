/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SectionBackground } from "~/components/ui/section-background";
import { Check, Zap } from "lucide-react";
import { cn } from "~/lib/utils";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

interface IntegrationApp {
  name: string;
  logo: string;
  status?: "active" | "coming-soon";
}

interface IntegrationCarouselProps {
  buttonText?: string;
  buttonHref?: string;
  title?: string;
  subtitle?: string;
  topRowApps?: IntegrationApp[];
  bottomRowApps?: IntegrationApp[];
}

// Real veterinary practice management system integrations
const defaultTopRowApps: IntegrationApp[] = [
  { name: "IDEXX Neo", logo: "/integrations/idexx.svg", status: "active" },
  { name: "ezyVet", logo: "/integrations/ezyvet.svg", status: "active" },
  {
    name: "Cornerstone",
    logo: "/integrations/cornerstone.svg",
    status: "active",
  },
  { name: "AVImark", logo: "/integrations/avimark.svg", status: "coming-soon" },
  {
    name: "Covetrus Pulse",
    logo: "/integrations/covetrus.svg",
    status: "coming-soon",
  },
  {
    name: "Hippo Manager",
    logo: "/integrations/hippo.svg",
    status: "coming-soon",
  },
  {
    name: "Shepherd",
    logo: "/integrations/shepherd.svg",
    status: "coming-soon",
  },
];

// Bottom row - same integrations in different order for visual variety
const defaultBottomRowApps: IntegrationApp[] = [
  {
    name: "Shepherd",
    logo: "/integrations/shepherd.svg",
    status: "coming-soon",
  },
  {
    name: "Hippo Manager",
    logo: "/integrations/hippo.svg",
    status: "coming-soon",
  },
  {
    name: "Covetrus Pulse",
    logo: "/integrations/covetrus.svg",
    status: "coming-soon",
  },
  { name: "AVImark", logo: "/integrations/avimark.svg", status: "coming-soon" },
  {
    name: "Cornerstone",
    logo: "/integrations/cornerstone.svg",
    status: "active",
  },
  { name: "ezyVet", logo: "/integrations/ezyvet.svg", status: "active" },
  { name: "IDEXX Neo", logo: "/integrations/idexx.svg", status: "active" },
];

// Integration card component with hover effect
const IntegrationCard = ({ app }: { app: IntegrationApp }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex h-20 w-36 flex-shrink-0 items-center justify-center rounded-2xl px-4 transition-all duration-300",
        "border border-slate-200/60 bg-white/80 backdrop-blur-sm",
        "hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/10",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status indicator */}
      {app.status === "active" && (
        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 shadow">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      <img
        src={app.logo}
        alt={app.name}
        className={cn(
          "block h-10 w-full object-contain transition-all duration-300",
          "group-hover:scale-105",
          app.status === "coming-soon" &&
            "opacity-60 grayscale group-hover:opacity-80 group-hover:grayscale-0",
        )}
      />

      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute -bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-lg">
          {app.name}
          {app.status === "coming-soon" && " (Coming Soon)"}
        </div>
      )}
    </div>
  );
};

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
          <h2 className="font-display mb-4 max-w-2xl text-4xl font-medium tracking-tight text-slate-800 lg:text-5xl">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-xl text-lg">{subtitle}</p>

          {/* Integration status badges */}
          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.35 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
              <Check className="h-3.5 w-3.5" />
              <span>3 Active integrations</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              <Zap className="h-3.5 w-3.5" />
              <span>4 Coming soon</span>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ ...transition, delay: 0.4 }}
            className="mt-6"
          >
            <a
              href={buttonHref}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-5 py-2.5 text-center text-sm font-medium text-teal-700 backdrop-blur-sm transition-all duration-200 hover:border-teal-300 hover:bg-teal-100/80 hover:shadow-lg"
            >
              {buttonText}
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ ...transition, delay: 0.5 }}
        className="relative h-[240px] overflow-hidden"
      >
        <div
          ref={topRowRef}
          className="absolute top-6 flex items-start gap-6 whitespace-nowrap"
          style={{ willChange: "transform" }}
        >
          {[...topRowApps, ...topRowApps].map((app, index) => (
            <IntegrationCard key={`top-${index}`} app={app} />
          ))}
        </div>

        {/* Gradient overlays - using transparent to blend with background */}
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-20 w-48 bg-gradient-to-l to-transparent lg:w-60" />
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-20 w-48 bg-gradient-to-r to-transparent lg:w-60" />

        <div
          ref={bottomRowRef}
          className="absolute top-[130px] flex items-start gap-6 whitespace-nowrap"
          style={{ willChange: "transform" }}
        >
          {[...bottomRowApps, ...bottomRowApps].map((app, index) => (
            <IntegrationCard key={`bottom-${index}`} app={app} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};
