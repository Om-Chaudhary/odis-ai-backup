"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import Image from "next/image";
import { cn } from "@odis-ai/utils";

export type IntegrationStatus = "active" | "coming-soon" | "beta";

export interface IntegrationCardProps {
  /**
   * Integration name
   */
  name: string;
  /**
   * Integration slug (for URL)
   */
  slug: string;
  /**
   * Short description
   */
  description?: string;
  /**
   * Logo image source
   */
  logoSrc?: string;
  /**
   * Integration status
   * @default "active"
   */
  status?: IntegrationStatus;
  /**
   * List of features/capabilities
   */
  features?: string[];
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

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-700",
    icon: Check,
  },
  "coming-soon": {
    label: "Coming Soon",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  beta: {
    label: "Beta",
    color: "bg-blue-100 text-blue-700",
    icon: null,
  },
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * IntegrationCard
 *
 * A reusable card component for displaying integration information.
 *
 * @example
 * ```tsx
 * <IntegrationCard
 *   name="IDEXX Neo"
 *   slug="idexx-neo"
 *   description="Seamlessly sync patient data with IDEXX Neo."
 *   logoSrc="/images/integrations/idexx.png"
 *   status="active"
 *   features={["Auto-sync patients", "Lab results"]}
 * />
 * ```
 */
export function IntegrationCard({
  name,
  slug,
  description,
  logoSrc,
  status = "active",
  features,
  animated = true,
  isInView = true,
  delay = 0,
  className,
  children,
}: IntegrationCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const isClickable = status === "active";

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

  const cardContent = (
    <>
      {/* Header with logo and status */}
      <div className="mb-4 flex items-start justify-between">
        {/* Logo */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={`${name} logo`}
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          ) : (
            <span className="text-lg font-semibold text-slate-400">
              {name.charAt(0)}
            </span>
          )}
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            statusInfo.color,
          )}
        >
          {StatusIcon && <StatusIcon className="h-3 w-3" />}
          {statusInfo.label}
        </span>
      </div>

      {/* Name */}
      <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">
        {name}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      )}

      {/* Features */}
      {features && features.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {features.slice(0, 3).map((feature, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <Check className="h-3.5 w-3.5 text-teal-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Children */}
      {children}

      {/* Learn more link (only for active) */}
      {isClickable && (
        <div className="mt-auto flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors group-hover:text-teal-700">
          Learn more
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      )}
    </>
  );

  const cardClasses = cn(
    "group relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-all duration-300",
    isClickable
      ? "border-slate-200/80 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-teal-200"
      : "border-slate-200/60 bg-slate-50/50",
    className,
  );

  return (
    <Wrapper {...wrapperProps} className="h-full">
      {isClickable ? (
        <Link href={`/integrations/${slug}`} className={cardClasses}>
          {cardContent}
        </Link>
      ) : (
        <div className={cardClasses}>{cardContent}</div>
      )}
    </Wrapper>
  );
}

export default IntegrationCard;
