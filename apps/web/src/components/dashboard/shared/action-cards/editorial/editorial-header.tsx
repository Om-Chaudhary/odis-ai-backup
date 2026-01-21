"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import {
  type EditorialVariant,
  getEditorialVariantStyles,
} from "./editorial-card-base";

interface EditorialHeaderProps {
  /** First line of title (e.g., "Appointment") */
  titleLine1: string;
  /** Second line of title (e.g., "Scheduled") */
  titleLine2: string;
  /** Large icon to display */
  icon: LucideIcon;
  /** Semantic color variant */
  variant: EditorialVariant;
  /** Additional className */
  className?: string;
}

/**
 * Editorial Header
 *
 * Magazine-style header with gradient background, large icon,
 * and two-line title using display typography.
 */
export function EditorialHeader({
  titleLine1,
  titleLine2,
  icon: Icon,
  variant,
  className,
}: EditorialHeaderProps) {
  const styles = getEditorialVariantStyles(variant);

  return (
    <div
      className={cn(
        "relative flex items-start justify-between px-5 pt-5 pb-4",
        className,
      )}
    >
      {/* Title stack */}
      <div className="flex flex-col">
        <motion.h3
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className={cn(
            "font-display text-xl font-bold tracking-tight",
            styles.titleColor,
          )}
        >
          {titleLine1}
        </motion.h3>
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={cn(
            "font-display text-lg font-semibold tracking-tight -mt-0.5",
            styles.labelColor,
          )}
        >
          {titleLine2}
        </motion.span>
      </div>

      {/* Large icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          "shadow-lg",
          styles.iconBg,
        )}
      >
        <Icon className={cn("h-6 w-6", styles.iconColor)} strokeWidth={1.75} />
      </motion.div>
    </div>
  );
}
