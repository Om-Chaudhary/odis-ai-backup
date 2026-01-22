"use client";

import { PhoneCall } from "lucide-react";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
} from "./editorial";

interface CallbackCardProps {
  /** Summary of the callback request from VAPI */
  escalationSummary: string;
  /** Staff action needed from VAPI */
  staffActionNeeded?: string | null;
  /** Follow-up next steps */
  nextSteps?: string | null;
  /** Caller name if available */
  callerName?: string | null;
  /** Pet name if available */
  petName?: string | null;
  /** Phone number to call back */
  phoneNumber?: string | null;
  /** Callback when confirm is clicked */
  onConfirm?: () => void;
  /** Whether confirm action is in progress */
  isConfirming?: boolean;
  /** Whether the action has been confirmed */
  isConfirmed?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Get reason text to display
 */
function getReasonText(
  escalationSummary: string,
  staffActionNeeded?: string | null,
): string {
  const text = staffActionNeeded ?? escalationSummary;

  // Truncate if too long
  if (text.length > 100) {
    return text.slice(0, 97) + "...";
  }

  return text;
}

/**
 * Callback Card
 *
 * Editorial design with:
 * - Orange/peach gradient background
 * - Phone icon with wave decoration
 * - Request reason in quotes
 * - Large green confirm button
 */
export function CallbackCard({
  escalationSummary,
  staffActionNeeded,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: CallbackCardProps) {
  // Get reason text
  const reason = getReasonText(escalationSummary, staffActionNeeded);

  return (
    <EditorialCardBase variant="callback" className={className}>
      <EditorialHeader
        title="Callback Request"
        icon={PhoneCall}
        variant="callback"
        showConfirmButton
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
      />

      <EditorialFieldList
        variant="callback"
        fields={[
          {
            label: "Request:",
            value: reason,
            isQuoted: true,
          },
        ]}
      />
    </EditorialCardBase>
  );
}
