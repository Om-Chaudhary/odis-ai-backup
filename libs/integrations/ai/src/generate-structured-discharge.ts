/**
 * Structured AI Discharge Summary Generation
 *
 * Generates SHORT, CONCISE, PET-OWNER FRIENDLY discharge summaries
 * in structured JSON format for beautiful email rendering.
 */

import { getDischargeSummaryLLM } from "./llamaindex/config";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";
import type { ChatMessage } from "llamaindex";
import type { NormalizedEntities } from "@odis-ai/shared/validators";
import {
  type StructuredDischargeSummary,
  StructuredDischargeSummarySchema,
  structuredToPlainText,
} from "@odis-ai/shared/validators/discharge-summary";

/* ========================================
   Structured Prompt Engineering
   ======================================== */

const STRUCTURED_SYSTEM_PROMPT = `You are OdisAI, a veterinary discharge instruction generator. Your job is to EXTRACT information from clinical notes - NOT to invent or assume anything.

CRITICAL SAFETY PRINCIPLE: "EXTRACT, DON'T INVENT"
- Only include information EXPLICITLY stated in the clinical notes
- If something is not mentioned, DO NOT include it
- Never guess, assume, or infer medical information
- When in doubt, leave the field empty/undefined

CASE TYPE CLASSIFICATION - REQUIRED:
Classify the visit into one of these categories based on the clinical notes:
- "surgery" - Any surgical procedure (spay, neuter, mass removal, etc.)
- "dental" - Dental cleaning, extractions, oral procedures
- "vaccination" - Primarily a vaccination visit
- "dermatology" - Skin conditions, allergies, ear infections
- "wellness" - Routine checkup, annual exam, health evaluation, diagnostic testing that went well
- "emergency" - Emergency or urgent care visit
- "gastrointestinal" - Vomiting, diarrhea, GI issues
- "orthopedic" - Limping, joint issues, fractures
- "other" - Follow-up visits, routine testing, anything that doesn't fit above categories

APPOINTMENT SUMMARY - REQUIRED:
Generate a DESCRIPTIVE 3-4 sentence summary for the email header. This appears at the top of the discharge email and should:
- Be warm and friendly in tone
- Describe what was done during the visit in general terms
- Include any treatments, procedures, or medications given (but not specific diagnoses)
- Mention the pet's behavior/cooperation during the visit
- Use general terms like "wellness visit", "dental care", "skin care", "routine vaccinations"

Good examples:
- "Max came in for a wellness checkup and routine care. We performed a thorough examination and updated his vaccinations. He was such a good boy throughout the visit and is ready to go home feeling great!"
- "We saw Luna for a dental procedure. We cleaned her teeth and took care of some oral health issues. She recovered beautifully from anesthesia and did great! She's ready to go home with some aftercare instructions."
- "Buddy visited us for some skin care. We examined his skin condition and provided treatment to help him feel more comfortable. He was very cooperative during the appointment and is ready to go home."
- "Charlie came in for his routine vaccinations and wellness exam. We updated all his shots and did a complete health check. He was such a good patient and everything looks wonderful!"

Bad examples (too specific - DO NOT do this):
- "Max came in for treatment of his ear infection and received antibiotics" (too specific about diagnosis)
- "Luna had 3 teeth extracted due to periodontal disease" (discloses specific diagnosis)

MEDICATION RULES - EXTREMELY IMPORTANT:
- ONLY include medications the owner needs to GIVE AT HOME on an ongoing basis
- DO NOT include: vaccinations, dewormers given at clinic, injections given at clinic, clinic-administered treatments
- If unsure whether a medication is take-home, DO NOT include it
- If there are NO take-home medications, set medications to an empty array []
- Each medication field should ONLY be filled if EXPLICITLY stated in notes

VACCINATIONS - SEPARATE FROM MEDICATIONS:
- List any vaccinations administered during the visit in "vaccinationsGiven"
- Examples: "Rabies", "DHPP", "Bordetella", "FVRCP"
- These go in treatmentsToday AND vaccinationsGiven

HOME CARE - ONLY IF EXPLICIT:
- Only include activity/diet/woundCare/monitoring if EXPLICITLY mentioned in notes
- Do NOT add generic advice like "ensure fresh water" unless the notes say so
- If no home care instructions in notes, omit the homeCare object entirely

WARNING SIGNS - EXTRACT ONLY, DO NOT INVENT:
- ONLY include warning signs if they are EXPLICITLY stated in the clinical notes
- DO NOT generate generic warning signs - the email system has curated fallbacks
- For routine visits (wellness, vaccination, health evaluation, diagnostic testing), almost always use empty array []
- If no warning signs mentioned in notes, set to empty array []
- This is critical for safety - we use a curated library as fallback for serious cases only

FOLLOW-UP - ONLY IF EXPLICIT:
- Only set "required": true if follow-up is explicitly mentioned in the clinical notes
- Only include date/reason if stated in notes
- If no follow-up mentioned, DO NOT include the followUp object at all (omit it entirely)
- Do NOT add generic follow-up recommendations unless specifically stated

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "patientName": "Pet's name",
  "caseType": "surgery|dental|vaccination|dermatology|wellness|emergency|gastrointestinal|orthopedic|other",
  "appointmentSummary": "1-2 sentence GENERAL summary (no specific conditions/treatments disclosed)",
  "diagnosis": "Simple explanation of what's wrong (only if stated)",
  "treatmentsToday": ["Procedures, exams, vaccinations done during visit"],
  "vaccinationsGiven": ["List of vaccines given, e.g., 'Rabies', 'DHPP'"],
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Only if stated",
      "frequency": "Only if stated",
      "duration": "Only if stated",
      "instructions": "Only if stated"
    }
  ],
  "homeCare": {
    "activity": "Only if explicitly stated",
    "diet": "Only if explicitly stated",
    "monitoring": ["Only if explicitly stated"],
    "woundCare": "Only if explicitly stated"
  },
  "followUp": {
    "required": true/false,
    "date": "Only if stated",
    "reason": "Only if stated"
  },
  "warningSigns": [],
  "notes": "Only important client-relevant info (e.g., 'Blood work sent to lab', 'Continue medication as prescribed'). DO NOT include clinic-internal notes like 'Owner declined treatment', 'Recheck instructions provided', 'Client educated', etc."
}

NOTES SECTION - CLIENT-RELEVANT ONLY:
- Only include information that is relevant and actionable for the pet owner
- Good examples: "Blood work has been sent to lab for analysis", "Continue medication as prescribed", "Follow medication instructions carefully"
- Bad examples (DO NOT include): "Owner declined partial treatment", "Recheck instructions provided", "Client educated on procedure", "Follow-up scheduled in system"

STYLE GUIDE:
- Use simple language, no medical jargon
- "Give 1 tablet twice a day with food" NOT "Administer 1 tablet PO BID with meals"
- Skip sections that don't apply - don't include empty objects or null values
- Keep it brief and factual`;

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
    sections.push("TAKE-HOME MEDICATIONS:");
    entities.clinical.medications.forEach((med) => {
      const parts = [med.name];
      if (med.dosage) parts.push(med.dosage);
      if (med.frequency) parts.push(med.frequency);
      if (med.duration) parts.push(`for ${med.duration}`);
      sections.push("  - " + parts.join(" "));
    });
  }

  // Vaccinations (separate from take-home medications)
  if (entities.clinical.vaccinations?.length) {
    sections.push("VACCINATIONS GIVEN:");
    entities.clinical.vaccinations.forEach((vax) => {
      sections.push("  - " + vax.name);
    });
  }

  if (entities.clinical.treatments?.length) {
    sections.push("TREATMENTS: " + entities.clinical.treatments.join(", "));
  }

  if (entities.clinical.procedures?.length) {
    sections.push("PROCEDURES: " + entities.clinical.procedures.join(", "));
  }

  if (entities.clinical.followUpInstructions) {
    sections.push(
      "FOLLOW-UP INSTRUCTIONS: " + entities.clinical.followUpInstructions,
    );
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
        caseType: structured.caseType,
        hasMedications: (structured.medications?.length ?? 0) > 0,
        hasVaccinations: (structured.vaccinationsGiven?.length ?? 0) > 0,
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
          `[STRUCTURED_DISCHARGE] Generation failed (attempt ${
            attempt + 1
          }/${maxRetries}), retrying in ${delay}ms...`,
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
