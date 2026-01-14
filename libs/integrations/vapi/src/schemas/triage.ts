/**
 * Triage-related Tool Schemas
 *
 * Schemas for emergency triage and ER information.
 */

import { z } from "zod";

/* ========================================
   Enums
   ======================================== */

/**
 * Species enum for triage
 */
export const SpeciesEnum = z.enum(["dog", "cat", "other"]);
export type Species = z.infer<typeof SpeciesEnum>;

/**
 * Urgency level for emergency triage
 */
export const UrgencyLevelEnum = z.enum(["critical", "urgent", "monitor"]);
export type UrgencyLevel = z.infer<typeof UrgencyLevelEnum>;

/**
 * Action taken during triage
 */
export const TriageActionEnum = z.enum([
  "sent_to_er",
  "scheduled_appointment",
  "home_care_advised",
]);
export type TriageAction = z.infer<typeof TriageActionEnum>;

/* ========================================
   Log Emergency Triage
   ======================================== */

/**
 * Schema: log_emergency_triage
 *
 * Logs emergency triage call with outcome classification.
 * Used by Emergency Agent to record triage outcomes.
 */
export const LogEmergencyTriageSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Caller info
  caller_name: z.string().min(1, "caller_name is required"),
  caller_phone: z.string().min(1, "caller_phone is required"),

  // Pet info
  pet_name: z.string().min(1, "pet_name is required"),
  species: SpeciesEnum.optional().default("other"),

  // Triage data
  symptoms: z.string().min(1, "symptoms description is required"),
  urgency: UrgencyLevelEnum,
  action_taken: TriageActionEnum,
  er_referred: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export type LogEmergencyTriageInput = z.infer<typeof LogEmergencyTriageSchema>;

/* ========================================
   Get ER Info
   ======================================== */

/**
 * Schema: get_er_info
 *
 * Get emergency veterinary clinic information.
 * Used by Emergency Agent to provide ER directions.
 */
export const GetErInfoSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
});

export type GetErInfoInput = z.infer<typeof GetErInfoSchema>;
