"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { InlineAudioPlayer } from "./inline-audio-player";

interface SummaryTabProps {
  /** Call summary text */
  summary: string | null;
  /** Recording URL */
  recordingUrl: string | null;
  /** Duration in seconds */
  durationSeconds?: number | null;
  /** Actions taken during the call */
  actionsTaken?: (string | { action: string; details?: string })[];
  /** Whether the call was successful */
  isSuccessful?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Summary Tab Content
 *
 * Displays call summary text with inline audio player.
 * Part of the CallDetailTabs component.
 */
export function SummaryTab({
  summary,
  recordingUrl,
  durationSeconds,
  actionsTaken,
  isSuccessful = true,
  className,
}: SummaryTabProps) {
  // Parse actions taken
  const actions = actionsTaken?.map((action) =>
    typeof action === "string" ? action : action.action,
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary text */}
      {summary ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-xl"
        >
          {/* Glassmorphic background */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-br from-white/60 via-white/40 to-slate-50/30",
              "dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-900/30",
              "backdrop-blur-sm",
              "ring-1 ring-white/50 dark:ring-white/10",
            )}
          />

          {/* Content */}
          <div className="relative p-4">
            <div className="mb-3 flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  "bg-gradient-to-br from-teal-500/20 to-emerald-500/10",
                  "ring-1 ring-teal-500/20",
                )}
              >
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Call Summary
              </h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {summary}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No summary available
          </p>
        </div>
      )}

      {/* Inline Audio Player */}
      {recordingUrl && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <InlineAudioPlayer
            src={recordingUrl}
            durationHint={durationSeconds ?? undefined}
            title="Call Recording"
          />
        </motion.div>
      )}

      {/* Actions Taken */}
      {actions && actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="relative overflow-hidden rounded-xl"
        >
          {/* Glassmorphic background */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-br from-white/60 via-white/40 to-teal-50/20",
              "dark:from-slate-800/60 dark:via-slate-800/40 dark:to-teal-950/20",
              "backdrop-blur-sm",
              "ring-1 ring-white/50 dark:ring-white/10",
            )}
          />

          {/* Content */}
          <div className="relative p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-500" />
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
          </div>
        </motion.div>
      )}
    </div>
  );
}
