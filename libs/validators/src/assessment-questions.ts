/**
 * Validation Schemas for AI-Generated Assessment Questions
 *
 * These schemas define the structure of dynamically generated
 * follow-up call content tailored to specific cases.
 */

import { z } from "zod";

/**
 * Single assessment question with response patterns
 */
export const AssessmentQuestionSchema = z.object({
  /** The question to ask (can include {{petName}} placeholder) */
  question: z.string().min(10, "Question too short"),

  /** Why we're asking this question (for AI reasoning) */
  context: z.string().optional(),

  /** Response patterns indicating positive progress */
  expectedPositiveResponse: z.array(z.string()).optional(),

  /** Response patterns indicating concerning symptoms */
  concerningResponses: z.array(z.string()).optional(),

  /** Follow-up question if concerning response detected */
  followUpIfConcerning: z.string().optional(),

  /** Priority level (1 = highest, 5 = lowest) */
  priority: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ])
    .optional()
    .default(2),
});

export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;

/**
 * Complete AI-generated call intelligence package
 *
 * Contains everything needed for a hyper-specific follow-up call
 */
export const GeneratedCallIntelligenceSchema = z.object({
  /**
   * Brief case context summary for the AI
   * e.g., "3-year-old Lab with bilateral ear infection, prescribed Otomax"
   */
  caseContextSummary: z.string(),

  /**
   * 2-3 hyper-specific assessment questions for this case
   */
  assessmentQuestions: z
    .array(AssessmentQuestionSchema)
    .min(1)
    .max(5)
    .describe("2-3 targeted questions specific to this case"),

  /**
   * Case-specific warning signs (not generic KB ones)
   */
  warningSignsToMonitor: z
    .array(z.string())
    .max(5)
    .describe("Warning signs specific to this case"),

  /**
   * What's normal for THIS case's recovery
   */
  normalExpectations: z
    .array(z.string())
    .max(4)
    .describe("Normal expectations for this specific recovery"),

  /**
   * Emergency criteria specific to this case
   */
  emergencyCriteria: z
    .array(z.string())
    .max(4)
    .describe("Emergency signs specific to this condition"),

  /**
   * Whether questions should be asked at all
   * False for grooming, simple wellness, etc.
   */
  shouldAskClinicalQuestions: z
    .boolean()
    .describe("Whether clinical assessment questions are appropriate"),

  /**
   * Suggested call approach
   */
  callApproach: z
    .enum(["brief-checkin", "standard-assessment", "detailed-monitoring"])
    .describe("Recommended depth of assessment"),

  /**
   * AI's confidence in the generated content
   */
  confidence: z.number().min(0).max(1),
});

export type GeneratedCallIntelligence = z.infer<
  typeof GeneratedCallIntelligenceSchema
>;

/**
 * Input for generating call intelligence
 */
export const GenerateCallIntelligenceInputSchema = z.object({
  /** Patient name */
  petName: z.string(),

  /** Patient species */
  species: z.string().optional(),

  /** Patient breed */
  breed: z.string().optional(),

  /** Patient age */
  age: z.string().optional(),

  /** Primary diagnosis */
  diagnosis: z.string().optional(),

  /** List of diagnoses */
  diagnoses: z.array(z.string()).optional(),

  /** Medications prescribed */
  medications: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
      }),
    )
    .optional(),

  /** Procedures performed */
  procedures: z.array(z.string()).optional(),

  /** Treatments administered */
  treatments: z.array(z.string()).optional(),

  /** Visit reason */
  visitReason: z.string().optional(),

  /** Chief complaint */
  chiefComplaint: z.string().optional(),

  /** Presenting symptoms */
  presentingSymptoms: z.array(z.string()).optional(),

  /** Raw SOAP note content (optional) */
  soapContent: z.string().optional(),

  /** Follow-up instructions from vet */
  followUpInstructions: z.string().optional(),

  /** Condition category (for fallback) */
  conditionCategory: z.string().optional(),
});

export type GenerateCallIntelligenceInput = z.infer<
  typeof GenerateCallIntelligenceInputSchema
>;
