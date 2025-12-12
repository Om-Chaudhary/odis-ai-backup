"use client";

import { useEffect, useRef } from "react";
import { format, formatDistanceToNow, parseISO, isPast } from "date-fns";
import {
  Phone,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  MinusCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odis-ai/ui/table";
import { Badge } from "@odis-ai/ui/badge";
import { Skeleton } from "@odis-ai/ui/skeleton";
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
  };
  caseType: string | null;
  status: DischargeCaseStatus;
  phoneSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  emailSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  timestamp: string;
  scheduledEmailFor: string | null;
  scheduledCallFor: string | null;
}

interface OutboundCaseTableProps<T extends TableCaseBase> {
  cases: T[];
  selectedCaseId: string | null;
  onSelectCase: (caseItem: T) => void;
  onKeyNavigation: (direction: "up" | "down") => void;
  isLoading: boolean;
}

/**
 * Case Table Component
 *
 * Table columns:
 * 1. Patient: Pet name (bold) + owner name (muted, below)
 * 2. Case Type: Procedure/visit reason
 * 3. Status: Colored badge
 * 4. Phone: Icon showing sent/pending/failed/not-applicable
 * 5. Email: Icon showing sent/pending/failed/not-applicable
 * 6. Time: Discharge timestamp
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
      <Table>
        <TableHeader className="bg-background sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-[220px] pl-4">Patient</TableHead>
            <TableHead className="w-[120px]">Case Type</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[60px]">Phone</TableHead>
            <TableHead className="w-[60px]">Email</TableHead>
            <TableHead className="w-[80px]">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseItem) => {
            const isSelected = selectedCaseId === caseItem.id;
            return (
              <TableRow
                key={caseItem.id}
                ref={isSelected ? selectedRowRef : null}
                className={cn(
                  "cursor-pointer transition-colors",
                  isSelected && "border-l-2 border-l-teal-500 bg-teal-50",
                  caseItem.status === "failed" && !isSelected && "bg-red-50/50",
                  caseItem.status === "in_progress" &&
                    !isSelected &&
                    "bg-teal-50/30",
                  caseItem.status === "scheduled" &&
                    !isSelected &&
                    "bg-purple-50/30",
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
                <TableCell className="pl-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{caseItem.patient.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {caseItem.owner.name ?? "Unknown Owner"}
                    </span>
                  </div>
                </TableCell>

                {/* Case Type */}
                <TableCell className="text-sm">
                  {formatCaseType(caseItem.caseType)}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={caseItem.status} />
                </TableCell>

                {/* Phone Status */}
                <TableCell>
                  <DeliveryIcon status={caseItem.phoneSent} type="phone" />
                </TableCell>

                {/* Email Status */}
                <TableCell>
                  <DeliveryIcon status={caseItem.emailSent} type="email" />
                </TableCell>

                {/* Time / Schedule */}
                <TableCell className="text-sm">
                  <ScheduleTimeDisplay
                    status={caseItem.status}
                    timestamp={caseItem.timestamp}
                    scheduledEmailFor={caseItem.scheduledEmailFor}
                    scheduledCallFor={caseItem.scheduledCallFor}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
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
 * Status badge with appropriate color
 */
function StatusBadge({ status }: { status: DischargeCaseStatus }) {
  const config: Record<
    DischargeCaseStatus,
    { label: string; className: string; icon?: React.ReactNode }
  > = {
    pending_review: {
      label: "Pending",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-purple-100 text-purple-800 border-purple-200",
      icon: <Calendar className="mr-1 h-3 w-3" />,
    },
    ready: {
      label: "Ready",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-teal-100 text-teal-800 border-teal-200 animate-pulse",
      icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" />,
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const { label, className, icon } = config[status];
  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {icon}
      {label}
    </Badge>
  );
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
      <CheckCircle
        className="h-4 w-4 text-green-600"
        aria-label={`${type} sent`}
      />
    );
  }
  if (status === "pending") {
    return (
      <Clock
        className="h-4 w-4 text-amber-600"
        aria-label={`${type} pending`}
      />
    );
  }
  if (status === "failed") {
    return (
      <AlertCircle
        className="h-4 w-4 text-red-600"
        aria-label={`${type} failed`}
      />
    );
  }
  if (status === "not_applicable") {
    return (
      <MinusCircle
        className="text-muted-foreground h-4 w-4"
        aria-label={`No ${type}`}
      />
    );
  }
  return (
    <Icon
      className="text-muted-foreground/50 h-4 w-4"
      aria-label={`${type} not scheduled`}
    />
  );
}

/**
 * Loading skeleton for table
 */
function CaseTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {/* Header skeleton */}
      <div className="flex gap-4 border-b pb-2 pl-4">
        <Skeleton className="h-4 w-[220px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 pl-4">
          <div className="w-[220px] space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-[60px]" />
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
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <CheckCircle className="text-muted-foreground mb-4 h-12 w-12" />
      <p className="text-lg font-medium">All caught up!</p>
      <p className="text-muted-foreground text-sm">
        No discharge cases require attention right now.
      </p>
    </div>
  );
}
