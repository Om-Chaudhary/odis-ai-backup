"use client";

import { Phone, Mail, X, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@odis-ai/shared/ui/card";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import { cn, formatRelativeTime } from "@odis-ai/shared/util";
import type { DeliveryStatus } from "../types";

// Delay options for scheduling (in days)
const DELAY_OPTIONS = [0, 1, 2, 3, 5, 7];

interface CommunicationStatusCardsProps {
  // Phone state
  phoneStatus: DeliveryStatus;
  phoneEnabled: boolean;
  phoneScheduledFor: string | null;
  phoneCompletedAt: string | null;
  phoneFailureReason: string | null;
  phoneDelayDays: number;
  onPhoneToggle: (enabled: boolean) => void;
  onPhoneDelayChange: (days: number) => void;
  onPhoneCancel?: () => void;
  onPhoneRetry?: () => void;
  hasOwnerPhone: boolean;

  // Email state
  emailStatus: DeliveryStatus;
  emailEnabled: boolean;
  emailScheduledFor: string | null;
  emailSentAt: string | null;
  emailFailureReason: string | null;
  emailDelayDays: number;
  onEmailToggle: (enabled: boolean) => void;
  onEmailDelayChange: (days: number) => void;
  onEmailCancel?: () => void;
  onEmailRetry?: () => void;
  hasOwnerEmail: boolean;

  // Global
  isSubmitting: boolean;
  isPhoneCancelling?: boolean;
  isEmailCancelling?: boolean;
  caseStatus: "pending_review" | "ready" | "scheduled" | "completed" | "failed" | "in_progress";
}

type CardStatus = "to_schedule" | "scheduled" | "delivered" | "failed" | "not_available" | "pending";

interface StatusBadgeProps {
  status: CardStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    to_schedule: {
      label: "To Schedule",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    },
    delivered: {
      label: "Delivered",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    },
    not_available: {
      label: "N/A",
      className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    },
  };

  const { label, className } = config[status];

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

interface ChannelCardProps {
  type: "phone" | "email";
  cardStatus: CardStatus;
  enabled: boolean;
  scheduledFor: string | null;
  completedAt: string | null;
  failureReason: string | null;
  delayDays: number;
  hasContact: boolean;
  onToggle: (enabled: boolean) => void;
  onDelayChange: (days: number) => void;
  onCancel?: () => void;
  onRetry?: () => void;
  isSubmitting: boolean;
  isCancelling?: boolean;
  showControls: boolean;
}

function ChannelCard({
  type,
  cardStatus,
  enabled,
  scheduledFor,
  completedAt,
  failureReason,
  delayDays,
  hasContact,
  onToggle,
  onDelayChange,
  onCancel,
  onRetry,
  isSubmitting,
  isCancelling,
  showControls,
}: ChannelCardProps) {
  const Icon = type === "phone" ? Phone : Mail;
  const label = type === "phone" ? "Phone Call" : "Email";

  // Determine what to show based on status
  const isToSchedule = cardStatus === "to_schedule";
  const isScheduled = cardStatus === "scheduled";
  const isDelivered = cardStatus === "delivered";
  const isFailed = cardStatus === "failed";
  const isPending = cardStatus === "pending";
  const isNotAvailable = cardStatus === "not_available";

  // Get relative time for delivered items
  const relativeTime = completedAt ? formatRelativeTime(completedAt) : null;

  // Format failure reason for display
  const displayFailureReason = failureReason
    ? formatFailureReason(failureReason)
    : "Delivery failed";

  return (
    <Card className={cn(
      "flex-1 transition-colors",
      isNotAvailable && "opacity-60",
      isFailed && "border-red-200 dark:border-red-800/50",
      isDelivered && "border-emerald-200 dark:border-emerald-800/50",
      isScheduled && "border-teal-200 dark:border-teal-800/50",
      isToSchedule && "border-amber-200 dark:border-amber-800/50",
    )}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Checkbox - only show for pending/ready cases with contact info */}
            {showControls && hasContact && (
              <Checkbox
                id={`${type}-toggle`}
                checked={enabled}
                onCheckedChange={(checked) => onToggle(Boolean(checked))}
                disabled={isSubmitting}
              />
            )}
            <Icon className={cn(
              "h-4 w-4",
              isDelivered && "text-emerald-600",
              isFailed && "text-red-500",
              isScheduled && "text-teal-600",
              isPending && "text-amber-600",
              isToSchedule && "text-amber-600",
              isNotAvailable && "text-slate-400",
            )} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {label}
            </span>
          </div>
          <StatusBadge status={cardStatus} />
        </div>

        {/* Content based on status */}
        <div className="mt-3">
          {/* Scheduled: Show delay dropdown and cancel */}
          {isScheduled && (
            <div className="space-y-2">
              {showControls && (
                <div className="flex items-center gap-2">
                  <Select
                    value={String(delayDays)}
                    onValueChange={(value) => onDelayChange(Number(value))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_OPTIONS.map((days) => (
                        <SelectItem key={days} value={String(days)}>
                          {days === 0 ? "Same day" : days}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {delayDays > 0 && <span className="text-sm text-slate-500">day{delayDays > 1 ? "s" : ""}</span>}
                </div>
              )}
              {scheduledFor && (
                <p className="text-xs text-teal-600 dark:text-teal-400">
                  {formatScheduledTime(scheduledFor)}
                </p>
              )}
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting || isCancelling}
                  className="h-7 gap-1 text-xs text-slate-500 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                  {isCancelling ? "Cancelling..." : "Cancel"}
                </Button>
              )}
            </div>
          )}

          {/* Delivered: Show relative time */}
          {isDelivered && relativeTime && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {relativeTime}
            </p>
          )}

          {/* Failed: Show failure reason and retry */}
          {isFailed && (
            <div className="space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400">
                {displayFailureReason}
              </p>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  disabled={isSubmitting}
                  className="h-7 gap-1 text-xs text-slate-500 hover:text-teal-600"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </Button>
              )}
            </div>
          )}

          {/* Pending: Show "in progress" message */}
          {isPending && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Delivery in progress...
            </p>
          )}

          {/* Not available: Show reason */}
          {isNotAvailable && (
            <p className="text-sm text-slate-500">
              No {type === "phone" ? "phone number" : "email address"} on file
            </p>
          )}

          {/* To Schedule: Show delay dropdown for configuring schedule */}
          {isToSchedule && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Select
                  value={String(delayDays)}
                  onValueChange={(value) => onDelayChange(Number(value))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELAY_OPTIONS.map((days) => (
                      <SelectItem key={days} value={String(days)}>
                        {days === 0 ? "Same day" : days}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {delayDays > 0 && (
                  <span className="text-sm text-slate-500">
                    day{delayDays > 1 ? "s" : ""} after discharge
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Formats the scheduled time for display.
 */
function formatScheduledTime(scheduledFor: string): string {
  const date = new Date(scheduledFor);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats failure reasons for human-readable display.
 */
function formatFailureReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    // VAPI ended reasons
    "voicemail-reached": "Voicemail Detected",
    "voicemail": "Voicemail Detected",
    "machine-detected": "Voicemail Detected",
    "dial-no-answer": "No Answer",
    "customer-did-not-answer": "No Answer",
    "no-answer": "No Answer",
    "silence-timed-out": "No Response",
    "silence-timeout": "No Response",
    "failed-to-connect-call": "Connection Failed",
    "connection-error": "Connection Failed",
    "busy": "Line Busy",
    "customer-busy": "Line Busy",
    "rejected": "Call Rejected",
    "invalid-phone": "Invalid Phone Number",
    // Email failures
    "invalid-email": "No Email Address",
    "email-bounced": "Email Bounced",
    "email-rejected": "Email Rejected",
  };

  // Check for partial matches
  const lowerReason = reason.toLowerCase();
  for (const [key, display] of Object.entries(reasonMap)) {
    if (lowerReason.includes(key.toLowerCase())) {
      return display;
    }
  }

  // Return formatted version of original
  return reason.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Derives the card status from delivery status and other factors.
 */
function deriveCardStatus(
  deliveryStatus: DeliveryStatus,
  hasContact: boolean,
  scheduledFor: string | null,
  caseStatus: string
): CardStatus {
  if (!hasContact) {
    return "not_available";
  }

  // For pending_review/ready cases without scheduled time, show "to_schedule"
  if (["pending_review", "ready"].includes(caseStatus) && !scheduledFor) {
    return "to_schedule";
  }

  switch (deliveryStatus) {
    case "sent":
      return "delivered";
    case "failed":
      return "failed";
    case "pending":
      // Check if there's a scheduled time
      if (scheduledFor) {
        return "scheduled";
      }
      return "pending";
    case "not_applicable":
      return "not_available";
    default:
      // null or undefined - check if scheduled
      if (scheduledFor) {
        return "scheduled";
      }
      return "pending";
  }
}

/**
 * Communication Status Cards
 *
 * Displays side-by-side status cards for phone and email channels.
 * Shows appropriate controls based on case status:
 * - Scheduled: Checkboxes, delay dropdowns, cancel buttons
 * - Delivered: Relative time display
 * - Failed: Failure reason, retry button
 */
export function CommunicationStatusCards({
  // Phone props
  phoneStatus,
  phoneEnabled,
  phoneScheduledFor,
  phoneCompletedAt,
  phoneFailureReason,
  phoneDelayDays,
  onPhoneToggle,
  onPhoneDelayChange,
  onPhoneCancel,
  onPhoneRetry,
  hasOwnerPhone,
  // Email props
  emailStatus,
  emailEnabled,
  emailScheduledFor,
  emailSentAt,
  emailFailureReason,
  emailDelayDays,
  onEmailToggle,
  onEmailDelayChange,
  onEmailCancel,
  onEmailRetry,
  hasOwnerEmail,
  // Global
  isSubmitting,
  isPhoneCancelling,
  isEmailCancelling,
  caseStatus,
}: CommunicationStatusCardsProps) {
  // Determine if we should show controls (checkboxes, delay dropdowns)
  // Only for pending_review, ready, or scheduled cases
  const showControls = ["pending_review", "ready", "scheduled"].includes(caseStatus);

  // Derive card statuses
  const phoneCardStatus = deriveCardStatus(phoneStatus, hasOwnerPhone, phoneScheduledFor, caseStatus);
  const emailCardStatus = deriveCardStatus(emailStatus, hasOwnerEmail, emailScheduledFor, caseStatus);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ChannelCard
        type="phone"
        cardStatus={phoneCardStatus}
        enabled={phoneEnabled}
        scheduledFor={phoneScheduledFor}
        completedAt={phoneCompletedAt}
        failureReason={phoneFailureReason}
        delayDays={phoneDelayDays}
        hasContact={hasOwnerPhone}
        onToggle={onPhoneToggle}
        onDelayChange={onPhoneDelayChange}
        onCancel={onPhoneCancel}
        onRetry={onPhoneRetry}
        isSubmitting={isSubmitting}
        isCancelling={isPhoneCancelling}
        showControls={showControls}
      />
      <ChannelCard
        type="email"
        cardStatus={emailCardStatus}
        enabled={emailEnabled}
        scheduledFor={emailScheduledFor}
        completedAt={emailSentAt}
        failureReason={emailFailureReason}
        delayDays={emailDelayDays}
        hasContact={hasOwnerEmail}
        onToggle={onEmailToggle}
        onDelayChange={onEmailDelayChange}
        onCancel={onEmailCancel}
        onRetry={onEmailRetry}
        isSubmitting={isSubmitting}
        isCancelling={isEmailCancelling}
        showControls={showControls}
      />
    </div>
  );
}
