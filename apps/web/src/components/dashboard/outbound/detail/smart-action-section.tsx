import type { DischargeCaseStatus, DeliveryToggles } from "../types";
import { PendingReviewActions } from "./smart-action-section/pending-review-actions";
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
  testModeEnabled?: boolean;
  failureReason?: string | null;
  /** Whether the current user is a superadmin (role='admin') */
  isSuperAdmin?: boolean;
}

/**
 * Smart Action Section - Context-aware component that shows different UI based on case state
 *
 * Routes to appropriate sub-component:
 * - PendingReviewActions: For ready/pending_review cases (schedule UI)
 * - ScheduledActions: For fully scheduled cases
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
  ownerPhone: _ownerPhone,
  ownerEmail: _ownerEmail,
  deliveryToggles,
  onToggleChange: _onToggleChange,
  onApprove,
  onRetry,
  onCancelScheduled,
  isSubmitting,
  isCancelling,
  testModeEnabled,
  failureReason,
  isSuperAdmin,
}: SmartActionSectionProps) {
  // State: Ready to Send / Pending Review - show schedule UI
  // Only show if user is a superadmin
  if (status === "ready" || status === "pending_review") {
    if (!isSuperAdmin) {
      return null;
    }
    return (
      <PendingReviewActions
        hasOwnerPhone={hasOwnerPhone}
        hasOwnerEmail={hasOwnerEmail}
        deliveryToggles={deliveryToggles}
        onApprove={onApprove}
        isSubmitting={isSubmitting}
        testModeEnabled={testModeEnabled}
      />
    );
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
