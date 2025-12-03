/**
 * Structured AI Discharge Summary Generation
 *
 * Generates SHORT, CONCISE, PET-OWNER FRIENDLY discharge summaries
 * in structured JSON format for beautiful email rendering.
 */

import { getDischargeSummaryLLM } from "~/lib/llamaindex/config";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "~/lib/llamaindex/utils";
import type { ChatMessage } from "llamaindex";
import type { NormalizedEntities } from "~/lib/validators/scribe";
import {
  type StructuredDischargeSummary,
  StructuredDischargeSummarySchema,
  structuredToPlainText,
} from "~/lib/validators/discharge-summary";

/* ========================================
   Structured Prompt Engineering
   ======================================== */

const STRUCTURED_SYSTEM_PROMPT = `You are OdisAI, a veterinary discharge instruction generator. Generate SHORT, CONCISE discharge instructions that pet owners can easily understand and follow.

CRITICAL REQUIREMENTS:
1. BE BRIEF - Keep each section to 1-3 bullet points maximum
2. USE SIMPLE LANGUAGE - No medical jargon, explain like talking to a friend
3. FOCUS ON ACTION - Only include what the owner needs to DO
4. PRIORITIZE - Medications, warning signs, and follow-up are most important

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "patientName": "Pet's name",
  "visitSummary": "One sentence: why they came and what we did",
  "diagnosis": "Simple explanation of what's wrong (optional)",
  "treatmentsToday": ["Brief list of what was done"],
  "medications": [
    {
      "name": "Medication name",
      "dosage": "How much (e.g., '1 tablet')",
      "frequency": "How often (e.g., 'twice daily')",
      "duration": "How long (e.g., '7 days')",
      "instructions": "Special notes (e.g., 'give with food')"
    }
  ],
  "homeCare": {
    "activity": "Activity restrictions",
    "diet": "Food instructions",
    "monitoring": ["What to watch for"],
    "woundCare": "Wound care if applicable"
  },
  "followUp": {
    "required": true/false,
    "date": "When to return",
    "reason": "Why follow-up is needed"
  },
  "warningSigns": ["Call immediately if you see these"],
  "notes": "Any other brief notes"
}

STYLE GUIDE:
- Write like you're texting a friend, not writing a medical document
- "Give 1 tablet twice a day with food" NOT "Administer 1 tablet PO BID with meals"
- "Call us if vomiting continues" NOT "Contact clinic if emesis persists"
- Skip sections that don't apply - don't include empty arrays or null values
- Maximum 3 warning signs, focus on the most important ones`;

interface PatientData {
  name?: string;
  species?: string;
  breed?: string;
  age?: string;
  owner_name?: string;
}

function formatEntityExtractionForStructuredPrompt(
  entities: NormalizedEntities,
): string {
  const sections: string[] = [];

  sections.push("PATIENT: " + (entities.patient.name ?? "Unknown"));
  sections.push("SPECIES: " + entities.patient.species);
  if (entities.patient.breed) sections.push("BREED: " + entities.patient.breed);

  if (entities.clinical.chiefComplaint) {
    sections.push("REASON FOR VISIT: " + entities.clinical.chiefComplaint);
  } else if (entities.clinical.visitReason) {
    sections.push("REASON FOR VISIT: " + entities.clinical.visitReason);
  }

  if (entities.clinical.diagnoses?.length) {
    sections.push("DIAGNOSIS: " + entities.clinical.diagnoses.join(", "));
  }

  if (entities.clinical.medications?.length) {
    sections.push("MEDICATIONS:");
    entities.clinical.medications.forEach((med) => {
      const parts = [med.name];
      if (med.dosage) parts.push(med.dosage);
      if (med.frequency) parts.push(med.frequency);
      if (med.duration) parts.push(`for ${med.duration}`);
      sections.push("  - " + parts.join(" "));
    });
  }

  if (entities.clinical.treatments?.length) {
    sections.push("TREATMENTS: " + entities.clinical.treatments.join(", "));
  }

  if (entities.clinical.procedures?.length) {
    sections.push("PROCEDURES: " + entities.clinical.procedures.join(", "));
  }

  if (entities.clinical.followUpInstructions) {
    sections.push("FOLLOW-UP: " + entities.clinical.followUpInstructions);
  }

  if (entities.clinical.followUpDate) {
    sections.push("FOLLOW-UP DATE: " + entities.clinical.followUpDate);
  }

  return sections.join("\n");
}

function createStructuredUserPrompt(
  soapContent: string | null,
  entityExtraction: NormalizedEntities | null,
  patientData: PatientData | null,
): string {
  const sections: string[] = [];

  // Get patient name from available sources
  const patientName =
    patientData?.name ?? entityExtraction?.patient.name ?? "Unknown";

  sections.push(
    `Generate a SHORT, CONCISE discharge summary for ${patientName}.`,
  );
  sections.push("");

  if (soapContent) {
    sections.push("CLINICAL DATA:");
    sections.push(soapContent);
  } else if (entityExtraction) {
    sections.push("CLINICAL DATA:");
    sections.push(formatEntityExtractionForStructuredPrompt(entityExtraction));
  }

  sections.push("");
  sections.push(
    "Return ONLY the JSON object. No markdown, no explanation, just the JSON.",
  );

  return sections.join("\n");
}

/* ========================================
   Structured Generation Result
   ======================================== */

export interface StructuredDischargeResult {
  structured: StructuredDischargeSummary;
  plainText: string;
}

/* ========================================
   Main Structured Generation Function
   ======================================== */

export interface GenerateStructuredDischargeInput {
  soapContent?: string | null;
  entityExtraction?: NormalizedEntities | null;
  patientData?: PatientData | null;
}

export async function generateStructuredDischargeSummary(
  input: GenerateStructuredDischargeInput,
): Promise<StructuredDischargeResult> {
  const { soapContent, entityExtraction, patientData } = input;

  // Validate we have at least one data source
  if (!soapContent && !entityExtraction) {
    throw new Error(
      "Must provide either soapContent or entityExtraction to generate discharge summary",
    );
  }

  try {
    const llm = getDischargeSummaryLLM();

    console.log(
      "[STRUCTURED_DISCHARGE] Generating structured discharge summary",
      {
        hasSoapContent: !!soapContent,
        hasEntityExtraction: !!entityExtraction,
        patientName: patientData?.name ?? entityExtraction?.patient.name,
      },
    );

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: STRUCTURED_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: createStructuredUserPrompt(
          soapContent ?? null,
          entityExtraction ?? null,
          patientData ?? null,
        ),
      },
    ];

    const response = await llm.chat({ messages });
    const responseText = extractTextFromResponse(response);

    // Parse JSON response
    let parsedResponse: unknown;
    try {
      // Clean up response - remove markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error(
        "[STRUCTURED_DISCHARGE] Failed to parse JSON response:",
        responseText,
      );
      throw new Error(
        `Invalid JSON response from AI: ${
          parseError instanceof Error ? parseError.message : "Parse error"
        }`,
      );
    }

    // Validate against schema
    const validationResult =
      StructuredDischargeSummarySchema.safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error(
        "[STRUCTURED_DISCHARGE] Validation failed:",
        validationResult.error,
      );
      console.error(
        "[STRUCTURED_DISCHARGE] Raw response:",
        JSON.stringify(parsedResponse, null, 2),
      );
      throw new Error(
        `Structured summary validation failed: ${validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
      );
    }

    const structured = validationResult.data;
    const plainText = structuredToPlainText(structured);

    console.log(
      "[STRUCTURED_DISCHARGE] Successfully generated structured summary",
      {
        patientName: structured.patientName,
        hasMedications: (structured.medications?.length ?? 0) > 0,
        hasWarningSigns: (structured.warningSigns?.length ?? 0) > 0,
        plainTextLength: plainText.length,
      },
    );

    return { structured, plainText };
  } catch (error) {
    const statusCode = extractApiErrorStatus(error);
    if (statusCode !== null) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown API error";
      console.error("[STRUCTURED_DISCHARGE] API error:", {
        status: statusCode,
        message: errorMessage,
      });
      throw new Error(`API error (${statusCode}): ${errorMessage}`);
    }

    console.error("[STRUCTURED_DISCHARGE] Unexpected error:", error);
    throw error;
  }
}

/* ========================================
   Retry Logic
   ======================================== */

export async function generateStructuredDischargeSummaryWithRetry(
  input: GenerateStructuredDischargeInput,
  maxRetries = 3,
): Promise<StructuredDischargeResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateStructuredDischargeSummary(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors (data issue, not transient)
      if (lastError.message.includes("Must provide either")) {
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
          `[STRUCTURED_DISCHARGE] Generation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // For JSON parse errors, retry once (AI might give better output)
      if (lastError.message.includes("Invalid JSON") && attempt < 1) {
        console.warn("[STRUCTURED_DISCHARGE] JSON parse failed, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      throw lastError;
    }
  }

  throw (
    lastError ??
    new Error("Structured discharge generation failed after retries")
  );
}

/* ========================================
   Convenience: Generate from Entities Only
   ======================================== */

export async function generateStructuredDischargeFromEntities(
  entities: NormalizedEntities,
): Promise<StructuredDischargeResult> {
  return generateStructuredDischargeSummaryWithRetry({
    entityExtraction: entities,
    patientData: {
      name: entities.patient.name,
      species: entities.patient.species,
      breed: entities.patient.breed,
      owner_name: entities.patient.owner.name,
    },
  });
}
