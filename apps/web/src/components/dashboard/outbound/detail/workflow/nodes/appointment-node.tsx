"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Hospital } from "lucide-react";
import { BaseWorkflowNode } from "./base-workflow-node";

interface AppointmentNodeData {
  caseType?: string;
  visitType?: string;
  timestamp?: string;
}

// Format case type for display
function formatCaseType(caseType: string | undefined): string {
  if (!caseType) return "Visit completed";

  const formatted = caseType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return formatted;
}

/**
 * Appointment Node - Start of the workflow flow.
 * Shows when the appointment ended and what type of visit it was.
 */
function AppointmentNodeComponent({ data }: NodeProps) {
  const nodeData = data as AppointmentNodeData;
  return (
    <BaseWorkflowNode
      icon={<Hospital className="h-4 w-4 text-emerald-600" />}
      title="Appointment Ended"
      subtitle={formatCaseType(nodeData?.caseType ?? nodeData?.visitType)}
      timestamp={nodeData?.timestamp}
      status="completed"
      showTargetHandle={false}
    />
  );
}

export const AppointmentNode = memo(AppointmentNodeComponent);
