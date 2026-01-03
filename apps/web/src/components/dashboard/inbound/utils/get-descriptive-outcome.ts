/**
 * Generates descriptive outcomes for inbound calls
 * Uses structured data from VAPI to create clinically relevant outcome descriptions
 *
 * Main Outcome Categories:
 * 1. Appointment - scheduled, canceled, rescheduled
 * 2. Info Provided - clinic info, general clinical guidance
 * 3. Emergency Triage - emergency info, routed to ER
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
    | "emergency"
    | "scheduled"
    | "cancelled"
    | "info"
    | "callback"
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

  // ============================================================================
  // CATEGORY 1: EMERGENCY TRIAGE
  // ============================================================================

  // Detect calls that ended with ER referral or emergency handling
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

  // Check for urgent/emergency outcome or attention flags
  const isEmergencyOutcome = call.outcome === "Emergency";
  const hasUrgentAttention = call.attention_types?.includes("urgent");

  if (isEmergencyOutcome || hasUrgentAttention) {
    return {
      label: "Emergency Triage",
      description: clinicalSummary,
      variant: "emergency",
    };
  }

  // ============================================================================
  // CATEGORY 2: APPOINTMENT
  // ============================================================================

  // Scheduled
  if (call.outcome === "Scheduled") {
    return {
      label: "Appt. Scheduled",
      description: clinicalSummary,
      variant: "scheduled",
    };
  }

  // Canceled
  if (call.outcome === "Cancellation") {
    // Check if it's a reschedule
    if (
      summaryLower.includes("reschedule") ||
      summaryLower.includes("re-schedule")
    ) {
      return {
        label: "Appt. Rescheduled",
        description: clinicalSummary,
        variant: "scheduled",
      };
    }
    return {
      label: "Appt. Canceled",
      description: clinicalSummary,
      variant: "cancelled",
    };
  }

  // Check for appointment-related content in summary
  const appointmentKeywords = [
    "appointment",
    "schedule",
    "book",
    "visit",
    "check-up",
    "checkup",
  ];
  const hasAppointmentContent = appointmentKeywords.some((kw) =>
    summaryLower.includes(kw),
  );

  // If follow-up needed and appointment-related
  const followUpNeeded =
    getJsonProp<boolean>(call.follow_up_data, "follow_up_needed") === true;
  const hasCallBack = call.outcome === "Call Back";

  if ((followUpNeeded || hasCallBack) && hasAppointmentContent) {
    return {
      label: "Appt. Request",
      description: clinicalSummary,
      variant: "callback",
    };
  }

  // ============================================================================
  // CATEGORY 3: INFO PROVIDED
  // ============================================================================

  // Keywords for clinic info requests
  const clinicInfoKeywords = [
    "hours",
    "open",
    "closed",
    "location",
    "address",
    "directions",
    "pricing",
    "cost",
    "price",
    "services",
    "offer",
    "available",
    "phone",
    "number",
    "fax",
    "email",
    "website",
    "parking",
    "holiday",
    "new year",
    "christmas",
    "thanksgiving",
    "weekend",
  ];

  // Keywords for general clinical guidance
  const clinicalGuidanceKeywords = [
    "advice",
    "recommend",
    "guidance",
    "question",
    "information",
    "inquir",
    "general",
    "symptom",
    "monitor",
    "watch for",
    "normal",
    "concern",
    "worried",
    "eating",
    "drinking",
    "behavior",
    "recovery",
    "healing",
    "medication",
    "diet",
    "exercise",
    "activity",
    "care",
    "instruction",
  ];

  // Explicit Info outcome
  if (call.outcome === "Info") {
    // Determine subtype
    const isClinicInfo = clinicInfoKeywords.some((kw) =>
      summaryLower.includes(kw),
    );
    if (isClinicInfo) {
      return {
        label: "Clinic Info",
        description: clinicalSummary,
        variant: "info",
      };
    }
    return {
      label: "Clinical Guidance",
      description: clinicalSummary,
      variant: "info",
    };
  }

  // Detect info calls even without explicit outcome
  // Check for info keywords regardless of length - even short summaries can be info
  const hasClinicInfoContent = clinicInfoKeywords.some((kw) =>
    summaryLower.includes(kw),
  );
  const hasClinicalGuidanceContent = clinicalGuidanceKeywords.some((kw) =>
    summaryLower.includes(kw),
  );

  if (hasClinicInfoContent) {
    return {
      label: "Clinic Info",
      description: clinicalSummary,
      variant: "info",
    };
  }

  if (hasClinicalGuidanceContent) {
    return {
      label: "Clinical Guidance",
      description: clinicalSummary,
      variant: "info",
    };
  }

  // ============================================================================
  // FALLBACK: Other callbacks and follow-ups
  // ============================================================================

  // Check for escalation that needs follow-up
  const escalationTriggered = getJsonProp<boolean>(
    call.escalation_data,
    "escalation_triggered",
  );
  const hasEscalation =
    (call.attention_types?.includes("escalation") ?? false) ||
    escalationTriggered === true;

  if (hasEscalation) {
    // Records request
    if (
      summaryLower.includes("record") ||
      summaryLower.includes("vaccination") ||
      summaryLower.includes("insurance")
    ) {
      return {
        label: "Records Request",
        description: clinicalSummary,
        variant: "callback",
      };
    }

    // Generic follow-up
    return {
      label: "Follow-up Needed",
      description: clinicalSummary,
      variant: "callback",
    };
  }

  // Callback needed
  if (followUpNeeded || hasCallBack) {
    // Medication/Rx request
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

    // Message/callback
    if (
      summaryLower.includes("message") ||
      summaryLower.includes("call back") ||
      summaryLower.includes("callback")
    ) {
      return {
        label: "Message Left",
        description: clinicalSummary,
        variant: "callback",
      };
    }

    return {
      label: "Follow-up Needed",
      description: clinicalSummary,
      variant: "callback",
    };
  }

  // Check actions_taken for any context
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

  // Fall back to simple outcome if available
  if (call.outcome) {
    return {
      label: call.outcome,
      description: clinicalSummary,
      variant: mapSimpleOutcomeToVariant(call.outcome),
    };
  }

  // Default: Unknown outcome - needs review
  return {
    label: "Review Needed",
    description: clinicalSummary,
    variant: "default",
  };
}

/**
 * Map simple outcome field to semantic variant
 * VAPI enum values: Scheduled, Cancellation, Info, Emergency, Call Back, Blank
 */
function mapSimpleOutcomeToVariant(
  outcome: string,
): DescriptiveOutcome["variant"] {
  switch (outcome) {
    case "Emergency":
      return "emergency";
    case "Call Back":
      return "callback";
    case "Scheduled":
      return "scheduled";
    case "Cancellation":
      return "cancelled";
    case "Info":
      return "info";
    case "Blank":
      return "default";
    default:
      return "default";
  }
}
