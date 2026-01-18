"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { format } from "date-fns";

interface ActionTaken {
  action: string;
  details?: string;
}

interface CallSummaryCardProps {
  /** The call summary text */
  summary: string | null;
  /** When the call occurred */
  timestamp?: string | null;
  /** Duration in seconds */
  durationSeconds?: number | null;
  /** List of actions taken during the call */
  actionsTaken?: (string | ActionTaken)[];
  /** Whether the call was successful */
  isSuccessful?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Call Summary Card Component
 *
 * A glassmorphic, modern card displaying call summary information.
 * Features frosted glass effect, subtle gradients, and teal accents.
 */
export function CallSummaryCard({
  summary,
  timestamp,
  durationSeconds,
  actionsTaken,
  isSuccessful = true,
  className,
}: CallSummaryCardProps) {
  const formattedDate = timestamp
    ? format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a")
    : null;

  const formattedDuration = durationSeconds
    ? durationSeconds >= 60
      ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
      : `${durationSeconds}s`
    : null;

  // Parse actions taken
  const actions = actionsTaken?.map((action) =>
    typeof action === "string" ? action : action.action,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Glassmorphic background */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl",
          "bg-gradient-to-br from-white/60 via-white/40 to-teal-50/30",
          "dark:from-slate-800/60 dark:via-slate-800/40 dark:to-teal-950/30",
          "backdrop-blur-md",
          "ring-1 ring-white/50 dark:ring-white/10",
          "shadow-lg shadow-slate-200/30 dark:shadow-slate-900/50",
        )}
      />

      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-teal-400/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-cyan-400/10 blur-xl" />

      {/* Content */}
      <div className="relative p-5">
        {/* Header row */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Status icon */}
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-gradient-to-br",
                isSuccessful
                  ? "from-teal-500/20 to-emerald-500/20 ring-1 ring-teal-500/20"
                  : "from-amber-500/20 to-orange-500/20 ring-1 ring-amber-500/20",
              )}
            >
              {isSuccessful ? (
                <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                Call Summary
              </h3>
              {formattedDate && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formattedDate}
                </p>
              )}
            </div>
          </div>

          {/* Duration pill */}
          {formattedDuration && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                "bg-white/60 dark:bg-white/10",
                "text-slate-600 dark:text-slate-300",
                "ring-1 ring-slate-200/50 dark:ring-slate-600/50",
              )}
            >
              <Clock className="h-3 w-3 text-teal-500" />
              <span className="font-medium">{formattedDuration}</span>
            </div>
          )}
        </div>

        {/* Summary text */}
        {summary ? (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {summary}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic dark:text-slate-500">
            No summary available for this call
          </p>
        )}

        {/* Actions Taken */}
        {actions && actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-4 border-t border-slate-200/50 pt-4 dark:border-slate-700/50"
          >
            <div className="mb-2.5 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              <span className="text-xs font-medium tracking-wide text-slate-600 uppercase dark:text-slate-400">
                Actions Taken
              </span>
            </div>
            <div className="space-y-1.5">
              {actions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-1.5",
                    "bg-gradient-to-r from-teal-500/5 to-transparent",
                    "border-l-2 border-teal-500/40",
                  )}
                >
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-teal-500/70" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {action}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
