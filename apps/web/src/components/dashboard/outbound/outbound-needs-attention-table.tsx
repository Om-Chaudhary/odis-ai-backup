"use client";

import { useEffect, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import {
  AttentionBadgeGroup,
  AttentionSeverityBadge,
  CriticalPulsingDot,
} from "~/components/dashboard/shared";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odis-ai/shared/ui/tooltip";
import type { SelectedRowPosition } from "./outbound-split-layout";

/**
 * Minimum required fields for needs attention table
 */
interface NeedsAttentionCaseBase {
  id: string;
  patient: { name: string };
  owner: { name: string | null };
  attentionTypes?: string[] | null;
  attentionSeverity?: string | null;
  attentionSummary?: string | null;
  scheduledCall?: {
    status: string;
    endedReason?: string | null;
    durationSeconds?: number | null;
  } | null;
  timestamp: string;
}

interface OutboundNeedsAttentionTableProps<T extends NeedsAttentionCaseBase> {
  cases: T[];
  selectedCaseId: string | null;
  onSelectCase: (caseItem: T) => void;
  onToggleCase?: (caseItem: T) => void;
  isLoading: boolean;
  onSelectedRowPositionChange?: (position: SelectedRowPosition | null) => void;
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
 * - Shows attention cases for the selected date
 */
export function OutboundNeedsAttentionTable<T extends NeedsAttentionCaseBase>({
  cases,
  selectedCaseId,
  onSelectCase,
  onToggleCase,
  isLoading,
  onSelectedRowPositionChange,
}: OutboundNeedsAttentionTableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  // Update selected row position for tab connection effect
  const updateRowPosition = useCallback(() => {
    if (
      selectedRowRef.current &&
      tableRef.current &&
      onSelectedRowPositionChange
    ) {
      const tableRect = tableRef.current.getBoundingClientRect();
      const rowRect = selectedRowRef.current.getBoundingClientRect();
      onSelectedRowPositionChange({
        top: rowRect.top - tableRect.top + tableRef.current.scrollTop,
        height: rowRect.height,
      });
    } else if (onSelectedRowPositionChange && !selectedCaseId) {
      onSelectedRowPositionChange(null);
    }
  }, [onSelectedRowPositionChange, selectedCaseId]);

  // Scroll selected row into view and update position
  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
    // Small delay to let scroll finish before measuring
    const timer = setTimeout(updateRowPosition, 100);
    return () => clearTimeout(timer);
  }, [selectedCaseId, updateRowPosition]);

  // Handle row click with toggle support
  const handleRowClick = useCallback(
    (caseItem: T) => {
      if (selectedCaseId === caseItem.id && onToggleCase) {
        onToggleCase(caseItem);
      } else {
        onSelectCase(caseItem);
      }
    },
    [selectedCaseId, onSelectCase, onToggleCase],
  );

  if (isLoading) {
    return <NeedsAttentionSkeleton />;
  }

  return (
    <div ref={tableRef} className="h-full min-h-0 w-full overflow-auto">
      <table className="w-full min-w-0 table-fixed">
        <thead className="sticky top-0 z-10 border-b border-teal-100/20 bg-gradient-to-r from-teal-50/40 via-teal-50/30 to-white/60 backdrop-blur-xl">
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
            <th className="h-12 w-[80px] pr-4 text-right font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-teal-100/10">
          {cases.map((caseItem) => {
            const isSelected = selectedCaseId === caseItem.id;
            const severity = caseItem.attentionSeverity ?? "routine";

            return (
              <tr
                key={caseItem.id}
                ref={isSelected ? selectedRowRef : null}
                className={cn(
                  "group cursor-pointer transition-all duration-150",
                  // Selected row: gradient starts white, builds to teal on right, matches panel
                  isSelected
                    ? "relative z-20 rounded-r-none border-l-2 border-l-teal-400/50 bg-gradient-to-r from-white/30 via-teal-50/55 to-teal-50/80 shadow-sm shadow-teal-500/10 backdrop-blur-sm"
                    : "transition-all duration-200 hover:bg-teal-50/30 hover:backdrop-blur-sm",
                  // Severity-based styling (when not selected)
                  !isSelected &&
                    severity === "critical" &&
                    "border-l-2 border-l-red-500 bg-red-50/40 hover:bg-red-50/60",
                  !isSelected &&
                    severity === "urgent" &&
                    "bg-orange-50/30 hover:bg-orange-50/50",
                )}
                onClick={() => handleRowClick(caseItem)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleRowClick(caseItem);
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

                {/* Time */}
                <td className="py-4 pr-4 text-right">
                  <span className="text-xs text-slate-500">
                    {caseItem.timestamp
                      ? format(parseISO(caseItem.timestamp), "h:mm a")
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
  call: NeedsAttentionCaseBase["scheduledCall"];
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3">
      {/* Header skeleton */}
      <div className="mb-4 flex shrink-0 gap-3 border-b border-orange-100/50 pb-3">
        <div className="h-3 w-[80px] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[20%] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[25%] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[30%] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[100px] animate-pulse rounded bg-orange-100/50" />
        <div className="h-3 w-[80px] animate-pulse rounded bg-orange-100/50" />
      </div>
      {/* Row skeletons */}
      <div className="flex-1 space-y-1">
        {Array.from({ length: 15 }).map((_, i) => (
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
    </div>
  );
}
