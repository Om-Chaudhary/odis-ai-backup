/**
 * Medication Compliance Structured Output Schema
 *
 * Captures medication adherence and related issues.
 */

import { z } from "zod";

export const MedicationComplianceSchema = z.object({
  compliance_level: z
    .enum(["full", "partial", "none", "not_applicable", "not_discussed"])
    .describe("Level of medication adherence"),

  missed_doses: z
    .number()
    .optional()
    .describe("Number of missed doses if known"),

  administration_issues: z
    .array(z.string())
    .optional()
    .describe("Any issues administering medication"),

  side_effects_reported: z
    .array(z.string())
    .optional()
    .describe("Any side effects mentioned"),

  refill_needed: z
    .boolean()
    .optional()
    .describe("Whether a refill is needed"),
});

export type MedicationCompliance = z.infer<typeof MedicationComplianceSchema>;
