import { formatDistanceToNow } from "date-fns";
import {
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { cn } from "@odis-ai/shared/util";
import type { TimelineEvent as TimelineEventType } from "./types";

interface TimelineEventProps {
  event: TimelineEventType;
  children?: React.ReactNode;
}

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    label: "Delivered",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  scheduled: {
    icon: Clock,
    label: "Scheduled",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  not_started: {
    icon: Clock,
    label: "Pending",
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
  },
};

const formatDuration = (seconds: number | undefined): string => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const getFailureReason = (reason: string | undefined): string => {
  if (!reason) return "Unknown error";
  const reasonMap: Record<string, string> = {
    voicemail: "Voicemail",
    "no-answer": "No answer",
    "user-hangup": "User hung up",
    "assistant-error": "System error",
    "exceeds-max-duration": "Call too long",
    "silence-timed-out": "Voicemail detected",
  };
  return reasonMap[reason] ?? reason;
};

/**
 * Compact timeline event row
 */
export function TimelineEvent({ event, children }: TimelineEventProps) {
  const config = STATUS_CONFIG[event.status];
  const StatusIcon = config.icon;
  const ChannelIcon = event.channel === "email" ? Mail : Phone;
  const channelLabel = event.channel === "email" ? "Email" : "Phone Call";

  const retryAction = event.actions.find((a) => a.type === "retry");
  const cancelAction = event.actions.find((a) => a.type === "cancel");

  // Build metadata string
  const metaParts: string[] = [];
  if (event.timestamp) {
    const timeStr = formatDistanceToNow(new Date(event.timestamp), {
      addSuffix: true,
    });
    metaParts.push(timeStr);
  }
  if (event.metadata?.duration && event.status === "completed") {
    metaParts.push(`Duration: ${formatDuration(event.metadata.duration)}`);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5",
        "bg-white/40 dark:bg-white/5",
        "ring-1 ring-slate-200/30 dark:ring-slate-700/30",
        "backdrop-blur-sm",
      )}
    >
      {/* Channel icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          "bg-gradient-to-br from-teal-500/10 to-cyan-500/10",
          "ring-1 ring-teal-500/10",
        )}
      >
        <ChannelIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {channelLabel}
          </span>
          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
              config.bgColor,
              config.color,
            )}
          >
            <StatusIcon className="h-2.5 w-2.5" />
            {config.label}
          </span>
        </div>

        {/* Metadata line */}
        {(metaParts.length > 0 || event.status === "failed") && (
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            {event.status === "failed" && event.metadata?.endedReason && (
              <span className="text-red-500">
                {getFailureReason(event.metadata.endedReason)}
                {metaParts.length > 0 && " · "}
              </span>
            )}
            {event.metadata?.endedReason === "voicemail" &&
              event.status === "completed" && (
                <span className="text-amber-500">
                  Voicemail
                  {metaParts.length > 0 && " · "}
                </span>
              )}
            {metaParts.join(" · ")}
          </p>
        )}

        {/* Inline children (scheduler) */}
        {children && <div className="mt-2">{children}</div>}
      </div>

      {/* Action buttons - inline on the right */}
      {(retryAction?.enabled ?? cancelAction?.enabled) && (
        <div className="flex shrink-0 gap-1">
          {retryAction?.enabled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={retryAction.handler}
              className="h-7 gap-1 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
          {cancelAction?.enabled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelAction.handler}
              className="h-7 gap-1 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
