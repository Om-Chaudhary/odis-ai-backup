"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  PawPrint,
  User,
  RotateCcw,
  ExternalLink,
  Loader2,
  Stethoscope,
  Calendar,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Zap,
  Clock,
} from "lucide-react";
import { api } from "~/trpc/client";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Checkbox } from "@odis-ai/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@odis-ai/ui/tabs";
import { Badge } from "@odis-ai/ui/badge";
import { Separator } from "@odis-ai/ui/separator";
import type {
  PreviewTab,
  DeliveryToggles,
  DischargeCaseStatus,
  SoapNote,
} from "./types";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";
import { CallRecordingPlayer } from "../shared";
import {
  AttentionTypeBadge,
  AttentionSeverityBadge,
} from "../shared/attention-badges";
import { DeleteCaseDialog } from "../cases/delete-case-dialog";
import { EmptyDetailState } from "./detail/detail-empty-state";
import { EmailStructuredPreview } from "./detail/structured-preview";
import { cn } from "@odis-ai/utils";

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
  structuredData?: Record<string, unknown> | null;
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
  // Attention fields
  attentionTypes?: string[] | null;
  attentionSeverity?: string | null;
  attentionSummary?: string | null;
  attentionFlaggedAt?: string | null;
  needsAttention?: boolean;
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
  /** Called after case is successfully deleted */
  onDelete?: () => void;
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
  onDelete,
}: OutboundCaseDetailProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("call_script");

  // Mutation for scheduling remaining outreach
  const utils = api.useUtils();
  const scheduleRemainingMutation =
    api.outbound.scheduleRemainingOutreach.useMutation({
      onSuccess: () => {
        // Invalidate the cases list to refresh data
        void utils.outbound.listDischargeCases.invalidate();
      },
    });

  const handleScheduleRemaining = (options: {
    scheduleCall: boolean;
    scheduleEmail: boolean;
    immediateDelivery: boolean;
  }) => {
    if (!caseData) return;
    scheduleRemainingMutation.mutate({
      caseId: caseData.caseId,
      scheduleCall: options.scheduleCall,
      scheduleEmail: options.scheduleEmail,
      immediateDelivery: options.immediateDelivery,
    });
  };

  if (!caseData) {
    return <EmptyDetailState />;
  }

  const isEditable =
    caseData.status === "pending_review" || caseData.status === "ready";
  const showRetry = caseData.status === "failed";
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

  return (
    <div className="flex h-full flex-col">
      {/* Patient Header */}
      <PatientHeader caseData={caseData} onDelete={onDelete} />

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
              onScheduleRemaining={handleScheduleRemaining}
              isScheduling={scheduleRemainingMutation.isPending}
            />

            {/* Attention Section - Show prominently for flagged cases */}
            {caseData.needsAttention && (
              <AttentionSection caseData={caseData} />
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
            {/* Attention Section - Show prominently for flagged cases */}
            {caseData.needsAttention && (
              <AttentionSection caseData={caseData} />
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
function PatientHeader({
  caseData,
  onDelete,
}: {
  caseData: CaseData;
  onDelete?: () => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 gap-1.5"
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete this case"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
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

      <DeleteCaseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        caseId={caseData.id}
        patientName={caseData.patient.name}
        onSuccess={onDelete}
      />
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

        {/* Timing Selection - Available to all users */}
        <div className="space-y-2 border-t pt-2">
          <p className="text-muted-foreground text-xs font-medium">
            Delivery Timing
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Scheduled (default) */}
            <label
              htmlFor="scheduled-timing"
              className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                !toggles.immediateDelivery
                  ? "border-teal-500 bg-teal-500/10"
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
                className={`h-4 w-4 ${!toggles.immediateDelivery ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`}
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
                  ? "border-teal-500 bg-teal-500/10"
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
                className={`h-4 w-4 ${toggles.immediateDelivery ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`}
              />
              <div>
                <span className="text-sm font-medium">Immediate</span>
                <p className="text-muted-foreground text-xs">Send right away</p>
              </div>
            </label>
          </div>

          {/* Test mode indicator */}
          {testModeEnabled && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Test mode: Will send to your test contacts
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Delivery Complete Card for sent cases
 * Shows delivery status and allows scheduling remaining outreach for partial cases
 */
function DeliveryCompleteCard({
  status,
  scheduledCall,
  caseData,
  onScheduleRemaining,
  isScheduling,
}: {
  status: "completed" | "failed";
  scheduledCall: ScheduledCallData | null;
  caseData: CaseData;
  onScheduleRemaining?: (options: {
    scheduleCall: boolean;
    scheduleEmail: boolean;
    immediateDelivery: boolean;
  }) => void;
  isScheduling?: boolean;
}) {
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [immediateDelivery, setImmediateDelivery] = useState(false);
  const call = scheduledCall;
  const isCompleted = status === "completed";

  // Determine actual delivery status from case data
  const emailStatus = caseData.emailSent;
  const phoneStatus = caseData.phoneSent;
  const hasOwnerEmail = Boolean(caseData.owner.email);
  const hasOwnerPhone = Boolean(caseData.owner.phone);

  // Detect partial outreach - one method sent, other can still be scheduled
  const emailSent = emailStatus === "sent";
  const phoneSent = phoneStatus === "sent";
  const canScheduleCall =
    !phoneSent && hasOwnerPhone && phoneStatus !== "pending";
  const canScheduleEmail =
    !emailSent && hasOwnerEmail && emailStatus !== "pending";
  const hasPartialOutreach =
    (emailSent || phoneSent) && (canScheduleCall || canScheduleEmail);

  // Get friendly failure reason from ended_reason
  const getFailureReason = (
    endedReason: string | null | undefined,
  ): { short: string; detail: string } => {
    if (!endedReason) {
      if (emailStatus === "failed") {
        return {
          short: "Email delivery failed",
          detail: "The email could not be delivered to the recipient.",
        };
      }
      return {
        short: "Delivery failed",
        detail: "Communications could not be delivered.",
      };
    }

    const reason = endedReason.toLowerCase();

    if (reason.includes("silence-timed-out")) {
      return {
        short: "No response from owner",
        detail:
          "The call connected but the owner did not respond. They may have been unavailable or the call went to a busy line.",
      };
    }
    if (
      reason.includes("customer-did-not-answer") ||
      reason.includes("dial-no-answer")
    ) {
      return {
        short: "Owner didn't answer",
        detail:
          "The phone rang but no one picked up. The owner may be unavailable.",
      };
    }
    if (reason.includes("dial-busy")) {
      return {
        short: "Line was busy",
        detail: "The owner's phone line was busy. They may be on another call.",
      };
    }
    if (reason.includes("voicemail")) {
      return {
        short: "Reached voicemail",
        detail:
          "The call went to voicemail. A message was not left per your settings.",
      };
    }
    if (
      reason.includes("sip") ||
      reason.includes("failed-to-connect") ||
      reason.includes("twilio")
    ) {
      return {
        short: "Connection failed",
        detail: "Unable to connect the call due to a network or carrier issue.",
      };
    }
    if (reason.includes("error")) {
      return {
        short: "Call error occurred",
        detail: "An error occurred during the call attempt.",
      };
    }

    return {
      short: "Delivery failed",
      detail: "Communications could not be delivered.",
    };
  };

  // Generate delivery summary
  const getDeliverySummary = () => {
    if (status === "failed") {
      const failureInfo = getFailureReason(call?.endedReason);
      return failureInfo.detail;
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
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {getFailureReason(call?.endedReason).short}
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">
              {getDeliverySummary()}
            </p>
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

            {/* Schedule Remaining Outreach Section */}
            {hasPartialOutreach && onScheduleRemaining && (
              <div className="mt-4 border-t border-emerald-200/50 pt-4">
                {!showScheduleOptions ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setShowScheduleOptions(true)}
                  >
                    {canScheduleCall && canScheduleEmail ? (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Remaining Outreach
                      </>
                    ) : canScheduleCall ? (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        Schedule Phone Call
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Schedule Email
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Schedule{" "}
                      {canScheduleCall && canScheduleEmail
                        ? "Remaining"
                        : canScheduleCall
                          ? "Call"
                          : "Email"}
                    </p>

                    {/* Delivery Method Selection */}
                    {canScheduleCall && canScheduleEmail && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2">
                          <Phone className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">Call</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2">
                          <Mail className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">Email</span>
                        </div>
                      </div>
                    )}

                    {/* Timing Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        htmlFor="schedule-remaining-scheduled"
                        className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                          !immediateDelivery
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          id="schedule-remaining-scheduled"
                          name="schedule-remaining-timing"
                          checked={!immediateDelivery}
                          onChange={() => setImmediateDelivery(false)}
                          className="sr-only"
                        />
                        <Clock
                          className={`h-4 w-4 ${!immediateDelivery ? "text-emerald-600" : "text-slate-400"}`}
                        />
                        <div>
                          <span className="text-sm font-medium">Scheduled</span>
                          <p className="text-muted-foreground text-xs">
                            Use delay settings
                          </p>
                        </div>
                      </label>

                      <label
                        htmlFor="schedule-remaining-immediate"
                        className={`relative flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all ${
                          immediateDelivery
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          id="schedule-remaining-immediate"
                          name="schedule-remaining-timing"
                          checked={immediateDelivery}
                          onChange={() => setImmediateDelivery(true)}
                          className="sr-only"
                        />
                        <Zap
                          className={`h-4 w-4 ${immediateDelivery ? "text-emerald-600" : "text-slate-400"}`}
                        />
                        <div>
                          <span className="text-sm font-medium">Immediate</span>
                          <p className="text-muted-foreground text-xs">
                            Send right away
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setShowScheduleOptions(false);
                          setImmediateDelivery(false);
                        }}
                        disabled={isScheduling}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          onScheduleRemaining({
                            scheduleCall: canScheduleCall,
                            scheduleEmail: canScheduleEmail,
                            immediateDelivery,
                          });
                        }}
                        disabled={isScheduling}
                      >
                        {isScheduling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          "Schedule"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Attention Section
 * Displays attention data for flagged cases with new structured outputs
 */
function AttentionSection({ caseData }: { caseData: CaseData }) {
  if (!caseData.needsAttention) return null;

  const severityColors: Record<string, string> = {
    critical: "border-red-500/30 bg-red-500/5",
    urgent: "border-orange-500/20 bg-orange-500/5",
    routine: "border-blue-500/20 bg-blue-500/5",
  };

  const severity = caseData.attentionSeverity ?? "routine";
  const cardClass = severityColors[severity] ?? severityColors.routine;

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              severity === "critical" && "text-red-600",
              severity === "urgent" && "text-orange-600",
              severity === "routine" && "text-blue-600",
            )}
          />
          Needs Attention
          <AttentionSeverityBadge severity={severity} size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Attention Types */}
        {caseData.attentionTypes && caseData.attentionTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {caseData.attentionTypes.map((type) => (
              <AttentionTypeBadge key={type} type={type} size="md" />
            ))}
          </div>
        )}

        {/* AI Summary */}
        {caseData.attentionSummary && (
          <div className="rounded-md bg-white/50 p-3">
            <p className="text-sm leading-relaxed">
              {caseData.attentionSummary}
            </p>
          </div>
        )}

        {/* Flagged timestamp */}
        {caseData.attentionFlaggedAt && (
          <p className="text-muted-foreground text-xs">
            Flagged{" "}
            {formatDistanceToNow(parseISO(caseData.attentionFlaggedAt), {
              addSuffix: true,
            })}
          </p>
        )}
      </CardContent>
    </Card>
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
