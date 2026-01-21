"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";

export type EditorialVariant =
  | "scheduled"
  | "canceled"
  | "callback"
  | "emergency"
  | "info";

/**
 * Variant-specific styling with ODIS sage/terracotta palette
 * Editorial magazine aesthetic with print-inspired gradients
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
  }
> = {
  scheduled: {
    gradientFrom: "from-sage-100",
    gradientTo: "to-white",
    iconBg: "bg-sage-600",
    iconColor: "text-white",
    titleColor: "text-sage-900",
    labelColor: "text-sage-700",
    borderColor: "border-sage-200/60",
    sectionLabelColor: "text-sage-600",
  },
  canceled: {
    gradientFrom: "from-slate-100",
    gradientTo: "to-white",
    iconBg: "bg-slate-500",
    iconColor: "text-white",
    titleColor: "text-slate-800",
    labelColor: "text-slate-600",
    borderColor: "border-slate-200/60",
    sectionLabelColor: "text-slate-500",
  },
  callback: {
    gradientFrom: "from-terracotta-100",
    gradientTo: "to-white",
    iconBg: "bg-terracotta-500",
    iconColor: "text-white",
    titleColor: "text-terracotta-900",
    labelColor: "text-terracotta-700",
    borderColor: "border-terracotta-200/60",
    sectionLabelColor: "text-terracotta-600",
  },
  emergency: {
    gradientFrom: "from-rose-100",
    gradientTo: "to-white",
    iconBg: "bg-rose-600",
    iconColor: "text-white",
    titleColor: "text-rose-900",
    labelColor: "text-rose-700",
    borderColor: "border-rose-200/60",
    sectionLabelColor: "text-rose-600",
  },
  info: {
    gradientFrom: "from-sky-100",
    gradientTo: "to-white",
    iconBg: "bg-sky-600",
    iconColor: "text-white",
    titleColor: "text-sky-900",
    labelColor: "text-sky-700",
    borderColor: "border-sky-200/60",
    sectionLabelColor: "text-sky-600",
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
