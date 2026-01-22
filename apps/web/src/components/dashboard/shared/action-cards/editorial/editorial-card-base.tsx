"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";

export type EditorialVariant =
  | "scheduled"
  | "rescheduled"
  | "canceled"
  | "callback"
  | "emergency"
  | "info";

/**
 * Variant-specific styling
 * Refined editorial design matching the new visual specifications
 */
const variantStyles: Record<
  EditorialVariant,
  {
    gradientFrom: string;
    gradientTo: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    labelColor: string;
    borderColor: string;
    sectionLabelColor: string;
    valueColor: string;
  }
> = {
  scheduled: {
    gradientFrom: "from-emerald-50",
    gradientTo: "to-emerald-50/30",
    iconBg: "bg-primary",
    iconColor: "text-white",
    titleColor: "text-primary",
    labelColor: "text-muted-foreground",
    borderColor: "border-emerald-200/60",
    sectionLabelColor: "text-muted-foreground",
    valueColor: "text-primary",
  },
  rescheduled: {
    gradientFrom: "from-emerald-50",
    gradientTo: "to-emerald-50/30",
    iconBg: "bg-primary",
    iconColor: "text-white",
    titleColor: "text-primary",
    labelColor: "text-muted-foreground",
    borderColor: "border-emerald-200/60",
    sectionLabelColor: "text-muted-foreground",
    valueColor: "text-primary",
  },
  canceled: {
    gradientFrom: "from-rose-50",
    gradientTo: "to-rose-50/30",
    iconBg: "bg-rose-500",
    iconColor: "text-white",
    titleColor: "text-rose-600",
    labelColor: "text-muted-foreground",
    borderColor: "border-rose-200/60",
    sectionLabelColor: "text-muted-foreground",
    valueColor: "text-rose-600",
  },
  callback: {
    gradientFrom: "from-amber-50",
    gradientTo: "to-orange-50/30",
    iconBg: "bg-orange-500",
    iconColor: "text-white",
    titleColor: "text-orange-600",
    labelColor: "text-muted-foreground",
    borderColor: "border-amber-200/60",
    sectionLabelColor: "text-muted-foreground",
    valueColor: "text-orange-600",
  },
  emergency: {
    gradientFrom: "from-rose-50",
    gradientTo: "to-rose-50/30",
    iconBg: "bg-rose-500",
    iconColor: "text-white",
    titleColor: "text-rose-600",
    labelColor: "text-muted-foreground",
    borderColor: "border-rose-200/60",
    sectionLabelColor: "text-muted-foreground",
    valueColor: "text-rose-600",
  },
  info: {
    gradientFrom: "from-sky-50",
    gradientTo: "to-sky-50/30",
    iconBg: "bg-sky-500",
    iconColor: "text-white",
    titleColor: "text-sky-600",
    labelColor: "text-muted-foreground",
    borderColor: "border-sky-200/60",
    sectionLabelColor: "text-muted-foreground",
    valueColor: "text-sky-600",
  },
};

export function getEditorialVariantStyles(variant: EditorialVariant) {
  return variantStyles[variant];
}

interface EditorialCardBaseProps {
  /** Semantic color variant */
  variant: EditorialVariant;
  /** Additional className */
  className?: string;
  children: React.ReactNode;
}

/**
 * Editorial Card Base
 *
 * Base container for editorial-style action cards with
 * gradient backgrounds and print-inspired aesthetics.
 */
export function EditorialCardBase({
  variant,
  className,
  children,
}: EditorialCardBaseProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={cn(
        "relative overflow-hidden rounded-xl",
        "border",
        styles.borderColor,
        className,
      )}
    >
      {/* Gradient background */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-b",
          styles.gradientFrom,
          styles.gradientTo,
        )}
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
