"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { BaseWorkflowNode, type NodeStatus } from "./base-workflow-node";

interface StatusNodeData {
  statusType: "complete" | "failed" | "partial";
  message?: string;
  timestamp?: string;
}

const statusConfig: Record<
  "complete" | "failed" | "partial",
  {
    icon: typeof CheckCircle2;
    iconColor: string;
    title: string;
    defaultMessage: string;
    status: NodeStatus;
  }
> = {
  complete: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    title: "Delivery Complete",
    defaultMessage: "All communications sent successfully",
    status: "completed",
  },
  failed: {
    icon: XCircle,
    iconColor: "text-red-600",
    title: "Delivery Failed",
    defaultMessage: "Unable to complete delivery",
    status: "failed",
  },
  partial: {
    icon: AlertCircle,
    iconColor: "text-amber-600",
    title: "Partial Delivery",
    defaultMessage: "Some communications pending",
    status: "pending",
  },
};

/**
 * Status Node - Final node showing the overall delivery status.
 * Shows complete, failed, or partial status.
 */
function StatusNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as StatusNodeData;
  const statusType = nodeData?.statusType ?? "complete";
  const config = statusConfig[statusType];
  const Icon = config.icon;

  return (
    <BaseWorkflowNode
      icon={<Icon className={`h-5 w-5 ${config.iconColor}`} />}
      title={config.title}
      subtitle={nodeData?.message ?? config.defaultMessage}
      timestamp={nodeData?.timestamp}
      status={config.status}
      showSourceHandle={false}
    />
  );
}

export const StatusNode = memo(StatusNodeComponent);
