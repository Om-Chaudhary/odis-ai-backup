"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@odis-ai/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/ui/collapsible";
import { ExternalLink, FileText, Phone, Mail, ChevronDown } from "lucide-react";
import { api } from "~/trpc/client";
import type {
  DeliveryToggles,
  DischargeCaseStatus,
  SoapNote,
} from "./types";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";
import {
  EmptyDetailState,
  ClinicalNotesSection,
} from "./detail";
import { PatientOwnerCard } from "./detail/patient-owner-card";
import { DeliveryStatusHero } from "./detail/delivery-status-hero";
import { QuickActionPanel } from "./detail/quick-action-panel";
import { WorkflowCanvas, type CaseDataForWorkflow } from "./detail/workflow";
import { CallTabContent } from "./detail/communication-tabs/call-tab-content";
import { EmailTabContent } from "./detail/communication-tabs/email-tab-content";

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
  onRetry?: () => void;
  isSubmitting: boolean;
  testModeEnabled?: boolean;
  onDelete?: () => void;
}

/**
 * Case Detail Panel Component (Redesigned)
 *
 * Optimized for veterinarians with emphasis on:
 * 1. Clear delivery status at the top
 * 2. Streamlined action panel with delivery options
 * 3. Clinical context in collapsible sections
 * 4. Communication previews accessible but not intrusive
 *
 * No skip button - cases remain in queue until explicitly sent
 */
export function OutboundCaseDetail({
  caseData,
  deliveryToggles,
  onToggleChange,
  onApprove,
  onRetry,
  isSubmitting,
  testModeEnabled = false,
  onDelete,
}: OutboundCaseDetailProps) {
  // Collapsible section states
  const [clinicalNotesOpen, setClinicalNotesOpen] = useState(false);
  const [callScriptOpen, setCallScriptOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
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

  // Suppress unused - keeping for future partial delivery feature
  void scheduleRemainingMutation;

  // Early return after all hooks are called
  if (!caseData || !workflowCaseData) {
    return <EmptyDetailState />;
  }

  // Determine case states
  const isEditable =
    caseData.status === "pending_review" || caseData.status === "ready";
  const showRetry = caseData.status === "failed";
  const isSentCase =
    caseData.status === "completed" || caseData.status === "failed";
  const isScheduled = caseData.status === "scheduled";

  // Check for partial delivery (one sent, one not)
  const phoneSent = caseData.phoneSent === "sent";
  const emailSent = caseData.emailSent === "sent";
  const isPartialDelivery =
    (phoneSent && !emailSent && !!caseData.owner.email) ||
    (!phoneSent && emailSent && !!caseData.owner.phone);

  // Show action panel for editable, partial, or failed cases
  const showActionPanel = isEditable || showRetry || isPartialDelivery;

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
  const hasClinicalNotes = hasIdexxNotes || hasSoapNotes;

  // Determine what to show for communication previews
  const hasOwnerPhone = Boolean(caseData.owner.phone);
  const hasOwnerEmail = Boolean(caseData.owner.email);
  const phoneCanBeSent = hasOwnerPhone && !phoneSent;
  const emailCanBeSent = hasOwnerEmail && !emailSent;

  return (
    <div className="flex h-full flex-col">
      {/* Patient/Owner Card */}
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
        {/* Delivery Status Hero - Always visible at top */}
        <DeliveryStatusHero
          status={caseData.status}
          emailStatus={caseData.emailSent}
          phoneStatus={caseData.phoneSent}
          scheduledEmailFor={caseData.scheduledEmailFor}
          scheduledCallFor={caseData.scheduledCallFor}
          scheduledCall={
            caseData.scheduledCall
              ? {
                  id: caseData.scheduledCall.id,
                  status: caseData.scheduledCall.status,
                  durationSeconds: caseData.scheduledCall.durationSeconds,
                  endedReason: caseData.scheduledCall.endedReason,
                  transcript: caseData.scheduledCall.transcript,
                  summary: caseData.scheduledCall.summary,
                }
              : null
          }
          hasOwnerEmail={hasOwnerEmail}
          hasOwnerPhone={hasOwnerPhone}
          ownerPhone={caseData.owner.phone}
          ownerEmail={caseData.owner.email}
        />

        {/* Quick Action Panel - For actionable cases */}
        {showActionPanel && (
          <QuickActionPanel
            status={caseData.status}
            needsGeneration={needsGeneration}
            deliveryToggles={deliveryToggles}
            onToggleChange={onToggleChange}
            onApprove={onApprove}
            onRetry={onRetry}
            isSubmitting={isSubmitting}
            testModeEnabled={testModeEnabled}
            hasOwnerPhone={hasOwnerPhone}
            hasOwnerEmail={hasOwnerEmail}
            ownerPhone={caseData.owner.phone}
            ownerEmail={caseData.owner.email}
            failureReason={caseData.scheduledCall?.endedReason}
            phoneStatus={caseData.phoneSent}
            emailStatus={caseData.emailSent}
          />
        )}

        {/* Clinical Notes - Collapsible */}
        {hasClinicalNotes && (
          <Collapsible open={clinicalNotesOpen} onOpenChange={setClinicalNotesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white/50 px-4 py-3 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium">Clinical Notes</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition-transform ${
                    clinicalNotesOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ClinicalNotesSection
                idexxNotes={caseData.idexxNotes}
                soapNotes={caseData.soapNotes}
                hasIdexxNotes={hasIdexxNotes}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Call Script Preview - Collapsible */}
        <Collapsible open={callScriptOpen} onOpenChange={setCallScriptOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white/50 px-4 py-3 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">
                  {phoneSent && caseData.scheduledCall?.transcript
                    ? "Call Transcript"
                    : "Call Script"}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform ${
                  callScriptOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="rounded-lg border border-slate-200 bg-white/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <CallTabContent
                caseData={{
                  scheduledCall: caseData.scheduledCall,
                }}
                callScript={callScript}
                phoneWasSent={phoneSent}
                phoneCanBeSent={phoneCanBeSent}
                hasOwnerPhone={hasOwnerPhone}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Email Preview - Collapsible */}
        <Collapsible open={emailPreviewOpen} onOpenChange={setEmailPreviewOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white/50 px-4 py-3 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">
                  {emailSent ? "Email Sent" : "Email Preview"}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform ${
                  emailPreviewOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="rounded-lg border border-slate-200 bg-white/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <EmailTabContent
                caseData={{
                  structuredContent: caseData.structuredContent,
                  emailContent: caseData.emailContent,
                  dischargeSummary: caseData.dischargeSummary,
                }}
                emailWasSent={emailSent}
                emailCanBeSent={emailCanBeSent}
                hasOwnerEmail={hasOwnerEmail}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

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
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-slate-500 hover:text-teal-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Open</span>
                    </Button>
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
