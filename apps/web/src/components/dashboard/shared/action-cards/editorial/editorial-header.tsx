"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import {
  type EditorialVariant,
  getEditorialVariantStyles,
} from "./editorial-card-base";
import { EditorialIconContainer } from "./editorial-icon-container";
import { EditorialConfirmButton } from "./editorial-confirm-button";

interface EditorialHeaderProps {
  /** Title text (e.g., "Appointment Scheduled") */
  title: string;
  /** Large icon to display */
  icon: LucideIcon;
  /** Semantic color variant */
  variant: EditorialVariant;
  /** Whether to show decorative notification dots on icon */
  showNotificationDots?: boolean;
  /** Whether to show the confirm button */
  showConfirmButton?: boolean;
  /** Callback when confirm is clicked */
  onConfirm?: () => void;
  /** Whether confirm action is in progress */
  isConfirming?: boolean;
  /** Whether the action has been confirmed */
  isConfirmed?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Editorial Header
 *
 * Redesigned header with icon on LEFT, title in the middle,
 * and optional confirm button on the RIGHT.
 */
export function EditorialHeader({
  title,
  icon,
  variant,
  showNotificationDots = false,
  showConfirmButton = false,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: EditorialHeaderProps) {
  const styles = getEditorialVariantStyles(variant);

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 px-5 pt-5 pb-3",
        className,
      )}
    >
      {/* Icon on the left */}
      <EditorialIconContainer
        icon={icon}
        variant={variant}
        showDots={showNotificationDots}
      />

      {/* Title - grows to fill space */}
      <motion.h3
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className={cn(
          "flex-1 text-xl font-semibold tracking-tight",
          styles.titleColor,
        )}
      >
        {title}
      </motion.h3>

      {/* Confirm button on the right (when applicable) */}
      {showConfirmButton && (onConfirm ?? isConfirmed) && (
        <EditorialConfirmButton
          onClick={onConfirm}
          isLoading={isConfirming}
          isConfirmed={isConfirmed}
        />
      )}
    </div>
  );
}
