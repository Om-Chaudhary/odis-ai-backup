"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { Textarea } from "@odis-ai/ui/textarea";
import { Separator } from "@odis-ai/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import {
  Calendar,
  User,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { api } from "~/trpc/client";
import { AppointmentStatusBadge } from "./badges";

interface AppointmentRequest {
  id: string;
  vapiCallId?: string | null;
  patientName: string;
  species: string | null;
  breed?: string | null;
  isNewClient: boolean | null;
  clientName: string;
  clientPhone: string;
  reason?: string | null;
  requestedDate?: string | null;
  requestedStartTime?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

interface AppointmentDetailProps {
  appointment: AppointmentRequest;
  onConfirm: (id: string) => Promise<void>;
  onReject: (id: string, notes?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

export function AppointmentDetail({
  appointment,
  onConfirm,
  onReject,
  onDelete,
  isSubmitting,
}: AppointmentDetailProps) {
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
        <AppointmentStatusBadge status={appointment.status} />
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
