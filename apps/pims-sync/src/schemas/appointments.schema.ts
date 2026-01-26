/**
 * Zod Validation Schemas for Appointment Routes
 *
 * Request validation for patient search, appointment creation, cancellation, and rescheduling.
 */

import { z } from "zod";

/**
 * Search patient request schema
 */
export const searchPatientSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

export type SearchPatientRequest = z.infer<typeof searchPatientSchema>;

/**
 * New client data schema (for appointment creation with new client)
 */
const newClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

/**
 * New patient data schema (for appointment creation with new patient)
 */
const newPatientSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  age: z.string().optional(),
  color: z.string().optional(),
  sex: z.enum(["M", "F", "Unknown"]).optional(),
  weight: z.string().optional(),
});

/**
 * Create appointment request schema
 * Supports both existing patients and new client/patient creation
 */
export const createAppointmentSchema = z
  .object({
    // For existing patients
    patientId: z.string().optional(),
    clientId: z.string().optional(),

    // For new clients/patients
    isNewClient: z.boolean().optional(),
    newClient: newClientSchema.optional(),
    newPatient: newPatientSchema.optional(),

    // Appointment details (required)
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").optional(),
    reason: z.string().min(1, "Reason is required"),
    note: z.string().optional(),

    // Optional IDEXX-specific fields
    providerId: z.string().optional(),
    appointmentTypeId: z.string().optional(),
    roomId: z.string().optional(),
  })
  .refine(
    (data) => {
      // If new client, require newClient and newPatient
      if (data.isNewClient) {
        return data.newClient && data.newPatient;
      }
      // If not new client, require patientId
      return !!data.patientId;
    },
    {
      message: "Either patientId (for existing) or newClient+newPatient (for new) is required",
    },
  );

export type CreateAppointmentRequest = z.infer<typeof createAppointmentSchema>;

/**
 * Cancel appointment request schema
 */
export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  reason: z.string().optional(),
});

export type CancelAppointmentRequest = z.infer<typeof cancelAppointmentSchema>;

/**
 * Reschedule appointment request schema
 * Cancels old appointment and creates new one (atomic operation)
 */
export const rescheduleAppointmentSchema = z.object({
  // Original appointment to cancel
  cancelAppointmentId: z.string().min(1, "Appointment ID to cancel is required"),

  // New appointment details
  patientId: z.string().min(1, "Patient ID is required"),
  clientId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").optional(),
  reason: z.string().min(1, "Reason is required"),
  note: z.string().optional(),

  // Optional IDEXX-specific fields
  providerId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  roomId: z.string().optional(),
});

export type RescheduleAppointmentRequest = z.infer<typeof rescheduleAppointmentSchema>;
