"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useClinic } from "@odis-ai/shared/ui/clinic-context";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import { ExternalLink, ChevronDown } from "lucide-react";
import { api } from "~/trpc/client";
import type { DeliveryToggles, TransformedCase } from "./types";
import { EmptyDetailState } from "./detail";
import { CompactPatientHeader } from "./detail/compact-patient-header";
import { ActivityTimeline } from "./detail/activity-timeline";
import { SmartActionSection } from "./detail/smart-action-section";
import { SimplifiedContentPreview } from "./detail/simplified-content-preview";
import { WorkflowCanvas, type CaseDataForWorkflow } from "./detail/workflow";

interface OutboundCaseDetailProps {
  caseData: TransformedCase | null;
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
  const { clinicSlug } = useClinic();
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
  const handleScheduleRemaining = (options: {
    scheduleCall: boolean;
    scheduleEmail: boolean;
    immediate?: boolean;
  }) => {
    if (caseData) {
      scheduleRemainingMutation.mutate({
        caseId: caseData.caseId,
        scheduleCall: options.scheduleCall,
        scheduleEmail: options.scheduleEmail,
        immediateDelivery: options.immediate ?? false,
      });
    }
  };

  // Determine if we should show action section
  // Show for: ready, pending_review, scheduled, failed
  // Partial delivery is now handled in timeline
  const showActionSection =
    caseData.status === "ready" ||
    caseData.status === "pending_review" ||
    caseData.status === "scheduled" ||
    caseData.status === "failed";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Compact Patient Header */}
      <div className="border-b">
        <CompactPatientHeader
          patient={{
            name: caseData.patient.name,
            species: caseData.patient.species,
            breed: caseData.patient.breed,
            dateOfBirth: caseData.patient.dateOfBirth,
          }}
          owner={{
            name: caseData.owner.name,
          }}
          ownerPhone={caseData.owner.phone}
          ownerEmail={caseData.owner.email}
          attentionTypes={caseData.attentionTypes ?? []}
          attentionSeverity={caseData.attentionSeverity}
          onClose={onDelete}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Activity Timeline */}
        <ActivityTimeline
          callStatus={caseData.phoneSent}
          emailStatus={caseData.emailSent}
          scheduledCallFor={caseData.scheduledCallFor}
          scheduledEmailFor={caseData.scheduledEmailFor}
          callEndedReason={caseData.scheduledCall?.endedReason}
          callDuration={caseData.scheduledCall?.durationSeconds}
          callCompletedAt={caseData.scheduledCall?.endedAt}
          emailSentAt={null}
          attentionSeverity={caseData.attentionSeverity}
          hasOwnerPhone={hasOwnerPhone}
          hasOwnerEmail={hasOwnerEmail}
          ownerPhone={caseData.owner.phone}
          ownerEmail={caseData.owner.email}
          onRetryCall={onRetry}
          onCancelCall={handleCancelCall}
          onCancelEmail={handleCancelEmail}
          onScheduleRemaining={handleScheduleRemaining}
          showScheduleRemainingCall={
            !phoneSent && !caseData.scheduledCallFor && hasOwnerPhone
          }
          showScheduleRemainingEmail={
            !emailSent && !caseData.scheduledEmailFor && hasOwnerEmail
          }
          isSubmitting={isSubmitting || isCancelling}
          testModeEnabled={testModeEnabled}
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

        {/* Simplified Content Preview - No previews, expandable only */}
        <SimplifiedContentPreview
          callScript={callScript}
          emailContent={caseData.emailContent}
          dischargeSummary={caseData.dischargeSummary}
          structuredContent={caseData.structuredContent}
          scheduledCall={caseData.scheduledCall}
          phoneSent={phoneSent}
          emailSent={emailSent}
          hasOwnerPhone={hasOwnerPhone}
          hasOwnerEmail={hasOwnerEmail}
          scheduledCallFor={caseData.scheduledCallFor}
          scheduledEmailFor={caseData.scheduledEmailFor}
          ownerSentimentData={caseData.ownerSentimentData}
          petHealthData={caseData.petHealthData}
          followUpData={caseData.followUpData}
          patientName={caseData.patient.name}
          ownerName={caseData.owner.name ?? undefined}
        />

        {/* Workflow Timeline - Collapsible, shown for sent/scheduled cases */}
        {(isSentCase || isScheduled) && (
          <Collapsible open={workflowOpen} onOpenChange={setWorkflowOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between rounded-lg border border-teal-200/40 bg-teal-100/80 px-4 py-3 hover:bg-teal-100/90"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Workflow Timeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/${clinicSlug}/outbound/workflow/${caseData.caseId}`}
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
              <div className="overflow-hidden rounded-lg border border-teal-200/40 bg-teal-100/80">
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
