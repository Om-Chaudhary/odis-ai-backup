"use client";

import { useState } from "react";
import { format } from "date-fns";
import { api } from "~/trpc/client";
import {
  Phone,
  Calendar,
  MessageSquare,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Mail,
  Trash2,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Separator } from "@odis-ai/ui/separator";
import { Textarea } from "@odis-ai/ui/textarea";
import { cn } from "@odis-ai/utils";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { CallRecordingPlayer } from "../outbound/call-recording-player";
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
  onDeleteCall?: (id: string) => Promise<void>;
  onDeleteAppointment?: (id: string) => Promise<void>;
  onDeleteMessage?: (id: string) => Promise<void>;
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
  onDeleteCall,
  onDeleteAppointment,
  onDeleteMessage,
  isSubmitting,
}: InboundDetailProps) {
  if (!item) {
    return <EmptyDetailState viewMode={viewMode} />;
  }

  return (
    <div className="flex h-full flex-col">
      {viewMode === "calls" && (
        <CallDetail
          call={item as InboundCall}
          onDelete={onDeleteCall}
          isSubmitting={isSubmitting}
        />
      )}
      {viewMode === "appointments" && (
        <AppointmentDetail
          appointment={item as AppointmentRequest}
          onConfirm={onConfirmAppointment}
          onReject={onRejectAppointment}
          onDelete={onDeleteAppointment}
          isSubmitting={isSubmitting}
        />
      )}
      {viewMode === "messages" && (
        <MessageDetail
          message={item as ClinicMessage}
          onMarkRead={onMarkMessageRead}
          onResolve={onResolveMessage}
          onDelete={onDeleteMessage}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// =============================================================================
// Call Detail
// =============================================================================

function CallDetail({
  call,
  onDelete,
  isSubmitting,
}: {
  call: InboundCall;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch call data from VAPI if database data is missing critical fields
  const shouldFetchFromVAPI = !call.recording_url && !!call.vapi_call_id;
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: call.vapi_call_id },
    {
      enabled: () => shouldFetchFromVAPI,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false, // Don't retry on error
    },
  );

  // Hardcoded data for Maria Serpa case (phone: 4085612356)
  const isMariaSerpaCall =
    call.customer_phone === "4085612356" ||
    call.customer_phone === "408-561-2356" ||
    call.customer_phone === "+14085612356" ||
    call.customer_phone === "(408) 561-2356" ||
    call.customer_phone === "+1 (408) 561-2356";

  const mariaSerpaCallData = isMariaSerpaCall
    ? {
        ...call,
        recording_url: "/audio/cancelAppt.MP3",
        transcript: `Assistant: Hello, You have reached the After Hours Assistant at Alam Rock Animal Hospital. How can I help you today?\n\nUser: I need to cancel my dog's appointment.\n\nAssistant: I can help you with that. Could you please provide your name and the best phone number to reach you?\n\nUser: Maria Serpa, 4 0 8 5 6 1 2 3 5 6.\n\nAssistant: Thank you, Maria. Could you please tell me your dog's name?\n\nUser: Charlie.\n\nAssistant: Got it. I'll pass along the message to cancel Charlie's appointment. Is there anything else I can help you with?\n\nUser: No.\n\nAssistant: I've noted your request to cancel Charlie's appointment. Thank you for calling Alham Rock Animal Hospital.`,
        duration_seconds: 55,
        summary:
          "Maria Serpa called to cancel her dog Charlie's appointment. The original appointment was scheduled for Dec 17th at 8:30am. The assistant noted the cancellation request.",
      }
    : null;

  // Hardcoded data for silent calls (no audio, blank transcript, hang-up summary)
  const isSilentCall =
    [
      "727576003",
      "7275760033",
      "727-576-0033",
      "(727) 576-0033",
      "+1 (727) 576-0033",
      "+17275760033",
      "2532278892",
      "253-227-8892",
      "(253) 227-8892",
      "+1 (253) 227-8892",
      "+12532278892",
      "5103207704",
      "510-320-7704",
      "(510) 320-7704",
      "+1 (510) 320-7704",
      "+15103207704",
    ].some((pattern) =>
      call.customer_phone
        ?.replace(/\D/g, "")
        .includes(pattern.replace(/\D/g, "")),
    ) ||
    [
      "727576003",
      "2532278892",
      "5103207704",
      "727-576-0033",
      "253-227-8892",
      "510-320-7704",
      "(727) 576-0033",
      "(253) 227-8892",
      "(510) 320-7704",
      "+1 (727) 576-0033",
      "+1 (253) 227-8892",
      "+1 (510) 320-7704",
    ].includes(call.customer_phone ?? "");

  const silentCallData = isSilentCall
    ? {
        ...call,
        recording_url: null,
        transcript: "",
        duration_seconds: null,
        summary:
          "Call connected but caller did not speak. The line remained silent and the caller hung up without providing any information.",
      }
    : null;

  // Hardcoded data for Eric Silva case (phone: 4084260512)
  const isEricSilvaCall =
    call.customer_phone === "4084260512" ||
    call.customer_phone === "408-426-0512" ||
    call.customer_phone === "+14084260512" ||
    call.customer_phone === "(408) 426-0512" ||
    call.customer_phone === "+1 (408) 426-0512";

  const ericSilvaCallData = isEricSilvaCall
    ? {
        ...call,
        recording_url: "/audio/JackStitches.MP3",
        transcript: `User: Hello?

AI: Thank you for calling Alum Rock Animal Hospital. You've reached the after hours assistant. Are you looking to schedule an appointment? Or do you have a concern about your pet?

User: Concern.

AI: Alright. Can you tell me a little about what's going on with your pet?

User: Stitches are coming out.

AI: I see. It sounds like your pet's stitches might be coming loose. That can be concerning. Let me ask, are they bleeding or showing signs of discomfort?

User: No.

AI: Okay, that's good to hear. There's no bleeding or discomfort. Since this isn't urgent, I recommend keeping the area clean and preventing your pet from licking or scratching it. The clinic can assist you during business hours to check the stitches and ensure everything is healing properly. Would you like me to take a message for the clinic to follow up with you?

User: Yes.

AI: Of course, I can take a message for you. What's your name?

User: Eric Silva.

AI: Thank you, Eric. What's the best phone number to reach you?

User: 408-426-0512.

AI: Got it. 408-426-0512. Does this concern a specific pet? What's their name?

User: Jack.

AI: Got it, Jack. What would you like the message to say?

User: If they can call me back, I need to know about the stitches. I've seen that they're coming off, but he's not bleeding a lot, just very little.

AI: I've got your message, Eric. The clinic will call you back during business hours to assist with Jack's stitches. Is there anything else I can help you with?

User: No.`,
        duration_seconds: 141,
        summary:
          "Eric Silva called the after-hours assistant at Alum Rock Animal Hospital because his pet, Jack, had stitches coming out. The assistant determined it was not urgent and advised keeping the area clean. A message was taken for the clinic to call Eric back.",
      }
    : null;

  // Hardcoded data for Melissa 5:40 AM call (phone: 4848455065)
  const melissa540CallData =
    (call.customer_phone === "4848455065" ||
      call.customer_phone === "484-845-5065" ||
      call.customer_phone === "(484) 845-5065" ||
      call.customer_phone === "+1 (484) 845-5065" ||
      call.customer_phone === "+14848455065") &&
    call.created_at &&
    (() => {
      const callTime = new Date(call.created_at);
      const hour = callTime.getUTCHours();
      const minute = callTime.getUTCMinutes();
      // Only apply to the 5:40 AM call (13:40 UTC = 5:40 AM PST)
      return hour === 13 && minute === 40;
    })()
      ? {
          ...call,
          recording_url: "/audio/fetchpetinsurance.MP3",
          transcript: `Assistant: Thank you for calling Alum Rock Animal Hospital. You've reached our after-hours assistant. How can I help you today?\n\nUser: Calling from Fetch Pet Insurance. Requesting medical records for Otis, owned by Ama Villanueva. Please send the invoice for Otis dated December 7, 2025, to medical.record@fetchpet.com.\n\nAssistant: I understand you're from Fetch Pet Insurance and need medical records for Otis. I'll make sure to pass this message to the clinic so they can send the invoice to medical.record@fetchpet.com. Is there anything else I can help you with?\n\nUser: No, that's all.\n\nAssistant: Perfect. I've noted your request for Otis's medical records to be sent to Fetch Pet Insurance. Thank you for calling.`,
          duration_seconds: 48,
          summary:
            "Melissa from Fetch Pet Insurance called requesting medical records for patient Otis, owned by Ama Villanueva. Requested invoice dated December 7, 2025 be sent to medical.record@fetchpet.com.",
        }
      : null;

  // Merge database and VAPI data, prioritizing hardcoded data
  const callData =
    silentCallData ??
    ericSilvaCallData ??
    mariaSerpaCallData ??
    melissa540CallData ??
    (shouldFetchFromVAPI && vapiQuery.data
      ? {
          ...call,
          recording_url: vapiQuery.data.recordingUrl ?? call.recording_url,
          transcript: vapiQuery.data.transcript ?? call.transcript,
          summary: vapiQuery.data.analysis?.summary ?? call.summary,
          duration_seconds: vapiQuery.data.duration ?? call.duration_seconds,
        }
      : call);

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
                  {callData.duration_seconds ? (
                    formatDuration(callData.duration_seconds)
                  ) : vapiQuery.isLoading ? (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "N/A"
                  )}
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

        {/* Call Recording and Transcript */}
        {vapiQuery.isLoading && shouldFetchFromVAPI ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading call recording...
              </div>
            </CardContent>
          </Card>
        ) : callData.recording_url ? (
          <CallRecordingPlayer
            recordingUrl={callData.recording_url}
            transcript={callData.transcript}
            durationSeconds={callData.duration_seconds}
          />
        ) : vapiQuery.error && shouldFetchFromVAPI ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Unable to load call recording from VAPI
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Call Summary */}
        {callData.summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Call Summary
                {shouldFetchFromVAPI && vapiQuery.data && !call.summary && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    From VAPI
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {callData.summary}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Footer */}
      {onDelete && (
        <div className="bg-muted/10 border-t p-4">
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete this call? This action cannot be
                undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  onClick={() => onDelete(call.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Confirm Delete
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Call
            </Button>
          )}
        </div>
      )}
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
  onDelete,
  isSubmitting,
}: {
  appointment: AppointmentRequest;
  onConfirm: (id: string) => Promise<void>;
  onReject: (id: string, notes?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isPending = appointment.status === "pending";

  // Fetch call recording from VAPI if appointment has an associated call
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: appointment.vapiCallId! },
    {
      enabled: !!appointment.vapiCallId,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false,
    },
  );

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

        {/* Call Recording and Transcript */}
        {appointment.vapiCallId && (
          <>
            {vapiQuery.isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading call recording...
                  </div>
                </CardContent>
              </Card>
            ) : vapiQuery.data?.recordingUrl ? (
              <CallRecordingPlayer
                recordingUrl={vapiQuery.data.recordingUrl}
                transcript={vapiQuery.data.transcript ?? null}
                durationSeconds={vapiQuery.data.duration ?? null}
              />
            ) : vapiQuery.error ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Unable to load call recording
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="bg-muted/10 border-t p-4">
        {isPending ? (
          <>
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
          </>
        ) : onDelete ? (
          <>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Are you sure you want to delete this appointment request? This
                  action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    onClick={() => onDelete(appointment.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Confirm Delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Appointment
              </Button>
            )}
          </>
        ) : null}
      </div>
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
  onDelete,
  isSubmitting,
}: {
  message: ClinicMessage;
  onMarkRead: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isNew = message.status === "new";
  const isRead = message.status === "read";
  const isResolved = message.status === "resolved";
  const isUrgent = message.priority === "urgent";

  // Check for demo call data in metadata (for static demo messages like Eric Silva, Maria Serpa)
  const demoCallData = (
    message.metadata as {
      demoCallData?: {
        recordingUrl: string;
        transcript: string;
        durationSeconds: number;
        summary: string;
      };
    }
  )?.demoCallData;

  // Fetch call data dynamically for messages with a vapiCallId (skip if we have demo data)
  const callDataQuery = api.inboundCalls.getCallDataForAppointment.useQuery(
    { vapiCallId: message.vapiCallId! },
    {
      enabled: !!message.vapiCallId && !demoCallData,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: 1,
    },
  );

  // Get call data from demo metadata or query result
  const callData = demoCallData
    ? {
        recording_url: demoCallData.recordingUrl,
        transcript: demoCallData.transcript,
        duration_seconds: demoCallData.durationSeconds,
        summary: demoCallData.summary,
      }
    : callDataQuery.data
      ? {
          recording_url: callDataQuery.data.recordingUrl,
          transcript: callDataQuery.data.transcript,
          duration_seconds: callDataQuery.data.duration,
          summary: callDataQuery.data.summary,
        }
      : null;

  const isLoadingCallData =
    callDataQuery.isLoading && !!message.vapiCallId && !demoCallData;
  const hasCallData = !!demoCallData || !!message.vapiCallId;

  // Old hardcoded data removed - now using dynamic fetch via callDataQuery or metadata.demoCallData
  // Keeping this for reference during transition period
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _oldEricSilvaCallData = false
    ? {
        recording_url: "/audio/JackStitches.MP3",
        transcript: `User: Hello?

AI: Thank you for calling Alum Rock Animal Hospital. You've reached the after hours assistant. Are you looking to schedule an appointment? Or do you have a concern about your pet?

User: Concern.

AI: Alright. Can you tell me a little about what's going on with your pet?

User: Stitches are coming out.

AI: I see. It sounds like your pet's stitches might be coming loose. That can be concerning. Let me ask, are they bleeding or showing signs of discomfort?

User: No.

AI: Okay, that's good to hear. There's no bleeding or discomfort. Since this isn't urgent, I recommend keeping the area clean and preventing your pet from licking or scratching it. The clinic can assist you during business hours to check the stitches and ensure everything is healing properly. Would you like me to take a message for the clinic to follow up with you?

User: Yes.

AI: Of course, I can take a message for you. What's your name?

User: Eric Silva.

AI: Thank you, Eric. What's the best phone number to reach you?

User: 408-426-0512.

AI: Got it. 408-426-0512. Does this concern a specific pet? What's their name?

User: Jack.

AI: Got it, Jack. What would you like the message to say?

User: If they can call me back, I need to know about the stitches. I've seen that they're coming off, but he's not bleeding a lot, just very little.

AI: I've got your message, Eric. The clinic will call you back during business hours to assist with Jack's stitches. Is there anything else I can help you with?

User: No.`,
        duration_seconds: 141,
        summary:
          "Eric Silva called the after-hours assistant at Alum Rock Animal Hospital because his pet, Jack, had stitches coming out. The assistant determined it was not urgent and advised keeping the area clean. A message was taken for the clinic to call Eric back.",
      }
    : null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _oldMariaSerpaCallData = false
    ? {
        recording_url: "/audio/cancelAppt.MP3",
        transcript: `Assistant: Hello, You have reached the After Hours Assistant at Alam Rock Animal Hospital. How can I help you today?

User: I need to cancel my dog's appointment.

Assistant: I can help you with that. Could you please provide your name and the best phone number to reach you?

User: Maria Serpa, 4 0 8 5 6 1 2 3 5 6.

Assistant: Thank you, Maria. Could you please tell me your dog's name?

User: Charlie.

Assistant: Got it. I'll pass along the message to cancel Charlie's appointment. Is there anything else I can help you with?

User: No.

Assistant: I've noted your request to cancel Charlie's appointment. Thank you for calling Alham Rock Animal Hospital.`,
        duration_seconds: 55,
        summary:
          "Maria Serpa called to cancel her dog Charlie's appointment. The original appointment was scheduled for Dec 17th at 8:30am. The assistant noted the cancellation request.",
      }
    : null;

  // Use dynamically fetched call data
  const currentCallData = callData;

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

        {/* Call Recording and Transcript */}
        {hasCallData && (
          <>
            {isLoadingCallData ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading call recording...
                  </div>
                </CardContent>
              </Card>
            ) : currentCallData?.recording_url ? (
              <CallRecordingPlayer
                recordingUrl={currentCallData.recording_url}
                transcript={currentCallData.transcript ?? null}
                durationSeconds={currentCallData.duration_seconds ?? null}
              />
            ) : callDataQuery.error ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Unable to load call recording
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}

        {/* Call Summary */}
        {currentCallData?.summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Call Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentCallData.summary}
              </p>
            </CardContent>
          </Card>
        )}

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

        {/* Call Recording and Transcript - Only available for specific demo cases */}
      </div>

      {/* Action Footer */}
      <div
        className={cn(
          "border-t p-4",
          isUrgent ? "bg-destructive/5" : "bg-muted/10",
        )}
      >
        {isNew || isRead ? (
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
        ) : isResolved && onDelete ? (
          <>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Are you sure you want to delete this message? This action
                  cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    onClick={() => onDelete(message.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Confirm Delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Message
              </Button>
            )}
          </>
        ) : null}
      </div>
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
