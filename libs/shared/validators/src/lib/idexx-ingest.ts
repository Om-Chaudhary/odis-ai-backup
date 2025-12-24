/**
 * IDEXX Case Ingest Validation Schemas
 *
 * Zod schemas for validating IDEXX case ingestion requests.
 * Used by the /api/cases/ingest endpoint which handles:
 * 1. Case creation/update
 * 2. Entity extraction from consultation notes
 * 3. Discharge summary generation
 * 4. Call intelligence pre-generation
 */

import { z } from "zod";

/* ========================================
   IDEXX Appointment Data Schema
   ======================================== */

/**
 * Schema for IDEXX appointment/case data
 * This represents the data collected by the Chrome extension from IDEXX Neo
 */
export const IdexxAppointmentDataSchema = z.object({
  // Appointment identifiers
  appointmentId: z.string().optional(),
  consultationId: z.string().optional(),

  // Patient information
  pet_name: z.string().min(1, "Pet name is required"),
  species: z.string().optional(),
  breed: z.string().optional(),
  age: z.string().optional(),
  sex: z.string().optional(),
  weight: z.string().optional(),

  // Owner/Client information
  owner_name: z.string().optional(),
  client_first_name: z.string().optional(),
  client_last_name: z.string().optional(),
  phone_number: z.string().optional(),
  mobile_number: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),

  // Clinical data (critical for generation)
  consultation_notes: z.string().optional(),
  products_services: z.string().optional(),
  declined_products_services: z.string().optional(),

  // Appointment details
  appointment_type: z.string().optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  provider_name: z.string().optional(),
  provider_id: z.string().optional(),

  // Additional metadata (allow any extra fields)
}).passthrough();

export type IdexxAppointmentData = z.infer<typeof IdexxAppointmentDataSchema>;

/* ========================================
   Ingest Request Schema
   ======================================== */

/**
 * Schema for the case ingest request
 */
export const IdexxIngestRequestSchema = z.object({
  // The IDEXX appointment/case data
  appointment: IdexxAppointmentDataSchema,

  // Optional: sync date for tracking
  syncDate: z.string().optional(),

  // Options for the ingest process
  options: z
    .object({
      // Whether to auto-schedule a discharge call after generation
      autoSchedule: z.boolean().default(false),
      // Whether to skip generation steps (useful for testing)
      skipGeneration: z.boolean().default(false),
      // Whether to force regeneration even if data exists
      forceRegenerate: z.boolean().default(false),
    })
    .optional(),
});

export type IdexxIngestRequest = z.infer<typeof IdexxIngestRequestSchema>;

/* ========================================
   Ingest Response Schema
   ======================================== */

/**
 * Schema for the ingest response
 */
export const IdexxIngestResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      caseId: z.string(),
      patientName: z.string().optional(),
      ownerName: z.string().optional(),
      ownerPhone: z.string().optional(),
      ownerEmail: z.string().optional(),

      // Generation status
      generation: z.object({
        entityExtraction: z.enum(["completed", "skipped", "failed"]),
        dischargeSummary: z.enum(["completed", "skipped", "failed"]),
        callIntelligence: z.enum(["completed", "skipped", "failed"]),
      }),

      // Scheduled call info (if autoSchedule was true)
      scheduledCall: z
        .object({
          id: z.string(),
          scheduledFor: z.string(),
        })
        .optional()
        .nullable(),

      // Timing information
      timing: z.object({
        totalMs: z.number(),
        entityExtractionMs: z.number().optional(),
        dischargeSummaryMs: z.number().optional(),
        callIntelligenceMs: z.number().optional(),
      }),
    })
    .optional(),
  error: z.string().optional(),
});

export type IdexxIngestResponse = z.infer<typeof IdexxIngestResponseSchema>;

/* ========================================
   Batch Ingest Schema
   ======================================== */

/**
 * Schema for batch ingesting multiple appointments
 */
export const IdexxBatchIngestRequestSchema = z.object({
  // Array of appointments to ingest
  appointments: z
    .array(IdexxAppointmentDataSchema)
    .min(1, "At least one appointment is required")
    .max(50, "Cannot ingest more than 50 appointments at once"),

  // Sync date for tracking
  syncDate: z.string().optional(),

  // Options applied to all appointments
  options: z
    .object({
      autoSchedule: z.boolean().default(false),
      skipGeneration: z.boolean().default(false),
    })
    .optional(),
});

export type IdexxBatchIngestRequest = z.infer<
  typeof IdexxBatchIngestRequestSchema
>;
