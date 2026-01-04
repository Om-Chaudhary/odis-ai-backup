"use client";

import { formatDistanceToNow } from "date-fns";
import { Calendar, Phone, Mail, RefreshCw, X } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { cn } from "@odis-ai/shared/util";

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
  onRetryCall?: () => void;
  onCancelCall?: () => void;
  onCancelEmail?: () => void;
  onScheduleRemainingCall?: () => void;
  onScheduleRemainingEmail?: () => void;
  showScheduleRemainingCall?: boolean;
  showScheduleRemainingEmail?: boolean;
  isSubmitting?: boolean;
}

type StatusType =
  | "completed"
  | "failed"
  | "pending"
  | "scheduled"
  | "in_progress"
  | "not_applicable";

interface StatusConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
}

const getStatusConfig = (
  status: StatusType,
  channelType: "call" | "email",
): StatusConfig => {
  const ChannelIcon = channelType === "call" ? Phone : Mail;

  switch (status) {
    case "completed":
      return {
        icon: <ChannelIcon className="h-5 w-5" />,
        label: "Completed",
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    case "failed":
      return {
        icon: <ChannelIcon className="h-5 w-5" />,
        label: "Failed",
        color: "text-red-600",
        bgColor: "bg-red-50",
      };
    case "pending":
      return {
        icon: <ChannelIcon className="h-5 w-5" />,
        label: "Pending",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      };
    case "scheduled":
      return {
        icon: <ChannelIcon className="h-5 w-5" />,
        label: "Scheduled",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      };
    case "in_progress":
      return {
        icon: <ChannelIcon className="h-5 w-5" />,
        label: "In Progress",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      };
    case "not_applicable":
      return {
        icon: <ChannelIcon className="h-5 w-5" />,
        label: "N/A",
        color: "text-gray-400",
        bgColor: "bg-gray-50",
      };
  }
};

const determineCallStatus = (
  status: DeliveryTimelineProps["callStatus"],
  scheduledFor: string | null | undefined,
  callCompletedAt: string | null | undefined,
): StatusType => {
  if (status === "not_applicable") return "not_applicable";
  if (status === "failed") return "failed";
  if (status === "sent" || callCompletedAt) return "completed";
  if (scheduledFor && new Date(scheduledFor) > new Date()) return "scheduled";
  // Don't show pending unless there's an actual scheduled date
  return "not_applicable";
};

const determineEmailStatus = (
  status: DeliveryTimelineProps["emailStatus"],
  scheduledFor: string | null | undefined,
  emailSentAt: string | null | undefined,
): StatusType => {
  if (status === "not_applicable") return "not_applicable";
  if (status === "failed") return "failed";
  if (status === "sent" || emailSentAt) return "completed";
  if (scheduledFor && new Date(scheduledFor) > new Date()) return "scheduled";
  // Don't show pending unless there's an actual scheduled date
  return "not_applicable";
};

const getConnectionLineColor = (
  callStatus: StatusType,
  emailStatus: StatusType,
): string => {
  if (callStatus === "completed" && emailStatus === "completed") {
    return "bg-green-500";
  }
  if (callStatus === "failed" || emailStatus === "failed") {
    return "bg-red-500";
  }
  if (callStatus === "in_progress" || emailStatus === "in_progress") {
    return "bg-purple-500";
  }
  if (
    callStatus === "scheduled" ||
    callStatus === "pending" ||
    emailStatus === "scheduled" ||
    emailStatus === "pending"
  ) {
    return "bg-amber-500";
  }
  return "bg-gray-300";
};

const formatScheduledTime = (
  scheduledFor: string | null | undefined,
): string => {
  if (!scheduledFor) return "";
  const scheduledDate = new Date(scheduledFor);
  if (scheduledDate > new Date()) {
    return `in ${formatDistanceToNow(scheduledDate)}`;
  }
  return formatDistanceToNow(scheduledDate, { addSuffix: true });
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const getFailureReason = (reason: string | null | undefined): string => {
  if (!reason) return "Unknown error";
  const reasonMap: Record<string, string> = {
    voicemail: "Voicemail",
    "no-answer": "No answer",
    "user-hangup": "User hung up",
    "assistant-error": "System error",
    "exceeds-max-duration": "Call too long",
    "silence-timed-out": "Voicemail",
  };
  return reasonMap[reason] ?? reason;
};

export function DeliveryTimeline({
  callStatus,
  emailStatus,
  scheduledCallFor,
  scheduledEmailFor,
  callEndedReason,
  callDuration,
  callCompletedAt,
  emailSentAt,
  attentionSeverity,
  onRetryCall,
  onCancelCall,
  onCancelEmail,
  onScheduleRemainingCall,
  onScheduleRemainingEmail,
  showScheduleRemainingCall = false,
  showScheduleRemainingEmail = false,
  isSubmitting = false,
}: DeliveryTimelineProps) {
  const callStatusType = determineCallStatus(
    callStatus,
    scheduledCallFor,
    callCompletedAt,
  );
  const emailStatusType = determineEmailStatus(
    emailStatus,
    scheduledEmailFor,
    emailSentAt,
  );

  const callConfig = getStatusConfig(callStatusType, "call");
  const emailConfig = getStatusConfig(emailStatusType, "email");
  const lineColor = getConnectionLineColor(callStatusType, emailStatusType);

  const containerClasses = cn(
    "rounded-lg border-2 p-4",
    attentionSeverity === "critical" &&
      "border-red-500 bg-gradient-to-r from-red-50/50 to-transparent",
    attentionSeverity === "urgent" &&
      "border-amber-500 bg-gradient-to-r from-amber-50/50 to-transparent",
    !attentionSeverity && "border-gray-200",
  );

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between gap-6">
        {/* Call Status */}
        <div className="flex-1">
          <div className="flex flex-col items-center gap-2">
            {/* Icon */}
            <div className={cn("rounded-full p-2", callConfig.bgColor)}>
              <div className={callConfig.color}>{callConfig.icon}</div>
            </div>

            {/* Status Label */}
            <div className={cn("text-xs font-semibold", callConfig.color)}>
              {callConfig.label}
            </div>

            {/* Details */}
            <div className="text-center text-[11px] text-gray-600">
              {callStatusType === "completed" && callCompletedAt && (
                <div>
                  <div>
                    {formatDistanceToNow(new Date(callCompletedAt), {
                      addSuffix: true,
                    })}
                  </div>
                  {callDuration && (
                    <div className="text-gray-500">
                      Duration: {formatDuration(callDuration)}
                    </div>
                  )}
                  {callEndedReason === "voicemail" && (
                    <div className="mt-1 text-amber-600">Left voicemail</div>
                  )}
                </div>
              )}

              {callStatusType === "failed" && (
                <div className="text-red-600">
                  {getFailureReason(callEndedReason)}
                </div>
              )}

              {callStatusType === "scheduled" && scheduledCallFor && (
                <div>{formatScheduledTime(scheduledCallFor)}</div>
              )}

              {callStatusType === "not_applicable" && (
                <div className="text-gray-400">No phone number</div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-2 flex gap-2">
              {callStatusType === "failed" && onRetryCall && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetryCall}
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
              )}

              {callStatusType === "scheduled" && onCancelCall && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelCall}
                  disabled={isSubmitting}
                  className="gap-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              )}

              {showScheduleRemainingCall && onScheduleRemainingCall && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onScheduleRemainingCall}
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  Schedule
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Connection Line */}
        <div className="flex-1">
          <div className="relative">
            <div className={cn("h-0.5 w-full rounded-full", lineColor)} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full border border-white",
                  lineColor,
                )}
              />
            </div>
          </div>
        </div>

        {/* Email Status */}
        <div className="flex-1">
          <div className="flex flex-col items-center gap-2">
            {/* Icon */}
            <div className={cn("rounded-full p-2", emailConfig.bgColor)}>
              <div className={emailConfig.color}>{emailConfig.icon}</div>
            </div>

            {/* Status Label */}
            <div className={cn("text-xs font-semibold", emailConfig.color)}>
              {emailConfig.label}
            </div>

            {/* Details */}
            <div className="text-center text-[11px] text-gray-600">
              {emailStatusType === "completed" && emailSentAt && (
                <div>
                  {formatDistanceToNow(new Date(emailSentAt), {
                    addSuffix: true,
                  })}
                </div>
              )}

              {emailStatusType === "failed" && (
                <div className="text-red-600">Delivery failed</div>
              )}

              {emailStatusType === "scheduled" && scheduledEmailFor && (
                <div>{formatScheduledTime(scheduledEmailFor)}</div>
              )}

              {emailStatusType === "not_applicable" && (
                <div className="text-gray-400">No email address</div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-2 flex gap-2">
              {emailStatusType === "scheduled" && onCancelEmail && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelEmail}
                  disabled={isSubmitting}
                  className="gap-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              )}

              {showScheduleRemainingEmail && onScheduleRemainingEmail && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onScheduleRemainingEmail}
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  Schedule
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
