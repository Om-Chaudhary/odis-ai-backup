/**
 * Simplified VAPI Dynamic Variables
 *
 * This module contains only the variables currently in use by the production system.
 * For advanced knowledge base features, see types.ts
 */

/**
 * Core dynamic variables for VAPI calls (currently in use)
 * All variable names use snake_case to match VAPI requirements
 */
export interface SimpleDynamicVariables {
  // ============================================
  // Core Variables (Required for ALL calls)
  // ============================================

  /** Name of the pet */
  pet_name: string;

  /** Name of the pet owner */
  owner_name: string;

  /** Appointment date spelled out for voice (e.g., "January tenth, twenty twenty five") */
  appointment_date: string;

  /** Type of follow-up call */
  call_type: "discharge" | "follow-up";

  /** First name of the vet tech making the call (no title, e.g., "Sarah") */
  agent_name: string;

  /** Name of the veterinary clinic */
  clinic_name: string;

  /** Clinic phone number spelled out for voice (e.g., "five five five, one two three...") */
  clinic_phone: string;

  /** Emergency phone number spelled out for voice */
  emergency_phone: string;

  /**
   * Brief summary completing "{pet_name} [summary]"
   * Example: "received rabies and DHPP vaccines and got a clean bill of health"
   */
  discharge_summary_content: string;

  // ============================================
  // Conditional/Optional Variables
  // ============================================

  /** Name of the veterinarian (optional) */
  vet_name?: string;

  /** Type of discharge visit (required for discharge calls) */
  sub_type?: "wellness" | "vaccination";

  /** What the pet was treated for (required for follow-up calls) */
  condition?: string;

  /** Follow-up care instructions */
  next_steps?: string;

  /** Prescribed medications with dosing instructions */
  medications?: string;

  /** Scheduled follow-up appointment date spelled out for voice */
  recheck_date?: string;
}

/**
 * Type guard to check if variables are valid
 */
export function isValidDynamicVariables(
  variables: unknown,
): variables is SimpleDynamicVariables {
  if (typeof variables !== "object" || variables === null) return false;

  const v = variables as Record<string, unknown>;

  // Check required fields
  const requiredFields = [
    "pet_name",
    "owner_name",
    "appointment_date",
    "call_type",
    "agent_name",
    "clinic_name",
    "clinic_phone",
    "emergency_phone",
    "discharge_summary_content",
  ];

  for (const field of requiredFields) {
    if (typeof v[field] !== "string" || !v[field]) {
      return false;
    }
  }

  // Check call_type is valid
  if (v.call_type !== "discharge" && v.call_type !== "follow-up") {
    return false;
  }

  // Check conditional requirements
  if (v.call_type === "follow-up" && !v.condition) {
    return false;
  }

  return true;
}

/**
 * Variables actually passed to VAPI (matches database column)
 */
export type VapiCallVariables = SimpleDynamicVariables;
