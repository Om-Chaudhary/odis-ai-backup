/**
 * Schedule Sync Validation Schemas
 *
 * Zod schemas for validating schedule sync requests and appointment data
 * from IDEXX Neo extension.
 */

import { z } from "zod";

/* ========================================
   Helper Validators
   ======================================== */

/**
 * Validates ISO date format (YYYY-MM-DD) and ensures it's a valid date
 */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in ISO format (YYYY-MM-DD)")
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !Number.isNaN(parsed.getTime());
    },
    {
      message: "Date must be a valid date",
    },
  );

/**
 * Validates time format (HH:mm) and ensures valid hour/minute values
 */
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format")
  .refine(
    (time) => {
      const parts = time.split(":");
      if (parts.length !== 2) return false;
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      return (
        hours >= 0 &&
        hours < 24 &&
        minutes >= 0 &&
        minutes < 60 &&
        Number.isInteger(hours) &&
        Number.isInteger(minutes)
      );
    },
    {
      message: "Time must be valid (00:00-23:59)",
    },
  );

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
  date: isoDateSchema,
  start_time: timeSchema,
  end_time: timeSchema,

  // Patient/client information
  patient_name: z.string().optional().nullable(),
  client_name: z.string().optional().nullable(),
  client_phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (phone) => {
        if (!phone) return true; // Optional field
        // Basic phone validation - allows E.164 format or common formats
        return /^\+?[\d\s\-\(\)]{7,20}$/.test(phone);
      },
      {
        message: "Phone number format is invalid",
      },
    ),

  // Appointment details
  appointment_type: z.string().optional().nullable(),
  status: z
    .string()
    .default("scheduled")
    .refine(
      (status) =>
        ["scheduled", "confirmed", "cancelled", "completed", "no_show"]
          .includes(
            status,
          ),
      {
        message:
          "Status must be one of: scheduled, confirmed, cancelled, completed, no_show",
      },
    ),
  notes: z.string().max(5000, "Notes cannot exceed 5000 characters").optional()
    .nullable(),

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
export const ScheduleSyncRequestSchema = z
  .object({
    // Date for which appointments are being synced
    syncDate: isoDateSchema.refine(
      (date) => {
        // Don't allow syncing dates too far in the future (max 1 year)
        const parsedDate = new Date(date);
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        return parsedDate <= maxDate;
      },
      {
        message: "Sync date cannot be more than 1 year in the future",
      },
    ),

    // Array of appointments to sync
    appointments: z
      .array(AppointmentInputSchema)
      .min(1, "At least one appointment is required")
      .max(1000, "Cannot sync more than 1000 appointments at once"),

    // Optional metadata
    metadata: z.record(z.unknown()).optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate that end_time is after start_time for each appointment
      return data.appointments.every((apt) => {
        const startParts = apt.start_time.split(":");
        const endParts = apt.end_time.split(":");
        if (startParts.length !== 2 || endParts.length !== 2) return false;

        const startHours = Number(startParts[0]);
        const startMinutes = Number(startParts[1]);
        const endHours = Number(endParts[0]);
        const endMinutes = Number(endParts[1]);

        if (
          !Number.isInteger(startHours) ||
          !Number.isInteger(startMinutes) ||
          !Number.isInteger(endHours) ||
          !Number.isInteger(endMinutes)
        ) {
          return false;
        }

        const startTime = startHours * 60 + startMinutes;
        const endTime = endHours * 60 + endMinutes;
        return endTime > startTime;
      });
    },
    {
      message: "End time must be after start time for all appointments",
      path: ["appointments"],
    },
  );

export type ScheduleSyncRequest = z.infer<typeof ScheduleSyncRequestSchema>;
