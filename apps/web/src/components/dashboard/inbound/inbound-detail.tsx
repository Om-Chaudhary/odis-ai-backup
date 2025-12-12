"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Phone,
  Calendar,
  MessageSquare,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  AlertTriangle,
  Loader2,
  FileText,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Separator } from "@odis-ai/ui/separator";
import { Textarea } from "@odis-ai/ui/textarea";
import { cn } from "@odis-ai/utils";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import type {
  ViewMode,
  AppointmentRequest,
  ClinicMessage,
  InboundItem,
  InboundCall,
} from "./types";

interface InboundDetailProps {
  item: InboundItem | null;
  viewMode: ViewMode;
  onConfirmAppointment: (id: string) => Promise<void>;
  onRejectAppointment: (id: string, notes?: string) => Promise<void>;
  onMarkMessageRead: (id: string) => Promise<void>;
  onResolveMessage: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Inbound Detail Panel
 *
 * Shows full details for the selected item with action buttons:
 * - Calls: Full transcript, recording, analysis
 * - Appointments: Full details with confirm/reject actions
 * - Messages: Full message with mark read/resolve actions
 */
export function InboundDetail({
  item,
  viewMode,
  onConfirmAppointment,
  onRejectAppointment,
  onMarkMessageRead,
  onResolveMessage,
  isSubmitting,
}: InboundDetailProps) {
  if (!item) {
    return <EmptyDetailState viewMode={viewMode} />;
  }

  return (
    <div className="flex h-full flex-col">
      {viewMode === "calls" && <CallDetail call={item as InboundCall} />}
      {viewMode === "appointments" && (
        <AppointmentDetail
          appointment={item as AppointmentRequest}
          onConfirm={onConfirmAppointment}
          onReject={onRejectAppointment}
          isSubmitting={isSubmitting}
        />
      )}
      {viewMode === "messages" && (
        <MessageDetail
          message={item as ClinicMessage}
          onMarkRead={onMarkMessageRead}
          onResolve={onResolveMessage}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// =============================================================================
// Call Detail
// =============================================================================

function CallDetail({ call }: { call: InboundCall }) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="bg-muted/20 flex items-start justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10">
            <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {formatPhoneNumber(call.customer_phone ?? "") || "Unknown Caller"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {format(new Date(call.created_at), "EEEE, MMMM d 'at' h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CallStatusBadge status={call.status} />
          {call.user_sentiment && (
            <SentimentBadge sentiment={call.user_sentiment} />
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Call Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Call Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {call.duration_seconds
                    ? formatDuration(call.duration_seconds)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Cost</p>
                <p className="font-medium">
                  {call.cost ? `$${call.cost.toFixed(2)}` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Clinic</p>
                <p className="font-medium">{call.clinic_name ?? "Unknown"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">End Reason</p>
                <p className="font-medium">{call.ended_reason ?? "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {call.summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Call Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {call.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        {call.transcript && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground max-h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
                {call.transcript}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recording */}
        {call.recording_url && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Play className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Recording
              </CardTitle>
            </CardHeader>
            <CardContent>
              <audio controls src={call.recording_url} className="w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Appointment Detail
// =============================================================================

function AppointmentDetail({
  appointment,
  onConfirm,
  onReject,
  isSubmitting,
}: {
  appointment: AppointmentRequest;
  onConfirm: (id: string) => Promise<void>;
  onReject: (id: string, notes?: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const isPending = appointment.status === "pending";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="bg-muted/20 flex items-start justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10">
            <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {appointment.patientName}
              </h3>
              {appointment.isNewClient && (
                <Badge
                  variant="secondary"
                  className="bg-blue-500/10 text-blue-700 dark:text-blue-400"
                >
                  New Client
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {appointment.species}
              {appointment.breed && ` · ${appointment.breed}`}
            </p>
          </div>
        </div>
        <AppointmentStatusBadgeLarge status={appointment.status} />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Client Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{appointment.clientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">
                  <a
                    href={`tel:${appointment.clientPhone}`}
                    className="text-teal-600 hover:text-teal-700 hover:underline dark:text-teal-400"
                  >
                    {formatPhoneNumber(appointment.clientPhone)}
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Appointment Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Reason for Visit</p>
                <p className="font-medium">
                  {appointment.reason ?? "Not specified"}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Preferred Date</p>
                  <p className="font-medium">
                    {appointment.requestedDate
                      ? format(
                          new Date(appointment.requestedDate),
                          "EEEE, MMMM d, yyyy",
                        )
                      : "No preference"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Preferred Time</p>
                  <p className="font-medium">
                    {appointment.requestedStartTime
                      ? appointment.requestedStartTime.slice(0, 5)
                      : "No preference"}
                  </p>
                </div>
              </div>
              {appointment.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground">Notes</p>
                    <p className="font-medium">{appointment.notes}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Timestamp */}
        <Card>
          <CardContent className="py-3">
            <p className="text-muted-foreground text-xs">
              Request received{" "}
              <span className="font-medium">
                {format(
                  new Date(appointment.createdAt),
                  "MMMM d, yyyy 'at' h:mm a",
                )}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      {isPending && (
        <div className="bg-muted/10 border-t p-4">
          {showRejectForm ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Reason for rejection (optional)"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectNotes("");
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() =>
                    onReject(appointment.id, rejectNotes || undefined)
                  }
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Confirm Rejection
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={() => onConfirm(appointment.id)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirm Appointment
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Message Detail
// =============================================================================

function MessageDetail({
  message,
  onMarkRead,
  onResolve,
  isSubmitting,
}: {
  message: ClinicMessage;
  onMarkRead: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const isNew = message.status === "new";
  const isRead = message.status === "read";
  const isUrgent = message.priority === "urgent";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={cn(
          "flex items-start justify-between border-b p-4",
          isUrgent ? "bg-destructive/5" : "bg-muted/20",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isUrgent ? "bg-destructive/10" : "bg-teal-500/10",
            )}
          >
            <MessageSquare
              className={cn(
                "h-5 w-5",
                isUrgent
                  ? "text-destructive"
                  : "text-teal-600 dark:text-teal-400",
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {message.callerName ?? "Unknown Caller"}
              </h3>
              {isUrgent && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {formatPhoneNumber(message.callerPhone)}
            </p>
          </div>
        </div>
        <MessageStatusBadgeLarge status={message.status} />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Message Content */}
        <Card className={isUrgent ? "border-destructive/20" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {message.messageContent}
            </p>
          </CardContent>
        </Card>

        {/* Message Info */}
        <Card>
          <CardContent className="py-3">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                Received{" "}
                <span className="font-medium">
                  {format(
                    new Date(message.createdAt),
                    "MMMM d, yyyy 'at' h:mm a",
                  )}
                </span>
              </span>
              {message.readAt && (
                <span>
                  Read{" "}
                  <span className="font-medium">
                    {format(new Date(message.readAt), "h:mm a")}
                  </span>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      {(isNew || isRead) && (
        <div
          className={cn(
            "border-t p-4",
            isUrgent ? "bg-destructive/5" : "bg-muted/10",
          )}
        >
          <div className="flex gap-2">
            {isNew && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onMarkRead(message.id)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Mark as Read
              </Button>
            )}
            <Button
              className={cn(
                "flex-1",
                isUrgent
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-teal-600 hover:bg-teal-700",
              )}
              onClick={() => onResolve(message.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark as Resolved
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Badge Components
// =============================================================================

function CallStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    queued: { label: "Queued", className: "bg-yellow-100 text-yellow-700" },
    ringing: { label: "Ringing", className: "bg-blue-100 text-blue-700" },
    in_progress: { label: "Active", className: "bg-green-100 text-green-700" },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-700",
    },
    failed: { label: "Failed", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return <Badge className={variant.className}>{variant.label}</Badge>;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    positive: { label: "Positive", className: "bg-green-100 text-green-700" },
    neutral: { label: "Neutral", className: "bg-slate-100 text-slate-600" },
    negative: { label: "Negative", className: "bg-red-100 text-red-700" },
  };

  const variant = variants[sentiment];
  if (!variant) return null;

  return <Badge className={variant.className}>{variant.label}</Badge>;
}

function AppointmentStatusBadgeLarge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending Review",
      className: "bg-amber-100 text-amber-700",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-emerald-100 text-emerald-700",
    },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return <Badge className={variant.className}>{variant.label}</Badge>;
}

function MessageStatusBadgeLarge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    new: { label: "New", className: "bg-amber-100 text-amber-700" },
    read: { label: "Read", className: "bg-slate-100 text-slate-600" },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-100 text-emerald-700",
    },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return <Badge className={variant.className}>{variant.label}</Badge>;
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyDetailState({ viewMode }: { viewMode: ViewMode }) {
  const config = {
    calls: {
      icon: Phone,
      title: "Select a call",
      description: "Choose a call from the list to view details",
    },
    appointments: {
      icon: Calendar,
      title: "Select an appointment",
      description: "Choose an appointment request to review and confirm",
    },
    messages: {
      icon: MessageSquare,
      title: "Select a message",
      description: "Choose a message to view and respond",
    },
  };

  const { icon: Icon, title, description } = config[viewMode];

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10">
        <Icon className="h-8 w-8 text-teal-600/30 dark:text-teal-400/30" />
      </div>
      <p className="text-muted-foreground text-lg font-medium">{title}</p>
      <p className="text-muted-foreground/60 mt-1 text-sm">{description}</p>
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
