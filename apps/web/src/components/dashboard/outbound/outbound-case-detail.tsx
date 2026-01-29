"use client";

import { useState } from "react";
import { api } from "~/trpc/client";
import type { DeliveryToggles, TransformedCase } from "./types";
import { EmptyDetailState } from "./detail";
import { CompactPatientHeader } from "./detail/compact-patient-header";
import { CommunicationStatusCards } from "./detail/communication-status-cards";
import { CommunicationTabsPanel } from "./detail/communication-tabs-panel";
import { SmartActionSection } from "./detail/smart-action-section";
import { NeedsAttentionCard } from "./detail/needs-attention-card";
import { hasActionableAttentionTypes } from "@odis-ai/shared/util";

interface OutboundCaseDetailProps {
  caseData: TransformedCase | null;
  deliveryToggles: DeliveryToggles;
  onToggleChange: (toggles: DeliveryToggles) => void;
  onApprove: (immediate?: boolean) => void;
  onRetry?: () => void;
  onPhoneReschedule?: (options: {
    delayDays: number;
    immediate: boolean;
  }) => void;
  onEmailReschedule?: (options: {
    delayDays: number;
    immediate: boolean;
  }) => void;
  onCancelScheduled?: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  onUpdateScheduleDelays?: (options: {
    callDelayDays?: number;
    emailDelayDays?: number;
  }) => void;
  isSubmitting: boolean;
  isCancellingCall?: boolean;
  isCancellingEmail?: boolean;
  isUpdatingSchedule?: boolean;
  isRescheduling?: boolean;
  testModeEnabled?: boolean;
  onDelete?: () => void;
  /** Default delay days for calls (from user settings) */
  defaultCallDelayDays?: number;
  /** Default delay days for emails (from user settings) */
  defaultEmailDelayDays?: number;
  /** Whether the current user is a superadmin (role='admin') */
  isSuperAdmin?: boolean;
}

/**
 * Case Detail Panel Component (Redesigned v2)
 *
 * Glanceable design with:
 * 1. Patient/Owner card at top
 * 2. Communication status cards (phone/email with toggles and delays)
 * 3. Context-aware action section
 * 4. Communication tabs panel (all states)
 */
export function OutboundCaseDetail({
  caseData,
  deliveryToggles,
  onToggleChange,
  onApprove,
  onRetry,
  onPhoneReschedule,
  onEmailReschedule,
  onCancelScheduled,
  onUpdateScheduleDelays,
  isSubmitting,
  isCancellingCall = false,
  isCancellingEmail = false,
  isUpdatingSchedule = false,
  isRescheduling = false,
  testModeEnabled = false,
  onDelete,
  defaultCallDelayDays = 2,
  defaultEmailDelayDays = 1,
  isSuperAdmin = false,
}: OutboundCaseDetailProps) {
  // Local state for delay days (allows optimistic UI)
  const [callDelayDays, setCallDelayDays] = useState(defaultCallDelayDays);
  const [emailDelayDays, setEmailDelayDays] = useState(defaultEmailDelayDays);

  // Mutation for scheduling remaining outreach (for partial delivery cases)
  const utils = api.useUtils();
  const scheduleRemainingMutation =
    api.outbound.scheduleRemainingOutreach.useMutation({
      onSuccess: () => {
        void utils.outbound.listDischargeCases.invalidate();
      },
    });

  // Mutation for updating communication preferences (immediate persistence)
  const updatePrefsMutation =
    api.outbound.updateCommunicationPreferences.useMutation({
      onSuccess: () => {
        void utils.outbound.listDischargeCases.invalidate();
      },
    });

  // Early return after all hooks are called
  if (!caseData) {
    return <EmptyDetailState />;
  }

  // Determine case states
  const isScheduled = caseData.status === "scheduled";

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
  const phoneFailed = caseData.phoneSent === "failed";
  const emailFailed = caseData.emailSent === "failed";

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

  // Handler for retry
  const handlePhoneRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleEmailRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  // Handler for toggling delivery channels (with immediate persistence)
  const handlePhoneToggle = (enabled: boolean) => {
    onToggleChange({ ...deliveryToggles, phoneEnabled: enabled });

    // Persist immediately if case exists
    if (caseData?.caseId) {
      updatePrefsMutation.mutate({
        caseId: caseData.caseId,
        callEnabled: enabled,
        emailEnabled: deliveryToggles.emailEnabled,
      });
    }
  };

  const handleEmailToggle = (enabled: boolean) => {
    onToggleChange({ ...deliveryToggles, emailEnabled: enabled });

    // Persist immediately if case exists
    if (caseData?.caseId) {
      updatePrefsMutation.mutate({
        caseId: caseData.caseId,
        callEnabled: deliveryToggles.phoneEnabled,
        emailEnabled: enabled,
      });
    }
  };

  // Handler for delay changes - auto-saves
  const handleCallDelayChange = (days: number) => {
    setCallDelayDays(days);
    if (onUpdateScheduleDelays && isScheduled) {
      onUpdateScheduleDelays({ callDelayDays: days });
    }
  };

  const handleEmailDelayChange = (days: number) => {
    setEmailDelayDays(days);
    if (onUpdateScheduleDelays && isScheduled) {
      onUpdateScheduleDelays({ emailDelayDays: days });
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
  // Show for: ready, pending_review, scheduled
  // Note: Failed cases have retry/reschedule in the status cards, so no separate action section needed
  const showActionSection =
    caseData.status === "ready" ||
    caseData.status === "pending_review" ||
    caseData.status === "scheduled";

  // Show status cards for ALL statuses (they handle each state internally)
  const showStatusCards = true;

  // Show tabs panel for ALL states (phone tab disabled when not sent, email tab always enabled)
  const showContentTabs = true;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Compact Patient Header */}
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

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Communication Status Cards - Side by side phone/email status */}
        {showStatusCards && (
          <CommunicationStatusCards
            // Phone props
            phoneStatus={caseData.phoneSent}
            phoneEnabled={deliveryToggles.phoneEnabled}
            phoneScheduledFor={caseData.scheduledCallFor}
            phoneCompletedAt={caseData.scheduledCall?.endedAt ?? null}
            phoneFailureReason={caseData.scheduledCall?.endedReason ?? null}
            phoneDelayDays={callDelayDays}
            onPhoneToggle={handlePhoneToggle}
            onPhoneDelayChange={handleCallDelayChange}
            onPhoneCancel={isScheduled ? handleCancelCall : undefined}
            onPhoneRetry={phoneFailed ? handlePhoneRetry : undefined}
            onPhoneReschedule={
              phoneFailed && onPhoneReschedule ? onPhoneReschedule : undefined
            }
            hasOwnerPhone={hasOwnerPhone}
            // Email props
            emailStatus={caseData.emailSent}
            emailEnabled={deliveryToggles.emailEnabled}
            emailScheduledFor={caseData.scheduledEmailFor}
            emailSentAt={caseData.scheduledEmail?.sentAt ?? null}
            emailFailureReason={emailFailed ? "Email delivery failed" : null}
            emailDelayDays={emailDelayDays}
            onEmailToggle={handleEmailToggle}
            onEmailDelayChange={handleEmailDelayChange}
            onEmailCancel={isScheduled ? handleCancelEmail : undefined}
            onEmailRetry={emailFailed ? handleEmailRetry : undefined}
            onEmailReschedule={
              emailFailed && onEmailReschedule ? onEmailReschedule : undefined
            }
            hasOwnerEmail={hasOwnerEmail}
            // Global
            isSubmitting={isSubmitting || isUpdatingSchedule}
            isPhoneCancelling={isCancellingCall}
            isEmailCancelling={isCancellingEmail}
            isRescheduling={isRescheduling}
            caseStatus={caseData.status}
          />
        )}

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
            isCancelling={isCancellingCall || isCancellingEmail}
            testModeEnabled={testModeEnabled}
            failureReason={caseData.scheduledCall?.endedReason}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {/* Needs Attention Card */}
        {hasActionableAttentionTypes(caseData.attentionTypes) && (
          <NeedsAttentionCard
            attentionTypes={caseData.attentionTypes ?? []}
            attentionSeverity={caseData.attentionSeverity}
            attentionSummary={caseData.attentionSummary}
            className="mb-6"
          />
        )}

        {/* Communication Tabs Panel - Shows for all states */}
        {showContentTabs && (
          <CommunicationTabsPanel
            scheduledCall={caseData.scheduledCall}
            phoneSent={phoneSent}
            emailSent={emailSent}
            hasOwnerPhone={hasOwnerPhone}
            hasOwnerEmail={hasOwnerEmail}
            callScript={callScript}
            emailContent={caseData.emailContent}
            dischargeSummary={caseData.dischargeSummary}
            structuredContent={caseData.structuredContent}
            ownerSentimentData={caseData.ownerSentimentData}
            petHealthData={caseData.petHealthData}
            followUpData={caseData.followUpData}
            patientName={caseData.patient.name}
            ownerName={caseData.owner.name ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
