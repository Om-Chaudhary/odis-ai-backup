/**
 * Generates descriptive outcomes for inbound calls
 * Uses structured data from VAPI to create clinically relevant outcome descriptions
 */

import type { Database } from "@odis-ai/shared/types";

// Use Database type for compatibility with actual table data
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

export interface DescriptiveOutcome {
  /** Short badge label (1-3 words) */
  label: string;
  /** Full descriptive text for detail views */
  description: string | null;
  /** Semantic color variant */
  variant:
    | "urgent"
    | "callback"
    | "scheduled"
    | "info"
    | "completed"
    | "cancelled"
    | "default";
}

/**
 * Generates a descriptive outcome from structured call data
 *
 * For veterinarians reviewing after-hours calls, the outcome should clearly show:
 * - Label: The action required (what the vet/staff needs to do)
 * - Description: The clinical context (what happened, what's needed)
 */
export function getDescriptiveOutcome(call: InboundCall): DescriptiveOutcome {
  // Use summary as the base description - it contains the clinical context
  const clinicalSummary = call.summary ?? "No details available";

  // Helper to safely access Json object properties
  const getJsonProp = <T>(obj: unknown, key: string): T | undefined => {
    if (obj && typeof obj === "object" && key in obj) {
      return (obj as Record<string, unknown>)[key] as T;
    }
    return undefined;
  };

  // Priority 1: Check for actual urgent medical situations vs administrative escalations
  const escalationTriggered = getJsonProp<boolean>(
    call.escalation_data,
    "escalation_triggered",
  );
  const isUrgentOutcome = call.outcome === "Urgent";
  const hasUrgentAttention = call.attention_types?.includes("urgent");
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const hasEscalation =
    call.attention_types?.includes("escalation") ||
    escalationTriggered === true;

  // True urgent medical situations
  if (isUrgentOutcome || hasUrgentAttention) {
    return {
      label: "Priority",
      description: clinicalSummary,
      variant: "urgent",
    };
  }

  // Administrative escalations (AI limitations, access issues, etc.)
  if (hasEscalation) {
    const summaryLower = clinicalSummary.toLowerCase();

    // Check if it's a records/administrative request
    if (
      summaryLower.includes("record") ||
      summaryLower.includes("vaccination") ||
      summaryLower.includes("cannot access") ||
      summaryLower.includes("not directly access")
    ) {
      return {
        label: "Records Request",
        description: clinicalSummary,
        variant: "callback",
      };
    }

    // Generic escalation - AI couldn't handle something
    return {
      label: "Staff Review",
      description: clinicalSummary,
      variant: "callback",
    };
  }

  // Priority 2: APPOINTMENT SCHEDULED - Handled by AI
  if (call.outcome === "Scheduled") {
    return {
      label: "Appt. Scheduled",
      description: clinicalSummary,
      variant: "scheduled",
    };
  }

  // Priority 3: CALLBACK/FOLLOW-UP NEEDED - Action required by staff
  const followUpNeeded =
    getJsonProp<boolean>(call.follow_up_data, "follow_up_needed") === true;
  const hasCallBack = call.outcome === "Call Back";

  if (followUpNeeded || hasCallBack) {
    // Determine specific action needed from summary content
    const summaryLower = clinicalSummary.toLowerCase();

    // Check for appointment requests
    if (
      summaryLower.includes("appointment") ||
      summaryLower.includes("schedule") ||
      summaryLower.includes("book") ||
      summaryLower.includes("visit")
    ) {
      return {
        label: "Appt. Request",
        description: clinicalSummary,
        variant: "callback",
      };
    }

    // Check for message/callback
    if (
      summaryLower.includes("message") ||
      summaryLower.includes("call back") ||
      summaryLower.includes("callback")
    ) {
      return {
        label: "Message/Callback",
        description: clinicalSummary,
        variant: "callback",
      };
    }

    // Check for medical records request
    if (
      summaryLower.includes("medical record") ||
      summaryLower.includes("records") ||
      summaryLower.includes("insurance")
    ) {
      return {
        label: "Records Request",
        description: clinicalSummary,
        variant: "callback",
      };
    }

    // Check for medication/prescription
    if (
      summaryLower.includes("medication") ||
      summaryLower.includes("prescription") ||
      summaryLower.includes("refill")
    ) {
      return {
        label: "Rx Request",
        description: clinicalSummary,
        variant: "callback",
      };
    }

    // Generic follow-up needed
    return {
      label: "Follow-up Needed",
      description: clinicalSummary,
      variant: "callback",
    };
  }

  // Priority 4: CANCELLATION - Action required
  if (call.outcome === "Cancellation") {
    return {
      label: "Cancellation",
      description: clinicalSummary,
      variant: "cancelled",
    };
  }

  // Priority 5: INFORMATION PROVIDED - No action needed, FYI only
  if (
    call.outcome === "Info" ||
    call.outcome === "Completed" ||
    call.status === "completed"
  ) {
    return {
      label: "Info Provided",
      description: clinicalSummary,
      variant: "info",
    };
  }

  // Priority 6: CHECK MESSAGES - Call generated appointment or message record
  // (These calls should be reviewed alongside their appointment/message)
  if (
    Array.isArray(call.actions_taken) &&
    call.actions_taken.some((action: unknown) => {
      if (typeof action === "string") {
        return (
          action.toLowerCase().includes("appointment") ||
          action.toLowerCase().includes("message")
        );
      }
      return false;
    })
  ) {
    return {
      label: "See Details",
      description: clinicalSummary,
      variant: "info",
    };
  }

  // Priority 7: Fall back to simple outcome if available
  if (call.outcome) {
    return {
      label: call.outcome,
      description: clinicalSummary,
      variant: mapSimpleOutcomeToVariant(call.outcome),
    };
  }

  // Default: Unknown outcome
  return {
    label: "Review Needed",
    description: clinicalSummary,
    variant: "default",
  };
}

/**
 * Map simple outcome field to semantic variant
 */
function mapSimpleOutcomeToVariant(
  outcome: string,
): DescriptiveOutcome["variant"] {
  switch (outcome) {
    case "Urgent":
      return "urgent";
    case "Call Back":
      return "callback";
    case "Scheduled":
      return "scheduled";
    case "Cancellation":
      return "cancelled";
    case "Completed":
      return "completed";
    case "Info":
      return "info";
    default:
      return "default";
  }
}
