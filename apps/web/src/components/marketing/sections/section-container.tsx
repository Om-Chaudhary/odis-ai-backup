"use client";

import { useRef, forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { SectionBackground } from "~/components/landing/ui/section-background";
import type { SectionBackgroundProps } from "~/components/landing/ui/section-background";
import { cn } from "@odis-ai/utils";

export interface SectionContainerProps extends HTMLAttributes<HTMLElement> {
  /**
   * Section content
   */
  children: ReactNode;
  /**
   * Background variant for the section
   */
  backgroundVariant?: SectionBackgroundProps["variant"];
  /**
   * Section ID for anchor links
   */
  id?: string;
  /**
   * Whether to animate the section on scroll
   * @default true
   */
  animated?: boolean;
  /**
   * Additional className for the section
   */
  className?: string;
  /**
   * Additional className for the inner container
   */
  containerClassName?: string;
  /**
   * Padding variant
   * @default "default"
   */
  padding?: "none" | "small" | "default" | "large";
}

const paddingClasses = {
  none: "",
  small: "py-8 sm:py-12 md:py-16",
  default: "py-16 sm:py-20 md:py-24 lg:py-32",
  large: "py-24 sm:py-32 md:py-40 lg:py-48",
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * SectionContainer
 *
 * A reusable wrapper component for marketing page sections.
 * Provides consistent spacing, backgrounds, and animation.
 *
 * @example
 * ```tsx
 * <SectionContainer
 *   id="features"
 *   backgroundVariant="cool-blue"
 *   padding="large"
 * >
 *   <SectionHeader title="Features" />
 *   <FeatureGrid />
 * </SectionContainer>
 * ```
 */
export const SectionContainer = forwardRef<HTMLElement, SectionContainerProps>(
  (
    {
      children,
      backgroundVariant,
      id,
      animated = true,
      className,
      containerClassName,
      padding = "default",
      ...props
    },
    forwardedRef,
  ) => {
    const localRef = useRef<HTMLElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLElement>) ?? localRef;
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const shouldReduceMotion = useReducedMotion();

    const transition = {
      duration: shouldReduceMotion ? 0 : 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    };

    const content = (
      <div
        className={cn(
          "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          containerClassName,
        )}
      >
        {children}
      </div>
    );

    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          "relative w-full overflow-hidden",
          paddingClasses[padding],
          className,
        )}
        {...props}
      >
        {backgroundVariant && <SectionBackground variant={backgroundVariant} />}

        {animated ? (
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={transition}
            className="relative"
          >
            {content}
          </motion.div>
        ) : (
          <div className="relative">{content}</div>
        )}
      </section>
    );
  },
);

SectionContainer.displayName = "SectionContainer";

export default SectionContainer;
