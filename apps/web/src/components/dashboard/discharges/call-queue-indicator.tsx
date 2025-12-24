"use client";

import { useState } from "react";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { ScrollArea } from "@odis-ai/shared/ui/scroll-area";
import { ChevronDown, ChevronUp, Loader2, Mail, Phone } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { DashboardCase } from "@odis-ai/shared/types";

/** Tracks which case is currently being processed and what type of discharge */
interface LoadingState {
  caseId: string;
  type: "call" | "email" | "both";
}

interface CallQueueIndicatorProps {
  loadingCases: Map<string, LoadingState>;
  cases: DashboardCase[];
}

/**
 * CallQueueIndicator - Floating indicator for in-flight discharge requests
 *
 * Shows in the bottom-right corner when multiple calls/emails are being sent.
 * Can be minimized to a compact pill or expanded to show details.
 */
export function CallQueueIndicator({
  loadingCases,
  cases,
}: CallQueueIndicatorProps) {
  const [isMinimized, setIsMinimized] = useState(true);

  // Don't render if nothing is loading
  if (loadingCases.size === 0) {
    return null;
  }

  // Calculate counts
  const loadingArray = Array.from(loadingCases.values());
  const callCount = loadingArray.filter(
    (l) => l.type === "call" || l.type === "both",
  ).length;
  const emailCount = loadingArray.filter(
    (l) => l.type === "email" || l.type === "both",
  ).length;
  const totalCount = loadingCases.size;

  // Get patient names for the loading cases
  const loadingItems = loadingArray.map((loading) => {
    const caseData = cases.find((c) => c.id === loading.caseId);
    return {
      ...loading,
      patientName: caseData?.patient.name ?? "Unknown Patient",
    };
  });

  // Minimized view - compact pill
  if (isMinimized) {
    return (
      <div className="bg-background fixed right-4 bottom-4 z-50 rounded-lg border shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2"
        >
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm font-medium">{totalCount} sending</span>
          <div className="flex gap-1">
            {callCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                <Phone className="mr-1 h-3 w-3" />
                {callCount}
              </Badge>
            )}
            {emailCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                <Mail className="mr-1 h-3 w-3" />
                {emailCount}
              </Badge>
            )}
          </div>
          <ChevronUp className="text-muted-foreground h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Expanded view - shows details
  return (
    <div className="bg-background fixed right-4 bottom-4 z-50 w-80 rounded-lg border shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm font-medium">
            Sending {totalCount} discharge{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsMinimized(true)}
          className="h-6 w-6"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 border-b px-4 py-2">
        {callCount > 0 && (
          <Badge variant="outline" className="gap-1">
            <Phone className="h-3 w-3" />
            {callCount} call{callCount !== 1 ? "s" : ""}
          </Badge>
        )}
        {emailCount > 0 && (
          <Badge variant="outline" className="gap-1">
            <Mail className="h-3 w-3" />
            {emailCount} email{emailCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* List of cases being processed */}
      <ScrollArea className={cn("p-2", totalCount > 5 ? "h-48" : "")}>
        <div className="space-y-1">
          {loadingItems.map((item) => (
            <div
              key={item.caseId}
              className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2 text-sm"
            >
              <Loader2 className="h-3 w-3 shrink-0 animate-spin text-blue-500" />
              <span className="flex-1 truncate">{item.patientName}</span>
              <div className="flex shrink-0 gap-1">
                {(item.type === "call" || item.type === "both") && (
                  <Phone className="text-muted-foreground h-3 w-3" />
                )}
                {(item.type === "email" || item.type === "both") && (
                  <Mail className="text-muted-foreground h-3 w-3" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
