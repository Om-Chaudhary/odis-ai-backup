/**
 * Follow-Up Structured Output Schema
 *
 * Captures follow-up requirements and recommendations.
 */

import { z } from "zod";

export const FollowUpSchema = z.object({
  follow_up_needed: z.boolean().describe("Whether follow-up is recommended"),

  follow_up_type: z
    .enum(["recheck_appointment", "phone_call", "email", "none"])
    .optional()
    .describe("Type of follow-up needed"),

  recommended_timeframe: z
    .string()
    .optional()
    .describe("When follow-up should occur"),

  follow_up_reason: z.string().optional().describe("Reason for follow-up"),

  appointment_scheduled: z
    .boolean()
    .optional()
    .describe("Whether an appointment was scheduled during call"),
});

export type FollowUp = z.infer<typeof FollowUpSchema>;
