"use client";

import { useState } from "react";
import { Clock, X, RotateCcw, CalendarClock } from "lucide-react";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@odis-ai/shared/ui/popover";
import { cn, formatRelativeTime } from "@odis-ai/shared/util";
import { getShortFailureReason } from "../../shared/utils";
import type { DeliveryStatus } from "../types";

// Generate date options for the next 14 days
function getDateOptions(): { value: string; label: string; date: Date }[] {
  const options: { value: string; label: string; date: Date }[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    options.push({
      value: String(i),
      label,
      date,
    });
  }

  return options;
}

const DATE_OPTIONS = getDateOptions();

/** Reschedule options with delay days - showing actual dates */
function getRescheduleOptions(): { value: number; label: string }[] {
  const today = new Date();
  const delays = [0, 1, 2, 3, 4, 5]; // Today + 5 future dates

  return delays.map((delayDays) => {
    const date = new Date(today);
    date.setDate(today.getDate() + delayDays);
    const label = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return { value: delayDays, label };
  });
}

const RESCHEDULE_DELAY_OPTIONS = getRescheduleOptions();

/** Reschedule options for failed/cancelled items */
interface RescheduleOptions {
  delayDays: number;
  immediate: boolean;
}

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
  onPhoneReschedule?: (options: RescheduleOptions) => void;
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
  onEmailReschedule?: (options: RescheduleOptions) => void;
  hasOwnerEmail: boolean;

  // Global
  isSubmitting: boolean;
  isPhoneCancelling?: boolean;
  isEmailCancelling?: boolean;
  isRescheduling?: boolean;
  caseStatus:
    | "pending_review"
    | "ready"
    | "scheduled"
    | "completed"
    | "failed"
    | "in_progress";
}

type CardStatus =
  | "to_schedule"
  | "scheduled"
  | "delivered"
  | "failed"
  | "not_available"
  | "pending";

interface StatusBadgeProps {
  status: CardStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    to_schedule: {
      label: "To Schedule",
      className: "bg-amber-50 text-amber-600 border-amber-200",
      showIcon: false,
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-amber-50 text-amber-600 border-amber-200",
      showIcon: true,
    },
    delivered: {
      label: "Delivered",
      className: "bg-emerald-50 text-emerald-600 border-emerald-200",
      showIcon: false,
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-600 border-red-200",
      showIcon: false,
    },
    not_available: {
      label: "N/A",
      className: "bg-slate-50 text-slate-500 border-slate-200",
      showIcon: false,
    },
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-600 border-amber-200",
      showIcon: true,
    },
  };

  const { label, className, showIcon } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {showIcon && <Clock className="h-3 w-3" />}
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
  onReschedule?: (options: RescheduleOptions) => void;
  isSubmitting: boolean;
  isCancelling?: boolean;
  isRescheduling?: boolean;
  showControls: boolean;
}

/**
 * Get the scheduled date formatted as "Mon DD" (e.g., "Jan 28")
 */
function getScheduledDateLabel(
  scheduledFor: string | null,
  delayDays: number,
): string {
  if (scheduledFor) {
    const date = new Date(scheduledFor);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  // Fall back to delay days from today
  const date = new Date();
  date.setDate(date.getDate() + delayDays);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  onReschedule,
  isSubmitting,
  isCancelling,
  isRescheduling,
  showControls,
}: ChannelCardProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
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
    ? getShortFailureReason(failureReason)
    : "Delivery failed";

  // Get scheduled date label
  const scheduledDateLabel = getScheduledDateLabel(scheduledFor, delayDays);

  // Show date picker for scheduled or to_schedule states
  const showDatePicker =
    (isScheduled || isToSchedule) && showControls && hasContact;

  return (
    <div
      className={cn(
        "flex-1 rounded-xl border-2 bg-white p-4 transition-colors dark:bg-slate-900",
        isNotAvailable && "border-slate-200 opacity-60 dark:border-slate-700",
        isFailed && "border-red-200 dark:border-red-700",
        isDelivered && "border-emerald-200 dark:border-emerald-700",
        (isScheduled || isPending) && "border-slate-200 dark:border-slate-600",
        isToSchedule && "border-slate-200 dark:border-slate-600",
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Checkbox - only show for pending/ready cases with contact info */}
          {showControls && hasContact && (
            <Checkbox
              id={`${type}-toggle`}
              checked={enabled}
              onCheckedChange={(checked) => onToggle(Boolean(checked))}
              disabled={isSubmitting}
              className="h-6 w-6 rounded border-2 border-slate-300 data-[state=checked]:border-slate-800 data-[state=checked]:bg-slate-800 data-[state=checked]:text-white"
            />
          )}
          <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {label}
          </span>
        </div>
        <StatusBadge status={cardStatus} />
      </div>

      {/* Divider - only show when there's content below */}
      {(showDatePicker ||
        isDelivered ||
        isFailed ||
        isPending ||
        isNotAvailable) && (
        <div className="my-3 border-t border-slate-200 dark:border-slate-700" />
      )}

      {/* Content based on status */}
      <div>
        {/* Scheduled or To Schedule: Show date picker */}
        {showDatePicker && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-base text-slate-600 italic dark:text-slate-400">
              Send on
            </span>
            <Select
              value={String(delayDays)}
              onValueChange={(value) => onDelayChange(Number(value))}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-9 w-[100px] border-slate-300 bg-white text-sm font-medium dark:border-slate-600 dark:bg-slate-800">
                <SelectValue>{scheduledDateLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DATE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Scheduled without controls: Just show the date */}
        {isScheduled && !showControls && scheduledFor && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-base text-slate-600 italic dark:text-slate-400">
              Send on
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {scheduledDateLabel}
            </span>
          </div>
        )}

        {/* Cancel button for scheduled items */}
        {isScheduled && onCancel && (
          <div className="mt-3 flex justify-end">
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
          </div>
        )}

        {/* Delivered: Show relative time */}
        {isDelivered && relativeTime && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Delivered {relativeTime}
          </p>
        )}

        {/* Failed: Show failure reason and retry/reschedule */}
        {isFailed && (
          <div className="space-y-2">
            <p className="text-sm text-red-600 dark:text-red-400">
              {displayFailureReason}
            </p>
            <div className="flex items-center gap-2">
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  disabled={isSubmitting || isRescheduling}
                  className="h-7 gap-1 text-xs text-slate-500 hover:text-teal-600"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry Now
                </Button>
              )}
              {onReschedule && (
                <Popover open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting || isRescheduling}
                      className="h-7 gap-1 text-xs text-slate-500 hover:text-teal-600"
                    >
                      <CalendarClock className="h-3 w-3" />
                      {isRescheduling ? "Scheduling..." : "Reschedule"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          onReschedule({ delayDays: 0, immediate: true });
                          setRescheduleOpen(false);
                        }}
                      >
                        Send Now
                      </Button>
                      <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                      {RESCHEDULE_DELAY_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => {
                            onReschedule({
                              delayDays: option.value,
                              immediate: false,
                            });
                            setRescheduleOpen(false);
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
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
      </div>
    </div>
  );
}

/**
 * Derives the card status from delivery status and other factors.
 */
function deriveCardStatus(
  deliveryStatus: DeliveryStatus,
  hasContact: boolean,
  scheduledFor: string | null,
  caseStatus: string,
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
  onPhoneReschedule,
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
  onEmailReschedule,
  hasOwnerEmail,
  // Global
  isSubmitting,
  isPhoneCancelling,
  isEmailCancelling,
  isRescheduling,
  caseStatus,
}: CommunicationStatusCardsProps) {
  // Determine if we should show controls (checkboxes, delay dropdowns)
  // Only for pending_review, ready, or scheduled cases
  const showControls = ["pending_review", "ready", "scheduled"].includes(
    caseStatus,
  );

  // Derive card statuses
  const phoneCardStatus = deriveCardStatus(
    phoneStatus,
    hasOwnerPhone,
    phoneScheduledFor,
    caseStatus,
  );
  const emailCardStatus = deriveCardStatus(
    emailStatus,
    hasOwnerEmail,
    emailScheduledFor,
    caseStatus,
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        onReschedule={onPhoneReschedule}
        isSubmitting={isSubmitting}
        isCancelling={isPhoneCancelling}
        isRescheduling={isRescheduling}
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
        onReschedule={onEmailReschedule}
        isSubmitting={isSubmitting}
        isCancelling={isEmailCancelling}
        isRescheduling={isRescheduling}
        showControls={showControls}
      />
    </div>
  );
}
