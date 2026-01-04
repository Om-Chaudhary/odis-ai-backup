"use client";

import { useState } from "react";
import { Card } from "@odis-ai/shared/ui/card";
import { Alert, AlertDescription } from "@odis-ai/shared/ui/alert";
import { AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { TimelineEvent } from "./timeline-event";
import { ChannelScheduler } from "./channel-scheduler";
import { UnifiedActions } from "./unified-actions";
import type {
  TimelineEvent as TimelineEventType,
  TimelineEventStatus,
} from "./types";

// Import the props interface from delivery-timeline to maintain compatibility
interface DeliveryTimelineProps {
  callStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  emailStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  scheduledCallFor: string | null;
  scheduledEmailFor: string | null;
  callEndedReason?: string | null;
  callDuration?: number | null;
  callCompletedAt?: string | null;
  emailSentAt?: string | null;
  attentionSeverity?: string | null;
  hasOwnerPhone?: boolean;
  hasOwnerEmail?: boolean;
  onRetryCall?: () => void;
  onCancelCall?: () => void;
  onCancelEmail?: () => void;
  onScheduleRemaining?: (options: {
    scheduleCall: boolean;
    scheduleEmail: boolean;
    immediate?: boolean;
  }) => void;
  showScheduleRemainingCall?: boolean;
  showScheduleRemainingEmail?: boolean;
  isSubmitting?: boolean;
  testModeEnabled?: boolean;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
}

/**
 * Determine event status from delivery status and scheduling info
 */
function determineEventStatus(
  deliveryStatus: DeliveryTimelineProps["callStatus"],
  scheduledFor: string | null | undefined,
  completedAt: string | null | undefined,
): TimelineEventStatus {
  if (deliveryStatus === "not_applicable") return "not_started";
  if (deliveryStatus === "failed") return "failed";
  if (deliveryStatus === "sent" || completedAt) return "completed";
  if (scheduledFor && new Date(scheduledFor) > new Date()) return "scheduled";
  return "not_started";
}

/**
 * Compute email event from props
 */
function computeEmailEvent(props: DeliveryTimelineProps): TimelineEventType {
  const status = determineEventStatus(
    props.emailStatus,
    props.scheduledEmailFor,
    props.emailSentAt,
  );

  const actions = [];

  // Cancel action for scheduled emails
  if (status === "scheduled" && props.onCancelEmail) {
    actions.push({
      type: "cancel" as const,
      enabled: true,
      handler: props.onCancelEmail,
    });
  }

  return {
    id: "email-event",
    channel: "email",
    status,
    timestamp: props.emailSentAt ?? props.scheduledEmailFor ?? undefined,
    metadata: {
      sentAt: props.emailSentAt ?? undefined,
    },
    actions,
    canSchedule: props.hasOwnerEmail ?? false,
    contactInfo: props.ownerEmail ?? null,
  };
}

/**
 * Compute phone event from props
 */
function computePhoneEvent(props: DeliveryTimelineProps): TimelineEventType {
  const status = determineEventStatus(
    props.callStatus,
    props.scheduledCallFor,
    props.callCompletedAt,
  );

  const actions = [];

  // Retry action for failed calls
  if (status === "failed" && props.onRetryCall) {
    actions.push({
      type: "retry" as const,
      enabled: true,
      handler: props.onRetryCall,
    });
  }

  // Cancel action for scheduled calls
  if (status === "scheduled" && props.onCancelCall) {
    actions.push({
      type: "cancel" as const,
      enabled: true,
      handler: props.onCancelCall,
    });
  }

  return {
    id: "phone-event",
    channel: "phone",
    status,
    timestamp: props.callCompletedAt ?? props.scheduledCallFor ?? undefined,
    metadata: {
      completedAt: props.callCompletedAt ?? undefined,
      duration: props.callDuration ?? undefined,
      endedReason: props.callEndedReason ?? undefined,
    },
    actions,
    canSchedule: props.hasOwnerPhone ?? false,
    contactInfo: props.ownerPhone ?? null,
  };
}

/**
 * Main Activity Timeline Container
 * Vertical timeline showing email and phone events with inline scheduling
 */
export function ActivityTimeline(props: DeliveryTimelineProps) {
  const {
    hasOwnerPhone = true,
    hasOwnerEmail = true,
    onScheduleRemaining,
    showScheduleRemainingCall = false,
    showScheduleRemainingEmail = false,
    isSubmitting = false,
    attentionSeverity,
    testModeEnabled = false,
  } = props;

  // Local state for channel toggles
  const [emailEnabled, setEmailEnabled] = useState(hasOwnerEmail);
  const [phoneEnabled, setPhoneEnabled] = useState(hasOwnerPhone);

  // Compute events
  const emailEvent = computeEmailEvent(props);
  const phoneEvent = computePhoneEvent(props);

  // Determine which events to show
  const showEmail = hasOwnerEmail;
  const showPhone = hasOwnerPhone;
  const hasAnyContact = showEmail || showPhone;

  // Container classes with attention severity
  const containerClasses = cn(
    "rounded-lg border-2 p-6",
    attentionSeverity === "critical" &&
      "border-red-500 bg-gradient-to-r from-red-50/50 to-transparent",
    attentionSeverity === "urgent" &&
      "border-amber-500 bg-gradient-to-r from-amber-50/50 to-transparent",
    !attentionSeverity && "border-gray-200",
  );

  return (
    <Card className={containerClasses}>
      {hasAnyContact ? (
        <div className="space-y-4">
          {/* Timeline events wrapper with vertical line */}
          <div className="relative space-y-4">
            {/* Vertical timeline line - only extends through events */}
            <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Email Event - only if email exists */}
            {showEmail && (
              <TimelineEvent event={emailEvent}>
                {emailEvent.status === "not_started" &&
                  showScheduleRemainingEmail && (
                    <ChannelScheduler
                      channel="email"
                      contactInfo={emailEvent.contactInfo}
                      isEnabled={emailEnabled}
                      onToggle={setEmailEnabled}
                      isSubmitting={isSubmitting}
                    />
                  )}
              </TimelineEvent>
            )}

            {/* Phone Event - only if phone exists */}
            {showPhone && (
              <TimelineEvent event={phoneEvent}>
                {phoneEvent.status === "not_started" &&
                  showScheduleRemainingCall && (
                    <ChannelScheduler
                      channel="phone"
                      contactInfo={phoneEvent.contactInfo}
                      isEnabled={phoneEnabled}
                      onToggle={setPhoneEnabled}
                      isSubmitting={isSubmitting}
                    />
                  )}
              </TimelineEvent>
            )}
          </div>

          {/* Unified Action Buttons - appears below timeline when at least one channel is enabled */}
          {(showScheduleRemainingEmail || showScheduleRemainingCall) &&
            onScheduleRemaining && (
              <UnifiedActions
                emailEnabled={emailEnabled}
                phoneEnabled={phoneEnabled}
                hasEmailContact={Boolean(emailEvent.contactInfo)}
                hasPhoneContact={Boolean(phoneEvent.contactInfo)}
                onSchedule={() => {
                  const shouldScheduleEmail =
                    emailEnabled && Boolean(emailEvent.contactInfo);
                  const shouldScheduleCall =
                    phoneEnabled && Boolean(phoneEvent.contactInfo);

                  if (shouldScheduleEmail || shouldScheduleCall) {
                    onScheduleRemaining({
                      scheduleEmail: shouldScheduleEmail,
                      scheduleCall: shouldScheduleCall,
                      immediate: false,
                    });
                  }
                }}
                onSendNow={() => {
                  const shouldScheduleEmail =
                    emailEnabled && Boolean(emailEvent.contactInfo);
                  const shouldScheduleCall =
                    phoneEnabled && Boolean(phoneEvent.contactInfo);

                  if (shouldScheduleEmail || shouldScheduleCall) {
                    onScheduleRemaining({
                      scheduleEmail: shouldScheduleEmail,
                      scheduleCall: shouldScheduleCall,
                      immediate: true,
                    });
                  }
                }}
                isSubmitting={isSubmitting}
              />
            )}

          {/* Test Mode Badge */}
          {testModeEnabled && (
            <div className="relative z-10 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-300">
                    Test mode active - communications will be sent to test
                    numbers/emails
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-gray-500">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p>No contact information available</p>
          <p className="mt-1 text-xs">
            Add phone or email to schedule discharge communications
          </p>
        </div>
      )}
    </Card>
  );
}
