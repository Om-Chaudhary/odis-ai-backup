/**
 * Validation Schemas for AI Veterinary Scribe Normalization
 *
 * Normalization = Entity extraction only (stores in case.metadata)
 * Generation endpoints (SOAP, discharge, etc.) use the extracted entities
 */

import { z } from "zod";

/* ========================================
   Input Validation
   ======================================== */

/**
 * Request schema for normalization endpoint
 * Accepts ANY clinical text and extracts entities
 */
export const NormalizeRequestSchema = z.object({
  // Input text (transcript, SOAP note, visit notes, any clinical text)
  input: z.string().min(50, "Input too short (minimum 50 characters)"),

  // Optional: Associate with existing case (will update case.metadata)
  caseId: z.string().uuid().optional(),

  // Optional: Hint about input type for better extraction
  inputType: z
    .enum([
      "transcript",
      "soap_note",
      "visit_notes",
      "discharge_summary",
      "other",
    ])
    .optional()
    .default("other"),

  // Optional metadata
  metadata: z.record(z.unknown()).optional(),
});

export type NormalizeRequest = z.infer<typeof NormalizeRequestSchema>;

/* ========================================
   AI Response Schemas (Entity Extraction)
   ======================================== */

/**
 * Patient information extracted from input
 */
export const ExtractedPatientSchema = z.object({
  name: z.string(), // Allow empty string if not present in notes
  species: z.enum(["dog", "cat", "bird", "rabbit", "other", "unknown"]),
  breed: z.string().optional(),
  age: z.string().optional(),
  sex: z.enum(["male", "female", "unknown"]).optional(),
  weight: z.string().optional(), // e.g., "15 kg" or "33 lbs"
  owner: z.object({
    name: z.string(), // Allow empty string if not present in notes
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
  }),
});

/**
 * Clinical details extracted from input
 * This is what gets stored in case.metadata for later generation
 */
export const ClinicalDetailsSchema = z.object({
  // Visit information
  chiefComplaint: z.string().optional(),
  visitReason: z.string().optional(),
  presentingSymptoms: z.array(z.string()).optional(),

  // Vital signs & exam
  vitalSigns: z
    .object({
      temperature: z.string().optional(),
      heartRate: z.string().optional(),
      respiratoryRate: z.string().optional(),
      weight: z.string().optional(),
    })
    .optional(),
  physicalExamFindings: z.array(z.string()).optional(),

  // Diagnoses
  diagnoses: z.array(z.string()).optional(),
  differentialDiagnoses: z.array(z.string()).optional(),

  // Medications & treatments
  medications: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
        route: z.string().optional(),
      }),
    )
    .optional(),
  treatments: z.array(z.string()).optional(),
  procedures: z.array(z.string()).optional(),

  // Follow-up
  followUpInstructions: z.string().optional(),
  followUpDate: z.string().optional(),
  recheckRequired: z.boolean().optional(),

  // Test results
  labResults: z.array(z.string()).optional(),
  imagingResults: z.array(z.string()).optional(),

  // Additional notes
  clinicalNotes: z.string().optional(),
  prognosis: z.string().optional(),
});

/**
 * Case type classification
 */
export const CaseTypeSchema = z.enum([
  "checkup",
  "emergency",
  "surgery",
  "follow_up",
  "dental",
  "vaccination",
  "diagnostic",
  "consultation",
  "other",
  "unknown",
]);

/**
 * Complete AI entity extraction response
 * This gets stored in case.metadata
 */
export const NormalizedEntitiesSchema = z.object({
  patient: ExtractedPatientSchema,
  clinical: ClinicalDetailsSchema,
  caseType: CaseTypeSchema,
  confidence: z.object({
    overall: z.number().min(0).max(1),
    patient: z.number().min(0).max(1),
    clinical: z.number().min(0).max(1),
  }),
  warnings: z.array(z.string()).optional(),
  extractedAt: z.string().datetime().optional(),
  originalInput: z.string().optional(),
  inputType: z.string().optional(),
});

export type NormalizedEntities = z.infer<typeof NormalizedEntitiesSchema>;
export type ExtractedPatient = z.infer<typeof ExtractedPatientSchema>;
export type ClinicalDetails = z.infer<typeof ClinicalDetailsSchema>;

/* ========================================
   Response Schemas
   ======================================== */

/**
 * API success response for normalization
 */
export const NormalizeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    case: z.object({
      id: z.string().uuid(),
      type: CaseTypeSchema,
      status: z.string(),
      metadata: z.record(z.unknown()),
      created_at: z.string(),
    }),
    patient: z.object({
      id: z.string().uuid(),
      name: z.string(),
      species: z.string(),
      owner_name: z.string(),
    }),
    entities: NormalizedEntitiesSchema,
  }),
  metadata: z
    .object({
      confidence: z.number().min(0).max(1),
      warnings: z.array(z.string()).optional(),
      processingTime: z.number().positive().optional(),
    })
    .optional(),
});

export type NormalizeResponse = z.infer<typeof NormalizeResponseSchema>;

/* ========================================
   Helper Functions
   ======================================== */

/**
 * Parse weight string to kilograms
 */
export function parseWeightToKg(
  weightStr: string | undefined,
): number | undefined {
  if (!weightStr) return undefined;

  const match = /^([\d.]+)\s*(kg|lbs?|pounds?)?$/i.exec(weightStr);
  if (!match?.[1]) return undefined;

  const value = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();

  if (!unit || unit.startsWith("kg")) {
    return value;
  } else if (unit.startsWith("lb") || unit.startsWith("pound")) {
    return value * 0.453592;
  }

  return undefined;
}

/**
 * Parse age string to approximate date of birth
 */
export function parseAgeToDOB(ageStr: string | undefined): string | undefined {
  if (!ageStr) return undefined;

  const now = new Date();
  let totalMonths = 0;

  const yearMatch = /(\d+)\s*(?:year|yr)/i.exec(ageStr);
  const monthMatch = /(\d+)\s*(?:month|mo)/i.exec(ageStr);

  if (yearMatch?.[1]) {
    totalMonths += parseInt(yearMatch[1]) * 12;
  }
  if (monthMatch?.[1]) {
    totalMonths += parseInt(monthMatch[1]);
  }

  if (totalMonths === 0) return undefined;

  const dob = new Date(
    now.getFullYear(),
    now.getMonth() - totalMonths,
    now.getDate(),
  );
  return dob.toISOString();
}

/**
 * Sanitize phone number to E.164 format
 */
export function sanitizePhoneNumber(
  phone: string | undefined,
): string | undefined {
  if (!phone) return undefined;

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return phone;
}
