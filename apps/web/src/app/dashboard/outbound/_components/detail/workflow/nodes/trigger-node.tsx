"use client";

import { memo, type ReactNode } from "react";
import { type NodeProps } from "@xyflow/react";
import { Zap, Mail, Phone, Clock } from "lucide-react";
import { BaseWorkflowNode, type NodeStatus } from "./base-workflow-node";

type TriggerType =
  | "email"
  | "call"
  | "email_triggered"
  | "call_triggered"
  | "awaiting_approval";

interface TriggerNodeData {
  triggerType?: TriggerType;
  status?: NodeStatus;
  timestamp?: string;
  label?: string;
}

// Get configuration based on trigger type
function getTriggerConfig(triggerType: TriggerType | undefined): {
  icon: ReactNode;
  title: string;
  defaultLabel: string;
} {
  switch (triggerType) {
    case "email":
    case "email_triggered":
      return {
        icon: <Mail className="h-4 w-4 text-amber-600" />,
        title: "Email Triggered",
        defaultLabel: "Scheduled for delivery",
      };
    case "call":
    case "call_triggered":
      return {
        icon: <Phone className="h-4 w-4 text-amber-600" />,
        title: "Call Approved",
        defaultLabel: "Ready for calling",
      };
    case "awaiting_approval":
      return {
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        title: "Awaiting Approval",
        defaultLabel: "Ready to send",
      };
    default:
      return {
        icon: <Zap className="h-4 w-4 text-amber-600" />,
        title: "Triggered",
        defaultLabel: "Processing",
      };
  }
}

/**
 * Trigger Node - Shows when an email or call was triggered/approved.
 */
function TriggerNodeComponent({ data }: NodeProps) {
  const nodeData = data as TriggerNodeData;
  const config = getTriggerConfig(nodeData?.triggerType);
  const status = nodeData?.status ?? "completed";
  const isAwaiting = nodeData?.triggerType === "awaiting_approval";

  return (
    <BaseWorkflowNode
      icon={
        <div className="relative">
          {config.icon}
          {!isAwaiting && (
            <Zap className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-500" />
          )}
        </div>
      }
      title={config.title}
      subtitle={nodeData?.label ?? config.defaultLabel}
      timestamp={nodeData?.timestamp}
      status={status}
      pulseAnimation={isAwaiting}
    />
  );
}

export const TriggerNode = memo(TriggerNodeComponent);
