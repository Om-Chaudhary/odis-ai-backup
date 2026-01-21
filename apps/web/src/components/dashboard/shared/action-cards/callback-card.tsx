"use client";

import { PhoneCall } from "lucide-react";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
  EditorialActionButton,
  EditorialStatusBadge,
  type FieldItem,
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
  /** Additional className */
  className?: string;
}

/**
 * Callback Card (Editorial Design)
 *
 * Displays callback request information from VAPI escalation_data
 * with magazine-style editorial layout and key-value pairs.
 */
export function CallbackCard({
  escalationSummary,
  staffActionNeeded,
  nextSteps: _nextSteps,
  callerName,
  petName: _petName,
  phoneNumber,
  className,
}: CallbackCardProps) {
  // Extract phone number from staffActionNeeded if not provided
  const extractedPhone =
    phoneNumber ??
    staffActionNeeded?.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/)?.[0];

  // Format phone for display
  const formatPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  // Determine priority level from escalation summary or staff action
  const getPriority = (): string | null => {
    const combined = `${escalationSummary} ${staffActionNeeded ?? ""}`.toLowerCase();
    if (combined.includes("urgent") || combined.includes("asap") || combined.includes("critical")) {
      return "Urgent";
    }
    if (combined.includes("high") || combined.includes("important")) {
      return "High";
    }
    return null;
  };

  // Build field items for structured display
  const fields: FieldItem[] = [
    {
      label: "Client",
      value: callerName ?? null,
    },
    {
      label: "Request",
      value: staffActionNeeded ?? escalationSummary ?? null,
    },
    {
      label: "Priority",
      value: getPriority(),
    },
  ];

  return (
    <EditorialCardBase variant="callback" className={className}>
      <EditorialHeader
        titleLine1="Callback"
        titleLine2="Requested"
        icon={PhoneCall}
        variant="callback"
      />

      <EditorialFieldList
        sectionLabel="Request Details"
        fields={fields}
        variant="callback"
      />

      {extractedPhone ? (
        <EditorialActionButton
          label="Call Back"
          dateOrText={formatPhone(extractedPhone)}
          onClick={() => {
            window.location.href = `tel:${extractedPhone.replace(/\D/g, "")}`;
          }}
          variant="callback"
        />
      ) : (
        <EditorialStatusBadge
          text="Awaiting Callback"
          isPulsing
          variant="callback"
        />
      )}
    </EditorialCardBase>
  );
}
