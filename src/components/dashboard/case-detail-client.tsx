"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Dog,
  Cat,
  FileText,
  User,
  Stethoscope,
  Clock,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  Play,
  Calendar,
  MessageSquare,
  Send,
  Heart,
  Thermometer,
  Scale,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "~/trpc/client";
import { toast } from "sonner";
import { DischargeStatusBadge } from "./discharge-status-badge";
import { SOAPNoteDisplay } from "./soap-note-display";
import { CallAudioPlayer } from "./call-audio-player";
import { SyncedTranscript } from "./synced-transcript";
import type { DischargeSettings, TranscriptMessage } from "~/types/dashboard";
import { cn, formatDuration } from "~/lib/utils";
import {
  isPlaceholder,
  getEffectiveContact,
} from "~/lib/utils/dashboard-helpers";
import { Badge } from "~/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

interface CaseDetailClientProps {
  caseId: string;
}

export function CaseDetailClient({ caseId }: CaseDetailClientProps) {
  const router = useRouter();
  const isProcessingRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);

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

    // Check for clinical notes requirement
    // Calculate has_clinical_notes from available data arrays
    const hasSoapNotes = (caseData.soap_notes?.length ?? 0) > 0;
    const hasTranscriptions = (caseData.transcriptions?.length ?? 0) > 0;
    const hasDischargeSummaries =
      (caseData.discharge_summaries?.length ?? 0) > 0;
    const hasClinicalNotes =
      hasSoapNotes || hasTranscriptions || hasDischargeSummaries;

    if (!hasClinicalNotes) {
      toast.error(
        "Clinical notes required: Add SOAP notes, transcription, or discharge summary before starting discharge call",
      );
      return;
    }

    const phone = getEffectiveContact(
      patient.owner_phone,
      settings.testContactPhone,
      settings.testModeEnabled ?? false,
    );

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
  const scheduledEmails = (caseData?.scheduled_discharge_emails ??
    []) as Array<{
    id: string;
    status: string;
    scheduled_for?: string | null;
    sent_at?: string | null;
    created_at: string;
  }>;
  const vitalSigns = (caseData?.vital_signs ?? []) as Array<{
    id: string;
    temperature?: number | null;
    temperature_unit?: string | null;
    pulse?: number | null;
    respiration?: number | null;
    weight?: number | null;
    weight_unit?: string | null;
    systolic?: number | null;
    diastolic?: number | null;
    notes?: string | null;
    measured_at?: string | null;
    source?: string | null;
    created_at: string;
  }>;

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

        <div className="flex items-start gap-6">
          <div className="bg-primary/5 text-primary border-primary/10 flex h-20 w-20 items-center justify-center rounded-xl border">
            {patient ? (
              <SpeciesIcon className="h-10 w-10" />
            ) : (
              <FileText className="h-10 w-10" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                {patient?.name && !isPlaceholder(patient.name)
                  ? patient.name
                  : "Unknown Patient"}
              </h1>
              {(patient?.species != null ||
                (patient?.breed != null && !isPlaceholder(patient.breed))) && (
                <p className="text-muted-foreground mt-1 text-lg">
                  {patient.species ?? ""}
                  {patient.breed != null && !isPlaceholder(patient.breed)
                    ? `${patient.species != null ? " • " : ""}${patient.breed}`
                    : ""}
                </p>
              )}
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

      {/* Main Content - Expandable Sections */}
      <div className="space-y-8">
        <Accordion
          type="multiple"
          defaultValue={["patient"]}
          className="w-full"
        >
          {/* Patient Information Section */}
          <AccordionItem value="patient" className="border-b border-slate-200">
            <AccordionTrigger className="py-6 text-left hover:no-underline">
              <div className="flex items-center gap-3">
                <User className="text-muted-foreground h-5 w-5" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Patient Information
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    Owner details and contact information
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              {patient ? (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                          Patient
                        </p>
                        <div className="space-y-2">
                          <p className="font-medium text-slate-900">
                            {patient.name}
                          </p>
                          {(patient.species != null ||
                            (patient.breed != null &&
                              !isPlaceholder(patient.breed))) && (
                            <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
                              {patient.species != null && (
                                <span>{patient.species}</span>
                              )}
                              {patient.breed != null &&
                                !isPlaceholder(patient.breed) && (
                                  <>
                                    {patient.species != null && <span>•</span>}
                                    <span>{patient.breed}</span>
                                  </>
                                )}
                            </div>
                          )}
                          {(patient.date_of_birth != null ||
                            patient.sex != null ||
                            patient.weight_kg != null) && (
                            <div className="text-muted-foreground mt-2 space-y-1 text-xs">
                              {patient.date_of_birth != null && (
                                <div>
                                  DOB:{" "}
                                  {format(
                                    new Date(patient.date_of_birth),
                                    "MMM d, yyyy",
                                  )}
                                </div>
                              )}
                              {patient.sex != null && (
                                <div>Sex: {patient.sex}</div>
                              )}
                              {patient.weight_kg != null && (
                                <div>
                                  Weight: {patient.weight_kg} kg
                                  {patient.weight_kg !== 0 &&
                                    ` (${(patient.weight_kg * 2.20462).toFixed(
                                      1,
                                    )} lbs)`}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {(patient.owner_name != null ||
                        (patient.owner_phone != null &&
                          !isPlaceholder(patient.owner_phone)) ||
                        (patient.owner_email != null &&
                          !isPlaceholder(patient.owner_email))) && (
                        <>
                          {patient.owner_name != null &&
                            !isPlaceholder(patient.owner_name) && (
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                                  Owner
                                </p>
                                <p className="font-medium text-slate-900">
                                  {patient.owner_name}
                                </p>
                              </div>
                            )}
                          <div>
                            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                              Contact
                            </p>
                            <div className="space-y-2 text-sm">
                              {patient.owner_phone != null &&
                                !isPlaceholder(patient.owner_phone) && (
                                  <div className="text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{patient.owner_phone}</span>
                                  </div>
                                )}
                              {patient.owner_email != null &&
                                !isPlaceholder(patient.owner_email) && (
                                  <div className="text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{patient.owner_email}</span>
                                  </div>
                                )}
                              {(!patient.owner_phone ||
                                isPlaceholder(patient.owner_phone)) &&
                                (!patient.owner_email ||
                                  isPlaceholder(patient.owner_email)) && (
                                  <p className="text-muted-foreground text-xs italic">
                                    No contact information available
                                  </p>
                                )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Appointment Metadata */}
                  {appointmentMetadata?.idexx && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        Appointment Details
                      </p>
                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        {appointmentMetadata.idexx.appointment_type && (
                          <div>
                            <span className="text-muted-foreground">
                              Type:{" "}
                            </span>
                            <span className="font-medium">
                              {appointmentMetadata.idexx.appointment_type}
                            </span>
                          </div>
                        )}
                        {appointmentMetadata.idexx.appointment_reason && (
                          <div>
                            <span className="text-muted-foreground">
                              Reason:{" "}
                            </span>
                            <span className="font-medium">
                              {appointmentMetadata.idexx.appointment_reason}
                            </span>
                          </div>
                        )}
                        {appointmentMetadata.idexx.provider_name && (
                          <div>
                            <span className="text-muted-foreground">
                              Provider:{" "}
                            </span>
                            <span className="font-medium">
                              {appointmentMetadata.idexx.provider_name}
                            </span>
                          </div>
                        )}
                        {appointmentMetadata.idexx.appointment_status && (
                          <div>
                            <span className="text-muted-foreground">
                              Status:{" "}
                            </span>
                            <span className="font-medium">
                              {appointmentMetadata.idexx.appointment_status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No patient information available
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Clinical Notes Section */}
          <AccordionItem value="clinical" className="border-b border-slate-200">
            <AccordionTrigger className="py-6 text-left hover:no-underline">
              <div className="flex items-center gap-3">
                <Stethoscope className="text-muted-foreground h-5 w-5" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Clinical Notes
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {soapNotes.length > 0 || transcriptions.length > 0
                      ? `${soapNotes.length} SOAP note${
                          soapNotes.length !== 1 ? "s" : ""
                        }, ${transcriptions.length} transcription${
                          transcriptions.length !== 1 ? "s" : ""
                        }`
                      : "No clinical notes"}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
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
                          className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
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
                {soapNotes.length === 0 && transcriptions.length === 0 && (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No clinical notes available
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Vital Signs Section */}
          {vitalSigns.length > 0 && (
            <AccordionItem value="vitals" className="border-b border-slate-200">
              <AccordionTrigger className="py-6 text-left hover:no-underline">
                <div className="flex items-center gap-3">
                  <Activity className="text-muted-foreground h-5 w-5" />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Vital Signs
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {vitalSigns.length} measurement
                      {vitalSigns.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                <div className="space-y-4">
                  {vitalSigns.map((vitals) => (
                    <div
                      key={vitals.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-6"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          {vitals.measured_at
                            ? format(
                                new Date(vitals.measured_at),
                                "MMM d, yyyy 'at' h:mm a",
                              )
                            : format(
                                new Date(vitals.created_at),
                                "MMM d, yyyy 'at' h:mm a",
                              )}
                        </span>
                        {vitals.source && (
                          <Badge variant="outline" className="text-xs">
                            {vitals.source}
                          </Badge>
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {vitals.temperature !== null &&
                          vitals.temperature !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-red-50 p-2 text-red-600">
                                <Thermometer className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs font-medium">
                                  Temperature
                                </p>
                                <p className="font-semibold">
                                  {vitals.temperature}
                                  {vitals.temperature_unit === "F"
                                    ? "°F"
                                    : vitals.temperature_unit === "C"
                                      ? "°C"
                                      : ""}
                                </p>
                              </div>
                            </div>
                          )}
                        {vitals.pulse !== null &&
                          vitals.pulse !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-pink-50 p-2 text-pink-600">
                                <Heart className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs font-medium">
                                  Pulse
                                </p>
                                <p className="font-semibold">
                                  {vitals.pulse} bpm
                                </p>
                              </div>
                            </div>
                          )}
                        {vitals.respiration !== null &&
                          vitals.respiration !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                                <Activity className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs font-medium">
                                  Respiration
                                </p>
                                <p className="font-semibold">
                                  {vitals.respiration} /min
                                </p>
                              </div>
                            </div>
                          )}
                        {vitals.weight !== null &&
                          vitals.weight !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-green-50 p-2 text-green-600">
                                <Scale className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs font-medium">
                                  Weight
                                </p>
                                <p className="font-semibold">
                                  {vitals.weight}{" "}
                                  {vitals.weight_unit === "kg"
                                    ? "kg"
                                    : vitals.weight_unit === "lb"
                                      ? "lbs"
                                      : (vitals.weight_unit ?? "")}
                                </p>
                              </div>
                            </div>
                          )}
                        {(vitals.systolic !== null &&
                          vitals.systolic !== undefined) ||
                        (vitals.diastolic !== null &&
                          vitals.diastolic !== undefined) ? (
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-purple-50 p-2 text-purple-600">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs font-medium">
                                Blood Pressure
                              </p>
                              <p className="font-semibold">
                                {vitals.systolic !== null &&
                                vitals.systolic !== undefined &&
                                vitals.diastolic !== null &&
                                vitals.diastolic !== undefined
                                  ? `${vitals.systolic}/${vitals.diastolic} mmHg`
                                  : vitals.systolic !== null &&
                                      vitals.systolic !== undefined
                                    ? `Systolic: ${vitals.systolic} mmHg`
                                    : vitals.diastolic !== null &&
                                        vitals.diastolic !== undefined
                                      ? `Diastolic: ${vitals.diastolic} mmHg`
                                      : ""}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      {vitals.notes && (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <p className="text-muted-foreground text-sm">
                            {vitals.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Discharge Summaries Section */}
          <AccordionItem
            value="discharge"
            className="border-b border-slate-200"
          >
            <AccordionTrigger className="py-6 text-left hover:no-underline">
              <div className="flex items-center gap-3">
                <FileText className="text-muted-foreground h-5 w-5" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Discharge Summaries
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {dischargeSummaries.length > 0
                      ? `${dischargeSummaries.length} summary${
                          dischargeSummaries.length !== 1 ? "ies" : "y"
                        }`
                      : "No discharge summaries"}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              {dischargeSummaries.length > 0 ? (
                <div className="space-y-4">
                  {dischargeSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-6"
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
              ) : (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No discharge summaries available
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Communications Section */}
          <AccordionItem
            value="communications"
            className="border-b border-slate-200"
          >
            <AccordionTrigger className="py-6 text-left hover:no-underline">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-muted-foreground h-5 w-5" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Communications
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {scheduledEmails.length > 0 || allCalls.length > 0
                      ? `${scheduledEmails.length} email${
                          scheduledEmails.length !== 1 ? "s" : ""
                        }, ${allCalls.length} call${allCalls.length !== 1 ? "s" : ""}`
                      : "No communications"}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                {scheduledEmails.length > 0 && (
                  <div>
                    <h3 className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
                      Scheduled Emails
                    </h3>
                    <div className="space-y-3">
                      {scheduledEmails.map((email) => (
                        <div
                          key={email.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <Send className="text-muted-foreground h-4 w-4" />
                            <div>
                              <p className="font-medium text-slate-900">
                                {email.status === "sent"
                                  ? "Sent"
                                  : email.status === "queued"
                                    ? "Queued"
                                    : email.status === "failed"
                                      ? "Failed"
                                      : "Cancelled"}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {email.sent_at
                                  ? `Sent ${format(new Date(email.sent_at), "MMM d, yyyy 'at' h:mm a")}`
                                  : email.scheduled_for
                                    ? `Scheduled for ${format(new Date(email.scheduled_for), "MMM d, yyyy 'at' h:mm a")}`
                                    : `Created ${format(new Date(email.created_at), "MMM d, yyyy 'at' h:mm a")}`}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              email.status === "sent"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : email.status === "failed"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-slate-200 bg-slate-50 text-slate-700",
                            )}
                          >
                            {email.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {allCalls.length > 0 && (
                  <div>
                    <h3 className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
                      Discharge Calls
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      {allCalls.length} call{allCalls.length !== 1 ? "s" : ""}{" "}
                      scheduled. See details below.
                    </p>
                  </div>
                )}
                {scheduledEmails.length === 0 && allCalls.length === 0 && (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No communications available
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
                      <div className="rounded-full bg-green-50 p-2 text-green-600">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">
                          Cost
                        </p>
                        <p className="font-semibold">
                          $
                          {typeof latestCall.cost === "number"
                            ? latestCall.cost.toFixed(4)
                            : "0.00"}
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

              {/* Success Evaluation */}
              {latestCall.success_evaluation && (
                <div
                  className={cn(
                    "rounded-lg border-l-4 bg-slate-50/50 p-6",
                    typeof latestCall.success_evaluation === "string" &&
                      latestCall.success_evaluation
                        .toLowerCase()
                        .includes("success")
                      ? "border-l-green-500"
                      : "border-l-amber-500",
                  )}
                >
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                    {typeof latestCall.success_evaluation === "string" &&
                    latestCall.success_evaluation
                      .toLowerCase()
                      .includes("success") ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    )}
                    Success Evaluation
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {latestCall.success_evaluation}
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

                  <div className="rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="border-b border-slate-200 bg-slate-100/50 px-6 py-3">
                      <h3 className="font-medium text-slate-900">
                        Live Transcript
                      </h3>
                    </div>
                    <div className="p-0">
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
                    </div>
                  </div>
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
    </div>
  );
}
