/**
 * Orchestration Request Validators
 *
 * Zod schemas for validating orchestration requests and step configurations.
 * Supports both raw data input and existing case continuation.
 */

import { z } from "zod";

/* ========================================
   Input Schemas
   ======================================== */

/**
 * Schema for raw data input (text or structured)
 */
const RawDataInputSchema = z.object({
  rawData: z.object({
    mode: z.enum(["text", "structured"]),
    source: z.enum([
      "mobile_app",
      "web_dashboard",
      "idexx_extension",
      "ezyvet_api",
    ]),
    data: z.record(z.any()).optional(),
    text: z.string().optional(),
  }),
});

/**
 * Schema for existing case input
 */
const ExistingCaseInputSchema = z.object({
  existingCase: z.object({
    caseId: z.string().uuid(),
    summaryId: z.string().uuid().optional(),
    emailContent: z
      .object({
        subject: z.string(),
        html: z.string(),
        text: z.string(),
      })
      .optional(),
  }),
});

/* ========================================
   Step Configuration Schemas
   ======================================== */

/**
 * Schema for ingest step configuration
 * Can be:
 * - boolean (true = enabled with defaults, false = disabled)
 * - object with options
 */
const IngestStepSchema = z.union([
  z.boolean(),
  z.object({
    options: z
      .object({
        extractEntities: z.boolean().optional(),
        skipDuplicateCheck: z.boolean().optional(),
      })
      .optional(),
  }),
]);

/**
 * Schema for generate summary step configuration
 */
const GenerateSummaryStepSchema = z.union([
  z.boolean(),
  z.object({
    templateId: z.string().uuid().optional(),
    useLatestEntities: z.boolean().optional(),
  }),
]);

/**
 * Schema for prepare email step configuration
 */
const PrepareEmailStepSchema = z.union([
  z.boolean(),
  z.object({
    templateId: z.string().uuid().optional(),
  }),
]);

/**
 * Schema for schedule email step configuration
 */
const ScheduleEmailStepSchema = z.union([
  z.boolean(),
  z.object({
    recipientEmail: z.string().email(),
    scheduledFor: z.coerce.date().optional(),
  }),
]);

/**
 * Schema for schedule call step configuration
 */
const ScheduleCallStepSchema = z.union([
  z.boolean(),
  z.object({
    phoneNumber: z.string(),
    scheduledFor: z.coerce.date().optional(),
  }),
]);

/* ========================================
   Main Orchestration Request Schema
   ======================================== */

/**
 * Main orchestration request schema
 * Validates the complete orchestration request including input, steps, and options
 */
export const OrchestrationRequestSchema = z.object({
  input: z.union([RawDataInputSchema, ExistingCaseInputSchema]),
  steps: z.object({
    ingest: IngestStepSchema.optional(),
    generateSummary: GenerateSummaryStepSchema.optional(),
    prepareEmail: PrepareEmailStepSchema.optional(),
    scheduleEmail: ScheduleEmailStepSchema.optional(),
    scheduleCall: ScheduleCallStepSchema.optional(),
  }),
  options: z
    .object({
      stopOnError: z.boolean().optional().default(false),
      parallel: z.boolean().optional().default(true),
      dryRun: z.boolean().optional().default(false),
    })
    .optional(),
});

/* ========================================
   Type Exports
   ======================================== */

export type OrchestrationRequest = z.infer<typeof OrchestrationRequestSchema>;
export type RawDataInput = z.infer<typeof RawDataInputSchema>;
export type ExistingCaseInput = z.infer<typeof ExistingCaseInputSchema>;
export type IngestStepConfig = z.infer<typeof IngestStepSchema>;
export type GenerateSummaryStepConfig = z.infer<
  typeof GenerateSummaryStepSchema
>;
export type PrepareEmailStepConfig = z.infer<typeof PrepareEmailStepSchema>;
export type ScheduleEmailStepConfig = z.infer<typeof ScheduleEmailStepSchema>;
export type ScheduleCallStepConfig = z.infer<typeof ScheduleCallStepSchema>;
