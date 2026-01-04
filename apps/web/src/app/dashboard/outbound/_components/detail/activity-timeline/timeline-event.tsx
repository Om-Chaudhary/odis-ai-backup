import { formatDistanceToNow } from "date-fns";
import {
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Button } from "@odis-ai/shared/ui/button";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { TimelineEvent as TimelineEventType } from "./types";

interface TimelineEventProps {
  event: TimelineEventType;
  children?: React.ReactNode;
}

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    badgeClass: "bg-green-100 text-green-700 border-green-300",
    label: "Delivered",
  },
  failed: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    badgeClass: "bg-red-100 text-red-700 border-red-300",
    label: "Failed",
  },
  scheduled: {
    icon: Clock,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-300",
    label: "Scheduled",
  },
  not_started: {
    icon: AlertCircle,
    iconColor: "text-gray-400",
    bgColor: "bg-gray-50",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-300",
    label: "Not Scheduled",
  },
};

const formatDuration = (seconds: number | undefined): string => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const getFailureReason = (reason: string | undefined): string => {
  if (!reason) return "Unknown error";
  const reasonMap: Record<string, string> = {
    voicemail: "Voicemail (no message left)",
    "no-answer": "No answer",
    "user-hangup": "User hung up",
    "assistant-error": "System error",
    "exceeds-max-duration": "Call too long",
    "silence-timed-out": "Voicemail detected",
  };
  return reasonMap[reason] ?? reason;
};

/**
 * Individual timeline event row
 * Shows icon, label, badge, timestamp, metadata, and optional children (ChannelScheduler)
 */
export function TimelineEvent({ event, children }: TimelineEventProps) {
  const config = STATUS_CONFIG[event.status];
  const StatusIcon = config.icon;
  const ChannelIcon = event.channel === "email" ? Mail : Phone;
  const channelLabel = event.channel === "email" ? "Email" : "Phone Call";

  // Find action handlers
  const retryAction = event.actions.find((a) => a.type === "retry");
  const cancelAction = event.actions.find((a) => a.type === "cancel");

  return (
    <div className="relative flex gap-4">
      {/* Icon Container */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.bgColor,
        )}
      >
        <StatusIcon className={cn("h-5 w-5", config.iconColor)} />
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-2 pb-4">
        {/* Header: Channel + Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ChannelIcon className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {channelLabel}
            </span>
          </div>
          <Badge variant="outline" className={cn("text-xs", config.badgeClass)}>
            {config.label}
          </Badge>
        </div>

        {/* Timestamp */}
        {event.timestamp && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {event.status === "scheduled"
              ? `Scheduled ${formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}`
              : formatDistanceToNow(new Date(event.timestamp), {
                  addSuffix: true,
                })}
          </p>
        )}

        {/* Metadata */}
        {event.metadata && (
          <div className="space-y-1 text-xs text-gray-600">
            {/* Call duration */}
            {event.metadata.duration && event.status === "completed" && (
              <p className="text-gray-500">
                Duration: {formatDuration(event.metadata.duration)}
              </p>
            )}

            {/* Voicemail badge */}
            {event.metadata.endedReason === "voicemail" &&
              event.status === "completed" && (
                <p className="text-amber-600">Left voicemail</p>
              )}

            {/* Failure reason */}
            {event.status === "failed" && (
              <p className="text-red-600">
                {getFailureReason(event.metadata.endedReason)}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(retryAction ?? cancelAction) && (
          <div className="mt-2 flex gap-2">
            {retryAction?.enabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={retryAction.handler}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            )}

            {cancelAction?.enabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={cancelAction.handler}
                className="gap-1 text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Children (ChannelScheduler for "not_started" state) */}
        {children}
      </div>
    </div>
  );
}
