/**
 * Generates descriptive outcomes for inbound calls
 * Uses structured data from VAPI to create clinically relevant outcome descriptions
 *
 * Main Outcome Categories:
 * 1. Appointment - schedule appointment, reschedule appointment, cancel appointment
 * 2. Emergency - emergency triage
 * 3. Callback - client requests callback
 * 4. Info - client gets information about the clinic
 *
 * Any call that doesn't explicitly fall into these categories shows as blank (null)
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
  variant: "emergency" | "appointment" | "callback" | "info" | "blank";
}

/**
 * Generates a descriptive outcome from structured call data
 *
 * Only categorizes calls into 4 specific outcomes:
 * 1. Appointment (schedule, reschedule, cancel)
 * 2. Emergency (emergency triage)
 * 3. Callback (client requests callback)
 * 4. Info (client gets clinic information)
 *
 * Any call that doesn't explicitly match returns blank/null
 */
export function getDescriptiveOutcome(
  call: InboundCall,
): DescriptiveOutcome | null {
  // Use summary as the base description
  const clinicalSummary = call.summary ?? "No details available";
  const summaryLower = clinicalSummary.toLowerCase();
  const outcome = call.outcome?.toLowerCase() ?? "";

  // ============================================================================
  // CATEGORY 1: APPOINTMENT
  // ============================================================================

  // Schedule appointment
  if (outcome === "scheduled" || outcome === "schedule appointment") {
    return {
      label: "Scheduled",
      description: clinicalSummary,
      variant: "appointment",
    };
  }

  // Reschedule appointment
  if (
    outcome === "rescheduled" ||
    outcome === "reschedule appointment" ||
    (outcome === "cancellation" &&
      (summaryLower.includes("reschedule") ||
        summaryLower.includes("re-schedule")))
  ) {
    return {
      label: "Rescheduled",
      description: clinicalSummary,
      variant: "appointment",
    };
  }

  // Cancel appointment
  if (outcome === "cancellation" || outcome === "cancel appointment") {
    return {
      label: "Cancellation",
      description: clinicalSummary,
      variant: "appointment",
    };
  }

  // ============================================================================
  // CATEGORY 2: EMERGENCY
  // ============================================================================

  if (outcome === "emergency" || outcome === "emergency triage") {
    return {
      label: "ER",
      description: clinicalSummary,
      variant: "emergency",
    };
  }

  // ============================================================================
  // CATEGORY 3: CALLBACK
  // ============================================================================

  if (
    outcome === "callback" ||
    outcome === "call back" ||
    outcome === "client requests callback"
  ) {
    return {
      label: "Callback",
      description: clinicalSummary,
      variant: "callback",
    };
  }

  // ============================================================================
  // CATEGORY 4: INFO
  // ============================================================================

  if (outcome === "info" || outcome === "clinic info") {
    return {
      label: "Info",
      description: clinicalSummary,
      variant: "info",
    };
  }

  // ============================================================================
  // DEFAULT: Blank (no badge shown)
  // ============================================================================

  // Return null for any call that doesn't match the above categories
  // This will cause no badge to be displayed
  return null;
}
