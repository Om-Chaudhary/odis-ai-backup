"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
import { format } from "date-fns";
import {
  type EditorialVariant,
  getEditorialVariantStyles,
} from "./editorial-card-base";

interface EditorialActionButtonProps {
  /** Button label (e.g., "CONFIRM", "CALL BACK") */
  label: string;
  /** Date to display in MM.DD.YYYY format, or custom text */
  dateOrText: Date | string;
  /** Click handler */
  onClick?: () => void;
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Semantic color variant */
  variant: EditorialVariant;
  /** Additional className */
  className?: string;
}

/**
 * Editorial Action Button
 *
 * Split button design with action label on left and date badge on right.
 * Uses monospace font for dates per editorial magazine aesthetic.
 */
export function EditorialActionButton({
  label,
  dateOrText,
  onClick,
  isLoading,
  disabled,
  variant,
  className,
}: EditorialActionButtonProps) {
  const styles = getEditorialVariantStyles(variant);

  // Format date if it's a Date object
  const displayText =
    dateOrText instanceof Date
      ? format(dateOrText, "MM.dd.yyyy")
      : dateOrText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.3 }}
      className={cn("px-5 pb-5 pt-3", className)}
    >
      <button
        onClick={onClick}
        disabled={disabled ?? isLoading}
        className={cn(
          "relative w-full overflow-hidden rounded-lg",
          "flex items-stretch",
          "border transition-all duration-200",
          "hover:shadow-md active:scale-[0.99]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          styles.borderColor,
          // Variant-specific background
          variant === "scheduled" && "bg-sage-600 hover:bg-sage-700 border-sage-600",
          variant === "canceled" && "bg-slate-500 hover:bg-slate-600 border-slate-500",
          variant === "callback" && "bg-terracotta-500 hover:bg-terracotta-600 border-terracotta-500",
          variant === "emergency" && "bg-rose-600 hover:bg-rose-700 border-rose-600",
          variant === "info" && "bg-sky-600 hover:bg-sky-700 border-sky-600",
        )}
      >
        {/* Label section */}
        <div
          className={cn(
            "flex-1 flex items-center justify-center",
            "px-4 py-2.5",
            "text-xs font-semibold uppercase tracking-wider",
            "text-white",
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full"
              />
              Processing
            </span>
          ) : (
            label
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-white/20" />

        {/* Date/text section */}
        <div
          className={cn(
            "flex items-center justify-center",
            "px-4 py-2.5",
            "font-mono text-xs",
            "text-white/90",
            "bg-black/10",
          )}
        >
          {displayText}
        </div>
      </button>
    </motion.div>
  );
}
