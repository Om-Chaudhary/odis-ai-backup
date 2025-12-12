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

  if (!caseData) {
    return <EmptyDetailState />;
  }

  const isEditable =
    caseData.status === "pending_review" || caseData.status === "ready";
  const showRetry = caseData.status === "failed";
  const showOutcome =
    caseData.status === "completed" || caseData.status === "failed";
  const showScheduleInfo = caseData.status === "scheduled";

  // Check if discharge summary needs to be generated
  const hasDischargeSummary = Boolean(caseData.dischargeSummary?.trim());
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

        {/* Discharge Summary */}
        <Card
          className={
            needsGeneration ? "border-amber-500/20 bg-amber-500/5" : ""
          }
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                AI Discharge Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {needsGeneration ? (
              <div className="space-y-2">
                {isSubmitting ? (
                  <div className="flex items-center gap-2 text-amber-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      Generating discharge instructions...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2 rounded-md bg-amber-100/50 p-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">
                          Discharge summary will be auto-generated
                        </p>
                        <p className="mt-1 text-amber-700">
                          {hasClinicalData
                            ? "Content will be created from the clinical notes above when you approve."
                            : "A basic discharge message will be created from patient information."}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {caseData.dischargeSummary || "No discharge summary available."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Communication Preview - Collapsible (only show if content exists) */}
        {hasDischargeSummary && (
          <Collapsible
            open={communicationExpanded}
            onOpenChange={setCommunicationExpanded}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="hover:bg-muted/50 cursor-pointer pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Communication Preview
                    </CardTitle>
                    {communicationExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as PreviewTab)}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="call_script" className="gap-2">
                        <Phone className="h-4 w-4" />
                        Call Script
                      </TabsTrigger>
                      <TabsTrigger value="email" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="call_script" className="mt-4">
                      <PreviewContent
                        content={callScript}
                        onPlay={() => {
                          // TODO: Implement TTS preview
                        }}
                        onEdit={() => {
                          // TODO: Implement edit modal
                        }}
                        isEditable={isEditable}
                        type="call"
                      />
                    </TabsContent>

                    <TabsContent value="email" className="mt-4">
                      <PreviewContent
                        content={
                          caseData.emailContent || caseData.dischargeSummary
                        }
                        onEdit={() => {
                          // TODO: Implement edit modal
                        }}
                        isEditable={isEditable}
                        type="email"
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Outcome Details for completed/failed */}
        {showOutcome && (
          <OutcomeDetails
            status={caseData.status as "completed" | "failed"}
            scheduledCall={caseData.scheduledCall}
          />
        )}

        {/* Delivery Toggles */}
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
          {caseData.caseType && (
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
  onPlay,
  onEdit,
  isEditable,
  type,
}: {
  content: string;
  onPlay?: () => void;
  onEdit: () => void;
  isEditable: boolean;
  type: "call" | "email";
}) {
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
      <div className="bg-muted/50 max-h-48 overflow-auto rounded-md p-3">
        <p className="text-sm whitespace-pre-wrap">
          {content || "No content available."}
        </p>
      </div>
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
 * Outcome details for completed/failed cases
 */
function OutcomeDetails({
  status,
  scheduledCall,
}: {
  status: "completed" | "failed";
  scheduledCall: ScheduledCallData | null;
}) {
  const call = scheduledCall;

  return (
    <Card
      className={
        status === "failed"
          ? "border-destructive/20 bg-destructive/5"
          : "border-emerald-500/20 bg-emerald-500/5"
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {status === "completed" ? "Delivery Complete" : "Delivery Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {status === "failed" && call?.endedReason && (
          <p className="text-destructive text-sm">Reason: {call.endedReason}</p>
        )}
        {status === "completed" && (
          <>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Communications were delivered successfully.
            </p>
            {call?.durationSeconds && (
              <p className="text-muted-foreground text-xs">
                Call duration: {Math.floor(call.durationSeconds / 60)}m{" "}
                {call.durationSeconds % 60}s
              </p>
            )}
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
