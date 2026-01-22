"use client";

import { Info } from "lucide-react";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
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
 * Get the inquiry text to display
 */
function getInquiryText(
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
  outcomeSummary,
  keyTopics,
  className,
}: InfoCardProps) {
  // Get inquiry text
  const inquiry = getInquiryText(outcomeSummary, keyTopics);

  return (
    <EditorialCardBase variant="info" className={className}>
      <EditorialHeader
        title="Information Provided"
        icon={Info}
        variant="info"
      />

      <EditorialFieldList
        variant="info"
        fields={[
          {
            label: "Info:",
            value: inquiry,
            isQuoted: true,
          },
        ]}
      />
    </EditorialCardBase>
  );
}
