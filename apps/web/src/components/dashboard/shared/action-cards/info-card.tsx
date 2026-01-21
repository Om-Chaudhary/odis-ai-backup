"use client";

import { Info } from "lucide-react";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
  EditorialStatusBadge,
  type FieldItem,
} from "./editorial";

interface InfoCardProps {
  /** Outcome summary from VAPI */
  outcomeSummary: string;
  /** Follow-up summary if any */
  followUpSummary?: string | null;
  /** Next steps if any */
  nextSteps?: string | null;
  /** Key topics discussed */
  keyTopics?: string[] | string | null;
  /** Additional className */
  className?: string;
}

/**
 * Info Card (Editorial Design)
 *
 * Displays information request details from VAPI call_outcome_data
 * with magazine-style editorial layout and key-value pairs.
 */
export function InfoCard({
  outcomeSummary: _outcomeSummary,
  followUpSummary,
  nextSteps,
  keyTopics,
  className,
}: InfoCardProps) {
  // Parse key topics
  const topics = Array.isArray(keyTopics)
    ? keyTopics
    : typeof keyTopics === "string"
      ? keyTopics.split(",").map((t) => t.trim())
      : [];

  // Determine resolution status
  const getResolution = (): string => {
    if (nextSteps) return "Pending follow-up";
    if (followUpSummary?.toLowerCase().includes("resolved")) return "Resolved";
    return "Questions answered";
  };

  // Build field items for structured display
  const fields: FieldItem[] = [
    {
      label: "Topics",
      value: topics.length > 0 ? topics.slice(0, 3).join(", ") : null,
    },
    {
      label: "Resolution",
      value: getResolution(),
    },
  ];

  return (
    <EditorialCardBase variant="info" className={className}>
      <EditorialHeader
        titleLine1="Information"
        titleLine2="Provided"
        icon={Info}
        variant="info"
      />

      <EditorialFieldList
        sectionLabel="Inquiry Details"
        fields={fields}
        variant="info"
      />

      <EditorialStatusBadge
        text="Inquiry Resolved"
        showCheck
        variant="info"
      />
    </EditorialCardBase>
  );
}
