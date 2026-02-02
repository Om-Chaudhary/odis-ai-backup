/**
 * Zod Schemas for Inbound Squad Tool Inputs
 *
 * These schemas validate inputs from VAPI tool calls.
 * Each schema maps to a specific tool endpoint.
 *
 * NOTE: Many schemas are re-exported from the main schemas/ folder.
 * Only define schemas here if they're unique to inbound-tools.
 */

import { z } from "zod";

/* ========================================
   Emergency Agent Tools
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

/**
 * Schema: log_emergency_triage
 *
 * Logs emergency triage call with outcome classification.
 * Used by Emergency Agent to record triage outcomes.
 */
export const LogEmergencyTriageSchema = z.object({
  // VAPI context (optional, will be extracted from call)
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
   Clinical Agent Tools
   ======================================== */

/**
 * Pharmacy preference for refill requests
 */
export const PharmacyPreferenceEnum = z.enum(["pickup", "external_pharmacy"]);
export type PharmacyPreference = z.infer<typeof PharmacyPreferenceEnum>;

/**
 * Schema: create_refill_request
 *
 * Creates a prescription refill request for veterinarian approval.
 * Used by Clinical Agent to log refill requests.
 */
export const CreateRefillRequestSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info
  pet_name: z.string().min(1, "pet_name is required"),
  species: z.string().optional(),

  // Medication info
  medication_name: z.string().min(1, "medication_name is required"),
  medication_strength: z.string().optional(),

  // Pharmacy preference
  pharmacy_preference: PharmacyPreferenceEnum.optional().default("pickup"),
  pharmacy_name: z.string().optional(),

  // Additional context
  last_refill_date: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateRefillRequestInput = z.infer<
  typeof CreateRefillRequestSchema
>;

/* ========================================
   Admin Agent Tools
   ======================================== */

/**
 * Message type categorization
 */
export const MessageTypeEnum = z.enum([
  "general",
  "billing",
  "records",
  "refill",
  "clinical",
  "other",
]);
export type MessageType = z.infer<typeof MessageTypeEnum>;

/**
 * Schema: leave_message (enhanced)
 *
 * Log a callback request with categorization.
 * Enhanced version used by Admin Agent for message logging.
 */
export const LeaveMessageSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info (optional for general messages)
  pet_name: z.string().optional(),

  // Message details
  message: z.string().min(1, "message is required"),
  is_urgent: z.boolean().default(false),
  message_type: MessageTypeEnum.optional().default("general"),
  best_callback_time: z.string().optional(),
  notes: z.string().optional(),
});

export type LeaveMessageInput = z.infer<typeof LeaveMessageSchema>;

/* ========================================
   Appointment Agent Tools
   ======================================== */

/**
 * Schema: cancel_appointment
 *
 * Log a request to cancel an existing appointment.
 * Used by Appointment Agent to record cancellation requests.
 */
export const CancelAppointmentSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info
  pet_name: z.string().min(1, "pet_name is required"),

  // Appointment details
  appointment_date: z.string().min(1, "appointment_date is required"),
  appointment_time: z.string().optional(),
  reason: z.string().optional(),
});

export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;

/**
 * Schema: reschedule_appointment
 *
 * Log a request to reschedule an existing appointment.
 * Used by Appointment Agent to record reschedule requests.
 */
export const RescheduleAppointmentSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info
  pet_name: z.string().min(1, "pet_name is required"),

  // Original appointment
  original_date: z.string().min(1, "original_date is required"),
  original_time: z.string().optional(),

  // Preferred new appointment
  preferred_new_date: z.string().min(1, "preferred_new_date is required"),
  preferred_new_time: z.string().optional(),
  reason: z.string().optional(),
});

export type RescheduleAppointmentInput = z.infer<
  typeof RescheduleAppointmentSchema
>;
