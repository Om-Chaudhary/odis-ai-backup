"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  Zap,
  Send,
} from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { Progress } from "@odis-ai/shared/ui/progress";
import { cn } from "@odis-ai/shared/util";
import { useBulkOperation } from "./bulk-operation-context";

/**
 * Collapsible floating progress widget for bulk discharge operations.
 * Appears in the bottom-right corner when a bulk send operation is in progress.
 */
export function BulkOperationProgress() {
  const {
    phase,
    totalCases,
    processedCases,
    cases,
    successCount,
    failedCount,
    isMinimized,
    setMinimized,
    clearOperation,
    errorMessage,
  } = useBulkOperation();

  // Auto-collapse after showing complete state for a bit
  const [showFullResults, setShowFullResults] = useState(false);

  // Reset showFullResults when a new operation starts
  useEffect(() => {
    if (phase === "generating") {
      setShowFullResults(false);
    }
  }, [phase]);

  // Don't render if idle
  if (phase === "idle") {
    return null;
  }

  const progressPercent =
    totalCases > 0 ? Math.round((processedCases / totalCases) * 100) : 0;

  const isComplete = phase === "complete" || phase === "error";
  const isProcessing = phase === "generating" || phase === "scheduling";

  const phaseLabel =
    phase === "generating"
      ? "Generating summaries..."
      : phase === "scheduling"
        ? "Scheduling deliveries..."
        : phase === "complete"
          ? "Complete"
          : "Error";

  // Minimized pill view
  if (isMinimized) {
    return (
      <div className="animate-in slide-in-from-bottom-2 fixed right-6 bottom-6 z-50">
        <button
          onClick={() => setMinimized(false)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all hover:scale-105",
            isComplete && failedCount === 0
              ? "bg-emerald-500 text-white"
              : isComplete && failedCount > 0
                ? "bg-amber-500 text-white"
                : "bg-teal-600 text-white",
          )}
        >
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
          {isComplete && failedCount === 0 && (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {isComplete && failedCount > 0 && <XCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {isComplete
              ? `${successCount}/${totalCases} sent`
              : `${processedCases}/${totalCases}`}
          </span>
          <ChevronUp className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Expanded card view
  return (
    <div className="animate-in slide-in-from-bottom-4 fixed right-6 bottom-6 z-50 w-80">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3",
            isComplete && failedCount === 0
              ? "bg-emerald-500"
              : isComplete && failedCount > 0
                ? "bg-amber-500"
                : "bg-gradient-to-r from-teal-500 to-teal-600",
          )}
        >
          <div className="flex items-center gap-2 text-white">
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isComplete && failedCount === 0 && (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isComplete && failedCount > 0 && <XCircle className="h-4 w-4" />}
            <span className="text-sm font-semibold">{phaseLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
              onClick={() => setMinimized(true)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            {isComplete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                onClick={clearOperation}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress section */}
        <div className="px-4 py-4">
          {/* Progress bar */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                {isComplete ? "Completed" : "Progress"}
              </span>
              <span className="text-slate-500 tabular-nums">
                {processedCases} of {totalCases}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className={cn(
                "h-2",
                isComplete && failedCount === 0
                  ? "[&>[data-state=complete]]:bg-emerald-500 [&>div]:bg-emerald-500"
                  : isComplete && failedCount > 0
                    ? "[&>[data-state=complete]]:bg-amber-500 [&>div]:bg-amber-500"
                    : "[&>div]:bg-teal-500",
              )}
            />
          </div>

          {/* Stats */}
          {isComplete && (
            <div className="mb-3 flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                  <Send className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {successCount} sent
                </span>
              </div>
              {failedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-3 w-3 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {failedCount} failed
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {phase === "error" && errorMessage && (
            <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Case list (collapsible for complete state) */}
          {isComplete && (
            <button
              onClick={() => setShowFullResults(!showFullResults)}
              className="mb-2 flex w-full items-center justify-between text-xs text-slate-500 hover:text-slate-700"
            >
              <span>View details</span>
              {showFullResults ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}

          {/* Case list - show during processing or when expanded */}
          {(isProcessing || showFullResults) && (
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all",
                    caseItem.status === "generating"
                      ? "bg-teal-50 ring-1 ring-teal-200"
                      : caseItem.status === "scheduled"
                        ? "bg-emerald-50"
                        : caseItem.status === "failed"
                          ? "bg-red-50"
                          : "bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "truncate font-medium",
                      caseItem.status === "generating"
                        ? "text-teal-700"
                        : caseItem.status === "scheduled"
                          ? "text-emerald-700"
                          : caseItem.status === "failed"
                            ? "text-red-700"
                            : "text-slate-500",
                    )}
                  >
                    {caseItem.patientName}
                  </span>
                  <div className="ml-2 flex-shrink-0">
                    {caseItem.status === "generating" && (
                      <Loader2 className="h-3 w-3 animate-spin text-teal-500" />
                    )}
                    {caseItem.status === "scheduled" && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    )}
                    {caseItem.status === "failed" && (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    {caseItem.status === "pending" && (
                      <div className="h-3 w-3 rounded-full border border-slate-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current action indicator for processing */}
          {isProcessing && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Zap className="h-3 w-3 text-teal-500" />
              <span>
                {phase === "generating"
                  ? "Generating discharge summaries..."
                  : "Scheduling calls and emails..."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
