"use client";

import { useState } from "react";
import { parseAttentionSummary, getAttentionTitle, formatAttentionAction, type ParsedAttentionSummary } from "@odis-ai/shared/util";
import { cn } from "@odis-ai/shared/util";
import { Button } from "@odis-ai/shared/ui/button";
import {
  AlertTriangle,
  Pill,
  Phone,
  Calendar,
  Heart,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  Stethoscope,
  Octagon
} from "lucide-react";

interface NeedsAttentionCardProps {
  attentionTypes: string[];
  attentionSeverity: string | null;
  attentionSummary: string | null;
  className?: string;
  callId?: string; // For persisting done state
}

/**
 * NeedsAttentionCard - Clean professional design matching inbound communication cards
 *
 * Features:
 * - Clean white card with subtle borders
 * - Icon + title layout with proper spacing
 * - Structured parsing of attention summaries
 * - Checkmark functionality for marking as done
 * - Professional typography and spacing
 */
export function NeedsAttentionCard({
  attentionTypes,
  attentionSeverity,
  attentionSummary,
  className,
  callId,
}: NeedsAttentionCardProps) {
  // State for marking as done (in production, this would be persisted)
  const [isDone, setIsDone] = useState(false);

  // Parse the attention summary
  const parsed: ParsedAttentionSummary | null = parseAttentionSummary(attentionSummary);

  // Get user-friendly title from attention types
  const title = getAttentionTitle(attentionTypes);

  // Icon mapping with colors for each attention type
  const getAttentionIcon = (attentionTypes: string[]) => {
    const iconMap = {
      emergency_signs: { icon: Octagon, color: "text-red-600" },
      medication_question: { icon: Pill, color: "text-blue-600" },
      callback_request: { icon: Phone, color: "text-green-600" },
      appointment_needed: { icon: Calendar, color: "text-purple-600" },
      health_concern: { icon: Heart, color: "text-pink-600" },
      dissatisfaction: { icon: AlertCircle, color: "text-amber-600" },
      owner_dissatisfaction: { icon: AlertCircle, color: "text-amber-600" },
      billing_question: { icon: DollarSign, color: "text-emerald-600" }
    };

    const primaryType = attentionTypes[0];
    return iconMap[primaryType as keyof typeof iconMap] || { icon: Stethoscope, color: "text-gray-600" };
  };

  const { icon: IconComponent, color: iconColor } = getAttentionIcon(attentionTypes);

  const handleMarkAsDone = () => {
    setIsDone(true);
    // In production, you would persist this state via API call
    // Example: markAttentionAsDone(callId, attentionTypes[0])
  };

  return (
    <div className={cn(
      "rounded-xl border shadow-sm backdrop-blur-md transition-all duration-300",
      "bg-gradient-to-br from-white/80 via-slate-50/30 to-white/80",
      "border-slate-200/50 hover:shadow-md",
      "dark:from-slate-900/80 dark:via-slate-800/30 dark:to-slate-900/80",
      "dark:border-slate-700/50",
      isDone && "opacity-75",
      className
    )}>
      <div className="p-4 space-y-4">
        {/* Header with icon and title */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "bg-gradient-to-br from-slate-100 to-slate-200",
            "dark:from-slate-800/50 dark:to-slate-700/50",
            "shadow-inner",
            isDone && "opacity-50"
          )}>
            {isDone ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <IconComponent className={cn("h-4 w-4", iconColor)} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "text-base font-semibold text-slate-800 dark:text-white",
              isDone && "line-through opacity-60"
            )}>
              {isDone ? "Attention Addressed" : title}
            </h3>
          </div>
        </div>

        {/* Content */}
        {!isDone && parsed ? (
          <div className="space-y-3">
            {/* Reason line */}
            {parsed.isStructured && parsed.reason && (
              <div className="rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="text-slate-900 dark:text-white font-semibold">{parsed.reason}</span>
                  {parsed.context && parsed.context !== "Attention needed" && (
                    <span className="text-slate-600 dark:text-slate-400"> - {parsed.context}</span>
                  )}
                </p>
              </div>
            )}

            {/* Action line */}
            {parsed.action && (
              <div className="rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Action Needed
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  {formatAttentionAction(parsed.action).split('\n').map((line, index, array) => (
                    <span key={index}>
                      {line}
                      {index < array.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
        ) : !isDone ? (
          <div className="rounded-lg border border-slate-200/50 bg-slate-50/50 p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {attentionSummary || "Please review this case for attention items."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-green-200/50 bg-green-50/50 p-3 dark:border-green-700/50 dark:bg-green-800/30">
            <p className="text-sm text-green-700 dark:text-green-300">
              This attention item has been marked as complete.
            </p>
          </div>
        )}

        {/* Mark as Done button */}
        {!isDone && (
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsDone}
              className={cn(
                "w-full justify-start gap-2 text-xs font-medium transition-all",
                "hover:bg-green-100 dark:hover:bg-green-900/30",
                "text-slate-600 hover:text-green-700 dark:text-slate-400 dark:hover:text-green-400"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}