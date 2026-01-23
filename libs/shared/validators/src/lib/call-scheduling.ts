/**
 * Call Scheduling Validation Schemas
 *
 * Zod schemas for validating call scheduling API requests.
 */

import { z } from "zod";

import { normalizeToE164 } from "@odis-ai/shared/util/phone";

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
 * Schema for scheduling a voice call
 * Stores patient details and call configuration for dynamic variables
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
