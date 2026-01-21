"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { EditorialVariant } from "./editorial-card-base";

interface EditorialStatusBadgeProps {
  /** Status text to display */
  text: string;
  /** Whether to show pulsing animation */
  isPulsing?: boolean;
  /** Whether to show check icon */
  showCheck?: boolean;
  /** Semantic color variant */
  variant: EditorialVariant;
  /** Additional className */
  className?: string;
}

/**
 * Editorial Status Badge
 *
 * Status indicator badge with optional pulsing animation
 * for active states (e.g., "Awaiting Callback").
 */
export function EditorialStatusBadge({
  text,
  isPulsing = false,
  showCheck = false,
  variant,
  className,
}: EditorialStatusBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className={cn("px-5 pb-4 flex justify-end", className)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
          "text-[11px] font-medium",
          "ring-1",
          // Variant-specific styling
          variant === "scheduled" && "bg-sage-100 text-sage-700 ring-sage-200",
          variant === "canceled" && "bg-slate-100 text-slate-600 ring-slate-200",
          variant === "callback" && "bg-terracotta-100 text-terracotta-700 ring-terracotta-200",
          variant === "emergency" && "bg-rose-100 text-rose-700 ring-rose-200",
          variant === "info" && "bg-sky-50 text-sky-700 ring-sky-200",
        )}
      >
        {isPulsing ? (
          <motion.span
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              variant === "scheduled" && "bg-sage-500",
              variant === "canceled" && "bg-slate-400",
              variant === "callback" && "bg-terracotta-500",
              variant === "emergency" && "bg-rose-500",
              variant === "info" && "bg-sky-500",
            )}
          />
        ) : showCheck ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              variant === "scheduled" && "bg-sage-400",
              variant === "canceled" && "bg-slate-400",
              variant === "callback" && "bg-terracotta-400",
              variant === "emergency" && "bg-rose-400",
              variant === "info" && "bg-sky-400",
            )}
          />
        )}
        {text}
      </span>
    </motion.div>
  );
}
