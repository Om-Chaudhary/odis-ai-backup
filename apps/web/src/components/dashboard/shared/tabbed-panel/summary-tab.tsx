"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface SummaryTabProps {
  /** Call summary text */
  summary: string | null;
  /** Additional className */
  className?: string;
}

/**
 * Summary Tab Content - Redesigned
 *
 * Simplified to show only call summary text.
 * Audio player and actions moved to Call tab and action cards respectively.
 *
 * Features refined, clinical-yet-warm aesthetic with IBM Plex Sans typography.
 */
export function SummaryTab({ summary, className }: SummaryTabProps) {
  return (
    <div
      className={cn("space-y-4", className)}
      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
    >
      {/* Summary text */}
      {summary ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl"
        >
          {/* Refined background with subtle warmth */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-br from-slate-50/90 via-white/80 to-teal-50/40",
              "dark:from-slate-900/90 dark:via-slate-800/80 dark:to-teal-950/40",
              "ring-1 ring-slate-200/60 dark:ring-slate-700/60",
            )}
          />

          {/* Content */}
          <div className="relative p-5">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-teal-500/15 to-teal-600/10",
                  "ring-1 ring-teal-500/20",
                )}
              >
                <FileText className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                Call Summary
              </h3>
            </div>

            {/* Summary text */}
            <div
              className={cn(
                "prose prose-sm max-w-none",
                "text-slate-700 dark:text-slate-300",
              )}
            >
              <p className="leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-700"
        >
          <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No summary available for this call
          </p>
        </motion.div>
      )}
    </div>
  );
}
