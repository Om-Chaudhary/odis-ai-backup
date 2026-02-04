"use client";

import { PhoneCall } from "lucide-react";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
} from "./editorial";

interface CallbackCardProps {
  /** Concise reason from VAPI structured output (3-8 words) */
  reason?: string | null;
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
 * Callback Card
 *
 * Editorial design with:
 * - Orange/peach gradient background
 * - Phone icon with wave decoration
 * - Request reason in quotes
 * - Large green confirm button
 */
export function CallbackCard({
  reason,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: CallbackCardProps) {
  // Build fields - only show reason if provided (from structured output)
  const fields = reason
    ? [
        {
          label: "Reason:",
          value: reason,
          isQuoted: true,
        },
      ]
    : [];

  return (
    <EditorialCardBase variant="callback" className={className}>
      <EditorialHeader
        title="Callback Request"
        icon={PhoneCall}
        variant="callback"
      />

      <EditorialFieldList
        variant="callback"
        fields={fields}
        showConfirmButton
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
      />
    </EditorialCardBase>
  );
}
