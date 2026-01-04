"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import { ExternalLink, ChevronDown } from "lucide-react";
import { api } from "~/trpc/client";
import type { DeliveryToggles, DischargeCaseStatus, SoapNote } from "./types";
import type { StructuredDischargeSummary } from "@odis-ai/shared/validators/discharge-summary";
import { EmptyDetailState } from "./detail";
import { PatientOwnerCard } from "./detail/patient-owner-card";
import { StatusOverviewCard } from "./detail/status-overview-card";
import { CommunicationsIntelligenceCard } from "./detail/communications-intelligence-card";
import { SmartActionSection } from "./detail/smart-action-section";
import { CommunicationPreview } from "./detail/communication-preview";
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
  cleanedTranscript?: string | null;
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
  onApprove: (immediate?: boolean) => void;
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
 * Case Detail Panel Component (Redesigned)
 *
 * Glanceable design with:
 * 1. Patient/Owner card at top
 * 2. Status overview with inline channel statuses
 * 3. Context-aware action section
 * 4. Communication previews (inline, expandable)
 * 5. Workflow timeline (collapsible)
 */
export function OutboundCaseDetail({
  caseData,
  deliveryToggles,
  onToggleChange,
  onApprove,
  onRetry,
  onCancelScheduled,
  isSubmitting,
  isCancelling = false,
  testModeEnabled = false,
  onDelete,
}: OutboundCaseDetailProps) {
  // Workflow timeline collapsible state
  const [workflowOpen, setWorkflowOpen] = useState(false);

  // Mutation for scheduling remaining outreach (for partial delivery cases)
  const utils = api.useUtils();
  const scheduleRemainingMutation =
    api.outbound.scheduleRemainingOutreach.useMutation({
      onSuccess: () => {
        void utils.outbound.listDischargeCases.invalidate();
      },
    });

  // Transform case data for workflow visualization
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
            cleanedTranscript: caseData.scheduledCall.cleanedTranscript,
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

  // Early return after all hooks are called
  if (!caseData || !workflowCaseData) {
    return <EmptyDetailState />;
  }

  // Determine case states
  const isSentCase =
    caseData.status === "completed" || caseData.status === "failed";
  const isScheduled = caseData.status === "scheduled";

  // Check if discharge summary needs to be generated
  const hasStructuredContent = Boolean(caseData.structuredContent?.patientName);
  const hasDischargeSummary =
    hasStructuredContent || Boolean(caseData.dischargeSummary?.trim());
  const needsGeneration =
    !hasDischargeSummary &&
    (caseData.status === "pending_review" || caseData.status === "ready");

  // Get call script from dynamic variables
  const callScript =
    typeof caseData.callScript === "object" && caseData.callScript !== null
      ? (((caseData.callScript as Record<string, unknown>)
          .call_script as string) ?? "")
      : caseData.dischargeSummary;

  // Determine contact availability
  const hasOwnerPhone = Boolean(caseData.owner.phone);
  const hasOwnerEmail = Boolean(caseData.owner.email);
  const phoneSent = caseData.phoneSent === "sent";
  const emailSent = caseData.emailSent === "sent";

  // Handler for canceling scheduled items
  const handleCancelCall = () => {
    if (onCancelScheduled) {
      onCancelScheduled({ cancelCall: true, cancelEmail: false });
    }
  };

  const handleCancelEmail = () => {
    if (onCancelScheduled) {
      onCancelScheduled({ cancelCall: false, cancelEmail: true });
    }
  };

  // Handler for scheduling remaining
  const handleScheduleRemaining = () => {
    if (caseData) {
      scheduleRemainingMutation.mutate({ caseId: caseData.caseId });
    }
  };

  // Determine if we should show action section
  // Show for: ready, pending_review, scheduled, failed, or partial delivery
  const showActionSection =
    caseData.status === "ready" ||
    caseData.status === "pending_review" ||
    caseData.status === "scheduled" ||
    caseData.status === "failed" ||
    (phoneSent && !emailSent && hasOwnerEmail) ||
    (!phoneSent && emailSent && hasOwnerPhone);

  // Only show scheduled card if there are PENDING items to display
  // Don't show for completed/failed items (scheduledFor timestamps persist after delivery)
  const hasActuallyScheduledCall =
    caseData.phoneSent === "pending" && Boolean(caseData.scheduledCallFor);
  const hasActuallyScheduledEmail =
    caseData.emailSent === "pending" && Boolean(caseData.scheduledEmailFor);
  const showScheduledCard =
    hasActuallyScheduledCall || hasActuallyScheduledEmail;

  return (
    <div className="flex h-full flex-col">
      {/* Patient/Owner Card with integrated status badge and delivery indicators */}
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
          phoneStatus={caseData.phoneSent}
          emailStatus={caseData.emailSent}
          onDelete={onDelete}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Scheduled Info Card - only show when there's scheduled delivery */}
        {showScheduledCard && (
          <StatusOverviewCard
            status={caseData.status}
            phoneStatus={caseData.phoneSent}
            emailStatus={caseData.emailSent}
            scheduledCallFor={caseData.scheduledCallFor}
            scheduledEmailFor={caseData.scheduledEmailFor}
            hasOwnerPhone={hasOwnerPhone}
            hasOwnerEmail={hasOwnerEmail}
            ownerPhone={caseData.owner.phone}
            ownerEmail={caseData.owner.email}
            onCancelCall={handleCancelCall}
            onCancelEmail={handleCancelEmail}
            isCancelling={isCancelling}
          />
        )}

        {/* Communications Intelligence - AI-powered call insights */}
        <CommunicationsIntelligenceCard
          scheduledCall={caseData.scheduledCall}
          urgentReasonSummary={caseData.scheduledCall?.urgentReasonSummary}
          needsAttention={caseData.needsAttention}
          attentionTypes={caseData.attentionTypes}
          attentionSeverity={caseData.attentionSeverity}
          attentionSummary={caseData.attentionSummary}
        />

        {/* Smart Action Section - Context-aware actions */}
        {showActionSection && (
          <SmartActionSection
            status={caseData.status}
            phoneStatus={caseData.phoneSent}
            emailStatus={caseData.emailSent}
            scheduledCallFor={caseData.scheduledCallFor}
            scheduledEmailFor={caseData.scheduledEmailFor}
            hasOwnerPhone={hasOwnerPhone}
            hasOwnerEmail={hasOwnerEmail}
            ownerPhone={caseData.owner.phone}
            ownerEmail={caseData.owner.email}
            deliveryToggles={deliveryToggles}
            onToggleChange={onToggleChange}
            onApprove={onApprove}
            onRetry={onRetry}
            onCancelScheduled={onCancelScheduled}
            onScheduleRemaining={handleScheduleRemaining}
            isSubmitting={isSubmitting}
            isCancelling={isCancelling}
            needsGeneration={needsGeneration}
            testModeEnabled={testModeEnabled}
            failureReason={caseData.scheduledCall?.endedReason}
          />
        )}

        {/* Communication Preview - Inline with expand/collapse */}
        <CommunicationPreview
          callScript={callScript}
          emailContent={caseData.emailContent}
          dischargeSummary={caseData.dischargeSummary}
          structuredContent={caseData.structuredContent}
          scheduledCall={caseData.scheduledCall}
          phoneSent={phoneSent}
          emailSent={emailSent}
          hasOwnerPhone={hasOwnerPhone}
          hasOwnerEmail={hasOwnerEmail}
        />

        {/* Workflow Timeline - Collapsible, shown for sent/scheduled cases */}
        {(isSentCase || isScheduled) && (
          <Collapsible open={workflowOpen} onOpenChange={setWorkflowOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white/50 px-4 py-3 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Workflow Timeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/outbound/workflow/${caseData.caseId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open</span>
                  </Link>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      workflowOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-900/50">
                <WorkflowCanvas
                  caseData={workflowCaseData}
                  className="h-[300px] min-h-[300px]"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
