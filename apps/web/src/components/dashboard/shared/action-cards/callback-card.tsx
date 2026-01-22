"use client";

import { Phone, Check, Loader2 } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { SimpleCardBase, getCardVariantStyles } from "./simple-card-base";

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
  /** Additional className */
  className?: string;
}

/**
 * Format phone number for display (1234567890 -> 123-456-7890)
 */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
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
  if (text.length > 80) {
    return text.slice(0, 77) + "...";
  }

  return text;
}

/**
 * Callback Card
 *
 * Clean, utilitarian design:
 * - Phone icon + header line
 * - Reason/request in quotes
 * - Call button with phone number
 */
export function CallbackCard({
  escalationSummary,
  staffActionNeeded,
  phoneNumber,
  onConfirm,
  isConfirming,
  className,
}: CallbackCardProps) {
  const styles = getCardVariantStyles("callback");

  // Extract phone number from staffActionNeeded if not provided
  const extractedPhone =
    phoneNumber ??
    staffActionNeeded?.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/)?.[0];

  // Get reason text
  const reason = getReasonText(escalationSummary, staffActionNeeded);

  return (
    <SimpleCardBase variant="callback" className={className}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className={cn("rounded-md p-1.5", styles.iconBg)}>
            <Phone className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Callback Requested
          </h3>
        </div>

        {/* Reason */}
        <p className="mt-2.5 text-sm italic text-muted-foreground">
          "{reason}"
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-2">
          {/* Call link */}
          {extractedPhone && (
            <a
              href={`tel:${extractedPhone.replace(/\D/g, "")}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5",
                "text-xs font-medium",
                "border border-terracotta-300 text-terracotta-600",
                "hover:bg-terracotta-50 active:bg-terracotta-100",
                "transition-colors duration-150",
              )}
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={2} />
              {formatPhone(extractedPhone)}
            </a>
          )}

          {/* Confirm button */}
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={isConfirming}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5",
                "text-xs font-medium",
                "bg-terracotta-500 text-white",
                "hover:bg-terracotta-600 active:bg-terracotta-700",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "transition-colors duration-150",
              )}
            >
              {isConfirming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              Confirm
            </button>
          )}
        </div>
      </div>
    </SimpleCardBase>
  );
}
