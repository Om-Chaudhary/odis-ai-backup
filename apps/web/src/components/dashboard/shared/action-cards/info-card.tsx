"use client";

import { Info } from "lucide-react";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
} from "./editorial";

interface InfoCardProps {
  /** Info topic/reason from VAPI structured output (new format) */
  reason?: string | null;
  /** Outcome summary from VAPI (legacy fallback) */
  outcomeSummary: string;
  /** Key topics discussed (legacy fallback) */
  keyTopics?: string[] | string | null;
  /** Additional className */
  className?: string;
}

/**
 * Get the inquiry text to display from legacy fields
 */
function getLegacyInquiryText(
  outcomeSummary: string,
  keyTopics?: string[] | string | null,
): string {
  // Parse key topics
  const topics = Array.isArray(keyTopics)
    ? keyTopics
    : typeof keyTopics === "string"
      ? keyTopics.split(",").map((t) => t.trim())
      : [];

  if (topics.length > 0) {
    const topicList = topics.slice(0, 3).join(", ");
    return `Asked about ${topicList.toLowerCase()}`;
  }

  // Fall back to outcome summary, truncate if needed
  if (outcomeSummary.length > 100) {
    return outcomeSummary.slice(0, 97) + "...";
  }

  return outcomeSummary;
}

/**
 * Info Card
 *
 * Editorial design with:
 * - Blue gradient background
 * - Info circle icon
 * - Information text in quotes
 * - NO confirm button (info-only cards don't need confirmation)
 */
export function InfoCard({
  reason,
  outcomeSummary,
  keyTopics,
  className,
}: InfoCardProps) {
  // Use new reason field if available, otherwise fall back to legacy derivation
  const inquiry = reason ?? getLegacyInquiryText(outcomeSummary, keyTopics);

  // Build fields - only show topic
  const fields = [
    {
      label: "Topic:",
      value: inquiry,
      isQuoted: true,
    },
  ];

  return (
    <EditorialCardBase variant="info" className={className}>
      <EditorialHeader
        title="Informational Call"
        icon={Info}
        variant="info"
      />

      <EditorialFieldList variant="info" fields={fields} />
    </EditorialCardBase>
  );
}
