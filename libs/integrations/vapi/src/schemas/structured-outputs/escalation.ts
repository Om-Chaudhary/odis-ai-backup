/**
 * Escalation Structured Output Schema
 *
 * Captures whether escalation is needed and the type/urgency.
 */

import { z } from "zod";

export const EscalationSchema = z.object({
  escalation_triggered: z.boolean().describe("Whether escalation is needed"),

  escalation_type: z
    .enum([
      "medical_emergency",
      "owner_complaint",
      "billing_issue",
      "callback_to_vet",
      "urgent_question",
      "none",
    ])
    .optional()
    .describe("Type of escalation if triggered"),

  escalation_reason: z
    .string()
    .optional()
    .describe("Detailed reason for escalation"),

  urgency: z
    .enum(["immediate", "same_day", "next_business_day", "routine"])
    .optional()
    .describe("How urgently escalation should be handled"),
});

export type Escalation = z.infer<typeof EscalationSchema>;
