"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface EditorialConfirmButtonProps {
  /** Callback when confirm button is clicked */
  onClick?: () => void;
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
  /** Whether the action has been confirmed */
  isConfirmed?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Editorial Confirm Button
 *
 * Large rounded square button with checkmark icon for confirming actions.
 * Shows "Confirmed" badge when action is complete.
 */
export function EditorialConfirmButton({
  onClick,
  isLoading,
  isConfirmed,
  disabled,
  className,
}: EditorialConfirmButtonProps) {
  // Show confirmed badge instead of button
  if (isConfirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "inline-flex items-center justify-center",
          "rounded-lg px-4 py-2",
          "bg-zinc-800 text-white",
          "text-sm font-medium",
          className,
        )}
      >
        Confirmed
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled ?? isLoading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex h-14 w-14 items-center justify-center",
        "rounded-2xl",
        "bg-primary text-white",
        "shadow-lg shadow-primary/25",
        "transition-all duration-200",
        "hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30",
        "active:bg-primary/80",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" strokeWidth={2.5} />
      ) : (
        <Check className="h-6 w-6" strokeWidth={3} />
      )}
    </motion.button>
  );
}
