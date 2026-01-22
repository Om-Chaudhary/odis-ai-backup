"use client";

import { Info } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { SimpleCardBase, getCardVariantStyles } from "./simple-card-base";

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
  if (outcomeSummary.length > 80) {
    return outcomeSummary.slice(0, 77) + "...";
  }

  return outcomeSummary;
}

/**
 * Info Card
 *
 * Clean, utilitarian design:
 * - Info icon + header line
 * - Single line showing topic/question in quotes
 * - NO confirm button
 */
export function InfoCard({
  outcomeSummary,
  keyTopics,
  className,
}: InfoCardProps) {
  const styles = getCardVariantStyles("info");

  // Get inquiry text
  const inquiry = getInquiryText(outcomeSummary, keyTopics);

  return (
    <SimpleCardBase variant="info" className={className}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className={cn("rounded-md p-1.5", styles.iconBg)}>
            <Info className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Clinic Info</h3>
        </div>

        {/* Inquiry */}
        <p className="mt-2.5 text-sm italic text-muted-foreground">
          "{inquiry}"
        </p>
      </div>
    </SimpleCardBase>
  );
}
