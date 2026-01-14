/**
 * Clinical-related Tool Schemas
 *
 * Schemas for prescription refills and lab result inquiries.
 */

import { z } from "zod";

/* ========================================
   Enums
   ======================================== */

/**
 * Pharmacy preference for refill requests
 */
export const PharmacyPreferenceEnum = z.enum(["pickup", "external_pharmacy"]);
export type PharmacyPreference = z.infer<typeof PharmacyPreferenceEnum>;

/* ========================================
   Create Refill Request
   ======================================== */

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
   Check Refill Status
   ======================================== */

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

/* ========================================
   Log Lab Result Inquiry
   ======================================== */

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
