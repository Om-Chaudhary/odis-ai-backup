/**
 * Attention Classification Structured Output Schema
 *
 * Captures whether the call needs human review and why.
 */

import { z } from "zod";

export const AttentionClassificationSchema = z.object({
  needs_attention: z
    .boolean()
    .describe("Whether this call needs human review"),

  attention_types: z
    .array(
      z.enum([
        "health_concern",
        "emergency_signs",
        "owner_complaint",
        "billing_question",
        "medication_issue",
        "scheduling_problem",
        "other",
      ]),
    )
    .optional()
    .describe("Categories of attention needed"),

  attention_severity: z
    .enum(["critical", "high", "medium", "low"])
    .optional()
    .describe("How urgently attention is needed"),

  attention_summary: z
    .string()
    .optional()
    .describe("Brief summary of why attention is needed"),
});

export type AttentionClassification = z.infer<
  typeof AttentionClassificationSchema
>;
