"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  Play,
  Pencil,
  PawPrint,
  User,
  RotateCcw,
  ExternalLink,
  Loader2,
  FileText,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  Wand2,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { api } from "~/trpc/client";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Checkbox } from "@odis-ai/ui/checkbox";
import { Zap, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import { Badge } from "@odis-ai/ui/badge";
import { Separator } from "@odis-ai/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/ui/collapsible";
import type {
  PreviewTab,
  DeliveryToggles,
  DischargeCaseStatus,
  SoapNote,
} from "./types";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";
import { CallRecordingPlayer } from "./call-recording-player";
import {
  Pill,
  Activity,
  Utensils,
  Eye,
  CalendarCheck,
  Syringe,
  Heart,
} from "lucide-react";

// Scheduled call data with structured output support
interface ScheduledCallData {
  id: string;
  status: string;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  endedReason: string | null;
  transcript: string | null;
  summary: string | null;
  customerPhone: string | null;
  structuredData?: { urgent_case?: boolean; [key: string]: unknown } | null;
  urgentReasonSummary?: string | null;
  recordingUrl?: string | null;
  stereoRecordingUrl?: string | null;
}

// Case data interface for the detail panel
interface CaseData {
  id: string;
  caseId: string;
  patient: {
    id: string;
    name: string;
    species: string | null;
    breed: string | null;
    dateOfBirth: string | null;
    sex: string | null;
    weightKg: number | null;
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
  dischargeSummary: string;
  structuredContent: StructuredDischargeSummary | null;
  callScript: unknown;
  emailContent: string;
  scheduledCall: ScheduledCallData | null;
  scheduledEmail: unknown;
  idexxNotes: string | null;
  soapNotes: SoapNote[];
  scheduledEmailFor: string | null;
  scheduledCallFor: string | null;
  isUrgentCase?: boolean;
}

interface OutboundCaseDetailProps {
  caseData: CaseData | null;
  deliveryToggles: DeliveryToggles;
  onToggleChange: (toggles: DeliveryToggles) => void;
  onApprove: () => void;
  onSkip: () => void;
  onRetry?: () => void;
  isSubmitting: boolean;
  /** When true, shows immediate delivery option */
  testModeEnabled?: boolean;
}

/**
 * Case Detail Panel Component
 *
 * Redesigned for veterinarians/clinicians with emphasis on:
 * 1. Patient & owner contact info (header)
 * 2. Clinical notes (IDEXX or SOAP) - most prominent
 * 3. AI-generated discharge summary
 * 4. Communication preview (call script / email)
 * 5. Delivery options & actions
 */
export function OutboundCaseDetail({
  caseData,
  deliveryToggles,
  onToggleChange,
  onApprove,
  onSkip,
  onRetry,
  isSubmitting,
  testModeEnabled = false,
}: OutboundCaseDetailProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("call_script");
  const [communicationExpanded, setCommunicationExpanded] = useState(false);
  const [dischargeSummaryExpanded, setDischargeSummaryExpanded] =
    useState(false);

  if (!caseData) {
    return <EmptyDetailState />;
  }

  const isEditable =
    caseData.status === "pending_review" || caseData.status === "ready";
  const showRetry = caseData.status === "failed";
  const showOutcome =
    caseData.status === "completed" || caseData.status === "failed";
  const showScheduleInfo = caseData.status === "scheduled";

  // Check if case has been sent (completed or failed)
  const isSentCase =
    caseData.status === "completed" || caseData.status === "failed";

  // Check if discharge summary needs to be generated
  const hasStructuredContent = Boolean(caseData.structuredContent?.patientName);
  const hasDischargeSummary =
    hasStructuredContent || Boolean(caseData.dischargeSummary?.trim());
  const needsGeneration = !hasDischargeSummary && isEditable;

  // Get call script from dynamic variables
  const callScript =
    typeof caseData.callScript === "object" && caseData.callScript !== null
      ? (((caseData.callScript as Record<string, unknown>)
          .call_script as string) ?? "")
      : caseData.dischargeSummary;

  // Determine which clinical notes to show
  const hasIdexxNotes = Boolean(caseData.idexxNotes?.trim());
  const hasSoapNotes = caseData.soapNotes && caseData.soapNotes.length > 0;
  const hasClinicalData = hasIdexxNotes || hasSoapNotes;

  return (
    <div className="flex h-full flex-col">
      {/* Patient Header */}
      <PatientHeader caseData={caseData} />

      <Separator />

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {isSentCase ? (
          /* Layout for SENT cases (completed/failed) */
          <>
            {/* Delivery Complete Card */}
            <DeliveryCompleteCard
              status={caseData.status as "completed" | "failed"}
              scheduledCall={caseData.scheduledCall}
              caseData={caseData}
            />

            {/* Urgent Reason Section - Show prominently for urgent cases */}
            {caseData.isUrgentCase && caseData.scheduledCall?.id && (
              <UrgentReasonSection callId={caseData.scheduledCall.id} />
            )}

            {/* Clinical Notes Section */}
            {(hasIdexxNotes || hasSoapNotes) && (
              <ClinicalNotesSection
                idexxNotes={caseData.idexxNotes}
                soapNotes={caseData.soapNotes}
                hasIdexxNotes={hasIdexxNotes}
              />
            )}

            {/* Communication Summary (intelligent display based on what was sent/available) */}
            <CommunicationSummarySection
              caseData={caseData}
              callScript={callScript}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </>
        ) : (
          /* Layout for UNSENT cases (pending_review, ready, scheduled) */
          <>
            {/* Urgent Reason Section - Show prominently for urgent cases */}
            {caseData.isUrgentCase && caseData.scheduledCall?.id && (
              <UrgentReasonSection callId={caseData.scheduledCall.id} />
            )}

            {/* Clinical Notes Section - Most Prominent */}
            {(hasIdexxNotes || hasSoapNotes) && (
              <ClinicalNotesSection
                idexxNotes={caseData.idexxNotes}
                soapNotes={caseData.soapNotes}
                hasIdexxNotes={hasIdexxNotes}
              />
            )}

            {/* Schedule Info for Scheduled Cases */}
            {showScheduleInfo && (
              <ScheduleInfoCard
                emailScheduledFor={caseData.scheduledEmailFor}
                callScheduledFor={caseData.scheduledCallFor}
              />
            )}

            {/* Communication Summary */}
            <CommunicationSummarySection
              caseData={caseData}
              callScript={callScript}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Delivery Options for unsent cases */}
            {isEditable && (
              <DeliveryToggleSection
                toggles={deliveryToggles}
                onChange={onToggleChange}
                hasPhone={!!caseData.owner.phone}
                hasEmail={!!caseData.owner.email}
                phone={caseData.owner.phone}
                email={caseData.owner.email}
                testModeEnabled={testModeEnabled}
              />
            )}
          </>
        )}
      </div>

      {/* Sticky Action Bar */}
      {(isEditable || showRetry) && (
        <div className="bg-muted/10 border-t p-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              className={`flex-1 ${needsGeneration ? "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600" : "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"}`}
              onClick={showRetry ? onRetry : onApprove}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {needsGeneration ? "Generating..." : "Scheduling..."}
                </>
              ) : showRetry ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retry
                </>
              ) : needsGeneration ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate & Send
                </>
              ) : (
                "Approve & Send"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Patient header with contact info and case link
 */
function PatientHeader({ caseData }: { caseData: CaseData }) {
  const age = caseData.patient.dateOfBirth
    ? calculateAge(caseData.patient.dateOfBirth)
    : null;

  // Check if case has been sent to hide the case type badge
  const isSentCase =
    caseData.status === "completed" || caseData.status === "failed";

  return (
    <div className="bg-muted/20 space-y-3 p-4 pt-10">
      {/* Patient Name & Case Link */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold">
            {caseData.patient.name}
          </h2>
          <p className="text-muted-foreground text-sm">
            {[caseData.patient.species, caseData.patient.breed, age]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Only show case type badge for unsent cases */}
          {!isSentCase && caseData.caseType && (
            <Badge variant="outline" className="whitespace-nowrap">
              <PawPrint className="mr-1 h-3 w-3" />
              {formatCaseType(caseData.caseType)}
            </Badge>
          )}
          <Link href={`/dashboard/cases/${caseData.caseId}`}>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              View Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Owner Contact Info - Clickable */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {caseData.owner.name && (
          <div className="flex items-center gap-1.5">
            <User className="text-muted-foreground h-4 w-4" />
            <span className="font-medium">{caseData.owner.name}</span>
          </div>
        )}
        {caseData.owner.phone && (
          <a
            href={`tel:${caseData.owner.phone}`}
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 hover:underline dark:text-teal-400"
          >
            <Phone className="h-4 w-4" />
            <span>{formatPhoneNumber(caseData.owner.phone)}</span>
          </a>
        )}
        {caseData.owner.email && (
          <a
            href={`mailto:${caseData.owner.email}`}
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 hover:underline dark:text-teal-400"
          >
            <Mail className="h-4 w-4" />
            <span className="max-w-[200px] truncate">
              {caseData.owner.email}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Clinical Notes Section - Shows IDEXX or SOAP notes
 */
function ClinicalNotesSection({
  soapNotes,
}: {
  idexxNotes: string | null;
  soapNotes: SoapNote[];
  hasIdexxNotes: boolean;
}) {
  // Show SOAP notes
  if (soapNotes && soapNotes.length > 0) {
    const latestNote = soapNotes[0]!;
    return (
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            SOAP Notes
            <Badge variant="secondary" className="text-xs">
              Clinical
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-background max-h-64 space-y-3 overflow-auto rounded-md p-3">
            {latestNote.subjective && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Subjective
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.subjective}
                </p>
              </div>
            )}
            {latestNote.objective && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Objective
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.objective}
                </p>
              </div>
            )}
            {latestNote.assessment && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Assessment
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.assessment}
                </p>
              </div>
            )}
            {latestNote.plan && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Plan
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.plan}
                </p>
              </div>
            )}
            {latestNote.clientInstructions && (
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase dark:text-blue-400">
                  Client Instructions
                </p>
                <p className="text-muted-foreground text-sm">
                  {latestNote.clientInstructions}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

/**
 * Preview content for call script or email
 */
function PreviewContent({
  content,
  structuredContent,
  onPlay,
  onEdit,
  isEditable,
  type,
}: {
  content: string;
  structuredContent?: StructuredDischargeSummary | null;
  onPlay?: () => void;
  onEdit: () => void;
  isEditable: boolean;
  type: "call" | "email";
}) {
  const hasStructured = Boolean(structuredContent?.patientName);

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {type === "call" && onPlay && (
          <Button variant="outline" size="sm" onClick={onPlay}>
            <Play className="mr-1.5 h-3 w-3" />
            Preview
          </Button>
        )}
        {isEditable && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3 w-3" />
            Edit
          </Button>
        )}
      </div>

      {hasStructured && structuredContent ? (
        type === "call" ? (
          <CallScriptStructuredPreview content={structuredContent} />
        ) : (
          <EmailStructuredPreview content={structuredContent} />
        )
      ) : (
        <div className="bg-muted/50 max-h-48 overflow-auto rounded-md p-3">
          <p className="text-sm whitespace-pre-wrap">
            {content || "No content available."}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Call Script Structured Preview
 * Shows what the AI voice agent will say in a conversational format
 */
function CallScriptStructuredPreview({
  content,
}: {
  content: StructuredDischargeSummary;
}) {
  const hasMedications = content.medications && content.medications.length > 0;
  const hasHomeCare =
    content.homeCare &&
    [
      content.homeCare.activity,
      content.homeCare.diet,
      content.homeCare.woundCare,
    ].some(Boolean);
  const hasFollowUp = content.followUp?.required;
  const hasWarningSigns =
    content.warningSigns && content.warningSigns.length > 0;

  return (
    <div className="max-h-64 space-y-3 overflow-auto rounded-lg border bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-4 dark:from-teal-950/30 dark:to-emerald-950/20">
      {/* Opening - Greeting */}
      <div className="flex gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
          1
        </div>
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            Greeting
          </p>
          <p className="text-muted-foreground text-sm">
            &ldquo;Hi, this is ODIS calling from the veterinary clinic about{" "}
            <span className="font-medium text-teal-700 dark:text-teal-400">
              {content.patientName}
            </span>
            &apos;s visit today...&rdquo;
          </p>
        </div>
      </div>

      {/* Visit Summary */}
      {content.appointmentSummary && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
            2
          </div>
          <div>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              Visit Summary
            </p>
            <p className="text-muted-foreground text-sm">
              {content.appointmentSummary}
            </p>
          </div>
        </div>
      )}

      {/* Medications */}
      {hasMedications && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            <Pill className="h-3 w-3" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Medications to Give
            </p>
            <ul className="mt-1 space-y-1">
              {content.medications?.map((med, idx) => (
                <li key={idx} className="text-muted-foreground text-sm">
                  • <span className="font-medium">{med.name}</span>
                  {med.frequency && ` - ${med.frequency}`}
                  {med.duration && ` for ${med.duration}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Home Care */}
      {hasHomeCare && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            <Heart className="h-3 w-3" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Home Care Tips
            </p>
            <div className="text-muted-foreground mt-1 space-y-0.5 text-sm">
              {content.homeCare?.activity && (
                <p>• Activity: {content.homeCare.activity}</p>
              )}
              {content.homeCare?.diet && <p>• Diet: {content.homeCare.diet}</p>}
              {content.homeCare?.woundCare && (
                <p>• Wound care: {content.homeCare.woundCare}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up */}
      {hasFollowUp && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
            <CalendarCheck className="h-3 w-3" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
              Follow-up Reminder
            </p>
            <p className="text-muted-foreground text-sm">
              &ldquo;Please schedule a follow-up
              {content.followUp?.date && ` ${content.followUp.date}`}
              {content.followUp?.reason && ` for ${content.followUp.reason}`}
              ...&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Warning Signs */}
      {hasWarningSigns && (
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            <AlertTriangle className="h-3 w-3" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              When to Call Back
            </p>
            <p className="text-muted-foreground text-sm">
              &ldquo;Please call us right away if you notice:{" "}
              {content.warningSigns?.join(", ")}...&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Closing */}
      <div className="flex gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-400 text-xs font-bold text-white">
          ✓
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Closing
          </p>
          <p className="text-muted-foreground text-sm">
            &ldquo;Do you have any questions about {content.patientName}&apos;s
            care?&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Email Structured Preview
 * Shows what the email will look like with sections
 */
function EmailStructuredPreview({
  content,
}: {
  content: StructuredDischargeSummary;
}) {
  const hasTreatments =
    content.treatmentsToday && content.treatmentsToday.length > 0;
  const hasVaccinations =
    content.vaccinationsGiven && content.vaccinationsGiven.length > 0;
  const hasMedications = content.medications && content.medications.length > 0;
  const hasHomeCare =
    content.homeCare &&
    [
      content.homeCare.activity,
      content.homeCare.diet,
      content.homeCare.woundCare,
      content.homeCare.monitoring && content.homeCare.monitoring.length > 0,
    ].some(Boolean);
  const hasFollowUp = content.followUp?.required;
  const hasWarningSigns =
    content.warningSigns && content.warningSigns.length > 0;

  return (
    <div className="max-h-64 overflow-auto rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-900">
      {/* Email Header */}
      <div className="mb-4 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
            <PawPrint className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Discharge Summary for {content.patientName}
            </p>
            <p className="text-muted-foreground text-xs">
              Thank you for visiting our clinic!
            </p>
          </div>
        </div>
      </div>

      {/* Appointment Summary */}
      {content.appointmentSummary && (
        <div className="mb-3">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {content.appointmentSummary}
          </p>
        </div>
      )}

      {/* Treatment Summary */}
      {[hasTreatments, hasVaccinations].some(Boolean) && (
        <div className="mb-3 rounded-md bg-slate-50 p-3 dark:bg-slate-800/50">
          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">
            Today&apos;s Care
          </p>
          {hasTreatments && (
            <ul className="text-muted-foreground space-y-0.5 text-sm">
              {content.treatmentsToday?.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          )}
          {hasVaccinations && (
            <div className="mt-2 flex flex-wrap gap-1">
              {content.vaccinationsGiven?.map((v, i) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                >
                  💉 {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Medications Section */}
      {hasMedications && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-950/30">
          <p className="mb-2 text-xs font-semibold text-amber-700 uppercase dark:text-amber-400">
            💊 Medications
          </p>
          <div className="space-y-2">
            {content.medications?.map((med, idx) => (
              <div
                key={idx}
                className="rounded bg-white/70 p-2 text-sm dark:bg-slate-900/50"
              >
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  {med.name}
                </span>
                {[med.dosage, med.frequency].some(Boolean) && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {med.dosage}
                    {med.dosage && med.frequency && ", "}
                    {med.frequency}
                  </span>
                )}
                {med.duration && (
                  <span className="text-muted-foreground">
                    {" "}
                    for {med.duration}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Home Care */}
      {hasHomeCare && (
        <div className="mb-3 rounded-md bg-blue-50 p-3 dark:bg-blue-950/30">
          <p className="mb-2 text-xs font-semibold text-blue-700 uppercase dark:text-blue-400">
            🏠 Home Care
          </p>
          <div className="text-muted-foreground space-y-1 text-sm">
            {content.homeCare?.activity && (
              <p>
                <strong>Activity:</strong> {content.homeCare.activity}
              </p>
            )}
            {content.homeCare?.diet && (
              <p>
                <strong>Diet:</strong> {content.homeCare.diet}
              </p>
            )}
            {content.homeCare?.woundCare && (
              <p>
                <strong>Wound Care:</strong> {content.homeCare.woundCare}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Follow-up */}
      {hasFollowUp && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-violet-50 p-3 dark:bg-violet-950/30">
          <CalendarCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <p className="text-sm text-violet-700 dark:text-violet-300">
            <strong>Follow-up:</strong>{" "}
            {content.followUp?.date ?? "Schedule as needed"}
            {content.followUp?.reason && ` — ${content.followUp.reason}`}
          </p>
        </div>
      )}

      {/* Warning Signs */}
      {hasWarningSigns && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800/50 dark:bg-red-950/30">
          <p className="mb-1 text-xs font-semibold text-red-700 uppercase dark:text-red-400">
            ⚠️ Call us if you notice:
          </p>
          <ul className="text-sm text-red-700 dark:text-red-400">
            {content.warningSigns?.map((sign, idx) => (
              <li key={idx}>• {sign}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Schedule info card for scheduled cases
 */
function ScheduleInfoCard({
  emailScheduledFor,
  callScheduledFor,
}: {
  emailScheduledFor: string | null;
  callScheduledFor: string | null;
}) {
  const formatScheduleTime = (isoString: string | null) => {
    if (!isoString) return null;
    try {
      const date = parseISO(isoString);
      const isDatePast = isPast(date);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      const absoluteTime = format(date, "EEE, MMM d 'at' h:mm a");

      return {
        relative: isDatePast ? "Ready to send" : relativeTime,
        absolute: absoluteTime,
        isPast: isDatePast,
      };
    } catch {
      return null;
    }
  };

  const emailTime = formatScheduleTime(emailScheduledFor);
  const callTime = formatScheduleTime(callScheduledFor);

  return (
    <Card className="border-violet-500/20 bg-violet-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          Scheduled Communications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {emailTime && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
              <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-muted-foreground text-xs">
                {emailTime.absolute}
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                {emailTime.relative}
              </p>
            </div>
          </div>
        )}
        {callTime && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
              <Phone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Phone Call</p>
              <p className="text-muted-foreground text-xs">
                {callTime.absolute}
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400">
                {callTime.relative}
              </p>
            </div>
          </div>
        )}
        {!emailTime && !callTime && (
          <p className="text-muted-foreground text-sm">
            No communications scheduled.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Delivery toggle section with contact info display
 * Uses checkboxes with card-based layout for better UX
 */
function DeliveryToggleSection({
  toggles,
  onChange,
  hasPhone,
  hasEmail,
  phone,
  email,
  testModeEnabled = false,
}: {
  toggles: DeliveryToggles;
  onChange: (toggles: DeliveryToggles) => void;
  hasPhone: boolean;
  hasEmail: boolean;
  phone: string | null;
  email: string | null;
  testModeEnabled?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Delivery Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Delivery Method Selection - Card-based checkboxes */}
        <div className="grid grid-cols-2 gap-2">
          {/* Phone Call Option */}
          <label
            htmlFor="phone-checkbox"
            className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all ${
              toggles.phoneEnabled && hasPhone
                ? "border-teal-500 bg-teal-500/10"
                : hasPhone
                  ? "border-border hover:border-border/80"
                  : "border-border/50 bg-muted/50 cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id="phone-checkbox"
                checked={toggles.phoneEnabled}
                onCheckedChange={(checked) =>
                  onChange({ ...toggles, phoneEnabled: checked as boolean })
                }
                disabled={!hasPhone}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium">Call</span>
                </div>
                {hasPhone ? (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {formatPhoneNumber(phone)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                    No phone
                  </p>
                )}
              </div>
            </div>
          </label>

          {/* Email Option */}
          <label
            htmlFor="email-checkbox"
            className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all ${
              toggles.emailEnabled && hasEmail
                ? "border-teal-500 bg-teal-500/10"
                : hasEmail
                  ? "border-border hover:border-border/80"
                  : "border-border/50 bg-muted/50 cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id="email-checkbox"
                checked={toggles.emailEnabled}
                onCheckedChange={(checked) =>
                  onChange({ ...toggles, emailEnabled: checked as boolean })
                }
                disabled={!hasEmail}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                {hasEmail ? (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {email}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                    No email
                  </p>
                )}
              </div>
            </div>
          </label>
        </div>

        {/* Timing Selection - Only show in test mode */}
        {testModeEnabled && (
          <div className="space-y-2 border-t pt-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Test Mode Timing
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Scheduled (default) */}
              <label
                htmlFor="scheduled-timing"
                className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                  !toggles.immediateDelivery
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <input
                  type="radio"
                  id="scheduled-timing"
                  name="delivery-timing"
                  checked={!toggles.immediateDelivery}
                  onChange={() =>
                    onChange({ ...toggles, immediateDelivery: false })
                  }
                  className="sr-only"
                />
                <Clock
                  className={`h-4 w-4 ${!toggles.immediateDelivery ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                />
                <div>
                  <span className="text-sm font-medium">Scheduled</span>
                  <p className="text-muted-foreground text-xs">
                    Use delay settings
                  </p>
                </div>
              </label>

              {/* Immediate */}
              <label
                htmlFor="immediate-timing"
                className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                  toggles.immediateDelivery
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <input
                  type="radio"
                  id="immediate-timing"
                  name="delivery-timing"
                  checked={toggles.immediateDelivery}
                  onChange={() =>
                    onChange({ ...toggles, immediateDelivery: true })
                  }
                  className="sr-only"
                />
                <Zap
                  className={`h-4 w-4 ${toggles.immediateDelivery ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                />
                <div>
                  <span className="text-sm font-medium">Immediate</span>
                  <p className="text-muted-foreground text-xs">
                    Send right away
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Delivery Complete Card for sent cases
 */
function DeliveryCompleteCard({
  status,
  scheduledCall,
  caseData,
}: {
  status: "completed" | "failed";
  scheduledCall: ScheduledCallData | null;
  caseData: CaseData;
}) {
  const call = scheduledCall;
  const isCompleted = status === "completed";

  // Determine actual delivery status from case data
  const emailStatus = caseData.emailSent;
  const phoneStatus = caseData.phoneSent;
  const hasOwnerEmail = Boolean(caseData.owner.email);
  const hasOwnerPhone = Boolean(caseData.owner.phone);

  // Generate delivery summary
  const getDeliverySummary = () => {
    if (status === "failed") {
      return "Communications could not be delivered.";
    }

    if (call?.summary) {
      // Use existing call summary if available
      return call.summary;
    }

    if (call?.transcript) {
      // Extract key points from transcript for a brief summary
      const transcript = call.transcript;
      if (transcript.length > 200) {
        // Generate a simple summary from transcript
        const sentences = transcript
          .split(".")
          .filter((s) => s.trim().length > 0);
        const firstSentence = sentences[0]?.trim() + ".";
        const lastSentence = sentences[sentences.length - 1]?.trim() + ".";
        return `${firstSentence} Call completed successfully.`;
      }
      return "Call completed successfully with owner. Discharge instructions provided.";
    }

    return "Communications were delivered successfully.";
  };

  return (
    <Card
      className={
        status === "failed"
          ? "border-red-500/20 bg-red-500/5"
          : "border-emerald-500/20 bg-emerald-500/5"
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          {isCompleted ? "Delivery Complete" : "Delivery Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "failed" ? (
          <>
            <p className="text-sm text-red-700 dark:text-red-400">
              {getDeliverySummary()}
            </p>
            {call?.endedReason && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Reason: {call.endedReason}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {getDeliverySummary()}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Phone Call status - moved to left */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    phoneStatus === "sent"
                      ? "bg-emerald-100"
                      : phoneStatus === "failed"
                        ? "bg-red-100"
                        : !hasOwnerPhone
                          ? "bg-slate-100"
                          : "bg-slate-100"
                  }`}
                >
                  <Phone
                    className={`h-4 w-4 ${
                      phoneStatus === "sent"
                        ? "text-emerald-600"
                        : phoneStatus === "failed"
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone Call</p>
                  <p
                    className={`text-xs ${
                      phoneStatus === "sent"
                        ? "text-emerald-600"
                        : phoneStatus === "failed"
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  >
                    {phoneStatus === "sent" && call?.durationSeconds
                      ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`
                      : phoneStatus === "sent"
                        ? "Completed"
                        : phoneStatus === "failed"
                          ? "Failed"
                          : !hasOwnerPhone
                            ? "No phone available"
                            : phoneStatus === "not_applicable"
                              ? "Not applicable"
                              : "Not sent"}
                  </p>
                </div>
              </div>

              {/* Email status - moved to right */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    emailStatus === "sent"
                      ? "bg-emerald-100"
                      : emailStatus === "failed"
                        ? "bg-red-100"
                        : !hasOwnerEmail
                          ? "bg-slate-100"
                          : "bg-slate-100"
                  }`}
                >
                  <Mail
                    className={`h-4 w-4 ${
                      emailStatus === "sent"
                        ? "text-emerald-600"
                        : emailStatus === "failed"
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p
                    className={`text-xs ${
                      emailStatus === "sent"
                        ? "text-emerald-600"
                        : emailStatus === "failed"
                          ? "text-red-600"
                          : !hasOwnerEmail
                            ? "text-slate-500"
                            : "text-slate-500"
                    }`}
                  >
                    {emailStatus === "sent"
                      ? "Sent"
                      : emailStatus === "failed"
                        ? "Failed"
                        : !hasOwnerEmail
                          ? "No email available"
                          : emailStatus === "not_applicable"
                            ? "Not applicable"
                            : "Not sent"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no case selected
 */
function EmptyDetailState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <PawPrint className="mb-4 h-12 w-12 text-teal-600/30 dark:text-teal-400/30" />
      <p className="text-muted-foreground font-medium">No case selected</p>
      <p className="text-muted-foreground/60 text-sm">
        Click a row in the table to view details
      </p>
    </div>
  );
}

/**
 * Urgent Reason Section
 * Displays why a case was flagged as urgent by the AI
 * Triggers LLM summary generation on load if not cached
 */
function UrgentReasonSection({ callId }: { callId: string }) {
  const {
    data: summaryData,
    isLoading,
    error,
  } = api.outbound.getUrgentSummary.useQuery(
    { callId },
    {
      // Only fetch once, don't refetch on window focus
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  );

  return (
    <Card className="border-orange-500/20 bg-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          Needs Attention
          <Badge
            variant="secondary"
            className="bg-orange-500/10 text-orange-700 dark:text-orange-400"
          >
            AI Flagged
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing transcript...</span>
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">
            {error.message || "Failed to load urgent reason"}
          </p>
        ) : summaryData?.summary ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-orange-800 dark:text-orange-400">
              {summaryData.summary}
            </p>
            {summaryData.cached && (
              <p className="text-muted-foreground text-xs">
                Previously analyzed
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            This case was flagged as urgent by the AI agent.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Structured Discharge Summary Display
 * Renders the discharge summary in beautifully formatted sections
 */
function StructuredDischargeSummaryDisplay({
  content,
}: {
  content: StructuredDischargeSummary;
}) {
  const hasAppointmentSummary = Boolean(content.appointmentSummary?.trim());
  const hasDiagnosis = Boolean(content.diagnosis?.trim());
  const hasTreatments =
    content.treatmentsToday && content.treatmentsToday.length > 0;
  const hasVaccinations =
    content.vaccinationsGiven && content.vaccinationsGiven.length > 0;
  const hasMedications = content.medications && content.medications.length > 0;
  const hasHomeCare =
    content.homeCare &&
    [
      content.homeCare.activity,
      content.homeCare.diet,
      content.homeCare.woundCare,
      content.homeCare.monitoring && content.homeCare.monitoring.length > 0,
    ].some(Boolean);
  const hasFollowUp = content.followUp?.required;
  const hasWarningSigns =
    content.warningSigns && content.warningSigns.length > 0;

  return (
    <div className="space-y-4">
      {/* Appointment Summary - Friendly intro */}
      {hasAppointmentSummary && (
        <div className="rounded-lg bg-teal-50/50 p-3 dark:bg-teal-950/20">
          <p className="text-sm leading-relaxed text-teal-800 dark:text-teal-300">
            {content.appointmentSummary}
          </p>
        </div>
      )}

      {/* Diagnosis */}
      {hasDiagnosis && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
              Diagnosis
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{content.diagnosis}</p>
        </div>
      )}

      {/* Treatments & Vaccinations Grid */}
      {[hasTreatments, hasVaccinations].some(Boolean) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Treatments Today */}
          {hasTreatments && (
            <div className="rounded-lg border bg-slate-50/50 p-3 dark:bg-slate-900/30">
              <div className="mb-2 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Today&apos;s Care
                </span>
              </div>
              <ul className="space-y-1">
                {content.treatmentsToday?.map((treatment, idx) => (
                  <li
                    key={idx}
                    className="text-muted-foreground flex items-start gap-2 text-sm"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {treatment}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vaccinations */}
          {hasVaccinations && (
            <div className="rounded-lg border bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
              <div className="mb-2 flex items-center gap-1.5">
                <Syringe className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Vaccinations
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {content.vaccinationsGiven?.map((vaccine, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  >
                    {vaccine}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medications */}
      {hasMedications && (
        <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-3 dark:border-amber-800/30 dark:bg-amber-950/20">
          <div className="mb-2 flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Take-Home Medications
            </span>
          </div>
          <div className="space-y-2">
            {content.medications?.map((med, idx) => (
              <div
                key={idx}
                className="rounded-md bg-white/70 p-2.5 dark:bg-slate-900/50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-amber-800 dark:text-amber-300">
                    {med.name}
                  </span>
                  {med.dosage && (
                    <span className="text-muted-foreground text-xs">
                      {med.dosage}
                    </span>
                  )}
                </div>
                {[med.frequency, med.duration].some(Boolean) && (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {med.frequency}
                    {med.frequency && med.duration && " · "}
                    {med.duration}
                  </p>
                )}
                {med.instructions && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    ℹ️ {med.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Home Care Instructions */}
      {hasHomeCare && (
        <div className="rounded-lg border bg-slate-50/50 p-3 dark:bg-slate-900/30">
          <div className="mb-2 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-pink-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Home Care
            </span>
          </div>
          <div className="space-y-2">
            {content.homeCare?.activity && (
              <div className="flex items-start gap-2 text-sm">
                <Activity className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs font-medium">
                    Activity:
                  </span>
                  <p className="text-muted-foreground">
                    {content.homeCare.activity}
                  </p>
                </div>
              </div>
            )}
            {content.homeCare?.diet && (
              <div className="flex items-start gap-2 text-sm">
                <Utensils className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs font-medium">
                    Diet:
                  </span>
                  <p className="text-muted-foreground">
                    {content.homeCare.diet}
                  </p>
                </div>
              </div>
            )}
            {content.homeCare?.woundCare && (
              <div className="flex items-start gap-2 text-sm">
                <Eye className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs font-medium">
                    Wound Care:
                  </span>
                  <p className="text-muted-foreground">
                    {content.homeCare.woundCare}
                  </p>
                </div>
              </div>
            )}
            {content.homeCare?.monitoring &&
              content.homeCare.monitoring.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs font-medium">
                    Watch for:
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {content.homeCare.monitoring.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-muted-foreground flex items-start gap-2 text-sm"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Follow-up */}
      {hasFollowUp && (
        <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-3 dark:border-blue-800/30 dark:bg-blue-950/20">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Follow-up{" "}
              {content.followUp?.date && (
                <span className="font-normal">{content.followUp.date}</span>
              )}
            </span>
          </div>
          {content.followUp?.reason && (
            <p className="text-muted-foreground mt-1 pl-6 text-sm">
              {content.followUp.reason}
            </p>
          )}
        </div>
      )}

      {/* Warning Signs */}
      {hasWarningSigns && (
        <div className="rounded-lg border border-red-200/50 bg-red-50/50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">
              Call Us If You Notice
            </span>
          </div>
          <ul className="space-y-1">
            {content.warningSigns?.map((sign, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {sign}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Notes */}
      {content.notes && (
        <div className="border-t pt-3">
          <p className="text-muted-foreground text-sm italic">
            {content.notes}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Communication Summary Section - intelligent display based on actual delivery status
 */
function CommunicationSummarySection({
  caseData,
  callScript,
  activeTab,
  setActiveTab,
}: {
  caseData: CaseData;
  callScript: string;
  activeTab: PreviewTab;
  setActiveTab: (tab: PreviewTab) => void;
}) {
  const emailStatus = caseData.emailSent;
  const phoneStatus = caseData.phoneSent;
  const hasOwnerEmail = Boolean(caseData.owner.email);
  const hasOwnerPhone = Boolean(caseData.owner.phone);

  // Determine what to show for each tab
  const emailWasSent = emailStatus === "sent";
  const phoneWasSent = phoneStatus === "sent";
  const emailCanBeSent = hasOwnerEmail && !emailWasSent;
  const phoneCanBeSent = hasOwnerPhone && !phoneWasSent;

  // Determine tab labels
  const getCallTabLabel = () => {
    if (phoneWasSent && caseData.scheduledCall?.transcript)
      return "Call Transcript";
    if (phoneWasSent) return "Call Sent";
    if (phoneCanBeSent) return "Call Script";
    return "Call Script";
  };

  const getEmailTabLabel = () => {
    if (emailWasSent) return "Email Sent";
    if (emailCanBeSent) return "Email Preview";
    return "Email";
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as PreviewTab)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="call_script" className="gap-2">
            <Phone className="h-4 w-4" />
            {getCallTabLabel()}
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            {getEmailTabLabel()}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="call_script" className="mt-4">
          <CallTabContent
            caseData={caseData}
            callScript={callScript}
            phoneWasSent={phoneWasSent}
            phoneCanBeSent={phoneCanBeSent}
            hasOwnerPhone={hasOwnerPhone}
          />
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <EmailTabContent
            caseData={caseData}
            emailWasSent={emailWasSent}
            emailCanBeSent={emailCanBeSent}
            hasOwnerEmail={hasOwnerEmail}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Call Tab Content - shows transcript if sent, schedule button if not sent, or script preview
 */
function CallTabContent({
  caseData,
  callScript,
  phoneWasSent,
  phoneCanBeSent,
  hasOwnerPhone,
}: {
  caseData: CaseData;
  callScript: string;
  phoneWasSent: boolean;
  phoneCanBeSent: boolean;
  hasOwnerPhone: boolean;
}) {
  // If phone was sent, show audio player with transcript
  if (phoneWasSent && caseData.scheduledCall) {
    return (
      <CallRecordingPlayer
        recordingUrl={caseData.scheduledCall.recordingUrl ?? null}
        transcript={caseData.scheduledCall.transcript}
        durationSeconds={caseData.scheduledCall.durationSeconds}
        summary={caseData.scheduledCall.summary}
      />
    );
  }

  // If phone can be sent, show schedule button
  if (phoneCanBeSent) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-slate-500" />
            Call Not Scheduled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            This call has not been scheduled yet.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // TODO: Implement schedule call functionality
              console.log("Schedule call");
            }}
          >
            <Phone className="mr-2 h-4 w-4" />
            Schedule Call
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no phone available, show not available message
  if (!hasOwnerPhone) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-slate-400" />
            Call Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-sm text-slate-600">
              No phone number available for this owner.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback: show call script
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-4 w-4 text-slate-500" />
          Call Script
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 max-h-80 overflow-auto rounded-md p-3">
          <p className="text-sm whitespace-pre-wrap">
            {callScript || "No call script available."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Email Tab Content - shows sent email if sent, schedule button if not sent, or preview
 */
function EmailTabContent({
  caseData,
  emailWasSent,
  emailCanBeSent,
  hasOwnerEmail,
}: {
  caseData: CaseData;
  emailWasSent: boolean;
  emailCanBeSent: boolean;
  hasOwnerEmail: boolean;
}) {
  // If email was sent, show the sent email content
  if (emailWasSent) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Email Sent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {caseData.structuredContent ? (
            <div className="max-h-96 overflow-auto">
              <EmailStructuredPreview content={caseData.structuredContent} />
            </div>
          ) : (
            <div className="bg-muted/50 max-h-96 overflow-auto rounded-md p-3">
              <p className="text-sm whitespace-pre-wrap">
                {caseData.emailContent ||
                  caseData.dischargeSummary ||
                  "No email content available."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If email can be sent, show schedule button
  if (emailCanBeSent) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-slate-500" />
            Email Not Scheduled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            This email has not been scheduled yet.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // TODO: Implement schedule email functionality
              console.log("Schedule email");
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Schedule Email
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no email available, show not available message
  if (!hasOwnerEmail) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-slate-400" />
            Email Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-sm text-slate-600">
              No email address available for this owner.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback: show email preview
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-slate-500" />
          Email Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {caseData.structuredContent ? (
          <div className="max-h-96 overflow-auto">
            <EmailStructuredPreview content={caseData.structuredContent} />
          </div>
        ) : (
          <div className="bg-muted/50 max-h-96 overflow-auto rounded-md p-3">
            <p className="text-sm whitespace-pre-wrap">
              {caseData.emailContent ||
                caseData.dischargeSummary ||
                "No email content available."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();

  if (years > 0) {
    return `${years} yr${years > 1 ? "s" : ""}`;
  }
  if (months > 0) {
    return `${months} mo${months > 1 ? "s" : ""}`;
  }
  return "< 1 mo";
}

/**
 * Format case type for display
 */
function formatCaseType(caseType: string): string {
  return caseType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
