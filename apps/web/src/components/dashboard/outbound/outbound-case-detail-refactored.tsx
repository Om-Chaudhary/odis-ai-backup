"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@odis-ai/ui/button";
import { Separator } from "@odis-ai/ui/separator";
import { Loader2, RotateCcw, Wand2, ExternalLink } from "lucide-react";
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
import { PatientOwnerCard } from "./detail/patient-owner-card";
import { WorkflowCanvas, type CaseDataForWorkflow } from "./detail/workflow";

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
  onCancelScheduled?: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  isSubmitting: boolean;
  isCancelling?: boolean;
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
  onCancelScheduled,
  isSubmitting,
  isCancelling = false,
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

  // Transform case data for workflow visualization
  // IMPORTANT: This hook must be called unconditionally before any early returns
  const workflowCaseData: CaseDataForWorkflow | null = useMemo(() => {
    if (!caseData) return null;
    return {
      id: caseData.id,
      caseId: caseData.caseId,
      status: caseData.status,
      caseType: caseData.caseType,
      timestamp:
        caseData.scheduledCall?.startedAt ??
        caseData.scheduledEmailFor ??
        new Date().toISOString(),
      emailSent: caseData.emailSent,
      scheduledEmailFor: caseData.scheduledEmailFor,
      phoneSent: caseData.phoneSent,
      scheduledCallFor: caseData.scheduledCallFor,
      scheduledCall: caseData.scheduledCall
        ? {
            id: caseData.scheduledCall.id,
            durationSeconds: caseData.scheduledCall.durationSeconds,
            transcript: caseData.scheduledCall.transcript,
            recordingUrl: caseData.scheduledCall.recordingUrl ?? null,
            summary: caseData.scheduledCall.summary,
            endedReason: caseData.scheduledCall.endedReason,
          }
        : null,
      needsAttention: caseData.needsAttention,
      attentionTypes: caseData.attentionTypes,
      attentionSeverity: caseData.attentionSeverity,
      attentionSummary: caseData.attentionSummary,
      owner: {
        email: caseData.owner.email,
        phone: caseData.owner.phone,
      },
    };
  }, [caseData]);

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

  // Early return after all hooks are called
  if (!caseData || !workflowCaseData) {
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
      {/* Patient/Owner Card (Redesigned) */}
      <div className="p-4 pb-0">
        <PatientOwnerCard
          caseData={{
            id: caseData.id,
            caseId: caseData.caseId,
            patient: caseData.patient,
            owner: caseData.owner,
            caseType: caseData.caseType,
            status: caseData.status,
          }}
          onDelete={onDelete}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {isSentCase ? (
          /* Layout for SENT cases - Workflow Visualization */
          <>
            {/* Workflow Timeline */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-900/50">
              {/* Header with expand button */}
              <div className="flex items-center justify-between border-b border-slate-200/60 bg-slate-50/50 px-4 py-2">
                <span className="text-xs font-medium text-slate-600">
                  Workflow Timeline
                </span>
                <Link href={`/dashboard/outbound/workflow/${caseData.caseId}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-slate-500 hover:text-teal-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="text-xs">Open</span>
                  </Button>
                </Link>
              </div>
              <WorkflowCanvas
                caseData={workflowCaseData}
                className="h-[380px] min-h-[380px]"
              />
            </div>

            {/* Clinical Notes Section (Collapsed) */}
            {(hasIdexxNotes || hasSoapNotes) && (
              <ClinicalNotesSection
                idexxNotes={caseData.idexxNotes}
                soapNotes={caseData.soapNotes}
                hasIdexxNotes={hasIdexxNotes}
              />
            )}

            {/* Communication Summary (Collapsed) */}
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
            {/* Workflow Timeline (Preview Mode) */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-900/50">
              {/* Header with expand button */}
              <div className="flex items-center justify-between border-b border-slate-200/60 bg-slate-50/50 px-4 py-2">
                <span className="text-xs font-medium text-slate-600">
                  Workflow Preview
                </span>
                <Link href={`/dashboard/outbound/workflow/${caseData.caseId}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-slate-500 hover:text-teal-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="text-xs">Open</span>
                  </Button>
                </Link>
              </div>
              <WorkflowCanvas
                caseData={workflowCaseData}
                className="h-[330px] min-h-[330px]"
              />
            </div>

            {/* Clinical Notes Section */}
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
                onCancelScheduled={onCancelScheduled}
                isCancelling={isCancelling}
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
