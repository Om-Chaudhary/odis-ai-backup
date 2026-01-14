"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Link2, CheckCircle2 } from "lucide-react";
import { SectionBackground } from "../ui/section-background";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";

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

interface IntegrationsSectionProps {
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

// Simple grayscale logo component
const IntegrationLogo = ({ app }: { app: IntegrationApp }) => {
  return (
    <div className="flex h-12 w-32 flex-shrink-0 items-center justify-center px-4">
      <Image
        src={app.logo}
        alt={app.name}
        width={120}
        height={40}
        className="block h-8 w-full object-contain opacity-50 grayscale transition-all duration-300 hover:opacity-80 hover:grayscale-0"
      />
    </div>
  );
};

export const IntegrationsSection = ({
  title = "Connects with your practice management system.",
  subtitle = "OdisAI integrates with the tools you already use—so every call syncs seamlessly with your patient records.",
  topRowApps = defaultTopRowApps,
  bottomRowApps = defaultBottomRowApps,
}: IntegrationsSectionProps) => {
  const sectionVisibilityRef =
    useSectionVisibility<HTMLElement>("integrations");
  const localRef = useRef<HTMLElement>(null);
  const isInView = useInView(localRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Combine refs for both visibility tracking and animation
  const sectionRef = (el: HTMLElement | null) => {
    (localRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (
      sectionVisibilityRef as React.MutableRefObject<HTMLElement | null>
    ).current = el;
  };

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef as React.LegacyRef<HTMLElement>}
      id="integrations"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Cool mesh gradient - professional, technical competence */}
      <SectionBackground variant="mesh-cool" />

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
          <h2 className="font-display mb-4 max-w-2xl text-2xl font-medium tracking-tight text-slate-800 sm:text-3xl md:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-xl text-lg">{subtitle}</p>
        </motion.div>
      </div>

      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ ...transition, delay: 0.5 }}
        className="relative h-[140px] overflow-hidden"
      >
        <div
          className="absolute top-4 flex items-center gap-12 whitespace-nowrap"
          style={{
            animation: shouldReduceMotion
              ? "none"
              : "scroll-left 25s linear infinite",
            willChange: "transform",
          }}
        >
          {[...topRowApps, ...topRowApps].map((app, index) => (
            <IntegrationLogo key={`top-${index}`} app={app} />
          ))}
        </div>

        {/* Gradient overlays - using transparent to blend with background */}
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-20 w-32 bg-gradient-to-l to-transparent lg:w-48" />
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-20 w-32 bg-gradient-to-r to-transparent lg:w-48" />

        <div
          className="absolute top-[76px] flex items-center gap-12 whitespace-nowrap"
          style={{
            animation: shouldReduceMotion
              ? "none"
              : "scroll-left-slow 35s linear infinite",
            willChange: "transform",
          }}
        >
          {[...bottomRowApps, ...bottomRowApps].map((app, index) => (
            <IntegrationLogo key={`bottom-${index}`} app={app} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};
