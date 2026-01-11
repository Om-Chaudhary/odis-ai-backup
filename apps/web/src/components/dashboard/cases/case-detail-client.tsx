"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@odis-ai/shared/ui/button";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Dog,
  Cat,
  FileText,
  User,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  Play,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { AudioPlayer as CallAudioPlayer } from "@odis-ai/shared/ui";
import { DischargeStatusBadge } from "../discharges/discharge-status-badge";
import { SOAPNoteDisplay } from "../shared/soap-note-display";
import { SyncedTranscript } from "../calls/synced-transcript";
import type {
  DischargeSettings,
  TranscriptMessage,
} from "@odis-ai/shared/types";
import { cn, formatDuration } from "@odis-ai/shared/util";
import {
  isPlaceholder,
  getEffectiveContact,
} from "@odis-ai/shared/util/dashboard-helpers";
import { checkCaseDischargeReadiness } from "@odis-ai/shared/util/discharge-readiness";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@odis-ai/shared/ui/accordion";

interface CaseDetailClientProps {
  caseId: string;
}

export function CaseDetailClient({ caseId }: CaseDetailClientProps) {
  const router = useRouter();
  const isProcessingRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const showRawTranscript = true; // Default to showing original VAPI transcript

  // Fetch case detail
  const {
    data: caseData,
    isLoading,
    error,
    refetch,
  } = api.cases.getCaseDetail.useQuery(
    { id: caseId },
    { enabled: !!caseId, refetchInterval: 5000 }, // Poll for status updates
  );

  // Fetch discharge settings
  const { data: settingsData } = api.cases.getDischargeSettings.useQuery();

  const triggerDischargeMutation = api.cases.triggerDischarge.useMutation({
    onSuccess: (result) => {
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning) => toast.warning(warning));
      }
      toast.success("Call initiated successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate call");
    },
    onSettled: () => {
      isProcessingRef.current = false;
    },
  });

  const settings: DischargeSettings = settingsData ?? {
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    emergencyPhone: "",
    vetName: "",
    testModeEnabled: false,
    testContactName: "",
    testContactEmail: "",
    testContactPhone: "",
    voicemailDetectionEnabled: false,
  };

  // Extract patient data
  // Note: Only 'name' is required (NOT NULL) in schema. All other fields are nullable.
  const patient = caseData?.patients?.[0] as
    | {
        id: string;
        name: string; // Required in schema
        species?: string | null; // Nullable in schema
        breed?: string | null; // Nullable in schema
        owner_name?: string | null; // Nullable in schema
        owner_email?: string | null; // Nullable in schema
        owner_phone?: string | null; // Nullable in schema
        date_of_birth?: string | null; // Nullable in schema
        sex?: string | null; // Nullable in schema
        weight_kg?: number | null; // Nullable in schema
      }
    | undefined;

  const handleTriggerCall = async () => {
    if (!caseData || !patient || isProcessingRef.current) return;

    // Check discharge readiness (content + contact validation)
    // Note: caseData from getCaseDetail includes metadata, so readiness check will work for both workflows
    const readiness = checkCaseDischargeReadiness(caseData, null);

    if (!readiness.isReady) {
      toast.error(
        `Cannot start discharge call. Missing: ${readiness.missingRequirements.join(", ")}`,
      );
      return;
    }

    const phone = getEffectiveContact(
      patient.owner_phone,
      settings.testContactPhone,
      settings.testModeEnabled ?? false,
    );

    // Additional check for phone specifically (since readiness checks for phone OR email)
    if (!phone || isPlaceholder(phone)) {
      toast.error(
        settings.testModeEnabled
          ? "Test phone number is required"
          : "Phone number is required",
      );
      return;
    }

    isProcessingRef.current = true;
    toast.info("Initiating discharge call...");
    triggerDischargeMutation.mutate({
      caseId: caseData.id,
      patientId: patient.id,
      patientData: {
        ownerName: patient.owner_name ?? undefined,
        ownerEmail: patient.owner_email ?? undefined,
        ownerPhone: phone,
      },
      dischargeType: "call",
    });
  };

  // Extract and sort data
  const latestCall = caseData?.scheduled_discharge_calls?.[0];
  const allCalls = (caseData?.scheduled_discharge_calls ?? []) as Array<{
    id: string;
    status: string;
    scheduled_for?: string | null;
    ended_at?: string | null;
    ended_reason?: string | null;
    started_at?: string | null;
    vapi_call_id?: string | null;
    transcript?: string | null;
    transcript_messages?: unknown;
    call_analysis?: unknown;
    summary?: string | null;
    success_evaluation?: string | null;
    structured_data?: unknown;
    user_sentiment?: string | null;
    recording_url?: string | null;
    stereo_recording_url?: string | null;
    duration_seconds?: number | null;
    cost?: number | null;
    created_at: string;
  }>;
  const soapNotes = (caseData?.soap_notes ?? []) as Array<{
    id: string;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    created_at: string;
  }>;
  const transcriptions = (caseData?.transcriptions ?? []) as Array<{
    id: string;
    transcript?: string | null;
    created_at: string;
  }>;
  const dischargeSummaries = (caseData?.discharge_summaries ?? []) as Array<{
    id: string;
    content?: string | null;
    created_at: string;
  }>;
  // const scheduledEmails = (caseData?.scheduled_discharge_emails ??
  //   []) as Array<{
  //   id: string;
  //   status: string;
  //   scheduled_for?: string | null;
  //   sent_at?: string | null;
  //   created_at: string;
  // }>;
  // const vitalSigns = (caseData?.vital_signs ?? []) as Array<{
  //   id: string;
  //   temperature?: number | null;
  //   temperature_unit?: string | null;
  //   pulse?: number | null;
  //   respiration?: number | null;
  //   weight?: number | null;
  //   weight_unit?: string | null;
  //   systolic?: number | null;
  //   diastolic?: number | null;
  //   notes?: string | null;
  //   measured_at?: string | null;
  //   source?: string | null;
  //   created_at: string;
  // }>;

  // Extract appointment metadata if available (from IDEXX, etc.)
  // Note: metadata is nullable jsonb field, and idexx structure only exists when source = 'idexx_neo'
  // We need to safely check if metadata exists and has the idexx property
  const appointmentMetadata =
    caseData?.metadata &&
    typeof caseData.metadata === "object" &&
    !Array.isArray(caseData.metadata) &&
    "idexx" in caseData.metadata
      ? (caseData.metadata as {
          idexx?: {
            appointment_type?: string;
            appointment_reason?: string;
            appointment_status?: string;
            provider_name?: string;
            appointment_duration?: number;
            notes?: string;
          };
          [key: string]: unknown;
        })
      : null;

  const SpeciesIcon = patient?.species?.toLowerCase() === "feline" ? Cat : Dog;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading case...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="py-16 text-center">
          <h2 className="text-2xl font-bold">Case not found</h2>
          <p className="text-muted-foreground mt-2">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Patient Profile Card as Header */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="bg-primary/5 text-primary border-primary/10 flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border">
              {patient ? (
                <SpeciesIcon className="h-10 w-10" />
              ) : (
                <FileText className="h-10 w-10" />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">
                  {patient?.name && !isPlaceholder(patient.name)
                    ? patient.name
                    : "Unknown Patient"}
                </h1>
                {(patient?.species != null ||
                  (patient?.breed != null &&
                    !isPlaceholder(patient.breed))) && (
                  <p className="text-muted-foreground text-xl">
                    {patient.species ?? ""}
                    {patient.breed != null && !isPlaceholder(patient.breed)
                      ? `${patient.species != null ? " • " : ""}${patient.breed}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Owner Information */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Owner
                    </span>
                  </div>
                  <p className="font-medium text-slate-900">
                    {patient?.owner_name && !isPlaceholder(patient.owner_name)
                      ? patient.owner_name
                      : "Unknown Owner"}
                  </p>
                </div>

                {/* Contact Information */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Contact
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-900">
                      {patient?.owner_phone &&
                      !isPlaceholder(patient.owner_phone)
                        ? patient.owner_phone
                        : "No phone"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {patient?.owner_email &&
                      !isPlaceholder(patient.owner_email)
                        ? patient.owner_email
                        : "No email"}
                    </p>
                  </div>
                </div>

                {/* Appointment Information */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Appointment
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-900">
                      {appointmentMetadata?.idexx?.appointment_type ??
                        "General"}
                    </p>
                    {appointmentMetadata?.idexx?.appointment_reason && (
                      <p className="text-sm text-slate-600">
                        {appointmentMetadata.idexx.appointment_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Case Information */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Case
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-900">
                      {format(new Date(caseData.created_at), "MMM d, yyyy")}
                    </p>
                    <p className="font-mono text-sm text-slate-600">
                      {caseData.id}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {caseData.status && (
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-700 capitalize"
                  >
                    {caseData.status}
                  </Badge>
                )}
                {caseData.type && typeof caseData.type === "string" && (
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-700 capitalize"
                  >
                    {caseData.type.replace("_", " ")}
                  </Badge>
                )}
                {caseData.visibility && (
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-700 capitalize"
                  >
                    {caseData.visibility}
                  </Badge>
                )}
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Created {format(new Date(caseData.created_at), "MMM d, yyyy")}
                </span>
                {caseData.scheduled_at && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Scheduled{" "}
                      {format(new Date(caseData.scheduled_at), "MMM d, yyyy")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discharge Calls Section - At Bottom */}
      {allCalls.length > 0 && (
        <div className="space-y-6 border-t border-slate-200 pt-12">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Discharge Calls
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Call recordings, transcripts, and analysis
            </p>
          </div>

          {latestCall && (
            <div className="space-y-6">
              {/* Latest Call Status */}
              <div
                className={cn(
                  "rounded-lg border-l-4 bg-slate-50/50 p-6",
                  latestCall.status === "completed"
                    ? "border-l-green-500"
                    : latestCall.status === "failed"
                      ? "border-l-red-500"
                      : latestCall.status === "in_progress"
                        ? "border-l-blue-500"
                        : "border-l-slate-300",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {latestCall.status === "completed"
                          ? "Call Completed"
                          : latestCall.status === "failed"
                            ? "Call Failed"
                            : latestCall.status === "in_progress"
                              ? "Call in Progress"
                              : latestCall.status === "ringing"
                                ? "Ringing..."
                                : "Call Queued"}
                      </h3>
                      <DischargeStatusBadge
                        status={latestCall.status}
                        type="call"
                      />
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                      {latestCall.started_at && (
                        <span>
                          Started{" "}
                          {format(new Date(latestCall.started_at), "h:mm a")}
                        </span>
                      )}
                      {latestCall.ended_at && (
                        <>
                          <span>•</span>
                          <span>
                            Ended{" "}
                            {format(new Date(latestCall.ended_at), "h:mm a")}
                          </span>
                        </>
                      )}
                      {latestCall.ended_reason && (
                        <>
                          <span>•</span>
                          <span>Reason: {latestCall.ended_reason}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {latestCall.status === "in_progress" && (
                    <div className="flex h-3 w-3">
                      <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                {latestCall.status === "completed" && (
                  <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">
                          Duration
                        </p>
                        <p className="font-semibold">
                          {formatDuration(latestCall.duration_seconds ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2",
                          latestCall.success_evaluation &&
                            typeof latestCall.success_evaluation === "string" &&
                            latestCall.success_evaluation
                              .toLowerCase()
                              .includes("success")
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600",
                        )}
                      >
                        {latestCall.success_evaluation &&
                        typeof latestCall.success_evaluation === "string" &&
                        latestCall.success_evaluation
                          .toLowerCase()
                          .includes("success") ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">
                          Success Evaluation
                        </p>
                        <p className="max-w-[120px] truncate text-xs font-semibold">
                          {latestCall.success_evaluation
                            ? typeof latestCall.success_evaluation ===
                                "string" &&
                              latestCall.success_evaluation
                                .toLowerCase()
                                .includes("success")
                              ? "Successful"
                              : "Needs Review"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2",
                          latestCall.user_sentiment === "positive"
                            ? "bg-green-50 text-green-600"
                            : latestCall.user_sentiment === "negative"
                              ? "bg-red-50 text-red-600"
                              : "bg-slate-50 text-slate-600",
                        )}
                      >
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">
                          Sentiment
                        </p>
                        <p className="font-semibold capitalize">
                          {latestCall.user_sentiment ?? "Neutral"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Summary */}
              {latestCall.summary && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-6">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                    <FileText className="h-5 w-5" />
                    Call Summary
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {latestCall.summary}
                  </p>
                </div>
              )}

              {/* Audio Player & Transcript */}
              {latestCall.recording_url && (
                <div className="space-y-6">
                  <CallAudioPlayer
                    url={
                      latestCall.stereo_recording_url ??
                      latestCall.recording_url
                    }
                    duration={latestCall.duration_seconds ?? undefined}
                    onTimeUpdate={setCurrentTime}
                  />

                  <Accordion
                    type="single"
                    collapsible
                    className="rounded-lg border border-slate-200 bg-slate-50/50"
                  >
                    <AccordionItem value="transcript" className="border-none">
                      <AccordionTrigger className="rounded-t-lg border-b border-slate-200 bg-slate-100/50 px-6 py-3 hover:bg-slate-100 [&[data-state=open]]:border-b">
                        <div className="flex w-full items-center justify-between pr-2">
                          <h3 className="font-medium text-slate-900">
                            Call Transcript
                          </h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        {/* Synced transcript for timed messages */}
                        {(latestCall.transcript_messages as TranscriptMessage[])
                          ?.length > 0 ? (
                          <SyncedTranscript
                            messages={
                              (latestCall.transcript_messages as TranscriptMessage[]) ??
                              []
                            }
                            currentTime={currentTime}
                            onMessageClick={(_time) => {
                              // This will be handled by passing a seek function to the audio player ideally,
                              // For now, just visual sync
                            }}
                            className="h-[500px] p-4"
                          />
                        ) : (
                          /* Plain text transcript fallback */
                          <div className="max-h-[500px] overflow-auto p-4">
                            <pre className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                              {showRawTranscript
                                ? latestCall.transcript
                                : (latestCall.cleaned_transcript ??
                                  latestCall.transcript ??
                                  "No transcript available")}
                            </pre>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {/* Trigger Call Button */}
              {(!latestCall ||
                latestCall.status === "completed" ||
                latestCall.status === "failed" ||
                latestCall.status === "cancelled") && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleTriggerCall}
                    disabled={
                      triggerDischargeMutation.isPending ||
                      isProcessingRef.current
                    }
                  >
                    {triggerDischargeMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Phone className="mr-2 h-4 w-4" />
                    )}
                    Start New Discharge Call
                  </Button>
                </div>
              )}
            </div>
          )}

          {allCalls.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-12 text-center">
              <Phone className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 font-semibold text-slate-900">
                No Calls Yet
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Start a discharge call to see live transcripts, audio recording,
                and AI analysis here.
              </p>
              <Button onClick={handleTriggerCall}>
                <Play className="mr-2 h-4 w-4" />
                Start First Call
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Content Sections */}
      <div className="space-y-12 border-t border-slate-200 pt-12">
        {/* Discharge Summaries Section - Collapsible */}
        {dischargeSummaries.length > 0 && (
          <div className="space-y-6">
            <Accordion
              type="single"
              collapsible
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
              defaultValue=""
            >
              <AccordionItem value="summaries" className="border-none">
                <AccordionTrigger className="rounded-t-lg border-b border-slate-200 bg-slate-50/50 px-6 py-4 hover:bg-slate-100 [&[data-state=open]]:border-b">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <div className="text-left">
                      <h2 className="text-xl font-semibold text-slate-900">
                        Discharge Summaries
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {dischargeSummaries.length} summary
                        {dischargeSummaries.length !== 1 ? "ies" : ""}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="space-y-4 p-6">
                    {dischargeSummaries.map((summary) => (
                      <div
                        key={summary.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            {format(
                              new Date(summary.created_at),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </span>
                        </div>
                        {summary.content && (
                          <div className="prose prose-sm max-w-none">
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {summary.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* Clinical Notes Section */}
        {(soapNotes.length > 0 || transcriptions.length > 0) && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Clinical Notes
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {soapNotes.length > 0 || transcriptions.length > 0
                  ? `${soapNotes.length} SOAP note${
                      soapNotes.length !== 1 ? "s" : ""
                    }, ${transcriptions.length} transcription${
                      transcriptions.length !== 1 ? "s" : ""
                    }`
                  : "No clinical notes"}
              </p>
            </div>
            <div className="space-y-8">
              {soapNotes.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
                    SOAP Notes
                  </h3>
                  <SOAPNoteDisplay notes={soapNotes} />
                </div>
              )}
              {transcriptions.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
                    Transcriptions
                  </h3>
                  <div className="space-y-4">
                    {transcriptions.map((transcription) => (
                      <div
                        key={transcription.id}
                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="text-muted-foreground h-4 w-4" />
                            <span className="text-muted-foreground text-xs">
                              {format(
                                new Date(transcription.created_at),
                                "MMM d, yyyy 'at' h:mm a",
                              )}
                            </span>
                          </div>
                        </div>
                        {transcription.transcript && (
                          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                            {transcription.transcript}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
