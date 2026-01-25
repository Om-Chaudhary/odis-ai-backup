/**
 * Pet Health Structured Output Schema
 *
 * Captures pet's recovery status and health indicators from the call.
 */

import { z } from "zod";

export const PetHealthSchema = z.object({
  recovery_status: z
    .enum(["excellent", "good", "fair", "concerning", "critical", "unknown"])
    .describe("Overall assessment of pet's recovery"),

  symptoms_reported: z
    .array(z.string())
    .optional()
    .describe("Any symptoms mentioned by owner"),

  appetite_level: z
    .enum(["normal", "increased", "decreased", "none", "not_discussed"])
    .optional()
    .describe("Pet's appetite status"),

  activity_level: z
    .enum(["normal", "increased", "decreased", "lethargic", "not_discussed"])
    .optional()
    .describe("Pet's activity level"),

  concerns_expressed: z
    .array(z.string())
    .optional()
    .describe("Specific health concerns mentioned"),
});

export type PetHealth = z.infer<typeof PetHealthSchema>;
