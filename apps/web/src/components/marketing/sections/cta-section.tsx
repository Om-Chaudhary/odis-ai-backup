"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { SectionBackground } from "~/components/landing/ui/section-background";
import type { SectionBackgroundProps } from "~/components/landing/ui/section-background";
import { Button } from "@odis-ai/ui/button";
import { cn } from "@odis-ai/utils";

export interface CTASectionProps {
  /**
   * Badge text displayed above the title
   */
  badge?: string;
  /**
   * Main CTA title
   */
  title: string;
  /**
   * Subtitle/description text
   */
  subtitle?: string;
  /**
   * Primary CTA button text
   * @default "Book a Demo"
   */
  primaryCTAText?: string;
  /**
   * Primary CTA link
   * @default "/demo"
   */
  primaryCTAHref?: string;
  /**
   * Secondary CTA button text
   */
  secondaryCTAText?: string;
  /**
   * Secondary CTA link
   */
  secondaryCTAHref?: string;
  /**
   * Whether to show the phone CTA
   * @default true
   */
  showPhoneCTA?: boolean;
  /**
   * Phone number for the phone CTA
   * @default "(925) 678-5640"
   */
  phoneNumber?: string;
  /**
   * Background variant for the section
   * @default "accent-cta"
   */
  backgroundVariant?: SectionBackgroundProps["variant"];
  /**
   * Additional className for the section
   */
  className?: string;
  /**
   * Section ID for anchor links
   */
  id?: string;
  /**
   * Optional children (additional content)
   */
  children?: ReactNode;
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**
 * CTASection
 *
 * A reusable call-to-action section for marketing pages.
 * Includes title, subtitle, and configurable CTA buttons.
 *
 * @example
 * ```tsx
 * <CTASection
 *   badge="Get Started"
 *   title="Ready to Transform Your Practice?"
 *   subtitle="Join hundreds of veterinary clinics using OdisAI."
 *   primaryCTAText="Book a Demo"
 *   primaryCTAHref="/demo"
 *   showPhoneCTA
 * />
 * ```
 */
export function CTASection({
  badge,
  title,
  subtitle,
  primaryCTAText = "Book a Demo",
  primaryCTAHref = "/demo",
  secondaryCTAText,
  secondaryCTAHref,
  showPhoneCTA = true,
  phoneNumber = "(925) 678-5640",
  backgroundVariant = "accent-cta",
  className,
  id,
  children,
}: CTASectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  // Format phone number for tel: link
  const phoneHref = `tel:+1${phoneNumber.replace(/\D/g, "")}`;

  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        "relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32",
        className,
      )}
    >
      <SectionBackground variant={backgroundVariant} />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        {badge && (
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
              {badge}
            </span>
          </motion.div>
        )}

        {/* Title */}
        <motion.h2
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUpVariant}
          transition={{ ...transition, delay: 0.1 }}
          className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl"
        >
          {title}
        </motion.h2>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0.2 }}
            className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base sm:text-lg"
          >
            {subtitle}
          </motion.p>
        )}

        {/* CTA Buttons */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUpVariant}
          transition={{ ...transition, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {/* Primary CTA */}
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3 text-base font-semibold shadow-lg transition-all hover:shadow-xl"
          >
            <Link href={primaryCTAHref}>
              {primaryCTAText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {/* Secondary CTA */}
          {secondaryCTAText && secondaryCTAHref && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-slate-300 px-8 py-3 text-base font-semibold transition-all hover:bg-slate-50"
            >
              <Link href={secondaryCTAHref}>{secondaryCTAText}</Link>
            </Button>
          )}

          {/* Phone CTA */}
          {showPhoneCTA && (
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-muted-foreground hover:text-slate-900"
            >
              <a href={phoneHref}>
                <Phone className="mr-2 h-4 w-4" />
                {phoneNumber}
              </a>
            </Button>
          )}
        </motion.div>

        {/* Children */}
        {children && (
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0.4 }}
            className="mt-12"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default CTASection;
