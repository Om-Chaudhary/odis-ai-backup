"use client";

import { AlertTriangle } from "lucide-react";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
  EditorialStatusBadge,
  type FieldItem,
} from "./editorial";

interface EmergencyCardProps {
  /** Escalation summary from VAPI */
  escalationSummary: string;
  /** Outcome summary with details */
  outcomeSummary?: string | null;
  /** Staff action needed */
  staffActionNeeded?: string | null;
  /** Key topics/symptoms discussed */
  keyTopics?: string[] | string | null;
  /** Pet name if available */
  petName?: string | null;
  /** Additional className */
  className?: string;
}

/**
 * Emergency Card (Editorial Design)
 *
 * Displays emergency/urgent concern information from VAPI
 * escalation_data and pet_health_data with high-visibility design.
 */
export function EmergencyCard({
  escalationSummary,
  outcomeSummary,
  staffActionNeeded,
  keyTopics,
  petName,
  className,
}: EmergencyCardProps) {
  // Parse key topics/symptoms
  const symptoms = Array.isArray(keyTopics)
    ? keyTopics
    : typeof keyTopics === "string"
      ? keyTopics.split(",").map((t) => t.trim())
      : [];

  // Determine urgency level from escalation summary
  const getUrgency = (): string => {
    const summary = escalationSummary.toLowerCase();
    if (summary.includes("critical") || summary.includes("life-threatening")) {
      return "Critical";
    }
    if (summary.includes("emergency") || summary.includes("immediate")) {
      return "Emergency";
    }
    return "Urgent";
  };

  // Build field items for structured display
  const fields: FieldItem[] = [
    {
      label: "Pet",
      value: petName ?? null,
    },
    {
      label: "Symptoms",
      value: symptoms.length > 0 ? symptoms.slice(0, 3).join(", ") : null,
    },
    {
      label: "Urgency",
      value: getUrgency(),
    },
    {
      label: "Action",
      value: staffActionNeeded ?? outcomeSummary ?? null,
    },
  ];

  return (
    <EditorialCardBase variant="emergency" className={className}>
      <EditorialHeader
        titleLine1="Emergency"
        titleLine2="Triage"
        icon={AlertTriangle}
        variant="emergency"
      />

      <EditorialFieldList
        sectionLabel="Urgent Concern"
        fields={fields}
        variant="emergency"
      />

      <EditorialStatusBadge
        text="Emergency Handled"
        isPulsing
        variant="emergency"
      />
    </EditorialCardBase>
  );
}
