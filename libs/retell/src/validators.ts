import { z } from "zod";
import { normalizeToE164 } from "@odis-ai/utils/phone";

/**
 * Phone number validation schema
 * Accepts international format with optional + prefix
 * E.164 format: +[country code][number]
 * US numbers are normalized to +1XXXXXXXXXX format
 */
export const phoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((val) => {
    // Normalize to E.164 format (+1XXXXXXXXXX for US numbers)
    const normalized = normalizeToE164(val);
    if (!normalized) {
      // Return original to trigger regex validation error
      return val;
    }
    return normalized;
  })
  .refine(
    (val) => /^\+[1-9]\d{1,14}$/.test(val),
    "Invalid phone number format. Use international format (e.g., +12137774445)",
  );

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
  retryOnBusy: z.boolean().optional().default(false),
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
 * Schema for scheduling a VAPI call
 * Stores patient details and call configuration for VAPI dynamic variables
 */
export const scheduleCallSchema = z
  .object({
    // Contact information
    phoneNumber: phoneNumberSchema,

    // Core patient/appointment details (REQUIRED)
    petName: z.string().min(1, "Pet name is required"),
    ownerName: z.string().min(1, "Owner name is required"),
    appointmentDate: z
      .string()
      .min(1, "Appointment date is required")
      .describe("Spelled out date (e.g., 'January tenth, twenty twenty five')"),

    // Call type configuration (REQUIRED)
    callType: z.enum(["discharge", "follow-up"], {
      errorMap: () => ({
        message: "Call type must be 'discharge' or 'follow-up'",
      }),
    }),

    // Clinic information (REQUIRED)
    agentName: z
      .string()
      .default("Sarah")
      .describe("AI agent name (first name only)"),
    clinicName: z.string().min(1, "Clinic name is required"),
    clinicPhone: z
      .string()
      .min(1, "Clinic phone is required")
      .describe(
        "Spelled out phone number (e.g., 'five five five, one two three...')",
      ),
    emergencyPhone: z
      .string()
      .min(1, "Emergency phone is required")
      .describe("Spelled out emergency phone number"),

    // Clinical details (REQUIRED)
    dischargeSummary: z.string().min(1, "Discharge summary is required"),

    // Conditional fields based on call type
    subType: z
      .enum(["wellness", "vaccination"])
      .optional()
      .describe("Required for discharge calls only"),
    condition: z
      .string()
      .optional()
      .describe("Required for follow-up calls only"),

    // Follow-up instructions (OPTIONAL but recommended)
    nextSteps: z
      .string()
      .optional()
      .describe("Follow-up care instructions to provide to owner"),

    // Additional clinical info (OPTIONAL)
    vetName: z.string().optional(),
    medications: z
      .string()
      .optional()
      .describe("Prescribed medications for follow-up calls"),
    recheckDate: z
      .string()
      .optional()
      .describe(
        "Spelled out recheck date (e.g., 'February first, twenty twenty five')",
      ),

    // Scheduling
    scheduledFor: z.coerce.date().optional(),
    notes: z.string().optional(),
    timezone: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      // Validate call-type specific requirements
      if (data.callType === "follow-up" && !data.condition) {
        return false;
      }
      return true;
    },
    {
      message: "condition is required when callType is 'follow-up'",
      path: ["condition"],
    },
  );

export type ScheduleCallInput = z.infer<typeof scheduleCallSchema>;

/**
 * Schema for importing calls from JSON
 * Accepts array of call data without requiring owner_name
 */
export const importCallsSchema = z.array(
  z.object({
    phone_number: phoneNumberSchema,
    pet_name: z.string().min(1, "Pet name is required"),
    owner_name: z.string().optional(),
    vet_name: z.string().optional(),
    clinic_name: z.string().optional(),
    clinic_phone: z.string().optional(),
    discharge_summary_content: z.string().optional(),
    notes: z.string().optional(),
  }),
);

export type ImportCallsInput = z.infer<typeof importCallsSchema>;
