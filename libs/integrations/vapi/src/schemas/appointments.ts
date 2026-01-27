/**
 * Appointment-related Tool Schemas
 *
 * Schemas for availability checking, booking, cancellation, and rescheduling.
 */

import { z } from "zod";

/* ========================================
   Check Availability
   ======================================== */

/**
 * Schema: check_availability
 *
 * Check appointment slot availability for a specific date.
 * Returns available time slots with capacity information.
 */
export const CheckAvailabilitySchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // STRICT Date: YYYY-MM-DD only
  date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date must be in YYYY-MM-DD format (e.g. 2024-05-21)",
    ),

  // Optional: include blocked times in response
  include_blocked: z.boolean().optional().default(false),
});

export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilitySchema>;

/**
 * Available slot from database function
 */
export interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  capacity: number;
  booked_count: number;
  available_count: number;
  is_blocked: boolean;
  block_reason: string | null;
}

/* ========================================
   Book Appointment
   ======================================== */

/**
 * Schema: book_appointment
 *
 * Book an appointment with a 5-minute hold.
 * Supports natural language date/time input.
 */
export const BookAppointmentSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Appointment details (natural language supported)
  date: z.string().min(1, "date is required"),
  time: z.string().min(1, "time is required"),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Patient info
  patient_name: z.string().min(1, "patient_name is required"),
  species: z.string().optional(),
  breed: z.string().optional(),

  // Visit details
  reason: z.string().optional(),
  is_new_client: z.boolean().optional().default(false),
});

export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;

/**
 * Result from book_slot_with_hold function
 */
export interface BookingResult {
  success: boolean;
  booking_id?: string;
  confirmation_number?: string;
  slot_id?: string;
  error?: string;
  alternative_times?: Array<{
    time: string;
    available: number;
  }>;
}

/* ========================================
   Verify Appointment (Internal Helper)
   ======================================== */

/**
 * Schema: appointment_verification
 *
 * Verify that an appointment exists for a given patient on a given date.
 * This is an internal helper tool used by confirm, cancel, and reschedule.
 * Queries local database only (synced data), no IDEXX calls.
 */
export const VerifyAppointmentSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Search criteria
  owner_name: z.string().min(1, "owner_name is required"),
  patient_name: z.string().min(1, "patient_name is required"),
  appointment_date: z.string().min(1, "appointment_date is required"), // Natural language supported
});

export type VerifyAppointmentInput = z.infer<typeof VerifyAppointmentSchema>;

/**
 * Result from appointment verification
 */
export interface VerifyAppointmentResult {
  status: "FOUND" | "DOES_NOT_EXIST";
  appointment_id?: string;
  idexx_appointment_id?: string;
  appointment_time?: string;
  appointment_time_end?: string;
  appointment_date?: string;
  formatted_date?: string;
  formatted_time?: string;
  provider_name?: string;
  appointment_type?: string;
  room?: string;
  patient_name?: string;
  client_name?: string;
  client_phone?: string;
  source?: "schedule_appointments" | "vapi_bookings";
  message?: string;
}

/* ========================================
   Cancel Appointment
   ======================================== */

/**
 * Schema: cancel_appointment
 *
 * Cancel an existing appointment with explicit consent.
 * Two-step process: First call verifies appointment, second call with confirmed=true cancels it.
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

  // Cancellation details
  reason: z.string().optional(),

  // CONSENT: Must be true to execute cancellation
  confirmed: z.boolean().optional().default(false),
});

export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;

/* ========================================
   Reschedule Appointment
   ======================================== */

/**
 * Schema: reschedule_appointment
 *
 * Reschedule an existing appointment to a new date/time.
 * Two-step process: First call verifies original and checks availability,
 * second call with confirmed=true executes the atomic reschedule.
 *
 * ATOMIC TRANSACTION: Cancel old + Create new with rollback on failure.
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

  // CONSENT: Must be true to execute reschedule
  confirmed: z.boolean().optional().default(false),
});

export type RescheduleAppointmentInput = z.infer<
  typeof RescheduleAppointmentSchema
>;

/* ========================================
   Check Availability Range
   ======================================== */

/**
 * Schema: check_availability_range
 *
 * Check appointment availability across a date range (up to 14 days).
 * Returns summary of available days and detailed times for the first available date.
 */
export const CheckAvailabilityRangeSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Number of days to check (default: 14, max: 30)
  days_ahead: z.coerce.number().min(1).max(30).optional().default(14),

  // Optional: specific start date (YYYY-MM-DD, defaults to today)
  start_date: z.string().optional(),
});

export type CheckAvailabilityRangeInput = z.infer<
  typeof CheckAvailabilityRangeSchema
>;
