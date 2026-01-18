"use client";

import { useState } from "react";
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

function computeEmailEvent(props: DeliveryTimelineProps): TimelineEventType {
  const status = determineEventStatus(
    props.emailStatus,
    props.scheduledEmailFor,
    props.emailSentAt,
  );

  const actions = [];
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

function computePhoneEvent(props: DeliveryTimelineProps): TimelineEventType {
  const status = determineEventStatus(
    props.callStatus,
    props.scheduledCallFor,
    props.callCompletedAt,
  );

  const actions = [];
  if (status === "failed" && props.onRetryCall) {
    actions.push({
      type: "retry" as const,
      enabled: true,
      handler: props.onRetryCall,
    });
  }
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
 * Compact Activity Timeline
 * Shows email and phone delivery status in a minimal, glassmorphic design
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

  const [emailEnabled, setEmailEnabled] = useState(hasOwnerEmail);
  const [phoneEnabled, setPhoneEnabled] = useState(hasOwnerPhone);

  const emailEvent = computeEmailEvent(props);
  const phoneEvent = computePhoneEvent(props);

  const showEmail = hasOwnerEmail;
  const showPhone = hasOwnerPhone;
  const hasAnyContact = showEmail || showPhone;

  if (!hasAnyContact) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        <AlertCircle className="mx-auto mb-2 h-6 w-6 text-slate-400" />
        <p>No contact information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Email Event */}
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

      {/* Phone Event */}
      {showPhone && (
        <TimelineEvent event={phoneEvent}>
          {phoneEvent.status === "not_started" && showScheduleRemainingCall && (
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

      {/* Unified Action Buttons */}
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
        <Alert
          className={cn(
            "border-amber-200/50 bg-amber-50/50",
            "dark:border-amber-800/50 dark:bg-amber-950/30",
          )}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
            Test mode - communications sent to test contacts
          </AlertDescription>
        </Alert>
      )}

      {/* Attention severity indicator */}
      {attentionSeverity && (
        <div
          className={cn(
            "h-1 rounded-full",
            attentionSeverity === "critical" && "bg-red-500",
            attentionSeverity === "urgent" && "bg-amber-500",
          )}
        />
      )}
    </div>
  );
}
