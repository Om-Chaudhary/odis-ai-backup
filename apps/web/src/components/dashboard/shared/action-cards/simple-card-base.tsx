"use client";

import { cn } from "@odis-ai/shared/util";

export type CardVariant =
  | "scheduled"
  | "rescheduled"
  | "canceled"
  | "callback"
  | "emergency"
  | "info";

/**
 * Variant accent colors - 4px left bar
 * Uses ODIS brand palette: sage, terracotta, slate, rose, sky
 */
const variantAccents: Record<CardVariant, string> = {
  scheduled: "bg-sage-500",
  rescheduled: "bg-sage-500",
  canceled: "bg-slate-400",
  callback: "bg-terracotta-500",
  emergency: "bg-rose-500",
  info: "bg-sky-500",
};

/**
 * Variant icon container backgrounds
 */
const variantIconBg: Record<CardVariant, string> = {
  scheduled: "bg-sage-50 text-sage-600",
  rescheduled: "bg-sage-50 text-sage-600",
  canceled: "bg-slate-50 text-slate-500",
  callback: "bg-terracotta-50 text-terracotta-600",
  emergency: "bg-rose-50 text-rose-600",
  info: "bg-sky-50 text-sky-600",
};

/**
 * Get styles for a card variant
 */
export function getCardVariantStyles(variant: CardVariant) {
  return {
    accent: variantAccents[variant],
    iconBg: variantIconBg[variant],
  };
}

interface SimpleCardBaseProps {
  /** Semantic color variant */
  variant: CardVariant;
  /** Additional className */
  className?: string;
  children: React.ReactNode;
}

/**
 * Simple Card Base
 *
 * Clean, utilitarian card with:
 * - White background
 * - Subtle border
 * - 4px colored left accent bar
 * - No gradients or animations
 */
export function SimpleCardBase({
  variant,
  className,
  children,
}: SimpleCardBaseProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        "border border-border/50 bg-card",
        "shadow-sm",
        className,
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          variantAccents[variant],
        )}
      />

      {/* Content */}
      <div className="pl-4">{children}</div>
    </div>
  );
}
