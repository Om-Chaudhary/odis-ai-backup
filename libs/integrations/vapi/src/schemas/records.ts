/**
 * Records-related Tool Schemas
 *
 * Schemas for medical records requests.
 */

import { z } from "zod";

/* ========================================
   Enums
   ======================================== */

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

/* ========================================
   Log Records Request
   ======================================== */

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
