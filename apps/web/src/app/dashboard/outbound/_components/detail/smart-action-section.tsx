import type { DischargeCaseStatus, DeliveryToggles } from "../types";
import { ReadyToSendActions } from "./smart-action-section/ready-to-send-actions";
import { ScheduledActions } from "./smart-action-section/scheduled-actions";
import { PartialDeliveryActions } from "./smart-action-section/partial-delivery-actions";
import { CompletedSummary } from "./smart-action-section/completed-summary";

interface SmartActionSectionProps {
  status: DischargeCaseStatus;
  phoneStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  emailStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  scheduledCallFor: string | null;
  scheduledEmailFor: string | null;
  hasOwnerPhone: boolean;
  hasOwnerEmail: boolean;
  ownerPhone: string | null;
  ownerEmail: string | null;
  deliveryToggles: DeliveryToggles;
  onToggleChange: (toggles: DeliveryToggles) => void;
  onApprove: (immediate?: boolean) => void;
  onRetry?: () => void;
  onCancelScheduled?: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  onScheduleRemaining?: () => void;
  isSubmitting: boolean;
  isCancelling?: boolean;
  needsGeneration?: boolean;
  testModeEnabled?: boolean;
  failureReason?: string | null;
}

/**
 * Smart Action Section - Context-aware component that shows different UI based on case state
 *
 * Routes to appropriate sub-component:
 * - ReadyToSendActions: For unsent cases (ready/pending_review)
 * - ScheduledActions: For fully scheduled cases
 * - PartialDeliveryActions: For partial sent/scheduled states
 * - CompletedSummary: For completed/failed cases
 */
export function SmartActionSection({
  status,
  phoneStatus,
  emailStatus,
  scheduledCallFor,
  scheduledEmailFor,
  hasOwnerPhone,
  hasOwnerEmail,
  ownerPhone,
  ownerEmail,
  deliveryToggles,
  onToggleChange,
  onApprove,
  onRetry,
  onCancelScheduled,
  onScheduleRemaining,
  isSubmitting,
  isCancelling,
  needsGeneration,
  testModeEnabled,
  failureReason,
}: SmartActionSectionProps) {
  // State: Ready to Send
  if (status === "ready" || status === "pending_review") {
    return (
      <ReadyToSendActions
        deliveryToggles={deliveryToggles}
        onToggleChange={onToggleChange}
        onApprove={onApprove}
        isSubmitting={isSubmitting}
        hasOwnerPhone={hasOwnerPhone}
        hasOwnerEmail={hasOwnerEmail}
        ownerPhone={ownerPhone}
        ownerEmail={ownerEmail}
        needsGeneration={needsGeneration}
        testModeEnabled={testModeEnabled}
      />
    );
  }

  // State: Fully Scheduled
  if (status === "scheduled") {
    // Check if it's actually a partial scheduled state
    const phoneSent = phoneStatus === "sent";
    const emailSent = emailStatus === "sent";
    const phoneScheduled = Boolean(scheduledCallFor);
    const emailScheduled = Boolean(scheduledEmailFor);

    // If one is sent/scheduled and one is not, show partial actions
    const isPartialScheduled =
      ((phoneSent || phoneScheduled) &&
        !(emailSent || emailScheduled) &&
        hasOwnerEmail) ||
      ((emailSent || emailScheduled) &&
        !(phoneSent || phoneScheduled) &&
        hasOwnerPhone);

    if (isPartialScheduled) {
      return (
        <PartialDeliveryActions
          phoneStatus={phoneStatus}
          emailStatus={emailStatus}
          scheduledCallFor={scheduledCallFor}
          scheduledEmailFor={scheduledEmailFor}
          hasOwnerPhone={hasOwnerPhone}
          hasOwnerEmail={hasOwnerEmail}
          ownerPhone={ownerPhone}
          ownerEmail={ownerEmail}
          deliveryToggles={deliveryToggles}
          onToggleChange={onToggleChange}
          onScheduleRemaining={onScheduleRemaining}
          onCancelScheduled={onCancelScheduled}
          isSubmitting={isSubmitting}
          isCancelling={isCancelling}
        />
      );
    }

    // Fully scheduled - show cancel options
    return (
      <ScheduledActions
        scheduledCallFor={scheduledCallFor}
        scheduledEmailFor={scheduledEmailFor}
        onCancelScheduled={onCancelScheduled}
        isCancelling={isCancelling}
      />
    );
  }

  // State: Completed or Failed
  if (status === "completed" || status === "failed") {
    // Check for partial delivery (one sent, one not)
    const phoneSent = phoneStatus === "sent";
    const emailSent = emailStatus === "sent";
    const isPartialDelivery =
      (phoneSent && !emailSent && hasOwnerEmail) ||
      (!phoneSent && emailSent && hasOwnerPhone);

    if (isPartialDelivery) {
      return (
        <PartialDeliveryActions
          phoneStatus={phoneStatus}
          emailStatus={emailStatus}
          scheduledCallFor={scheduledCallFor}
          scheduledEmailFor={scheduledEmailFor}
          hasOwnerPhone={hasOwnerPhone}
          hasOwnerEmail={hasOwnerEmail}
          ownerPhone={ownerPhone}
          ownerEmail={ownerEmail}
          deliveryToggles={deliveryToggles}
          onToggleChange={onToggleChange}
          onScheduleRemaining={onScheduleRemaining}
          onCancelScheduled={onCancelScheduled}
          isSubmitting={isSubmitting}
          isCancelling={isCancelling}
        />
      );
    }

    return (
      <CompletedSummary
        status={status}
        phoneStatus={phoneStatus}
        emailStatus={emailStatus}
        failureReason={failureReason}
        onRetry={onRetry}
        isRetrying={isSubmitting}
      />
    );
  }

  return null;
}
