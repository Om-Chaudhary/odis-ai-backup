"use client";

import { AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { SystemHealth } from "./types";

interface SystemStatusBannerProps {
  systemHealth: SystemHealth;
  onReviewClick: () => void;
}

export function SystemStatusBanner({
  systemHealth,
  onReviewClick,
}: SystemStatusBannerProps) {
  // Don't render if system is healthy
  if (systemHealth.status === "healthy") {
    return null;
  }

  const isCritical = systemHealth.status === "error";
  const totalIssues = systemHealth.totalCriticalActions;

  // Build a descriptive message based on what needs attention
  const issues: string[] = [];
  if (systemHealth.failedCallsCount > 0) {
    issues.push(
      `${systemHealth.failedCallsCount} failed call${systemHealth.failedCallsCount > 1 ? "s" : ""}`,
    );
  }
  if (systemHealth.voicemailsNeedingAction > 0) {
    issues.push(
      `${systemHealth.voicemailsNeedingAction} voicemail${systemHealth.voicemailsNeedingAction > 1 ? "s" : ""} need follow-up`,
    );
  }

  const issueText =
    issues.length > 0
      ? issues.join(", ")
      : `${totalIssues} item${totalIssues > 1 ? "s" : ""} need attention`;

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-top-2 flex items-center justify-between gap-4 rounded-xl border-l-4 px-4 py-3 duration-300",
        isCritical
          ? "border-red-500 bg-red-50 text-red-800"
          : "border-amber-500 bg-amber-50 text-amber-800",
      )}
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <XCircle className="h-5 w-5 shrink-0 text-red-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="font-medium">
            {isCritical ? "Urgent attention required" : "Items need review"}
          </p>
          <p
            className={cn(
              "text-sm",
              isCritical ? "text-red-700" : "text-amber-700",
            )}
          >
            {issueText}
          </p>
        </div>
      </div>
      <button
        onClick={onReviewClick}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          isCritical
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-amber-600 text-white hover:bg-amber-700",
        )}
      >
        Review Now
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
