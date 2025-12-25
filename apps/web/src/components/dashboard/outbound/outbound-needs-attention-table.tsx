"use client";

import { useEffect, useRef } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import {
  AttentionBadgeGroup,
  AttentionSeverityBadge,
  CriticalPulsingDot,
} from "../shared";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";

/**
 * Case interface for needs attention table
 */
interface NeedsAttentionCase {
  id: string;
  patient: { name: string };
  owner: { name: string | null };
  attentionTypes: string[] | null;
  attentionSeverity: string | null;
  attentionSummary: string | null;
  attentionFlaggedAt: string | null;
  scheduledCall: {
    status: string;
    endedReason?: string | null;
    durationSeconds?: number | null;
  } | null;
  timestamp: string;
}

interface OutboundNeedsAttentionTableProps {
  cases: NeedsAttentionCase[];
  selectedCaseId: string | null;
  onSelectCase: (caseItem: NeedsAttentionCase) => void;
  isLoading: boolean;
}

/**
 * Needs Attention Table Component
 *
 * A specialized table for the "Needs Attention" view with:
 * - Severity column with visual indicators
 * - Concern types badges
 * - Summary preview with tooltip
 * - Call status column
 * - Sorted by severity (critical first)
 * - Shows ALL attention cases across all dates (no date filtering)
 */
export function OutboundNeedsAttentionTable({
  cases,
  selectedCaseId,
  onSelectCase,
  isLoading,
}: OutboundNeedsAttentionTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  // Scroll selected row into view
  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedCaseId]);

  if (isLoading) {
    return <NeedsAttentionSkeleton />;
  }

  if (cases.length === 0) {
    return <NeedsAttentionEmpty />;
  }

  return (
    <div ref={tableRef} className="h-full w-full overflow-auto">
      <table className="w-full min-w-0 table-fixed">
        <thead className="sticky top-0 z-10 border-b border-orange-100/50 bg-gradient-to-r from-orange-50/40 to-white/60 backdrop-blur-sm">
          <tr className="text-xs text-slate-500">
            <th className="h-12 w-[80px] pl-4 text-left font-medium">
              Severity
            </th>
            <th className="h-12 w-[20%] text-left font-medium">Patient</th>
            <th className="h-12 w-[25%] text-left font-medium">Concerns</th>
            <th className="h-12 w-[30%] text-left font-medium">Summary</th>
            <th className="h-12 w-[100px] text-center font-medium">
              Call Status
            </th>
            <th className="h-12 w-[80px] pr-4 text-right font-medium">
              Flagged
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-orange-50">
          {cases.map((caseItem) => {
            const isSelected = selectedCaseId === caseItem.id;
            const severity = caseItem.attentionSeverity ?? "routine";

            return (
              <tr
                key={caseItem.id}
                ref={isSelected ? selectedRowRef : null}
                className={cn(
                  "group cursor-pointer transition-all duration-150",
                  isSelected
                    ? "border-l-2 border-l-orange-500 bg-orange-50/70"
                    : "hover:bg-orange-50/30",
                  // Severity-based styling
                  !isSelected &&
                    severity === "critical" &&
                    "border-l-2 border-l-red-500 bg-red-50/40 hover:bg-red-50/60",
                  !isSelected &&
                    severity === "urgent" &&
                    "bg-orange-50/30 hover:bg-orange-50/50",
                )}
                onClick={() => onSelectCase(caseItem)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSelectCase(caseItem);
                  }
                }}
              >
                {/* Severity */}
                <td className="py-4 pl-4">
                  <div className="flex items-center gap-2">
                    {severity === "critical" && <CriticalPulsingDot />}
                    <AttentionSeverityBadge severity={severity} size="sm" />
                  </div>
                </td>

                {/* Patient */}
                <td className="py-4">
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {caseItem.patient.name}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {caseItem.owner.name ?? "Unknown Owner"}
                    </span>
                  </div>
                </td>

                {/* Concerns */}
                <td className="py-4">
                  <AttentionBadgeGroup
                    types={caseItem.attentionTypes ?? []}
                    maxVisible={3}
                    size="sm"
                  />
                </td>

                {/* Summary */}
                <td className="py-4 pr-2">
                  {caseItem.attentionSummary ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="line-clamp-2 text-xs text-slate-600">
                            {caseItem.attentionSummary}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-md p-3">
                          <p className="text-sm">{caseItem.attentionSummary}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-xs text-slate-400">No summary</span>
                  )}
                </td>

                {/* Call Status */}
                <td className="py-4 text-center">
                  <CallStatusBadge call={caseItem.scheduledCall} />
                </td>

                {/* Flagged Time */}
                <td className="py-4 pr-4 text-right">
                  <span className="text-xs text-slate-500">
                    {caseItem.attentionFlaggedAt
                      ? formatDistanceToNow(
                          parseISO(caseItem.attentionFlaggedAt),
                          { addSuffix: false },
                        )
                      : "-"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Call status badge component
 */
function CallStatusBadge({
  call,
}: {
  call: NeedsAttentionCase["scheduledCall"];
}) {
  if (!call) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  }

  const status = call.status;

  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }

  if (status === "in_progress" || status === "ringing") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <Clock className="h-3 w-3" />
      {status === "queued" ? "Queued" : status}
    </span>
  );
}

/**
 * Loading skeleton
 */
function NeedsAttentionSkeleton() {
  return (
    <div className="w-full overflow-hidden p-3">
      {/* Header skeleton */}
      <div className="mb-4 flex gap-3 border-b border-orange-100/50 pb-3">
        <div className="h-3 w-[80px] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[20%] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[25%] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[30%] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[100px] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[80px] animate-pulse rounded bg-orange-100/50" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-orange-50 py-4"
        >
          <div className="w-[80px]">
            <div className="h-5 w-16 animate-pulse rounded-full bg-orange-50" />
          </div>
          <div className="w-[20%] space-y-1">
            <div className="h-4 w-20 animate-pulse rounded bg-orange-100/40" />
            <div className="h-3 w-24 animate-pulse rounded bg-orange-50" />
          </div>
          <div className="flex w-[25%] gap-1">
            <div className="h-5 w-16 animate-pulse rounded-full bg-orange-50" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-orange-50" />
          </div>
          <div className="w-[30%]">
            <div className="h-8 w-full animate-pulse rounded bg-orange-50" />
          </div>
          <div className="w-[100px] text-center">
            <div className="mx-auto h-4 w-16 animate-pulse rounded bg-orange-50" />
          </div>
          <div className="w-[80px] text-right">
            <div className="ml-auto h-3 w-12 animate-pulse rounded bg-orange-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no attention cases exist
 */
function NeedsAttentionEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <p className="text-lg font-semibold text-slate-800">
        No cases need attention
      </p>
      <p className="mt-1 text-sm text-slate-500">
        All flagged concerns have been addressed.
      </p>
    </div>
  );
}
