"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@odis-ai/shared/ui/button";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Textarea } from "@odis-ai/shared/ui/textarea";
import { Separator } from "@odis-ai/shared/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import {
  Calendar,
  CalendarCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Heart,
} from "lucide-react";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { api } from "~/trpc/client";

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
  // Confirmed appointment (what AI booked)
  confirmedDate?: string | null;
  confirmedTime?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

/**
 * Format time string (HH:MM:SS) to readable format (e.g., "2:30 PM")
 */
function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr ?? "0", 10);
  const minute = minuteStr ?? "00";
  const isPM = hour >= 12;
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minute} ${isPM ? "PM" : "AM"}`;
}

/**
 * Check if the reason indicates a sensitive case (euthanasia, emergency, etc.)
 */
function isSensitiveCase(reason: string | null | undefined): boolean {
  if (!reason) return false;
  const sensitiveKeywords = [
    "euthanasia",
    "put down",
    "put to sleep",
    "end of life",
    "goodbye",
    "passing",
    "humane",
  ];
  const lowerReason = reason.toLowerCase();
  return sensitiveKeywords.some((keyword) => lowerReason.includes(keyword));
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

  const isSensitive = isSensitiveCase(appointment.reason);
  const hasConfirmedTime =
    appointment.confirmedDate != null || appointment.confirmedTime != null;

  return (
    <div className="flex h-full flex-col">
      {/* Minimal Header - Only badges not shown in table */}
      <div className="flex items-center justify-between border-b border-teal-100/50 bg-gradient-to-r from-white/50 to-teal-50/30 px-4 py-3">
        <div className="flex items-center gap-2">
          {appointment.isNewClient && (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">
              New Client
            </Badge>
          )}
          {!appointment.isNewClient && (
            <span className="text-sm text-slate-500">Appointment Request</span>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Sensitive Case Alert */}
        {isSensitive && (
          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Sensitive Case — Please handle with extra care and compassion
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PROMINENT: Confirmed Appointment Time */}
        {hasConfirmedTime && (
          <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 dark:border-teal-800 dark:from-teal-950/40 dark:to-emerald-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-300">
                <CalendarCheck className="h-4 w-4" />
                Scheduled Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                    {appointment.confirmedDate
                      ? format(
                          new Date(appointment.confirmedDate + "T00:00:00"),
                          "EEEE, MMMM d",
                        )
                      : "Date TBD"}
                  </p>
                  {appointment.confirmedTime && (
                    <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-teal-700 dark:text-teal-300">
                      <Clock className="h-4 w-4" />
                      {formatTime(appointment.confirmedTime)}
                    </p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointment Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Reason for Visit</p>
                <p
                  className={`font-medium ${isSensitive ? "text-purple-700" : "text-slate-800"}`}
                >
                  {appointment.reason ?? "Not specified"}
                </p>
              </div>
              {/* Only show preferences if different from confirmed or no confirmed time */}
              {(appointment.requestedDate != null ||
                appointment.requestedStartTime != null) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500">
                      {hasConfirmedTime
                        ? "Originally Requested"
                        : "Preferred Date"}
                    </p>
                    <p className="font-medium text-slate-800">
                      {appointment.requestedDate
                        ? format(
                            new Date(appointment.requestedDate + "T00:00:00"),
                            "EEEE, MMMM d, yyyy",
                          )
                        : "No preference"}
                    </p>
                  </div>
                  {appointment.requestedStartTime && (
                    <div>
                      <p className="text-slate-500">
                        {hasConfirmedTime
                          ? "Originally Requested Time"
                          : "Preferred Time"}
                      </p>
                      <p className="flex items-center gap-1 font-medium text-slate-800">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatTime(appointment.requestedStartTime)}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {appointment.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-slate-500">Notes</p>
                    <p className="font-medium text-slate-800">
                      {appointment.notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Timestamp */}
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-slate-500">
              Request received{" "}
              <span className="font-medium text-slate-700">
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
                  <div className="flex items-center justify-center gap-2 text-slate-500">
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
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
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
      <div className="border-t border-teal-100/50 bg-gradient-to-r from-teal-50/30 to-white/50 p-4">
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
                <p className="text-sm text-slate-500">
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
