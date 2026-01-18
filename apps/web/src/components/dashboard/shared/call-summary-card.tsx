"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@odis-ai/shared/ui/badge";
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
 * A beautiful, modern card displaying call summary information.
 * Features:
 * - Gradient header with icon
 * - Timestamp and duration badges
 * - Animated actions list
 * - Dark mode support
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border",
        "bg-gradient-to-br from-white via-slate-50/50 to-teal-50/30",
        "border-slate-200/60",
        "dark:from-slate-900 dark:via-slate-800/50 dark:to-teal-950/30",
        "dark:border-slate-700/50",
        "shadow-sm transition-shadow duration-300 hover:shadow-md",
        className,
      )}
    >
      {/* Decorative gradient orb */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/10 to-cyan-400/10 blur-2xl dark:from-teal-500/5 dark:to-cyan-500/5" />

      {/* Header */}
      <div className="relative border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-gradient-to-br shadow-sm",
                isSuccessful
                  ? "from-teal-500 to-teal-600 shadow-teal-500/20"
                  : "from-amber-500 to-amber-600 shadow-amber-500/20",
              )}
            >
              {isSuccessful ? (
                <CheckCircle2 className="h-5 w-5 text-white" />
              ) : (
                <FileText className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Call Summary
              </h3>
              {formattedDate && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formattedDate}
                </p>
              )}
            </div>
          </div>

          {/* Duration badge */}
          {formattedDuration && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 bg-slate-100/80 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
            >
              <Clock className="h-3 w-3" />
              {formattedDuration}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative px-5 py-4">
        {summary ? (
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            {summary}
          </p>
        ) : (
          <p className="text-slate-400 italic dark:text-slate-500">
            No summary available for this call
          </p>
        )}

        {/* Actions Taken */}
        {actions && actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Actions Taken
              </span>
            </div>
            <div className="space-y-2">
              {actions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-2",
                    "bg-gradient-to-r from-teal-50/50 to-transparent",
                    "dark:from-teal-950/30 dark:to-transparent",
                    "border-l-2 border-teal-500/50",
                  )}
                >
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-teal-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
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
