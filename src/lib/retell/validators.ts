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
