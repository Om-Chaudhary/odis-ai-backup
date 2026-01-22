/**
 * Derive Action Card Data
 *
 * Utility to derive action card display data from legacy call fields.
 * Used as fallback when action_card_data is not available (pre-migration calls).
 *
 * @module dashboard/shared/action-cards/derive-action-card-data
 */

import type { BookingData, CallOutcome } from "../../inbound/types";

/**
 * Action card data structure (matches VAPI structured output)
 */
export interface ActionCardData {
  card_type:
    | "scheduled"
    | "rescheduled"
    | "cancellation"
    | "emergency"
    | "callback"
    | "info";

  appointment_data?: {
    patient_name?: string;
    client_name?: string;
    date?: string;
    time?: string;
    reason?: string;
  };

  original_appointment?: {
    date?: string;
    time?: string;
  };

  reschedule_reason?: string;
  cancellation_reason?: string;

  emergency_data?: {
    symptoms?: string[];
    er_name?: string | null;
    urgency_level?: "critical" | "urgent" | "monitor";
  };

  callback_data?: {
    reason?: string;
    phone_number?: string;
    caller_name?: string;
    pet_name?: string;
  };

  info_data?: {
    topics?: string[];
    summary?: string;
  };
}

/**
 * Call outcome data from VAPI structured output
 */
interface CallOutcomeData {
  call_outcome?: string;
  outcome_summary?: string;
  key_topics_discussed?: string[] | string;
}

/**
 * Escalation data from VAPI structured output
 */
interface EscalationData {
  escalation_triggered?: boolean;
  escalation_summary?: string;
  escalation_type?: string;
  staff_action_needed?: string;
  staff_action_required?: string;
}

/**
 * Follow-up data from VAPI structured output
 */
interface FollowUpData {
  follow_up_needed?: boolean;
  follow_up_summary?: string;
  appointment_status?: string;
  next_steps?: string;
}

/**
 * Legacy call data used to derive action card data
 */
export interface LegacyCallData {
  outcome?: CallOutcome | null;
  summary?: string | null;
  customer_phone?: string | null;
  call_outcome_data?: CallOutcomeData | null;
  escalation_data?: EscalationData | null;
  follow_up_data?: FollowUpData | null;
}

/**
 * Normalize outcome string to match canonical values
 */
function normalizeOutcome(
  outcome: string | null | undefined,
): ActionCardData["card_type"] | null {
  if (!outcome) return null;

  const lower = outcome.toLowerCase().trim();

  if (lower === "scheduled" || lower === "appointment") return "scheduled";
  if (lower === "rescheduled") return "rescheduled";
  if (
    lower === "cancellation" ||
    lower === "cancelled" ||
    lower === "canceled"
  )
    return "cancellation";
  if (lower === "callback" || lower === "call back" || lower === "message_taken")
    return "callback";
  if (lower === "emergency" || lower === "urgent_concern") return "emergency";
  if (lower === "info" || lower === "information") return "info";

  return null;
}

/**
 * Extract ER/hospital name from escalation text
 * Matches patterns like "sent to Austin ER", "referred to Pet Emergency Hospital"
 */
function extractERName(
  escalationSummary?: string | null,
  staffActionNeeded?: string | null,
): string | null {
  const combined = `${escalationSummary ?? ""} ${staffActionNeeded ?? ""}`;
  if (!combined.trim()) return null;

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
 * Extract phone number from text
 */
function extractPhoneNumber(text?: string | null): string | null {
  if (!text) return null;
  const pattern = /(\+?\d{1,2}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = pattern.exec(text);
  return match?.[0] ?? null;
}

/**
 * Parse key topics from various formats
 */
function parseKeyTopics(
  keyTopics?: string[] | string | null,
): string[] {
  if (Array.isArray(keyTopics)) return keyTopics;
  if (typeof keyTopics === "string") {
    return keyTopics.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Derive action card data from legacy call fields
 *
 * Used as fallback when action_card_data column is null (pre-migration calls).
 * Extracts and normalizes data from existing structured output columns.
 *
 * @param call - Legacy call data with structured output columns
 * @param booking - Optional booking data from vapi_bookings table
 * @returns Derived action card data or null if outcome unknown
 */
export function deriveActionCardData(
  call: LegacyCallData,
  booking?: BookingData | null,
): ActionCardData | null {
  const cardType = normalizeOutcome(call.outcome);
  if (!cardType) return null;

  const { call_outcome_data, escalation_data } = call;
  const outcomeSummary =
    call_outcome_data?.outcome_summary ?? call.summary ?? "";
  const keyTopics = parseKeyTopics(call_outcome_data?.key_topics_discussed);

  switch (cardType) {
    case "scheduled":
      return {
        card_type: "scheduled",
        appointment_data: booking
          ? {
              patient_name: booking.patient_name,
              client_name: booking.client_name,
              date: booking.date,
              time: booking.start_time,
              reason: booking.reason ?? undefined,
            }
          : undefined,
      };

    case "rescheduled":
      return {
        card_type: "rescheduled",
        appointment_data: booking
          ? {
              patient_name: booking.patient_name,
              client_name: booking.client_name,
              date: booking.date,
              time: booking.start_time,
              reason: booking.reason ?? undefined,
            }
          : undefined,
        original_appointment:
          booking?.original_date || booking?.original_time
            ? {
                date: booking.original_date ?? undefined,
                time: booking.original_time ?? undefined,
              }
            : undefined,
        reschedule_reason: booking?.rescheduled_reason ?? (outcomeSummary || undefined),
      };

    case "cancellation":
      return {
        card_type: "cancellation",
        appointment_data: booking
          ? {
              patient_name: booking.patient_name,
              client_name: booking.client_name,
              date: booking.date,
              time: booking.start_time,
            }
          : undefined,
        cancellation_reason:
          booking?.rescheduled_reason ?? (outcomeSummary || undefined),
      };

    case "emergency":
      return {
        card_type: "emergency",
        emergency_data: {
          symptoms: keyTopics.length > 0 ? keyTopics : undefined,
          er_name: extractERName(
            escalation_data?.escalation_summary,
            escalation_data?.staff_action_needed ??
              escalation_data?.staff_action_required,
          ),
          urgency_level:
            (escalation_data?.escalation_type as "critical" | "urgent" | "monitor") ??
            "urgent",
        },
      };

    case "callback":
      return {
        card_type: "callback",
        callback_data: {
          reason:
            escalation_data?.staff_action_needed ??
            escalation_data?.staff_action_required ??
            escalation_data?.escalation_summary ??
            (outcomeSummary || undefined),
          phone_number:
            call.customer_phone ??
            extractPhoneNumber(escalation_data?.staff_action_needed) ??
            undefined,
        },
      };

    case "info":
      return {
        card_type: "info",
        info_data: {
          topics: keyTopics.length > 0 ? keyTopics : undefined,
          summary: outcomeSummary || undefined,
        },
      };

    default:
      return null;
  }
}

/**
 * Get action card data with fallback to derived data
 *
 * Primary entry point for action card components.
 * Uses VAPI-provided action_card_data if available,
 * otherwise derives from legacy fields.
 *
 * @param actionCardData - Pre-computed action card data from VAPI (may be null)
 * @param call - Legacy call data for fallback derivation
 * @param booking - Optional booking data from vapi_bookings table
 * @returns Action card data or null if no valid outcome
 */
export function getActionCardData(
  actionCardData: ActionCardData | null | undefined,
  call: LegacyCallData,
  booking?: BookingData | null,
): ActionCardData | null {
  // Use pre-computed data if available
  if (actionCardData?.card_type) {
    return actionCardData;
  }

  // Fall back to deriving from legacy fields
  return deriveActionCardData(call, booking);
}
