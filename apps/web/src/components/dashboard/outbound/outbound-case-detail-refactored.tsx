"use client";

import { useState } from "react";
import { Button } from "@odis-ai/ui/button";
import { Separator } from "@odis-ai/ui/separator";
import { Loader2, RotateCcw, Wand2 } from "lucide-react";
import { api } from "~/trpc/client";
import type {
  PreviewTab,
  DeliveryToggles,
  DischargeCaseStatus,
  SoapNote,
} from "./types";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";
import {
  EmptyDetailState,
  PatientHeader,
  ClinicalNotesSection,
  ScheduleInfoCard,
  DeliveryToggleSection,
  DeliveryCompleteCard,
  AttentionSection,
  UrgentReasonSection,
  CommunicationSummarySection,
} from "./detail";

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
  testModeEnabled?: boolean;
  onDelete?: () => void;
}

/**
 * Case Detail Panel Component (Refactored)
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
            {caseData.needsAttention ? (
              <AttentionSection caseData={caseData} />
            ) : caseData.isUrgentCase && caseData.scheduledCall?.id ? (
              <UrgentReasonSection callId={caseData.scheduledCall.id} />
            ) : null}

            {/* Clinical Notes Section */}
            {(hasIdexxNotes || hasSoapNotes) && (
              <ClinicalNotesSection
                idexxNotes={caseData.idexxNotes}
                soapNotes={caseData.soapNotes}
                hasIdexxNotes={hasIdexxNotes}
              />
            )}

            {/* Communication Summary */}
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
            {caseData.needsAttention ? (
              <AttentionSection caseData={caseData} />
            ) : caseData.isUrgentCase && caseData.scheduledCall?.id ? (
              <UrgentReasonSection callId={caseData.scheduledCall.id} />
            ) : null}

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
