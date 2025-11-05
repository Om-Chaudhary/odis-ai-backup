import { z } from "zod";

/**
 * Phone number validation schema
 * Accepts international format with optional + prefix
 * E.164 format: +[country code][number]
 */
export const phoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    "Invalid phone number format. Use international format (e.g., +12137774445)",
  )
  .transform((val) => {
    // Ensure phone number starts with +
    return val.startsWith("+") ? val : `+${val}`;
  });

/**
 * Schema for sending a new call
 */
export const sendCallSchema = z.object({
  phoneNumber: phoneNumberSchema,
  agentId: z.string().optional().default(""),
  fromNumber: z.string().optional(),
  variables: z
    .record(z.string())
    .optional()
    .default({})
    .describe("Custom variables to pass to the agent"),
  metadata: z
    .record(z.any())
    .optional()
    .default({})
    .describe("Additional metadata for the call"),
  retryOnBusy: z.boolean().optional().default(false),
});

export type SendCallInput = z.infer<typeof sendCallSchema>;

/**
 * Schema for the call form with predefined variables
 */
export const callFormSchema = z.object({
  phoneNumber: phoneNumberSchema,
  agentId: z.string().default(""),
  fromNumber: z.string().optional(),
  // Retell agent variables
  petName: z.string().default(""),
  vetName: z.string().default(""),
  clinicName: z.string().default(""),
  ownerName: z.string().default(""),
  clinicPhone: z.string().default(""),
  dischargeSummaryContent: z.string().default(""),
  // Base fields
  variables: z
    .record(z.string())
    .default({})
    .describe("Custom variables to pass to the agent"),
  metadata: z
    .record(z.any())
    .default({})
    .describe("Additional metadata for the call"),
  retryOnBusy: z.boolean().default(false),
});

export type CallFormInput = z.input<typeof callFormSchema>;
export type CallFormOutput = z.infer<typeof callFormSchema>;

/**
 * Schema for listing calls with filters
 */
export const listCallsSchema = z.object({
  status: z
    .enum([
      "all",
      "scheduled",
      "initiated",
      "ringing",
      "in_progress",
      "completed",
      "failed",
      "cancelled",
    ])
    .optional()
    .default("all"),
  agentId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(100).optional().default(25),
  offset: z.number().min(0).optional().default(0),
});

export type ListCallsInput = z.infer<typeof listCallsSchema>;

/**
 * Schema for getting a single call
 */
export const getCallSchema = z.object({
  callId: z.string().min(1, "Call ID is required"),
});

export type GetCallInput = z.infer<typeof getCallSchema>;

/**
 * Schema for creating a new patient
 */
export const createPatientSchema = z.object({
  pet_name: z.string().min(1, "Pet name is required"),
  owner_name: z.string().min(1, "Owner name is required"),
  owner_phone: phoneNumberSchema,
  vet_name: z.string().optional(),
  clinic_name: z.string().optional(),
  clinic_phone: z.string().optional(),
  discharge_summary: z.string().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

/**
 * Schema for updating an existing patient
 */
export const updatePatientSchema = z.object({
  id: z.string().min(1, "Patient ID is required"),
  pet_name: z.string().min(1, "Pet name is required").optional(),
  owner_name: z.string().min(1, "Owner name is required").optional(),
  owner_phone: phoneNumberSchema.optional(),
  vet_name: z.string().optional().nullable(),
  clinic_name: z.string().optional().nullable(),
  clinic_phone: z.string().optional().nullable(),
  discharge_summary: z.string().optional().nullable(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

/**
 * Schema for getting a single patient
 */
export const getPatientSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
});

export type GetPatientInput = z.infer<typeof getPatientSchema>;

/**
 * Schema for deleting a patient
 */
export const deletePatientSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
});

export type DeletePatientInput = z.infer<typeof deletePatientSchema>;

/**
 * Schema for sending a call with optional patient reference
 * Extends the original sendCallSchema
 */
export const sendCallWithPatientSchema = sendCallSchema.extend({
  patientId: z.string().optional(),
});

export type SendCallWithPatientInput = z.infer<
  typeof sendCallWithPatientSchema
>;

/**
 * Schema for scheduling a call (save to DB without calling Retell API)
 * Requires patient ID since scheduled calls should be associated with a patient
 */
export const scheduleCallSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required for scheduled calls"),
  scheduledFor: z.date().optional(),
  notes: z.string().optional(),
});

export type ScheduleCallInput = z.infer<typeof scheduleCallSchema>;
