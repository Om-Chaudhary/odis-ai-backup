"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Phone,
  Calendar,
  MessageSquare,
  CheckCircle2,
  User,
  PawPrint,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { api } from "~/trpc/client";
import { Button } from "@odis-ai/ui/button";
import { cn } from "@odis-ai/utils";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import type {
  ViewMode,
  InboundItem,
  AppointmentRequest,
  ClinicMessage,
} from "./types";
import type { Database } from "~/database.types";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

// Helper function for hardcoded call modifications
function getCallModifications(call: InboundCall) {
  const phone = call.customer_phone ?? "";
  const callDate = new Date(call.created_at);

  // Calls to filter out completely
  if (
    phone.includes("408") &&
    phone.includes("234") &&
    phone.includes("6798")
  ) {
    // Check if this is the 6:22 AM call (to remove) vs other times (to keep)
    const hours = callDate.getHours();
    const minutes = callDate.getMinutes();
    if (hours === 6 && minutes === 22) {
      return { shouldHide: true };
    }
  }

  // Silent calls - blank duration
  const silentPhones = ["727576003", "2532278892", "5103207704"];
  const isSilent = silentPhones.some((silent) =>
    phone.replace(/\D/g, "").includes(silent),
  );

  // Timestamp corrections (6:XX PM -> 7:XX PM for demo)
  let adjustedDate = new Date(callDate);
  if (callDate.getHours() === 18) {
    // 6 PM hour
    adjustedDate = new Date(callDate);
    adjustedDate.setHours(19); // Change to 7 PM
  }

  // Specific timestamp fix for +1 (408) 892-4795
  if (
    phone.includes("408") &&
    phone.includes("892") &&
    phone.includes("4795")
  ) {
    if (callDate.getHours() === 18 && callDate.getMinutes() === 14) {
      // 6:14 PM
      adjustedDate = new Date(callDate);
      adjustedDate.setHours(19); // Change to 7:14 PM
    }
  }

  return {
    shouldHide: false,
    isSilent,
    adjustedDate,
  };
}

interface InboundTableProps {
  items: InboundItem[];
  viewMode: ViewMode;
  selectedItemId: string | null;
  onSelectItem: (item: InboundItem) => void;
  onKeyNavigation: (direction: "up" | "down") => void;
  isLoading: boolean;
  onQuickAction?: (id: string) => Promise<void>;
}

/**
 * Inbound Table Component
 *
 * Renders different columns based on view mode:
 * - Calls: Phone, Duration, Status, Sentiment, Time
 * - Appointments: Patient/Client, Species, Reason, Status, Date/Time
 * - Messages: Caller, Message Preview, Priority, Status, Time
 */
export function InboundTable({
  items,
  viewMode,
  selectedItemId,
  onSelectItem,
  onKeyNavigation,
  isLoading,
  onQuickAction,
}: InboundTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  // Global keyboard handler for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          if (!selectedItemId && items.length > 0) {
            e.preventDefault();
            onSelectItem(items[0]!);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onKeyNavigation, selectedItemId, items, onSelectItem]);

  // Scroll selected row into view
  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedItemId]);

  if (isLoading) {
    return <TableSkeleton viewMode={viewMode} />;
  }

  if (items.length === 0) {
    return <TableEmpty viewMode={viewMode} />;
  }

  return (
    <div ref={tableRef} className="h-full overflow-auto">
      <table className="w-full">
        <thead className="bg-muted/40 sticky top-0 z-10 border-b backdrop-blur-sm">
          {viewMode === "calls" && <CallsHeader />}
          {viewMode === "appointments" && <AppointmentsHeader />}
          {viewMode === "messages" && <MessagesHeader />}
        </thead>
        <tbody className="divide-border/50 divide-y">
          {items
            .filter((item) => {
              // Apply call filtering for hardcoded modifications
              if (viewMode === "calls") {
                const callMods = getCallModifications(item as InboundCall);
                return !callMods.shouldHide;
              }
              return true;
            })
            .map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <tr
                  key={item.id}
                  ref={isSelected ? selectedRowRef : null}
                  className={cn(
                    "group cursor-pointer transition-all duration-150",
                    isSelected
                      ? "bg-accent border-l-2 border-l-teal-500"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => onSelectItem(item)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSelectItem(item);
                    }
                  }}
                >
                  {viewMode === "calls" && (
                    <CallRow call={item as InboundCall} />
                  )}
                  {viewMode === "appointments" && (
                    <AppointmentRow
                      appointment={item as AppointmentRequest}
                      onQuickAction={onQuickAction}
                    />
                  )}
                  {viewMode === "messages" && (
                    <MessageRow
                      message={item as ClinicMessage}
                      onQuickAction={onQuickAction}
                    />
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Header Components
// =============================================================================

function CallsHeader() {
  return (
    <tr className="text-muted-foreground text-xs">
      <th className="h-10 w-[30%] pl-4 text-left font-medium">Caller</th>
      <th className="h-10 w-[15%] text-center font-medium">Status</th>
      <th className="h-10 w-[15%] text-center font-medium">Alerts</th>
      <th className="h-10 w-[15%] text-center font-medium">Duration</th>
      <th className="h-10 w-[25%] pr-4 text-right font-medium">Date/Time</th>
    </tr>
  );
}

function AppointmentsHeader() {
  return (
    <tr className="text-muted-foreground text-xs">
      <th className="h-10 w-[25%] pl-4 text-left font-medium">
        Patient / Client
      </th>
      <th className="h-10 w-[12%] text-left font-medium">Species</th>
      <th className="h-10 w-[20%] text-left font-medium">Reason</th>
      <th className="h-10 w-[12%] text-center font-medium">Status</th>
      <th className="h-10 w-[16%] text-center font-medium">Actions</th>
      <th className="h-10 w-[15%] pr-4 text-right font-medium">Appt Date</th>
    </tr>
  );
}

function MessagesHeader() {
  return (
    <tr className="text-muted-foreground text-xs">
      <th className="h-10 w-[20%] pl-4 text-left font-medium">Caller</th>
      <th className="h-10 w-[35%] text-left font-medium">Message</th>
      <th className="h-10 w-[10%] text-center font-medium">Priority</th>
      <th className="h-10 w-[10%] text-center font-medium">Status</th>
      <th className="h-10 w-[12%] text-center font-medium">Actions</th>
      <th className="h-10 w-[13%] pr-4 text-right font-medium">Date/Time</th>
    </tr>
  );
}

// =============================================================================
// Row Components
// =============================================================================

function CallRow({ call }: { call: InboundCall }) {
  const callMods = getCallModifications(call);
  const displayDate = callMods.adjustedDate ?? new Date(call.created_at);

  return (
    <>
      <td className="py-3 pl-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {formatPhoneNumber(call.customer_phone ?? "") || "Unknown"}
          </span>
          {call.clinic_name && (
            <span className="text-muted-foreground text-xs">
              {call.clinic_name}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 text-center">
        <CallStatusBadge status={call.status} />
      </td>
      <td className="py-3 text-center">
        <CallAlertsIcons vapiCallId={call.vapi_call_id} />
      </td>
      <td className="py-3 text-center">
        <CallDuration call={call} />
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs font-medium">
            {format(displayDate, "MMM d, yyyy")}
          </span>
          <span className="text-muted-foreground text-xs">
            {format(displayDate, "h:mm a")}
          </span>
        </div>
      </td>
    </>
  );
}

function AppointmentRow({
  appointment,
  onQuickAction,
}: {
  appointment: AppointmentRequest;
  onQuickAction?: (id: string) => Promise<void>;
}) {
  const isPending = appointment.status === "pending";

  return (
    <>
      <td className="py-3 pl-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <PawPrint className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-medium">
              {appointment.patientName}
            </span>
            {appointment.isNewClient && (
              <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <User className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground text-xs">
              {appointment.clientName}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">
              {formatPhoneNumber(appointment.clientPhone)}
            </span>
          </div>
        </div>
      </td>
      <td className="py-3">
        <span className="bg-muted text-muted-foreground inline-flex rounded-md px-2 py-0.5 text-xs font-medium">
          {appointment.species ?? "Unknown"}
          {appointment.breed && ` · ${appointment.breed}`}
        </span>
      </td>
      <td className="py-3">
        <span className="text-muted-foreground line-clamp-2 text-sm">
          {appointment.reason ?? "-"}
        </span>
      </td>
      <td className="py-3 text-center">
        <AppointmentStatusBadge status={appointment.status} />
      </td>
      <td className="py-3 text-center">
        {isPending && onQuickAction ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 bg-teal-500/10 px-3 text-xs font-medium text-teal-700 hover:bg-teal-500/20 dark:text-teal-400"
            onClick={(e) => {
              e.stopPropagation();
              void onQuickAction(appointment.id);
            }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Confirm
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="flex flex-col items-end gap-0.5">
          {appointment.requestedDate ? (
            <>
              <span className="text-xs font-medium">
                {format(new Date(appointment.requestedDate), "MMM d")}
              </span>
              {appointment.requestedStartTime && (
                <span className="text-muted-foreground text-xs">
                  {appointment.requestedStartTime.slice(0, 5)}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-xs">No preference</span>
          )}
        </div>
      </td>
    </>
  );
}

function MessageRow({
  message,
  onQuickAction,
}: {
  message: ClinicMessage;
  onQuickAction?: (id: string) => Promise<void>;
}) {
  const isNew = message.status === "new";
  const isUrgent = message.priority === "urgent";

  return (
    <>
      <td className="py-3 pl-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {message.callerName ?? "Unknown"}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatPhoneNumber(message.callerPhone)}
          </span>
        </div>
      </td>
      <td className="py-3">
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {message.messageContent}
        </p>
      </td>
      <td className="py-3 text-center">
        <PriorityBadge priority={message.priority} />
      </td>
      <td className="py-3 text-center">
        <MessageStatusBadge status={message.status} />
      </td>
      <td className="py-3 text-center">
        {isNew && onQuickAction ? (
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-7 gap-1.5 px-3 text-xs font-medium",
              isUrgent
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-400",
            )}
            onClick={(e) => {
              e.stopPropagation();
              void onQuickAction(message.id);
            }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Read
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs font-medium">
            {format(new Date(message.createdAt), "MMM d, yyyy")}
          </span>
          <span className="text-muted-foreground text-xs">
            {format(new Date(message.createdAt), "h:mm a")}
          </span>
        </div>
      </td>
    </>
  );
}

// =============================================================================
// Badge Components
// =============================================================================

function CallStatusBadge({ status: _status }: { status: string }) {
  // Always show as "Completed" for all calls in the inbound dashboard
  const variant = {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        variant.className,
      )}
    >
      {variant.label}
    </span>
  );
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      className: "bg-destructive/10 text-destructive",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground",
    },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        variant.className,
      )}
    >
      {variant.label}
    </span>
  );
}

function MessageStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    new: {
      label: "New",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    read: { label: "Read", className: "bg-muted text-muted-foreground" },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        variant.className,
      )}
    >
      {variant.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority || priority === "normal") {
    return <span className="text-muted-foreground text-xs">Normal</span>;
  }

  if (priority === "urgent") {
    return (
      <span className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
        <AlertTriangle className="h-3 w-3" />
        Urgent
      </span>
    );
  }

  return <span className="text-muted-foreground text-xs">{priority}</span>;
}

// =============================================================================
// Call Enhancement Components
// =============================================================================

function CallDuration({ call }: { call: InboundCall }) {
  // Check for hardcoded modifications
  const callMods = getCallModifications(call);

  // Silent calls show blank duration
  if (callMods.isSilent) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // Use existing duration if available, otherwise show loading or dash
  const shouldFetchFromVAPI = !call.duration_seconds && !!call.vapi_call_id;
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: call.vapi_call_id },
    {
      enabled: () => shouldFetchFromVAPI,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false,
    },
  );

  if (call.duration_seconds) {
    return (
      <span className="text-sm">{formatDuration(call.duration_seconds)}</span>
    );
  }

  if (shouldFetchFromVAPI && vapiQuery.isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
      </div>
    );
  }

  if (shouldFetchFromVAPI && vapiQuery.data?.duration) {
    return (
      <span className="text-sm">{formatDuration(vapiQuery.data.duration)}</span>
    );
  }

  return <span className="text-muted-foreground text-sm">-</span>;
}

function CallAlertsIcons({ vapiCallId }: { vapiCallId: string | null }) {
  // Check if this call is associated with appointments or messages via vapiCallId
  const { data: appointmentExists } =
    api.inbound.checkCallAppointmentAssociation.useQuery(
      { callId: vapiCallId! },
      {
        enabled: !!vapiCallId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: false,
      },
    );

  const { data: messageExists } =
    api.inbound.checkCallMessageAssociation.useQuery(
      { callId: vapiCallId! },
      {
        enabled: !!vapiCallId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        retry: false,
      },
    );

  return (
    <div className="flex items-center justify-center gap-1">
      {appointmentExists && (
        <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      )}
      {messageExists && (
        <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
      )}
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

// =============================================================================
// Loading & Empty States
// =============================================================================

function TableSkeleton({ viewMode: _viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4 border-b pb-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted h-3 flex-1 animate-pulse rounded" />
        ))}
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="border-border/50 flex items-center gap-4 border-b py-3"
        >
          <div className="w-[25%] space-y-1.5">
            <div className="bg-muted/60 h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted/40 h-3 w-32 animate-pulse rounded" />
          </div>
          <div className="bg-muted/40 h-5 w-20 animate-pulse rounded-md" />
          <div className="flex w-[15%] justify-center">
            <div className="bg-muted/40 h-5 w-16 animate-pulse rounded-full" />
          </div>
          <div className="flex w-[15%] justify-center">
            <div className="bg-muted/40 h-5 w-14 animate-pulse rounded-full" />
          </div>
          <div className="flex w-[12%] justify-center">
            <div className="bg-muted/40 h-7 w-16 animate-pulse rounded-md" />
          </div>
          <div className="bg-muted/40 h-3 w-16 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

function TableEmpty({ viewMode }: { viewMode: ViewMode }) {
  const config = {
    calls: {
      icon: Phone,
      title: "No calls yet",
      description: "Inbound calls will appear here when customers call in.",
    },
    appointments: {
      icon: Calendar,
      title: "No appointment requests",
      description:
        "Appointment requests from the AI assistant will appear here.",
    },
    messages: {
      icon: MessageSquare,
      title: "No messages",
      description: "Messages and callback requests will appear here.",
    },
  };

  const { icon: Icon, title, description } = config[viewMode];

  return (
    <div className="flex h-full flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10">
        <Icon className="h-8 w-8 text-teal-600 dark:text-teal-400" />
      </div>
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}
