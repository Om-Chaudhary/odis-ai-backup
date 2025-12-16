"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "~/lib/utils";

export interface SectionHeaderProps {
  /**
   * Badge text displayed above the title
   */
  badge?: string;
  /**
   * Badge color variant
   * @default "teal"
   */
  badgeVariant?: "teal" | "violet" | "blue" | "slate";
  /**
   * Main section title
   */
  title: string;
  /**
   * Subtitle/description text
   */
  subtitle?: string;
  /**
   * Text alignment
   * @default "center"
   */
  align?: "left" | "center" | "right";
  /**
   * Whether to animate the header
   * @default true
   */
  animated?: boolean;
  /**
   * Whether the section is in view (for animation trigger)
   * @default true
   */
  isInView?: boolean;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Optional children (rendered after subtitle)
   */
  children?: ReactNode;
}

const badgeColors = {
  teal: "bg-teal-500/10 text-teal-700",
  violet: "bg-violet-500/10 text-violet-700",
  blue: "bg-blue-500/10 text-blue-700",
  slate: "bg-slate-500/10 text-slate-700",
};

const badgeDotColors = {
  teal: "bg-teal-500",
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  slate: "bg-slate-500",
};

const alignClasses = {
  left: "text-left",
  center: "text-center mx-auto",
  right: "text-right ml-auto",
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**
 * SectionHeader
 *
 * A reusable header component for marketing page sections.
 * Includes badge, title, and subtitle with consistent styling and animation.
 *
 * @example
 * ```tsx
 * <SectionHeader
 *   badge="Features"
 *   title="Everything You Need"
 *   subtitle="Powerful tools to automate your practice communications."
 *   align="center"
 * />
 * ```
 */
export function SectionHeader({
  badge,
  badgeVariant = "teal",
  title,
  subtitle,
  align = "center",
  animated = true,
  isInView = true,
  className,
  children,
}: SectionHeaderProps) {
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? {
        initial: "hidden",
        animate: isInView ? "visible" : "hidden",
        variants: fadeUpVariant,
        transition,
      }
    : {};

  return (
    <div
      className={cn("mb-12 max-w-3xl lg:mb-16", alignClasses[align], className)}
    >
      {/* Badge */}
      {badge && (
        <Wrapper {...wrapperProps} className="mb-4">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              badgeColors[badgeVariant],
            )}
          >
            <span
              className={cn(
                "h-2 w-2 animate-pulse rounded-full",
                badgeDotColors[badgeVariant],
              )}
            />
            {badge}
          </span>
        </Wrapper>
      )}

      {/* Title */}
      <Wrapper
        {...(animated
          ? { ...wrapperProps, transition: { ...transition, delay: 0.1 } }
          : {})}
      >
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
          {title}
        </h2>
      </Wrapper>

      {/* Subtitle */}
      {subtitle && (
        <Wrapper
          {...(animated
            ? { ...wrapperProps, transition: { ...transition, delay: 0.2 } }
            : {})}
        >
          <p className="text-muted-foreground mt-4 text-base sm:text-lg lg:text-xl">
            {subtitle}
          </p>
        </Wrapper>
      )}

      {/* Children */}
      {children && (
        <Wrapper
          {...(animated
            ? { ...wrapperProps, transition: { ...transition, delay: 0.3 } }
            : {})}
        >
          <div className="mt-6">{children}</div>
        </Wrapper>
      )}
    </div>
  );
}

export default SectionHeader;
