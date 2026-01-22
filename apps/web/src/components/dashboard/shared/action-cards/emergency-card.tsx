"use client";

import { Cross } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { SimpleCardBase, getCardVariantStyles } from "./simple-card-base";

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
  /** ER name if provided directly from VAPI structured output (skips regex extraction) */
  erName?: string | null;
  /** Additional className */
  className?: string;
}

/**
 * Extract ER/hospital name from escalation text
 * Looks for common patterns like "sent to [Name] ER", "referred to [Name] Hospital", etc.
 */
function extractERName(
  escalationSummary: string,
  staffActionNeeded?: string | null,
): string | null {
  const combined = `${escalationSummary} ${staffActionNeeded ?? ""}`;

  // Common patterns for ER/hospital references
  const patterns = [
    /(?:sent|referred|directed|go|going)\s+to\s+([A-Z][A-Za-z\s]+(?:ER|Emergency|Hospital|Clinic|Vet|Animal\s+Hospital))/i,
    /([A-Z][A-Za-z\s]+(?:ER|Emergency|Hospital|Clinic|Vet|Animal\s+Hospital))/i,
    /nearest\s+([A-Z][A-Za-z\s]+(?:ER|Emergency))/i,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
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
  if (escalationSummary.length > 80) {
    return escalationSummary.slice(0, 77) + "...";
  }

  return escalationSummary;
}

/**
 * Emergency Card
 *
 * Clean, utilitarian design:
 * - Plus/cross icon + header line
 * - Reason/symptoms in quotes
 * - ER referral line (or "Referred to nearest ER")
 * - NO confirm button
 */
export function EmergencyCard({
  escalationSummary,
  staffActionNeeded,
  keyTopics,
  erName: providedErName,
  className,
}: EmergencyCardProps) {
  const styles = getCardVariantStyles("emergency");

  // Use provided ER name or extract from text as fallback
  const extractedErName = extractERName(escalationSummary, staffActionNeeded);
  const erName = providedErName ?? extractedErName;
  const erText = erName ? `Sent to ${erName}` : "Referred to nearest ER";

  // Get reason text
  const reason = getReasonText(escalationSummary, keyTopics);

  return (
    <SimpleCardBase variant="emergency" className={className}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className={cn("rounded-md p-1.5", styles.iconBg)}>
            <Cross className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Emergency Triage
          </h3>
        </div>

        {/* Reason/Symptoms */}
        {reason && (
          <p className="mt-2.5 text-sm italic text-muted-foreground">
            "{reason}"
          </p>
        )}

        {/* ER Referral */}
        <p className="mt-2 text-sm font-medium text-rose-600">{erText}</p>
      </div>
    </SimpleCardBase>
  );
}
