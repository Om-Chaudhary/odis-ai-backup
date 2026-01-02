"use client";
import { useState, useMemo, useEffect } from "react";
import { format, isValid } from "date-fns";
import { Button } from "@odis-ai/shared/ui/button";
import { Textarea } from "@odis-ai/shared/ui/textarea";
import { Label } from "@odis-ai/shared/ui/label";
import { Calendar as CalendarComponent } from "@odis-ai/shared/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@odis-ai/shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { Card, CardContent } from "@odis-ai/shared/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@odis-ai/shared/ui/accordion";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  CalendarIcon,
  User,
  Mic,
  FileText,
  Phone,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { Badge } from "@odis-ai/shared/ui/badge";
import { CallRecordingPlayer } from "../../shared/call-recording-player";
import { api } from "~/trpc/client";
import { AttentionBanner } from "./shared/attention-banner";
import { TimestampBadge } from "./shared/timestamp-badge";
import { getCallDataOverride } from "./demo-data/call-overrides";
import type { Database } from "@odis-ai/shared/types";

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
 * Safely parse a date string, returning a fallback date if invalid
 */
function safeParseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return isValid(date) ? date : new Date();
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

/**
 * Check if the reason indicates an urgent/emergency case
 */
function isUrgentCase(reason: string | null | undefined): boolean {
  if (!reason) return false;
  const urgentKeywords = [
    "emergency",
    "urgent",
    "critical",
    "severe",
    "bleeding",
    "trauma",
    "hit by car",
    "not breathing",
    "collapsed",
    "seizure",
    "poison",
    "toxic",
  ];
  const lowerReason = reason.toLowerCase();
  return urgentKeywords.some((keyword) => lowerReason.includes(keyword));
}

/**
 * Get species emoji for pet avatar
 */
function getSpeciesEmoji(species: string | null): string {
  const speciesLower = species?.toLowerCase() ?? "";
  if (speciesLower.includes("canine") || speciesLower.includes("dog"))
    return "🐕";
  if (speciesLower.includes("feline") || speciesLower.includes("cat"))
    return "🐈";
  if (speciesLower.includes("avian") || speciesLower.includes("bird"))
    return "🐦";
  if (speciesLower.includes("rabbit") || speciesLower.includes("bunny"))
    return "🐰";
  if (speciesLower.includes("hamster")) return "🐹";
  if (speciesLower.includes("fish")) return "🐠";
  if (speciesLower.includes("reptile") || speciesLower.includes("lizard"))
    return "🦎";
  if (speciesLower.includes("horse") || speciesLower.includes("equine"))
    return "🐴";
  return "🐾";
}

/**
 * Get appointment status config
 */
function getStatusConfig(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    },
    confirmed: {
      label: "Confirmed",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    },
    cancelled: {
      label: "Cancelled",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
    },
  };
  return config[status] ?? { label: status, className: "bg-slate-100" };
}

/**
 * Get clinic hours based on day of week
 */
function getClinicHoursForDate(date: Date): {
  startHour: number;
  endHour: number;
} {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return { startHour: 9, endHour: 17 }; // Sunday
  if (dayOfWeek === 6) return { startHour: 8, endHour: 18 }; // Saturday
  return { startHour: 8, endHour: 19 }; // Monday-Friday
}

/**
 * Generate time slots in 15-minute increments for clinic hours
 */
function generateTimeSlots(date: Date): { value: string; label: string }[] {
  const { startHour, endHour } = getClinicHoursForDate(date);
  const slots: { value: string; label: string }[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      const value = `${hourStr}:${minuteStr}`;
      const isPM = hour >= 12;
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const label = `${hour12}:${minuteStr} ${isPM ? "PM" : "AM"}`;
      slots.push({ value, label });
    }
  }

  return slots;
}

interface AppointmentDetailProps {
  appointment: AppointmentRequest;
  onConfirm: (
    id: string,
    confirmedDate?: string,
    confirmedTime?: string,
  ) => Promise<void>;
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
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmDate, setConfirmDate] = useState<Date | undefined>(() => {
    if (appointment.requestedDate) {
      const date = new Date(appointment.requestedDate + "T00:00:00");
      return isValid(date) ? date : undefined;
    }
    return undefined;
  });
  const [confirmTime, setConfirmTime] = useState<string>(() => {
    if (appointment.requestedStartTime) {
      return appointment.requestedStartTime.slice(0, 5);
    }
    return "";
  });
  const isPending = appointment.status === "pending";

  // Generate time slots based on selected date
  const timeSlots = useMemo(() => {
    if (!confirmDate) return [];
    return generateTimeSlots(confirmDate);
  }, [confirmDate]);

  // Check if this is a demo appointment with hardcoded data
  const isDemoAppointment = appointment.vapiCallId === "demo-vapi-call-andrea";

  // Get demo call data for demo appointments
  const demoCallData = isDemoAppointment
    ? getCallDataOverride({
        customer_phone: appointment.clientPhone,
        id: "demo-call-andrea-cancellation",
        created_at: appointment.createdAt,
        vapi_call_id: appointment.vapiCallId ?? "demo-vapi-call-andrea",
      } as Database["public"]["Tables"]["inbound_vapi_calls"]["Row"])
    : null;

  // Lazy loading: Only fetch VAPI data when detail panel is opened
  const [shouldFetchVAPI, setShouldFetchVAPI] = useState(false);
  const shouldFetchFromVAPI = !!appointment.vapiCallId && !isDemoAppointment;

  // Enable fetching after component mounts (lazy load)
  useEffect(() => {
    if (shouldFetchFromVAPI) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        setShouldFetchVAPI(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFetchFromVAPI]);

  // Fetch call recording from VAPI if appointment has an associated call (but not for demo)
  const vapiQuery = api.inboundCalls.fetchCallFromVAPI.useQuery(
    { vapiCallId: appointment.vapiCallId! },
    {
      enabled: shouldFetchVAPI && shouldFetchFromVAPI,
      staleTime: 5 * 60 * 1000,
      retry: 3, // Retry up to 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s, max 30s
    },
  );

  const isSensitive = isSensitiveCase(appointment.reason);
  const isUrgent = isUrgentCase(appointment.reason);
  const hasConfirmedTime =
    appointment.confirmedDate != null || appointment.confirmedTime != null;
  const statusConfig = getStatusConfig(appointment.status);
  const petMetadata = [appointment.species, appointment.breed]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Pet Header Card - Top priority info */}
        <div
          className={cn(
            "rounded-xl border p-4 pr-12",
            "bg-gradient-to-br from-white/80 via-teal-50/30 to-white/80",
            "dark:from-slate-900/80 dark:via-teal-950/30 dark:to-slate-900/80",
            "shadow-sm backdrop-blur-md",
            isSensitive && "border-purple-200/50 dark:border-purple-800/50",
            isUrgent && "border-red-200/50 dark:border-red-800/50",
            !isSensitive &&
              !isUrgent &&
              "border-teal-200/50 dark:border-teal-800/50",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Pet Avatar */}
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl shadow-inner",
                  "bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50",
                  isSensitive &&
                    "from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50",
                  isUrgent &&
                    "from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50",
                )}
              >
                {getSpeciesEmoji(appointment.species)}
              </div>
              {/* Pet Info */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {appointment.patientName.toUpperCase()}
                </h2>
                {petMetadata && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {petMetadata}
                  </p>
                )}
              </div>
            </div>
            {/* Badges */}
            <div className="flex flex-col items-end gap-1.5">
              <Badge
                className={cn("text-xs font-medium", statusConfig.className)}
              >
                {statusConfig.label}
              </Badge>
              {appointment.isNewClient && (
                <Badge
                  variant="secondary"
                  className="bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300"
                >
                  New Client
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Sensitive Case Alert */}
        {isSensitive && (
          <AttentionBanner
            type="escalation"
            title="Sensitive Case"
            description="Please handle with extra care and compassion"
          />
        )}

        {/* Urgent Case Alert */}
        {isUrgent && !isSensitive && (
          <AttentionBanner
            type="urgent"
            title="Urgent Appointment"
            description="This appointment has been flagged as urgent"
          />
        )}

        {/* PROMINENT: Confirmed Appointment Time */}
        {hasConfirmedTime && (
          <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 dark:border-teal-800 dark:from-teal-950/40 dark:to-emerald-950/40">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
                    Scheduled Appointment
                  </p>
                  <p className="text-xl font-bold text-teal-900 dark:text-teal-100">
                    {appointment.confirmedDate
                      ? format(
                          safeParseDate(
                            appointment.confirmedDate + "T00:00:00",
                          ),
                          "EEEE, MMMM d",
                        )
                      : "Date TBD"}
                  </p>
                  {appointment.confirmedTime && (
                    <p className="flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-300">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(appointment.confirmedTime)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accordion Sections */}
        <Accordion
          type="multiple"
          defaultValue={["request"]}
          className="space-y-3"
        >
          {/* Appointment Request Details */}
          <AccordionItem
            value="request"
            className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Appointment Request
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {/* Reason - Most prominent */}
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Reason for Visit
                  </p>
                  <p
                    className={cn(
                      "text-base font-medium",
                      isSensitive && "text-purple-700 dark:text-purple-300",
                      isUrgent && "text-red-700 dark:text-red-300",
                      !isSensitive &&
                        !isUrgent &&
                        "text-slate-800 dark:text-slate-200",
                    )}
                  >
                    {appointment.reason ?? "Not specified"}
                  </p>
                </div>

                {/* Requested Date/Time */}
                {(appointment.requestedDate ??
                  appointment.requestedStartTime) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {hasConfirmedTime
                          ? "Originally Requested"
                          : "Preferred Date"}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {appointment.requestedDate
                          ? format(
                              safeParseDate(
                                appointment.requestedDate + "T00:00:00",
                              ),
                              "EEEE, MMMM d, yyyy",
                            )
                          : "No preference"}
                      </p>
                    </div>
                    {appointment.requestedStartTime && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {hasConfirmedTime
                            ? "Originally Requested Time"
                            : "Preferred Time"}
                        </p>
                        <p className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatTime(appointment.requestedStartTime)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {appointment.notes && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Notes
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {appointment.notes}
                    </p>
                  </div>
                )}

                {/* Request Timestamp */}
                <div className="mt-2 border-t border-slate-200/50 pt-3 dark:border-slate-700/50">
                  <TimestampBadge
                    timestamp={appointment.createdAt}
                    size="sm"
                    label="Requested"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Owner Contact */}
          <AccordionItem
            value="owner"
            className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Owner Contact
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {appointment.clientName}
                  </span>
                </div>
                <a
                  href={`tel:${appointment.clientPhone}`}
                  className="flex items-center gap-2 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  <Phone className="h-4 w-4" />
                  <span>{appointment.clientPhone}</span>
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Call Recording */}
          {appointment.vapiCallId && (
            <AccordionItem
              value="recording"
              className="rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mic className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Original Call Recording
                  {vapiQuery.isLoading && (
                    <Loader2 className="ml-2 h-3 w-3 animate-spin text-slate-400" />
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {isDemoAppointment && demoCallData ? (
                  <CallRecordingPlayer
                    recordingUrl={demoCallData.recording_url ?? null}
                    transcript={demoCallData.transcript ?? null}
                    durationSeconds={demoCallData.duration_seconds ?? null}
                  />
                ) : vapiQuery.isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading call recording...
                  </div>
                ) : vapiQuery.data?.recordingUrl ? (
                  <CallRecordingPlayer
                    recordingUrl={vapiQuery.data.recordingUrl}
                    transcript={vapiQuery.data.transcript ?? null}
                    durationSeconds={vapiQuery.data.duration ?? null}
                  />
                ) : vapiQuery.error ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      Unable to load call recording
                    </span>
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                    No recording available
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* Action Footer */}
      <div className="border-t border-teal-100/50 bg-gradient-to-r from-teal-50/30 to-white/50 p-4 dark:from-teal-950/30 dark:to-slate-900/50">
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
                    className="min-w-0 flex-1"
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
                    className="min-w-0 flex-1"
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
            ) : showConfirmForm ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Date Picker */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !confirmDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {confirmDate
                            ? format(confirmDate, "MMM d, yyyy")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={confirmDate}
                          onSelect={(date) => {
                            setConfirmDate(date);
                            setConfirmTime("");
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Time</Label>
                    <Select
                      value={confirmTime}
                      onValueChange={setConfirmTime}
                      disabled={!confirmDate}
                    >
                      <SelectTrigger className="w-full">
                        <Clock className="mr-2 h-4 w-4 text-slate-400" />
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="min-w-0 flex-1"
                    onClick={() => {
                      setShowConfirmForm(false);
                      setConfirmDate(() => {
                        if (!appointment.requestedDate) return undefined;
                        const date = new Date(
                          appointment.requestedDate + "T00:00:00",
                        );
                        return isValid(date) ? date : undefined;
                      });
                      setConfirmTime(
                        appointment.requestedStartTime
                          ? appointment.requestedStartTime.slice(0, 5)
                          : "",
                      );
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="min-w-0 flex-1 bg-teal-600 hover:bg-teal-700"
                    onClick={() => {
                      const dateStr = confirmDate
                        ? format(confirmDate, "yyyy-MM-dd")
                        : undefined;
                      void onConfirm(
                        appointment.id,
                        dateStr,
                        confirmTime || undefined,
                      );
                    }}
                    disabled={isSubmitting || !confirmDate || !confirmTime}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="min-w-0 flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="min-w-0 flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={() => setShowConfirmForm(true)}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
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
                    className="min-w-0 flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="min-w-0 flex-1 bg-red-600 text-white hover:bg-red-700"
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
