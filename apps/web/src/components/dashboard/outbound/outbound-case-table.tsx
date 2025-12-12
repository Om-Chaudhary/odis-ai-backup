"use client";

import { useEffect, useRef } from "react";
import { format, formatDistanceToNow, parseISO, isPast } from "date-fns";
import {
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  MinusCircle,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@odis-ai/ui/button";
import { cn } from "@odis-ai/utils";
import type { DischargeCaseStatus } from "./types";

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
}

interface OutboundCaseTableProps<T extends TableCaseBase> {
  cases: T[];
  selectedCaseId: string | null;
  onSelectCase: (caseItem: T) => void;
  onKeyNavigation: (direction: "up" | "down") => void;
  isLoading: boolean;
  // Quick scheduling props
  onQuickSchedule?: (caseItem: T) => void;
  schedulingCaseId?: string | null;
}

/**
 * Case Table Component (Compact Layout)
 *
 * Table columns:
 * 1. Patient: Pet name (bold) + owner name (muted, below)
 * 2. Case Type: Procedure/visit reason
 * 3. Phone: Icon showing sent/pending/failed/not-applicable
 * 4. Email: Icon showing sent/pending/failed/not-applicable
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
  schedulingCaseId,
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
    return <CaseTableEmpty />;
  }

  return (
    <div ref={tableRef} className="h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 z-10 border-b border-teal-100/50 bg-gradient-to-r from-teal-50/40 to-white/60 backdrop-blur-sm">
          <tr className="text-xs text-slate-500">
            <th className="h-10 w-[32%] pl-4 text-left font-medium">Patient</th>
            <th className="h-10 w-[15%] text-left font-medium">Case Type</th>
            <th className="h-10 w-[8%] text-center font-medium">Phone</th>
            <th className="h-10 w-[8%] text-center font-medium">Email</th>
            <th className="h-10 w-[22%] text-center font-medium">Actions</th>
            <th className="h-10 w-[15%] pr-4 text-right font-medium">Time</th>
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
                  caseItem.status === "failed" &&
                    !isSelected &&
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
                {/* Patient */}
                <td className="py-3 pl-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-800">
                      {caseItem.patient.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {caseItem.owner.name ?? "Unknown Owner"}
                    </span>
                  </div>
                </td>

                {/* Case Type */}
                <td className="py-3">
                  <span className="inline-flex rounded-md bg-slate-100/80 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {formatCaseType(caseItem.caseType)}
                  </span>
                </td>

                {/* Phone Status */}
                <td className="py-3 text-center">
                  <DeliveryIcon status={caseItem.phoneSent} type="phone" />
                </td>

                {/* Email Status */}
                <td className="py-3 text-center">
                  <DeliveryIcon status={caseItem.emailSent} type="email" />
                </td>

                {/* Actions */}
                <td className="py-3 text-center">
                  <ActionCell
                    caseItem={caseItem}
                    onQuickSchedule={onQuickSchedule}
                    isScheduling={schedulingCaseId === caseItem.id}
                  />
                </td>

                {/* Time / Schedule */}
                <td className="py-3 pr-4 text-right text-xs">
                  <ScheduleTimeDisplay
                    status={caseItem.status}
                    timestamp={caseItem.timestamp}
                    scheduledEmailFor={caseItem.scheduledEmailFor}
                    scheduledCallFor={caseItem.scheduledCallFor}
                  />
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
 * Action cell for quick scheduling
 * Shows "Schedule" button for pending_review cases, status badge for others
 */
function ActionCell<T extends TableCaseBase>({
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
        className="h-7 gap-1.5 border-teal-200 bg-teal-50 px-3 text-xs font-medium text-teal-700 hover:bg-teal-100 hover:text-teal-800"
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
        Sent
      </span>
    );
  }

  if (caseItem.status === "failed") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Failed
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
    return <span className="text-xs text-slate-400">No contact</span>;
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
          <div className="flex items-center gap-1 text-blue-600">
            <Icon className="h-3 w-3" />
            <span>Ready</span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-1 text-purple-600">
          <Icon className="h-3 w-3" />
          <span>{formatDistanceToNow(nextTime, { addSuffix: false })}</span>
        </div>
      );
    }
  }

  // Default: show the timestamp
  return <span className="text-muted-foreground">{formatTime(timestamp)}</span>;
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
 * Format case type for display
 */
function formatCaseType(caseType: string | null): string {
  if (!caseType) return "-";
  return caseType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Delivery status icon for phone/email columns
 */
function DeliveryIcon({
  status,
  type,
}: {
  status: "sent" | "pending" | "failed" | "not_applicable" | null;
  type: "phone" | "email";
}) {
  const Icon = type === "phone" ? Phone : Mail;

  if (status === "sent") {
    return (
      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2
          className="h-3.5 w-3.5 text-emerald-600"
          aria-label={`${type} sent`}
        />
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
        <Clock
          className="h-3.5 w-3.5 text-amber-600"
          aria-label={`${type} pending`}
        />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
        <AlertCircle
          className="h-3.5 w-3.5 text-red-600"
          aria-label={`${type} failed`}
        />
      </div>
    );
  }
  if (status === "not_applicable") {
    return (
      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200">
        <MinusCircle
          className="h-3.5 w-3.5 text-slate-500"
          aria-label={`No ${type}`}
        />
      </div>
    );
  }
  return (
    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200">
      <Icon
        className="h-3.5 w-3.5 text-slate-500"
        aria-label={`${type} not scheduled`}
      />
    </div>
  );
}

/**
 * Loading skeleton for table
 */
function CaseTableSkeleton() {
  return (
    <div className="p-4">
      {/* Header skeleton */}
      <div className="mb-4 flex gap-4 border-b border-teal-100/50 pb-3">
        <div className="h-3 w-[32%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[15%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[8%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[8%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[22%] animate-pulse rounded bg-teal-100/50" />
        <div className="h-3 w-[15%] animate-pulse rounded bg-teal-100/50" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-teal-50 py-3"
        >
          <div className="w-[32%] space-y-1.5">
            <div className="h-4 w-24 animate-pulse rounded bg-teal-100/40" />
            <div className="h-3 w-32 animate-pulse rounded bg-teal-50" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-md bg-teal-50" />
          <div className="flex w-[8%] justify-center">
            <div className="h-6 w-6 animate-pulse rounded-full bg-teal-50" />
          </div>
          <div className="flex w-[8%] justify-center">
            <div className="h-6 w-6 animate-pulse rounded-full bg-teal-50" />
          </div>
          <div className="flex w-[22%] justify-center">
            <div className="h-7 w-20 animate-pulse rounded-md bg-teal-50" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-teal-50" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no cases
 */
function CaseTableEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-emerald-100">
        <CheckCircle2 className="h-8 w-8 text-teal-600" />
      </div>
      <p className="text-lg font-semibold text-slate-800">All caught up!</p>
      <p className="mt-1 text-sm text-slate-500">
        No discharge cases require attention right now.
      </p>
    </div>
  );
}
