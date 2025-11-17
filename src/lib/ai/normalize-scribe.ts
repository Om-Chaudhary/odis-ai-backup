/**
 * AI Entity Extraction for Veterinary Clinical Text
 *
 * Extracts structured entities from ANY veterinary clinical text
 * (transcripts, SOAP notes, visit notes, discharge summaries, etc.)
 *
 * IMPORTANT: This ONLY extracts entities - it does NOT generate SOAP notes
 * SOAP generation happens later using the extracted entities
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "~/env";
import {
  NormalizedEntitiesSchema,
  type NormalizedEntities,
} from "~/lib/validators/scribe";

/* ========================================
   Configuration
   ======================================== */

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.1; // Very low temperature for consistent entity extraction

/* ========================================
   AI Client
   ======================================== */

function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured. Add it to your environment variables.",
    );
  }

  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });
}

/* ========================================
   Prompt Engineering
   ======================================== */

/**
 * System prompt for entity extraction (NOT SOAP generation)
 */
const SYSTEM_PROMPT = `You are an expert veterinary clinical data extractor. Your ONLY job is to extract structured entities from veterinary clinical text.

CRITICAL: You are NOT generating SOAP notes or clinical documents. You are ONLY extracting factual entities that exist in the input text.

Extract these entities:
1. **Patient Information**: name, species, breed, age/DOB, sex, weight, owner details
2. **Clinical Facts**: symptoms, vital signs, exam findings, diagnoses, test results
3. **Medications & Treatments**: what was prescribed/administered (exact names, dosages, frequencies)
4. **Procedures**: what was performed
5. **Follow-up**: instructions given, recheck dates
6. **Case Classification**: type of visit (checkup, emergency, surgery, etc.)

Guidelines:
- EXTRACT ONLY what is explicitly stated - do not infer or generate new content
- If a field is missing, leave it empty - do not fill with assumptions
- Preserve exact medication names, dosages, and instructions as written
- Extract vital signs exactly as recorded
- List diagnoses as mentioned (do not add differentials unless stated)
- Indicate confidence level for extracted data
- Flag warnings if critical information is missing or ambiguous

Output Format (JSON only, NO markdown code blocks):
{
  "patient": {
    "name": "string",
    "species": "dog" | "cat" | "bird" | "rabbit" | "other" | "unknown",
    "breed": "string (optional)",
    "age": "string (optional, e.g., '5 years')",
    "sex": "male" | "female" | "unknown",
    "weight": "string (optional, e.g., '15 kg')",
    "owner": {
      "name": "string",
      "phone": "string (optional)",
      "email": "string (optional)"
    }
  },
  "clinical": {
    "chiefComplaint": "string (optional)",
    "visitReason": "string (optional)",
    "presentingSymptoms": ["array of symptoms"],
    "vitalSigns": {
      "temperature": "string (optional)",
      "heartRate": "string (optional)",
      "respiratoryRate": "string (optional)",
      "weight": "string (optional)"
    },
    "physicalExamFindings": ["array of findings"],
    "diagnoses": ["array of diagnoses"],
    "differentialDiagnoses": ["array if mentioned"],
    "medications": [
      {
        "name": "string",
        "dosage": "string (optional)",
        "frequency": "string (optional)",
        "duration": "string (optional)",
        "route": "string (optional, e.g., 'PO', 'IV')"
      }
    ],
    "treatments": ["array of treatments"],
    "procedures": ["array of procedures"],
    "followUpInstructions": "string (optional)",
    "followUpDate": "string (optional)",
    "recheckRequired": boolean,
    "labResults": ["array if any"],
    "imagingResults": ["array if any"],
    "clinicalNotes": "string (optional, any additional notes)",
    "prognosis": "string (optional)"
  },
  "caseType": "checkup" | "emergency" | "surgery" | "follow_up" | "dental" | "vaccination" | "diagnostic" | "consultation" | "other" | "unknown",
  "confidence": {
    "overall": number (0-1, how confident you are in the extraction),
    "patient": number (0-1),
    "clinical": number (0-1)
  },
  "warnings": ["array of strings if data is incomplete/uncertain"]
}`;

function createUserPrompt(input: string, inputType?: string): string {
  const typeHint = inputType ? ` (input type: ${inputType})` : "";

  return `Extract structured clinical entities from this veterinary text${typeHint}:

<clinical_text>
${input}
</clinical_text>

Remember: ONLY extract entities that are explicitly present. Do NOT generate, infer, or add content that isn't there.`;
}

/* ========================================
   Main Extraction Function
   ======================================== */

/**
 * Extract entities from clinical text (does NOT generate SOAP notes)
 */
export async function extractEntities(
  input: string,
  inputType?: string,
): Promise<NormalizedEntities> {
  if (!input || input.trim().length < 50) {
    throw new Error("Input too short for entity extraction (minimum 50 characters)");
  }

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: createUserPrompt(input, inputType),
        },
      ],
    });

    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response type from Claude API");
    }

    // Parse JSON response
    let parsedResponse: unknown;
    try {
      const cleanedText = content.text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.text);
      throw new Error(
        `Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      );
    }

    // Validate against schema
    const validationResult = NormalizedEntitiesSchema.safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error("AI response validation failed:", validationResult.error);
      console.error("Raw response:", JSON.stringify(parsedResponse, null, 2));

      throw new Error(
        `AI response validation failed: ${validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
      );
    }

    // Add metadata
    const entities = validationResult.data;
    entities.extractedAt = new Date().toISOString();
    entities.originalInput = input;
    entities.inputType = inputType;

    return entities;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(
        `Anthropic API error (${error.status}): ${error.message}`,
      );
    }

    throw error;
  }
}

/* ========================================
   Helper Functions
   ======================================== */

/**
 * Analyze extraction quality
 */
export function analyzeExtractionQuality(entities: NormalizedEntities): {
  hasWarnings: boolean;
  isHighConfidence: boolean;
  missingCriticalFields: string[];
} {
  const warnings = entities.warnings || [];
  const missingFields: string[] = [];

  // Check for critical missing fields
  if (!entities.patient.name) missingFields.push("patient.name");
  if (!entities.patient.owner.name) missingFields.push("patient.owner.name");

  const isHighConfidence =
    entities.confidence.overall >= 0.7 && missingFields.length === 0;

  return {
    hasWarnings: warnings.length > 0,
    isHighConfidence,
    missingCriticalFields: missingFields,
  };
}

/**
 * Create summary for logging
 */
export function createExtractionSummary(entities: NormalizedEntities): string {
  return [
    `Patient: ${entities.patient.name} (${entities.patient.species})`,
    `Owner: ${entities.patient.owner.name}`,
    `Case Type: ${entities.caseType}`,
    `Confidence: ${(entities.confidence.overall * 100).toFixed(1)}%`,
    entities.clinical.diagnoses?.length
      ? `Diagnoses: ${entities.clinical.diagnoses.join(", ")}`
      : "",
    entities.clinical.medications?.length
      ? `Medications: ${entities.clinical.medications.length} prescribed`
      : "",
    entities.warnings?.length ? `Warnings: ${entities.warnings.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * Retry logic with exponential backoff
 */
export async function extractEntitiesWithRetry(
  input: string,
  inputType?: string,
  maxRetries = 3,
): Promise<NormalizedEntities> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await extractEntities(input, inputType);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
      if (
        lastError.message.includes("too short") ||
        lastError.message.includes("validation failed")
      ) {
        throw lastError;
      }

      // Retry on API errors
      if (error instanceof Anthropic.APIError) {
        const isRetryable =
          error.status === 429 ||
          error.status === 500 ||
          error.status === 503;

        if (!isRetryable || attempt === maxRetries - 1) {
          throw lastError;
        }

        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `Entity extraction failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error("Entity extraction failed after retries");
}

/* ========================================
   Testing Helper
   ======================================== */

/**
 * Create mock entities for testing
 */
export function createMockEntities(): NormalizedEntities {
  return {
    patient: {
      name: "Max",
      species: "dog",
      breed: "Golden Retriever",
      age: "5 years",
      sex: "male",
      weight: "30 kg",
      owner: {
        name: "John Smith",
        phone: "(555) 123-4567",
        email: "john@example.com",
      },
    },
    clinical: {
      chiefComplaint: "Limping on right front leg",
      diagnoses: ["Soft tissue injury - right carpus"],
      medications: [
        {
          name: "Carprofen",
          dosage: "75mg",
          frequency: "BID",
          duration: "7 days",
        },
      ],
      followUpInstructions: "Rest and restricted activity",
      recheckRequired: true,
    },
    caseType: "checkup",
    confidence: {
      overall: 0.85,
      patient: 0.9,
      clinical: 0.8,
    },
    warnings: [],
    extractedAt: new Date().toISOString(),
  };
}
