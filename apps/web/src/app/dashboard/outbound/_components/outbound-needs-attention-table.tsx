"use client";

import { useEffect, useRef, useMemo } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  CalendarDays,
} from "lucide-react";
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
export function OutboundNeedsAttentionTable<T extends NeedsAttentionCaseBase>({
  cases,
  selectedCaseId,
  onSelectCase,
  isLoading,
}: OutboundNeedsAttentionTableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  // Group cases by day
  const casesByDay = useMemo(() => {
    const groups = new Map<string, T[]>();

    for (const caseItem of cases) {
      const dayKey = caseItem.timestamp
        ? format(startOfDay(parseISO(caseItem.timestamp)), "yyyy-MM-dd")
        : "unknown";

      if (!groups.has(dayKey)) {
        groups.set(dayKey, []);
      }
      groups.get(dayKey)!.push(caseItem);
    }

    // Sort by date descending (most recent first)
    return Array.from(groups.entries()).sort((a, b) =>
      b[0].localeCompare(a[0]),
    );
  }, [cases]);

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
            <th className="h-12 w-[80px] pr-4 text-right font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {casesByDay.map(([dayKey, dayCases]) => (
            <DayGroup
              key={dayKey}
              dayKey={dayKey}
              cases={dayCases}
              selectedCaseId={selectedCaseId}
              selectedRowRef={selectedRowRef}
              onSelectCase={onSelectCase}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Day group with header row and case rows
 */
function DayGroup<T extends NeedsAttentionCaseBase>({
  dayKey,
  cases,
  selectedCaseId,
  selectedRowRef,
  onSelectCase,
}: {
  dayKey: string;
  cases: T[];
  selectedCaseId: string | null;
  selectedRowRef: React.RefObject<HTMLTableRowElement | null>;
  onSelectCase: (caseItem: T) => void;
}) {
  // Format the day header
  const dayLabel = useMemo(() => {
    if (dayKey === "unknown") return "Unknown Date";
    try {
      const date = parseISO(dayKey);
      const today = startOfDay(new Date());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
        return "Today";
      }
      if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
        return "Yesterday";
      }
      return format(date, "EEEE, MMMM d");
    } catch {
      return dayKey;
    }
  }, [dayKey]);

  return (
    <>
      {/* Day Header Row */}
      <tr className="bg-gradient-to-r from-orange-50/60 to-slate-50/40">
        <td colSpan={6} className="py-2 pl-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-slate-700">
              {dayLabel}
            </span>
            <span className="text-xs text-slate-400">
              ({cases.length} case{cases.length !== 1 ? "s" : ""})
            </span>
          </div>
        </td>
      </tr>

      {/* Case Rows */}
      {cases.map((caseItem) => {
        const isSelected = selectedCaseId === caseItem.id;
        const severity = caseItem.attentionSeverity ?? "routine";

        return (
          <tr
            key={caseItem.id}
            ref={isSelected ? selectedRowRef : null}
            className={cn(
              "group cursor-pointer border-b border-orange-50 transition-all duration-150",
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
    </>
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
