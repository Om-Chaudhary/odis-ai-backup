"use client";

import { AlertTriangle } from "lucide-react";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
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
  /** ER name if provided directly from VAPI structured output */
  erName?: string | null;
  /** Additional className */
  className?: string;
}

/**
 * Get reason/symptoms from the data
 */
function getReasonText(
  escalationSummary: string,
  keyTopics?: string[] | string | null,
): string {
  // Parse key topics/symptoms
  const symptoms = Array.isArray(keyTopics)
    ? keyTopics
    : typeof keyTopics === "string"
      ? keyTopics.split(",").map((t) => t.trim())
      : [];

  if (symptoms.length > 0) {
    return symptoms.slice(0, 3).join(", ");
  }

  // Fall back to escalation summary, but truncate if too long
  if (escalationSummary.length > 100) {
    return escalationSummary.slice(0, 97) + "...";
  }

  return escalationSummary;
}

/**
 * Emergency Card
 *
 * Editorial design with:
 * - Pink/rose gradient background
 * - Warning triangle icon
 * - Request/symptoms in quotes
 * - NO confirm button (emergency actions don't need confirmation)
 */
export function EmergencyCard({
  escalationSummary,
  keyTopics,
  erName,
  className,
}: EmergencyCardProps) {
  // Get reason text
  const reason = getReasonText(escalationSummary, keyTopics);

  // Build fields dynamically
  const fields = [
    {
      label: "Request:",
      value: reason,
      isQuoted: true,
    },
  ];

  // Add ER name if available
  if (erName) {
    fields.push({
      label: "Triaged To:",
      value: erName,
      isQuoted: false,
    });
  }

  return (
    <EditorialCardBase variant="emergency" className={className}>
      <EditorialHeader
        title="Emergency Triage"
        icon={AlertTriangle}
        variant="emergency"
      />

      <EditorialFieldList variant="emergency" fields={fields} />
    </EditorialCardBase>
  );
}
