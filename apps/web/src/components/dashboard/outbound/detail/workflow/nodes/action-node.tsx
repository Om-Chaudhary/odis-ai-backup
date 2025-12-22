"use client";

import { memo, useState } from "react";
import { type NodeProps } from "@xyflow/react";
import {
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@odis-ai/ui/button";
import { BaseWorkflowNode, type NodeStatus } from "./base-workflow-node";
import { cn } from "@odis-ai/utils";

interface ActionNodeData {
  actionType:
    | "email_sent"
    | "call_completed"
    | "email_pending"
    | "call_pending";
  status?: NodeStatus;
  timestamp?: string;
  // Email specific
  recipientEmail?: string;
  // Call specific
  duration?: string;
  recordingUrl?: string;
  transcript?: string;
  // Pending specific
  onSchedule?: () => void;
}

/**
 * Action Node - Shows email sent or call completed status.
 * Can be expanded to show transcript or email preview.
 */
function ActionNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as ActionNodeData;
  const [isExpanded, setIsExpanded] = useState(false);

  const actionType = nodeData?.actionType ?? "email_sent";
  const isEmail = actionType.startsWith("email");
  const isPending = actionType.endsWith("pending");
  const status = nodeData?.status ?? (isPending ? "preview" : "completed");

  // Determine icon and title based on action type
  const getIconAndTitle = () => {
    if (isPending) {
      if (isEmail) {
        return {
          icon: <Mail className="h-4 w-4 text-slate-500" />,
          title: "Email Not Scheduled",
          statusIcon: <Clock className="h-3 w-3 text-slate-400" />,
        };
      }
      return {
        icon: <Phone className="h-4 w-4 text-slate-500" />,
        title: "Call Not Scheduled",
        statusIcon: <Clock className="h-3 w-3 text-slate-400" />,
      };
    }

    if (status === "failed") {
      return {
        icon: isEmail ? (
          <Mail className="h-4 w-4 text-red-600" />
        ) : (
          <Phone className="h-4 w-4 text-red-600" />
        ),
        title: isEmail ? "Email Failed" : "Call Failed",
        statusIcon: <XCircle className="h-3 w-3 text-red-500" />,
      };
    }

    if (isEmail) {
      return {
        icon: <Mail className="h-4 w-4 text-emerald-600" />,
        title: "Email Sent",
        statusIcon: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
      };
    }

    return {
      icon: <Phone className="h-4 w-4 text-emerald-600" />,
      title: "Call Completed",
      statusIcon: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
    };
  };

  const { icon, title, statusIcon } = getIconAndTitle();

  // Subtitle based on type
  const subtitle = isPending
    ? "Ready to schedule"
    : isEmail
      ? nodeData?.recipientEmail
      : nodeData?.duration
        ? `Duration: ${nodeData.duration}`
        : "Completed";

  // Has expandable content?
  const hasTranscript = !isEmail && Boolean(nodeData?.transcript);
  const hasEmailPreview = isEmail && Boolean(nodeData?.recipientEmail);
  const hasExpandableContent = !isPending && (hasTranscript || hasEmailPreview);

  // Clickable if completed (not pending/preview)
  const isClickable = !isPending && status === "completed";

  return (
    <BaseWorkflowNode
      icon={
        <div className="relative">
          {icon}
          <span className="absolute -right-0.5 -bottom-0.5">{statusIcon}</span>
        </div>
      }
      title={title}
      subtitle={subtitle}
      timestamp={nodeData?.timestamp}
      status={status}
      isLarge={isExpanded}
      isClickable={isClickable}
    >
      {/* Click hint for completed actions */}
      {isClickable && !hasExpandableContent && (
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400 opacity-70">
          <ExternalLink className="h-3 w-3" />
          <span>Click for {isEmail ? "email details" : "transcript"}</span>
        </div>
      )}

      {/* Expandable content for completed actions */}
      {hasExpandableContent && (
        <div className="space-y-2">
          {/* Toggle button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex w-full items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {isEmail ? "Preview" : "Transcript"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {/* Expanded content */}
          {isExpanded && (
            <div className="rounded-lg bg-white/50 p-2 text-xs dark:bg-slate-800/50">
              {!isEmail && nodeData?.transcript && (
                <div className="max-h-32 space-y-1.5 overflow-y-auto">
                  {nodeData.transcript.split("\n").map((line, i) => {
                    const isAI = line.startsWith("AI:");
                    const isUser = line.startsWith("User:");
                    return (
                      <div key={i} className="flex gap-1.5">
                        {(isAI || isUser) && (
                          <span
                            className={cn(
                              "shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold",
                              isAI
                                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                            )}
                          >
                            {isAI ? "AI" : "User"}
                          </span>
                        )}
                        <span className="text-slate-600 dark:text-slate-300">
                          {line.replace(/^(AI:|User:)\s*/, "")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Play button for calls with recordings */}
          {!isEmail && nodeData?.recordingUrl && !isExpanded && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.open(nodeData.recordingUrl, "_blank");
              }}
            >
              <Play className="h-3 w-3" />
              Play
            </Button>
          )}

          {/* Click hint */}
          {isClickable && (
            <div className="flex items-center justify-center gap-1 pt-1 text-[10px] text-slate-400 opacity-70">
              <ExternalLink className="h-3 w-3" />
              <span>Click to expand in modal</span>
            </div>
          )}
        </div>
      )}

      {/* Schedule button for pending actions */}
      {isPending && nodeData?.onSchedule && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 h-7 w-full text-xs"
          onClick={nodeData.onSchedule}
        >
          Schedule Now
        </Button>
      )}
    </BaseWorkflowNode>
  );
}

export const ActionNode = memo(ActionNodeComponent);
