/**
 * Zod Schemas for Inbound Squad Tool Inputs
 *
 * These schemas validate inputs from VAPI tool calls.
 * Each schema maps to a specific tool endpoint.
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

/**
 * Schema: check_refill_status
 *
 * Check the status of a pending prescription refill request.
 * Used by Clinical Agent to look up refill status.
 */
export const CheckRefillStatusSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),

  // Lookup criteria
  client_phone: z.string().min(1, "client_phone is required"),
  pet_name: z.string().optional(),
});

export type CheckRefillStatusInput = z.infer<typeof CheckRefillStatusSchema>;

/**
 * Schema: log_lab_result_inquiry
 *
 * Log that a caller is asking about lab/test results.
 * Used by Clinical Agent to record lab result requests.
 */
export const LogLabResultInquirySchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info
  pet_name: z.string().min(1, "pet_name is required"),

  // Test info
  test_type: z.string().optional(),
  test_date: z.string().optional(),
  notes: z.string().optional(),
});

export type LogLabResultInquiryInput = z.infer<
  typeof LogLabResultInquirySchema
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

/**
 * Records request type
 */
export const RecordsTypeEnum = z.enum([
  "full_history",
  "vaccines_only",
  "specific_visit",
  "recent_records",
]);
export type RecordsType = z.infer<typeof RecordsTypeEnum>;

/**
 * Records destination type
 */
export const DestinationTypeEnum = z.enum([
  "email",
  "fax",
  "vet_clinic",
  "specialist",
]);
export type DestinationType = z.infer<typeof DestinationTypeEnum>;

/**
 * Schema: log_records_request
 *
 * Log a request for medical records to be sent.
 * Used by Admin Agent to record records requests.
 */
export const LogRecordsRequestSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info
  pet_name: z.string().min(1, "pet_name is required"),

  // Records request details
  records_type: RecordsTypeEnum,
  specific_date: z.string().optional(),
  destination_type: DestinationTypeEnum,
  destination_contact: z.string().min(1, "destination_contact is required"),
  notes: z.string().optional(),
});

export type LogRecordsRequestInput = z.infer<typeof LogRecordsRequestSchema>;

/**
 * Billing inquiry type
 */
export const BillingInquiryTypeEnum = z.enum([
  "balance_question",
  "payment_plan",
  "insurance",
  "estimate_request",
  "refund",
  "other",
]);
export type BillingInquiryType = z.infer<typeof BillingInquiryTypeEnum>;

/**
 * Schema: log_billing_inquiry
 *
 * Log a billing or payment-related question.
 * Used by Admin Agent to record billing inquiries.
 */
export const LogBillingInquirySchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Billing inquiry details
  inquiry_type: BillingInquiryTypeEnum,
  details: z.string().min(1, "details is required"),
  visit_date: z.string().optional(),
});

export type LogBillingInquiryInput = z.infer<typeof LogBillingInquirySchema>;

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

/* ========================================
   Info Agent Tools
   ======================================== */

/**
 * Clinic info category
 */
export const ClinicInfoCategoryEnum = z.enum([
  "hours",
  "location",
  "services",
  "payment",
  "new_patients",
  "all",
]);
export type ClinicInfoCategory = z.infer<typeof ClinicInfoCategoryEnum>;

/**
 * Schema: get_clinic_info
 *
 * Get detailed clinic information by category.
 * Used by Info Agent to provide clinic information.
 */
export const GetClinicInfoSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),

  // Info category
  category: ClinicInfoCategoryEnum,
});

export type GetClinicInfoInput = z.infer<typeof GetClinicInfoSchema>;

/**
 * Schema: get_er_info
 *
 * Get emergency veterinary clinic information.
 * Used by Emergency Agent to provide ER directions.
 * No parameters required - uses clinic config.
 */
export const GetErInfoSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
});

export type GetErInfoInput = z.infer<typeof GetErInfoSchema>;
