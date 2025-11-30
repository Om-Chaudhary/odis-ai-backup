/**
 * Schedule Sync Validation Schemas
 *
 * Zod schemas for validating schedule sync requests and appointment data
 * from IDEXX Neo extension.
 */

import { z } from "zod";

/* ========================================
   Appointment Input Schema
   ======================================== */

/**
 * Schema for individual appointment input
 */
export const AppointmentInputSchema = z.object({
  // IDEXX Neo appointment ID (optional, but used for deduplication)
  neo_appointment_id: z.string().optional(),

  // Required appointment timing
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in ISO format (YYYY-MM-DD)"),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:mm format"),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "End time must be in HH:mm format"),

  // Patient/client information
  patient_name: z.string().optional().nullable(),
  client_name: z.string().optional().nullable(),
  client_phone: z.string().optional().nullable(),

  // Appointment details
  appointment_type: z.string().optional().nullable(),
  status: z.string().default("scheduled"),
  notes: z.string().optional().nullable(),

  // Provider information (for lookup/creation)
  provider_id: z.string().optional(), // Neo provider ID for lookup
  provider_name: z.string().optional(), // Provider name (fallback if provider_id not found)

  // Optional metadata
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type AppointmentInput = z.infer<typeof AppointmentInputSchema>;

/* ========================================
   Schedule Sync Request Schema
   ======================================== */

/**
 * Schema for schedule sync request (batch of appointments)
 */
export const ScheduleSyncRequestSchema = z.object({
  // Date for which appointments are being synced
  syncDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Sync date must be in ISO format (YYYY-MM-DD)",
    ),

  // Array of appointments to sync
  appointments: z
    .array(AppointmentInputSchema)
    .min(1, "At least one appointment is required"),

  // Optional metadata
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type ScheduleSyncRequest = z.infer<typeof ScheduleSyncRequestSchema>;
