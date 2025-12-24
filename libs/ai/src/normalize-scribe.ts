/**
 * AI Entity Extraction for Veterinary Clinical Text
 *
 * Extracts structured entities from ANY veterinary clinical text
 * (transcripts, SOAP notes, visit notes, discharge summaries, etc.)
 *
 * IMPORTANT: This ONLY extracts entities - it does NOT generate SOAP notes
 * SOAP generation happens later using the extracted entities
 */

import { getEntityExtractionLLM } from "./llamaindex/config";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";
import type { ChatMessage } from "llamaindex";
import {
  type NormalizedEntities,
  NormalizedEntitiesSchema,
} from "@odis-ai/validators";

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
3. **Medications**: ONLY prescribed take-home medications
4. **Vaccinations**: Vaccines administered during visit (separate from medications)
5. **Procedures**: what was performed
6. **Follow-up**: instructions given, recheck dates
7. **Case Classification**: type of visit (checkup, emergency, surgery, euthanasia, etc.)

=== CRITICAL DISTINCTIONS ===

MEDICATIONS vs VACCINATIONS vs TREATMENTS:
- "medications": ONLY prescribed take-home medications the owner gives at home
  Examples: Carprofen, Cephalexin, Metronidazole, Gabapentin, Apoquel, Cerenia
- "vaccinations": Vaccines administered during the visit - put these here, NOT in medications
  Examples: DHPP, Rabies, Bordetella, FVRCP, Leptospirosis, Lyme, Canine Influenza
- "treatments": In-clinic treatments and grooming products
  Examples: Fluids administered, injections given, shampoo, ear cleaner, nail trim

DIAGNOSES - WHAT IS AND IS NOT A DIAGNOSIS:
These are NOT diagnoses (patient status assessments) - do NOT include in diagnoses array:
- BARH = "Bright, Alert, Responsive, Hydrated" - this is patient STATUS, not a diagnosis
- BAR = "Bright, Alert, Responsive" - this is patient STATUS
- QAR = "Quiet, Alert, Responsive" - this is patient STATUS
- "No abnormalities detected" - this is an exam finding, not a diagnosis
- "Healthy" or "Normal exam" - these are assessments, not diagnoses

If no actual medical diagnosis exists, leave the diagnoses array EMPTY [].
Only include actual medical conditions/diseases as diagnoses.

EXPAND ALL ABBREVIATIONS in diagnoses to full terms:
- UTI → "Urinary Tract Infection"
- URI → "Upper Respiratory Infection"  
- GI → "Gastrointestinal" (e.g., "GI upset" → "Gastrointestinal upset")
- OA → "Osteoarthritis"
- IVDD → "Intervertebral Disc Disease"
- CHF → "Congestive Heart Failure"
- CKD → "Chronic Kidney Disease"
- DM → "Diabetes Mellitus"
- HBC → "Hit by Car"
- FLUTD → "Feline Lower Urinary Tract Disease"
- IBD → "Inflammatory Bowel Disease"
- DJD → "Degenerative Joint Disease"
- ACL/CCL → "Cranial Cruciate Ligament" injury/rupture

EUTHANASIA DETECTION:
If the text mentions euthanasia, humane euthanasia, put to sleep, end of life, peaceful passing, 
or similar end-of-life procedures:
- Set caseType to "euthanasia"
- This will prevent discharge communications from being sent

=== GENERAL GUIDELINES ===
- EXTRACT ONLY what is explicitly stated - do not infer or generate new content
- If a field is missing, leave it empty - do not fill with assumptions
- Preserve exact medication names, dosages, and instructions as written
- Extract vital signs exactly as recorded
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
    "physicalExamFindings": ["array of findings - include BARH/BAR/QAR here if present"],
    "diagnoses": ["array of ACTUAL medical diagnoses only - NOT status assessments, expand abbreviations"],
    "differentialDiagnoses": ["array if mentioned"],
    "medications": [
      {
        "name": "string (prescribed take-home meds ONLY)",
        "dosage": "string (optional)",
        "frequency": "string (optional)",
        "duration": "string (optional)",
        "route": "string (optional, e.g., 'PO', 'IV')"
      }
    ],
    "vaccinations": [
      {
        "name": "string (e.g., 'DHPP', 'Rabies', 'Bordetella')",
        "manufacturer": "string (optional)",
        "lotNumber": "string (optional)"
      }
    ],
    "treatments": ["array of in-clinic treatments, grooming products"],
    "procedures": ["array of procedures performed"],
    "followUpInstructions": "string (optional)",
    "followUpDate": "string (optional)",
    "recheckRequired": boolean,
    "labResults": ["array if any"],
    "imagingResults": ["array if any"],
    "clinicalNotes": "string (optional, any additional notes)",
    "prognosis": "string (optional)"
  },
  "caseType": "checkup" | "emergency" | "surgery" | "follow_up" | "dental" | "vaccination" | "diagnostic" | "consultation" | "exam" | "euthanasia" | "other" | "unknown",
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
    throw new Error(
      "Input too short for entity extraction (minimum 50 characters)",
    );
  }

  try {
    const llm = getEntityExtractionLLM();

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: createUserPrompt(input, inputType),
      },
    ];

    const response = await llm.chat({ messages });

    // Extract text content from LlamaIndex response (handles both string and array formats)
    const responseText = extractTextFromResponse(response);

    // Parse JSON response
    let parsedResponse: unknown;
    try {
      const cleanedText = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      throw new Error(
        `Invalid JSON response from AI: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`,
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
    // Extract API error status if present
    const statusCode = extractApiErrorStatus(error);
    if (statusCode !== null) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown LlamaIndex API error";
      throw new Error(`LlamaIndex API error (${statusCode}): ${errorMessage}`);
    }

    // Re-throw other errors as-is
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
  const warnings = entities.warnings ?? [];
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
    entities.warnings?.length
      ? `Warnings: ${entities.warnings.join("; ")}`
      : "",
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
      const statusCode = extractApiErrorStatus(error);

      if (statusCode !== null) {
        const isRetryable =
          statusCode === 429 || statusCode === 500 || statusCode === 503;

        if (!isRetryable || attempt === maxRetries - 1) {
          throw lastError;
        }

        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `Entity extraction failed (attempt ${
            attempt + 1
          }/${maxRetries}), retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error("Entity extraction failed after retries");
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
      vaccinations: [
        {
          name: "DHPP",
        },
        {
          name: "Rabies",
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
