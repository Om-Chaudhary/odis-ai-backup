import type { DischargeCaseStatus, DeliveryToggles } from "../types";
import { ScheduledActions } from "./smart-action-section/scheduled-actions";
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
  onScheduleRemaining?: (options: {
    scheduleCall: boolean;
    scheduleEmail: boolean;
    immediate?: boolean;
  }) => void;
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
 * - ScheduledActions: For fully scheduled cases
 * - CompletedSummary: For completed/failed cases
 *
 * Note: Ready/pending_review states are now handled inline in ActivityTimeline component
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
  isSubmitting,
  isCancelling,
  needsGeneration,
  testModeEnabled,
  failureReason,
}: SmartActionSectionProps) {
  // State: Ready to Send - now handled inline in ActivityTimeline
  if (status === "ready" || status === "pending_review") {
    return null;
  }

  // State: Fully Scheduled
  if (status === "scheduled") {
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
