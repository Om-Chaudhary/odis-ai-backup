"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import {
  type EditorialVariant,
  getEditorialVariantStyles,
} from "./editorial-card-base";

interface EditorialIconContainerProps {
  /** The icon to display */
  icon: LucideIcon;
  /** Semantic color variant */
  variant: EditorialVariant;
  /** Whether to show decorative notification dots */
  showDots?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Editorial Icon Container
 *
 * Large rounded icon with optional decorative notification dots
 * that add visual interest to the card header.
 */
export function EditorialIconContainer({
  icon: Icon,
  variant,
  showDots = false,
  className,
}: EditorialIconContainerProps) {
  const styles = getEditorialVariantStyles(variant);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn("relative", className)}
    >
      {/* Main icon container */}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          "shadow-md",
          styles.iconBg,
        )}
      >
        <Icon className={cn("h-6 w-6", styles.iconColor)} strokeWidth={1.75} />
      </div>

      {/* Decorative notification dots */}
      {showDots && (
        <>
          {/* Top-left dot */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.2 }}
            className={cn(
              "absolute -top-1 -left-1 h-2 w-2 rounded-full",
              styles.iconBg,
              "opacity-60",
            )}
          />
          {/* Top-right dot */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className={cn(
              "absolute -top-0.5 left-3 h-1.5 w-1.5 rounded-full",
              styles.iconBg,
              "opacity-40",
            )}
          />
          {/* Bottom dot */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.2 }}
            className={cn(
              "absolute -bottom-0.5 left-1 h-1.5 w-1.5 rounded-full",
              styles.iconBg,
              "opacity-50",
            )}
          />
        </>
      )}
    </motion.div>
  );
}
