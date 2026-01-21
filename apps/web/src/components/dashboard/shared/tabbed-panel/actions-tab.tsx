"use client";

import { motion } from "framer-motion";
import { Zap, Construction } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface ActionsTabProps {
  /** Additional className */
  className?: string;
}

/**
 * Actions Tab Content
 *
 * Placeholder for future action functionality.
 * Will contain quick actions, reply templates, etc.
 */
export function ActionsTab({ className }: ActionsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-xl",
        className,
      )}
    >
      {/* Glassmorphic background */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-br from-white/60 via-white/40 to-amber-50/20",
          "dark:from-slate-800/60 dark:via-slate-800/40 dark:to-amber-950/20",
          "backdrop-blur-sm",
          "ring-1 ring-white/50 dark:ring-white/10",
        )}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center p-8 text-center">
        <div
          className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl",
            "bg-gradient-to-br from-amber-500/20 to-orange-500/10",
            "ring-1 ring-amber-500/20",
          )}
        >
          <Construction className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>

        <h4 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Actions Coming Soon
        </h4>

        <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
          Quick actions, reply templates, and workflow integrations will be available here.
        </p>

        {/* Feature preview pills */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["Quick Reply", "Schedule Follow-up", "Add Note", "Assign Task"].map((feature) => (
            <span
              key={feature}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
                "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              <Zap className="h-3 w-3" />
              {feature}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
