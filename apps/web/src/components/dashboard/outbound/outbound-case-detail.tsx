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
} from "lucide-react";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import { Switch } from "@odis-ai/ui/switch";
import { Label } from "@odis-ai/ui/label";
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
  scheduledCall: unknown;
  scheduledEmail: unknown;
  idexxNotes: string | null;
  soapNotes: SoapNote[];
  scheduledEmailFor: string | null;
  scheduledCallFor: string | null;
}

interface OutboundCaseDetailProps {
  caseData: CaseData | null;
  deliveryToggles: DeliveryToggles;
  onToggleChange: (toggles: DeliveryToggles) => void;
  onApprove: () => void;
  onSkip: () => void;
  onRetry?: () => void;
  isSubmitting: boolean;
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
      <PatientHeader caseData={caseData} />

      <Separator />

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
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
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-teal-600" />
                AI Discharge Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {caseData.dischargeSummary || "No discharge summary available."}
            </p>
          </CardContent>
        </Card>

        {/* Communication Preview - Collapsible */}
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
          />
        )}
      </div>

      {/* Sticky Action Bar */}
      {(isEditable || showRetry) && (
        <div className="bg-background border-t p-4">
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
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={showRetry ? onRetry : onApprove}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : showRetry ? (
                <RotateCcw className="mr-2 h-4 w-4" />
              ) : null}
              {showRetry ? "Retry" : "Approve & Send"}
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
    <div className="space-y-3 p-4 pt-10">
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
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 hover:underline"
          >
            <Phone className="h-4 w-4" />
            <span>{caseData.owner.phone}</span>
          </a>
        )}
        {caseData.owner.email && (
          <a
            href={`mailto:${caseData.owner.email}`}
            className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 hover:underline"
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
  idexxNotes,
  soapNotes,
  hasIdexxNotes,
}: {
  idexxNotes: string | null;
  soapNotes: SoapNote[];
  hasIdexxNotes: boolean;
}) {
  if (hasIdexxNotes && idexxNotes) {
    return (
      <Card className="border-teal-200 bg-teal-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            IDEXX Neo Notes
            <Badge variant="secondary" className="text-xs">
              Clinical
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-auto rounded-md bg-white p-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {idexxNotes}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show SOAP notes
  if (soapNotes && soapNotes.length > 0) {
    const latestNote = soapNotes[0]!;
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            SOAP Notes
            <Badge variant="secondary" className="text-xs">
              Clinical
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-64 space-y-3 overflow-auto rounded-md bg-white p-3">
            {latestNote.subjective && (
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase">
                  Subjective
                </p>
                <p className="text-sm">{latestNote.subjective}</p>
              </div>
            )}
            {latestNote.objective && (
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase">
                  Objective
                </p>
                <p className="text-sm">{latestNote.objective}</p>
              </div>
            )}
            {latestNote.assessment && (
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase">
                  Assessment
                </p>
                <p className="text-sm">{latestNote.assessment}</p>
              </div>
            )}
            {latestNote.plan && (
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase">
                  Plan
                </p>
                <p className="text-sm">{latestNote.plan}</p>
              </div>
            )}
            {latestNote.clientInstructions && (
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase">
                  Client Instructions
                </p>
                <p className="text-sm">{latestNote.clientInstructions}</p>
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
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-purple-600" />
          Scheduled Communications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {emailTime && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
              <Mail className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-muted-foreground text-xs">
                {emailTime.absolute}
              </p>
              <p className="text-xs text-purple-600">{emailTime.relative}</p>
            </div>
          </div>
        )}
        {callTime && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
              <Phone className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Phone Call</p>
              <p className="text-muted-foreground text-xs">
                {callTime.absolute}
              </p>
              <p className="text-xs text-purple-600">{callTime.relative}</p>
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
 */
function DeliveryToggleSection({
  toggles,
  onChange,
  hasPhone,
  hasEmail,
  phone,
  email,
}: {
  toggles: DeliveryToggles;
  onChange: (toggles: DeliveryToggles) => void;
  hasPhone: boolean;
  hasEmail: boolean;
  phone: string | null;
  email: string | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Delivery Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="phone-toggle" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Call
            </Label>
            {hasPhone ? (
              <span className="text-muted-foreground text-xs">{phone}</span>
            ) : (
              <Badge variant="outline" className="w-fit text-xs">
                No phone available
              </Badge>
            )}
          </div>
          <Switch
            id="phone-toggle"
            checked={toggles.phoneEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...toggles, phoneEnabled: checked })
            }
            disabled={!hasPhone}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="email-toggle" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            {hasEmail ? (
              <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                {email}
              </span>
            ) : (
              <Badge variant="outline" className="w-fit text-xs">
                No email available
              </Badge>
            )}
          </div>
          <Switch
            id="email-toggle"
            checked={toggles.emailEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...toggles, emailEnabled: checked })
            }
            disabled={!hasEmail}
          />
        </div>
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
  scheduledCall: unknown;
}) {
  const call = scheduledCall as {
    endedReason?: string;
    durationSeconds?: number;
    transcript?: string;
  } | null;

  return (
    <Card
      className={
        status === "failed"
          ? "border-red-200 bg-red-50"
          : "border-green-200 bg-green-50"
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {status === "completed" ? "Delivery Complete" : "Delivery Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {status === "failed" && call?.endedReason && (
          <p className="text-sm text-red-700">Reason: {call.endedReason}</p>
        )}
        {status === "completed" && (
          <>
            <p className="text-sm text-green-700">
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
      <PawPrint className="text-muted-foreground/50 mb-4 h-12 w-12" />
      <p className="text-muted-foreground font-medium">No case selected</p>
      <p className="text-muted-foreground text-sm">
        Click a row in the table to view details
      </p>
    </div>
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
