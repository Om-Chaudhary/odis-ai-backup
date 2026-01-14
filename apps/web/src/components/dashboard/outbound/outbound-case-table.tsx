"use client";

import { useEffect, useRef } from "react";
import { format, formatDistanceToNow, parseISO, isPast } from "date-fns";
import { CheckCircle2, Loader2, Mail, Phone, Send, Star } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { cn } from "@odis-ai/shared/util";
import type { DischargeCaseStatus } from "./types";
import {
  AttentionBadgeGroup,
  CriticalPulsingDot,
} from "~/components/dashboard/shared";
import {
  getDeliveryStatusDisplay,
  type DeliveryStatus,
} from "./detail/utils/status-display";
import { DataTableEmptyState } from "~/components/dashboard/shared/data-table";

// Minimum required fields for table display
interface TableCaseBase {
  id: string;
  patient: {
    name: string;
  };
  owner: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  caseType: string | null;
  status: DischargeCaseStatus;
  phoneSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  emailSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  timestamp: string;
  scheduledEmailFor: string | null;
  scheduledCallFor: string | null;
  dischargeSummary?: string;
  scheduledCall?: {
    endedReason?: string | null;
  } | null;
  isStarred?: boolean;
  // Attention fields
  needsAttention?: boolean;
  attentionTypes?: string[] | null;
  attentionSeverity?: string | null;
  attentionSummary?: string | null;
}

/**
 * Get a friendly status message from ended_reason
 * Maps VAPI/Twilio call end reasons to human-readable statuses
 */
function getCallStatus(
  endedReason: string | null | undefined,
  emailFailed: boolean,
): string {
  if (emailFailed && !endedReason) {
    return "Email failed";
  }

  if (!endedReason) {
    return "Failed";
  }

  const reason = endedReason.toLowerCase();

  // Customer hung up during call
  if (
    reason.includes("customer-ended-call") ||
    reason.includes("hangup") ||
    reason.includes("hang-up")
  ) {
    return "Hangup";
  }

  // Voicemail detection
  if (
    reason.includes("voicemail") ||
    reason.includes("machine-detected") ||
    reason.includes("machine-ended") ||
    reason.includes("answering-machine")
  ) {
    return "Voicemail";
  }

  // No answer / didn't pick up
  if (
    reason.includes("customer-did-not-answer") ||
    reason.includes("dial-no-answer") ||
    reason.includes("no-answer")
  ) {
    return "No answer";
  }

  // Line busy
  if (reason.includes("dial-busy") || reason.includes("busy")) {
    return "Busy";
  }

  // Call rejected/declined
  if (reason.includes("rejected") || reason.includes("declined")) {
    return "Declined";
  }

  // Silence/no response during call
  if (reason.includes("silence-timed-out") || reason.includes("silence")) {
    return "No response";
  }

  // Connection/technical errors
  if (
    reason.includes("sip") ||
    reason.includes("failed-to-connect") ||
    reason.includes("twilio") ||
    reason.includes("network")
  ) {
    return "Connection error";
  }

  // Generic errors
  if (reason.includes("error")) {
    return "Call error";
  }

  // Invalid number
  if (
    reason.includes("invalid") ||
    reason.includes("unallocated") ||
    reason.includes("not-in-service")
  ) {
    return "Invalid number";
  }

  return "Failed";
}

interface OutboundCaseTableProps<T extends TableCaseBase> {
  cases: T[];
  selectedCaseId: string | null;
  onSelectCase: (caseItem: T) => void;
  onKeyNavigation: (direction: "up" | "down") => void;
  isLoading: boolean;
  // Quick scheduling props (supports concurrent scheduling)
  onQuickSchedule?: (caseItem: T) => void;
  schedulingCaseIds?: Set<string>;
  // Star toggle props
  onToggleStar?: (caseId: string, starred: boolean) => void;
  togglingStarCaseIds?: Set<string>;
  // Multi-select props
  selectedForBulk?: Set<string>;
  onToggleBulkSelect?: (caseId: string) => void;
  onSelectAll?: () => void;
  // Compact mode (when detail sidebar is open)
  isCompact?: boolean;
}

/**
 * Case Table Component (Compact Layout)
 *
 * Table columns:
 * 1. Patient: Pet name (bold) + owner name (muted, below)
 * 2. Phone: Icon showing sent/pending/failed/not-applicable
 * 3. Email: Icon showing sent/pending/failed/not-applicable
 * 4. Actions: Quick schedule button or status badge
 * 5. Time: Discharge timestamp
 *
 * Keyboard navigation:
 * - Arrow Up/Down: Navigate rows
 * - Enter: Select row (opens detail panel)
 * - Escape: Deselect (closes detail panel)
 */
export function OutboundCaseTable<T extends TableCaseBase>({
  cases,
  selectedCaseId,
  onSelectCase,
  onKeyNavigation,
  isLoading,
  onQuickSchedule,
  schedulingCaseIds,
  onToggleStar,
  togglingStarCaseIds,
  selectedForBulk = new Set(),
  onToggleBulkSelect,
  onSelectAll,
  isCompact = false,
}: OutboundCaseTableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  // Global keyboard handler for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          onKeyNavigation("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          onKeyNavigation("down");
          break;
        case "Enter":
          // Enter selects the first case if nothing selected
          if (!selectedCaseId && cases.length > 0) {
            e.preventDefault();
            onSelectCase(cases[0]!);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onKeyNavigation, selectedCaseId, cases, onSelectCase]);

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
    return <CaseTableSkeleton />;
  }

  if (cases.length === 0) {
    return (
      <DataTableEmptyState
        title="All caught up!"
        description="No discharge cases require attention right now."
        icon={CheckCircle2}
      />
    );
  }

  return (
    <div ref={tableRef} className="h-full min-h-0 w-full overflow-auto">
      <table className="w-full min-w-0 table-fixed">
        <thead className="sticky top-0 z-10 border-b border-teal-100/50 bg-gradient-to-r from-teal-50/40 to-white/60 backdrop-blur-sm">
          <tr className="text-xs text-slate-500">
            {onToggleBulkSelect && !isCompact && (
              <th className="h-10 w-[5%] pl-6 text-center font-medium">
                <Checkbox
                  checked={
                    cases.length > 0 && selectedForBulk.size === cases.length
                  }
                  onCheckedChange={onSelectAll}
                  aria-label="Select all cases"
                  className="h-4 w-4"
                />
              </th>
            )}
            {!isCompact && (
              <th className="h-10 w-[5%] text-center font-medium">
                <Star className="mx-auto h-4 w-4" />
              </th>
            )}
            <th
              className={cn(
                "h-10 text-left font-medium",
                isCompact
                  ? "w-[66%] pl-6"
                  : onToggleBulkSelect
                    ? "w-[32%]"
                    : "w-[36%] pl-6",
              )}
            >
              Patient
            </th>
            <th
              className={cn(
                "h-10 text-center font-medium",
                isCompact ? "w-[17%]" : "w-[10%]",
              )}
            >
              Phone
            </th>
            <th
              className={cn(
                "h-10 text-center font-medium",
                isCompact ? "w-[17%]" : "w-[10%]",
              )}
            >
              Email
            </th>
            {!isCompact && (
              <th className="h-10 w-[18%] text-center font-medium">Status</th>
            )}
            {!isCompact && (
              <th className="h-10 w-[14%] pr-6 text-right font-medium">Time</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-teal-50">
          {cases.map((caseItem) => {
            const isSelected = selectedCaseId === caseItem.id;
            return (
              <tr
                key={caseItem.id}
                ref={isSelected ? selectedRowRef : null}
                className={cn(
                  "group cursor-pointer transition-all duration-150",
                  isSelected
                    ? "border-l-2 border-l-teal-500 bg-teal-50/70"
                    : "hover:bg-teal-50/30",
                  // Attention case highlighting (when not selected)
                  !isSelected &&
                    caseItem.needsAttention &&
                    caseItem.attentionSeverity === "critical" &&
                    "border-l-2 border-l-red-500 bg-red-50/40 hover:bg-red-50/60",
                  !isSelected &&
                    caseItem.needsAttention &&
                    caseItem.attentionSeverity === "urgent" &&
                    "bg-orange-50/30 hover:bg-orange-50/50",
                  // Status styling (only when no attention highlighting)
                  caseItem.status === "failed" &&
                    !isSelected &&
                    !caseItem.needsAttention &&
                    "bg-red-50/30 hover:bg-red-50/50",
                  caseItem.status === "in_progress" &&
                    !isSelected &&
                    "bg-teal-50/20",
                  caseItem.status === "scheduled" &&
                    !isSelected &&
                    "bg-purple-50/20",
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
                {/* Checkbox - hidden when sidebar is open */}
                {onToggleBulkSelect && !isCompact && (
                  <td className="py-3 pl-6 text-center">
                    <Checkbox
                      checked={selectedForBulk.has(caseItem.id)}
                      onCheckedChange={() => onToggleBulkSelect(caseItem.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${caseItem.patient.name}`}
                      className="h-4 w-4"
                    />
                  </td>
                )}

                {/* Star */}
                {!isCompact && (
                  <td className="py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar?.(caseItem.id, !caseItem.isStarred);
                      }}
                      disabled={togglingStarCaseIds?.has(caseItem.id)}
                      className={cn(
                        "rounded p-1 transition-all hover:bg-slate-100",
                        togglingStarCaseIds?.has(caseItem.id) && "opacity-50",
                      )}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-colors",
                          caseItem.isStarred
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 hover:text-amber-400",
                        )}
                      />
                    </button>
                  </td>
                )}

                {/* Patient */}
                <td
                  className={cn(
                    "py-3",
                    isCompact ? "pl-6" : onToggleBulkSelect ? "" : "pl-6",
                  )}
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {caseItem.patient.name}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {caseItem.owner.name ?? "Unknown Owner"}
                    </span>
                    {/* Attention indicators */}
                    {caseItem.needsAttention && (
                      <div className="mt-0.5 flex items-center gap-1">
                        {caseItem.attentionSeverity === "critical" && (
                          <CriticalPulsingDot />
                        )}
                        <AttentionBadgeGroup
                          types={caseItem.attentionTypes ?? []}
                          maxVisible={2}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </td>

                {/* Phone Status */}
                <td className="py-3 text-center">
                  <DeliveryIcon status={caseItem.phoneSent} type="phone" />
                </td>

                {/* Email Status */}
                <td className="py-3 text-center">
                  <DeliveryIcon status={caseItem.emailSent} type="email" />
                </td>

                {/* Status */}
                {!isCompact && (
                  <td className="py-3 text-center">
                    <StatusCell
                      caseItem={caseItem}
                      onQuickSchedule={onQuickSchedule}
                      isScheduling={
                        schedulingCaseIds?.has(caseItem.id) ?? false
                      }
                    />
                  </td>
                )}

                {/* Time / Schedule */}
                {!isCompact && (
                  <td className="py-3 pr-6 text-right text-xs">
                    <ScheduleTimeDisplay
                      status={caseItem.status}
                      timestamp={caseItem.timestamp}
                      scheduledEmailFor={caseItem.scheduledEmailFor}
                      scheduledCallFor={caseItem.scheduledCallFor}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Status cell showing case status with descriptive messages
 * Shows "Schedule" button for pending_review cases, status badge for others
 */
function StatusCell<T extends TableCaseBase>({
  caseItem,
  onQuickSchedule,
  isScheduling,
}: {
  caseItem: T;
  onQuickSchedule?: (caseItem: T) => void;
  isScheduling: boolean;
}) {
  const hasContact =
    Boolean(caseItem.owner.phone) || Boolean(caseItem.owner.email);
  const canSchedule =
    caseItem.status === "pending_review" && hasContact && onQuickSchedule;

  if (isScheduling) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-amber-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-xs font-medium">Generating...</span>
      </div>
    );
  }

  if (canSchedule) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 border-teal-200 bg-teal-50 px-2.5 text-xs font-medium text-teal-700 hover:bg-teal-100 hover:text-teal-800"
        onClick={(e) => {
          e.stopPropagation();
          onQuickSchedule(caseItem);
        }}
      >
        <Send className="h-3 w-3" />
        Schedule
      </Button>
    );
  }

  // Show status badge for other statuses
  if (caseItem.status === "scheduled") {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
        Scheduled
      </span>
    );
  }

  if (caseItem.status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Completed
      </span>
    );
  }

  if (caseItem.status === "failed") {
    const callStatus = getCallStatus(
      caseItem.scheduledCall?.endedReason,
      caseItem.emailSent === "failed",
    );
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        {callStatus}
      </span>
    );
  }

  if (caseItem.status === "in_progress") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        In Progress
      </span>
    );
  }

  if (caseItem.status === "pending_review" && !hasContact) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
        No contact
      </span>
    );
  }

  return null;
}

/**
 * Schedule time display component
 * Shows countdown for scheduled items, regular time for others
 */
function ScheduleTimeDisplay({
  status,
  timestamp,
  scheduledEmailFor,
  scheduledCallFor,
}: {
  status: DischargeCaseStatus;
  timestamp: string;
  scheduledEmailFor: string | null;
  scheduledCallFor: string | null;
}) {
  // For scheduled items, show the next scheduled time
  if (status === "scheduled") {
    // Get the earliest scheduled time
    const emailTime = scheduledEmailFor ? parseISO(scheduledEmailFor) : null;
    const callTime = scheduledCallFor ? parseISO(scheduledCallFor) : null;

    let nextTime: Date | null = null;
    let type: "email" | "call" = "email";

    if (emailTime && callTime) {
      if (emailTime < callTime) {
        nextTime = emailTime;
        type = "email";
      } else {
        nextTime = callTime;
        type = "call";
      }
    } else if (emailTime) {
      nextTime = emailTime;
      type = "email";
    } else if (callTime) {
      nextTime = callTime;
      type = "call";
    }

    if (nextTime) {
      const isReady = isPast(nextTime);
      const Icon = type === "email" ? Mail : Phone;

      if (isReady) {
        return (
          <div className="flex items-center justify-end gap-1 text-blue-600">
            <Icon className="h-3 w-3" />
            <span className="text-xs">Ready</span>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-end gap-1 text-purple-600">
          <Icon className="h-3 w-3" />
          <span className="text-xs">
            {formatDistanceToNow(nextTime, { addSuffix: false })}
          </span>
        </div>
      );
    }
  }

  // Default: show the timestamp
  return (
    <span className="text-muted-foreground text-xs">
      {formatTime(timestamp)}
    </span>
  );
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
  try {
    return format(new Date(timestamp), "h:mm a");
  } catch {
    return "-";
  }
}

/**
 * Delivery status icon for phone/email columns
 * Uses shared status-display utility for consistent styling
 */
function DeliveryIcon({
  status,
  type,
}: {
  status: DeliveryStatus;
  type: "phone" | "email";
}) {
  const displayConfig = getDeliveryStatusDisplay(status, type);
  const Icon = displayConfig.icon;

  return (
    <div
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full",
        displayConfig.bgClass,
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", displayConfig.colorClass)}
        aria-label={displayConfig.label}
      />
    </div>
  );
}

/**
 * Loading skeleton for table
 */
function CaseTableSkeleton() {
  return (
    <div className="w-full overflow-hidden">
      {/* Header skeleton */}
      <div className="mb-0 flex gap-2 border-b border-teal-100/50 px-6 py-3">
        <div className="h-3 w-[5%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[5%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[32%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[10%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[10%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[18%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[14%] animate-pulse rounded bg-teal-100/50" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 border-b border-teal-50 px-6 py-3"
        >
          <div className="flex w-[5%] justify-center">
            <div className="h-4 w-4 animate-pulse rounded bg-teal-50" />
          </div>
          <div className="flex w-[5%] justify-center">
            <div className="h-4 w-4 animate-pulse rounded bg-teal-50" />
          </div>
          <div className="w-[32%] space-y-1">
            <div className="h-4 w-24 animate-pulse rounded bg-teal-100/40" />
            <div className="h-3 w-32 animate-pulse rounded bg-teal-50" />
          </div>
          <div className="flex w-[10%] justify-center">
            <div className="h-6 w-6 animate-pulse rounded-full bg-teal-50" />
          </div>
          <div className="flex w-[10%] justify-center">
            <div className="h-6 w-6 animate-pulse rounded-full bg-teal-50" />
          </div>
          <div className="flex w-[18%] justify-center">
            <div className="h-7 w-18 animate-pulse rounded-md bg-teal-50" />
          </div>
          <div className="flex w-[14%] justify-end">
            <div className="h-3 w-14 animate-pulse rounded bg-teal-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
