"use client";

import type { ReactNode, ComponentType, SVGProps } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

export interface FeatureCardProps {
  /**
   * Icon component to display (Lucide icon or similar)
   */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * Card title
   */
  title: string;
  /**
   * Card description
   */
  description?: string;
  /**
   * List of highlights/features
   */
  highlights?: string[];
  /**
   * Whether the card is highlighted/featured
   * @default false
   */
  featured?: boolean;
  /**
   * Whether to animate the card
   * @default true
   */
  animated?: boolean;
  /**
   * Whether the section is in view (for animation trigger)
   * @default true
   */
  isInView?: boolean;
  /**
   * Animation delay (in seconds)
   * @default 0
   */
  delay?: number;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Optional children (additional content)
   */
  children?: ReactNode;
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * FeatureCard
 *
 * A reusable card component for displaying features or benefits.
 *
 * @example
 * ```tsx
 * <FeatureCard
 *   icon={Phone}
 *   title="24/7 Availability"
 *   description="Never miss a call, even at 3am."
 *   highlights={["After-hours coverage", "Weekend support"]}
 *   featured
 * />
 * ```
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  highlights,
  featured = false,
  animated = true,
  isInView = true,
  delay = 0,
  className,
  children,
}: FeatureCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.5,
    delay,
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
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group relative rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8",
        featured
          ? "border-teal-200 ring-1 ring-teal-500/20"
          : "border-slate-200/80",
        className,
      )}
    >
      {/* Featured badge */}
      {featured && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center rounded-full bg-teal-500 px-3 py-1 text-xs font-medium text-white">
            Popular
          </span>
        </div>
      )}

      {/* Icon */}
      {Icon && (
        <div
          className={cn(
            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl",
            featured
              ? "bg-teal-100 text-teal-600"
              : "bg-slate-100 text-slate-600",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}

      {/* Title */}
      <h3 className="font-display mb-2 text-lg font-semibold text-slate-900 sm:text-xl">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          {description}
        </p>
      )}

      {/* Highlights */}
      {highlights && highlights.length > 0 && (
        <ul className="mt-4 space-y-2">
          {highlights.map((highlight, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-slate-600"
            >
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Children */}
      {children}
    </Wrapper>
  );
}

export default FeatureCard;
