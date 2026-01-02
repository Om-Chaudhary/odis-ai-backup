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
    | "emergency"
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
  const summaryLower = clinicalSummary.toLowerCase();

  // Helper to safely access Json object properties
  const getJsonProp = <T>(obj: unknown, key: string): T | undefined => {
    if (obj && typeof obj === "object" && key in obj) {
      return (obj as Record<string, unknown>)[key] as T;
    }
    return undefined;
  };

  // Priority 0: Emergency Triage - ER referral
  // Detect calls that ended with the AI recommending an emergency hospital/ER
  const erKeywords = [
    "emergency hospital",
    "emergency vet",
    "emergency clinic",
    "emergency room",
    "er referral",
    "referred to er",
    "go to er",
    "nearest er",
    "emergency care",
    "emergency facility",
    "emergency veterinary",
  ];

  const hasErReferral = erKeywords.some((kw) => summaryLower.includes(kw));
  const escalationType = getJsonProp<string>(
    call.escalation_data,
    "escalation_type",
  );
  const isErEscalation =
    escalationType?.toLowerCase().includes("emergency") ?? false;

  // Check actions_taken for ER referral
  const hasErAction =
    Array.isArray(call.actions_taken) &&
    call.actions_taken.some((action: unknown) => {
      if (typeof action === "string") {
        return erKeywords.some((kw) => action.toLowerCase().includes(kw));
      }
      return false;
    });

  if (hasErReferral || isErEscalation || hasErAction) {
    return {
      label: "Emergency Triage",
      description: clinicalSummary,
      variant: "emergency",
    };
  }

  // Priority 1: Check for actual urgent medical situations vs administrative escalations
  const escalationTriggered = getJsonProp<boolean>(
    call.escalation_data,
    "escalation_triggered",
  );
  const isUrgentOutcome = call.outcome === "Urgent";
  const hasUrgentAttention = call.attention_types?.includes("urgent");
  const hasEscalation =
    (call.attention_types?.includes("escalation") ?? false) ||
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

  // Priority 5: INFO - Call that actually provided information
  // Check transcript for user speech first
  const transcript = (call.transcript ?? "").trim();
  const hasUserSpeech = /\b(User|Customer|Client):/i.test(transcript);

  // If outcome is explicitly Info/Completed and user spoke, show Info
  if (
    (call.outcome === "Info" || call.outcome === "Completed") &&
    hasUserSpeech
  ) {
    return {
      label: "Info",
      description: clinicalSummary,
      variant: "info",
    };
  }

  // Priority 5b: Detect info-providing calls even without explicit outcome
  // These are calls where user asked a question and got informational response
  if (hasUserSpeech && !call.outcome) {
    const infoKeywords = [
      "closed",
      "open",
      "hours",
      "available",
      "tomorrow",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
      "holiday",
      "new year",
      "christmas",
      "thanksgiving",
      "location",
      "address",
      "directions",
      "pricing",
      "cost",
      "services",
      "offer",
    ];

    const hasInfoContent = infoKeywords.some((kw) => summaryLower.includes(kw));

    if (hasInfoContent) {
      return {
        label: "Info",
        description: clinicalSummary,
        variant: "info",
      };
    }
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
