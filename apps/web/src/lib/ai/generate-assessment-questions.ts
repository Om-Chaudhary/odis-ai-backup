/**
 * AI-Generated Case-Specific Assessment Questions
 *
 * Generates hyper-targeted follow-up call content based on actual case data,
 * replacing generic knowledge base questions with case-specific ones.
 */

import { getDischargeSummaryLLM } from "~/lib/llamaindex/config";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "~/lib/llamaindex/utils";
import type { ChatMessage } from "llamaindex";
import type { NormalizedEntities } from "~/lib/validators/scribe";
import {
  type GeneratedCallIntelligence,
  type GenerateCallIntelligenceInput,
  GeneratedCallIntelligenceSchema,
} from "~/lib/validators/assessment-questions";

/* ========================================
   System Prompt for Call Intelligence
   ======================================== */

const CALL_INTELLIGENCE_SYSTEM_PROMPT = `You are an expert veterinary technician generating follow-up call content. Your job is to create HYPER-SPECIFIC questions and guidance based on the actual case data provided.

CRITICAL PRINCIPLE: "SPECIFIC TO THIS CASE"
- Only generate questions about things ACTUALLY mentioned in the clinical data
- Do NOT ask generic wellness questions unless they're directly relevant
- If a dog came in for an ear infection, ask about the EAR, not appetite (unless appetite was noted as affected)
- If medication was prescribed, ask about medication compliance/tolerance
- If a procedure was done, ask about the procedure site

QUESTION GENERATION RULES:
1. Generate 1-2 questions MAX - quality over quantity
2. Each question must be directly tied to something in the case notes
3. Prioritize in this order:
   a) Symptom resolution (is the main problem improving?)
   b) Medication compliance (if meds prescribed)
   c) Procedure site/recovery (if procedure done)
   d) Side effects (only if relevant to specific medications)
4. NEVER include generic "eating and drinking" questions unless:
   - The case specifically mentioned appetite concerns
   - The condition typically affects appetite (GI issues, systemic illness)
   - The medication commonly causes appetite changes

CALL APPROACH CLASSIFICATION:
- "brief-checkin": Grooming, nail trims, routine wellness with no issues, simple vaccinations
- "standard-assessment": Most clinical cases with diagnosis and treatment
- "detailed-monitoring": Post-surgical, serious conditions, chronic disease management

SHOULD ASK CLINICAL QUESTIONS:
Set to FALSE for:
- Grooming visits
- Simple nail trims
- Wellness exams where pet was healthy
- Routine vaccinations with no adverse reactions noted

Set to TRUE for:
- Any diagnosis or illness
- Medication prescribed
- Procedure performed
- Follow-up care needed

WARNING SIGNS - BE SPECIFIC:
- Generate warning signs specific to THIS condition
- Don't include generic signs unless relevant
- Example: For ear infection, include "increased head shaking" not "loss of appetite"

NORMAL EXPECTATIONS - BE REALISTIC:
- What should the owner expect for THIS specific recovery
- Be honest about recovery timeline
- Example: "Some mild redness at the ear may persist for a few days"

OUTPUT FORMAT:
Return ONLY valid JSON matching this structure:
{
  "caseContextSummary": "Brief 1-sentence summary of case for AI context",
  "assessmentQuestions": [
    {
      "question": "Question text with {{petName}} placeholder",
      "context": "Why we're asking this",
      "expectedPositiveResponse": ["good response patterns"],
      "concerningResponses": ["concerning patterns"],
      "followUpIfConcerning": "Follow-up question if concerning",
      "priority": 1
    }
  ],
  "warningSignsToMonitor": ["Specific warning signs for this case"],
  "normalExpectations": ["What's normal for this recovery"],
  "emergencyCriteria": ["When to go to ER immediately"],
  "shouldAskClinicalQuestions": true,
  "callApproach": "standard-assessment",
  "confidence": 0.85
}

EXAMPLES:

Case: Ear infection, prescribed Otomax
Good questions:
- "Is {{petName}} still shaking their head or scratching at the ears?"
- "Have you been able to apply the Otomax drops without any issues?"
Bad questions:
- "How's {{petName}}'s appetite?" (not relevant unless noted)
- "Is {{petName}} drinking normally?" (not relevant)

Case: Spay surgery
Good questions:
- "How does the incision site look? Any redness, swelling, or discharge?"
- "Is {{petName}} trying to lick or chew at the incision?"
- "Has {{petName}} been keeping the e-collar on?"
Bad questions:
- "Is {{petName}} eating?" (only if they haven't eaten in 24+ hours post-op)

Case: Annual wellness exam, healthy
shouldAskClinicalQuestions: false
callApproach: "brief-checkin"
(No clinical questions needed - just a brief courtesy call)`;

/* ========================================
   Input Formatting
   ======================================== */

function formatInputForPrompt(input: GenerateCallIntelligenceInput): string {
  const sections: string[] = [];

  sections.push(`PATIENT: ${input.petName}`);
  if (input.species) sections.push(`SPECIES: ${input.species}`);
  if (input.breed) sections.push(`BREED: ${input.breed}`);
  if (input.age) sections.push(`AGE: ${input.age}`);

  if (input.visitReason) {
    sections.push(`\nVISIT REASON: ${input.visitReason}`);
  }

  if (input.chiefComplaint) {
    sections.push(`CHIEF COMPLAINT: ${input.chiefComplaint}`);
  }

  if (input.presentingSymptoms?.length) {
    sections.push(`SYMPTOMS: ${input.presentingSymptoms.join(", ")}`);
  }

  if (input.diagnosis) {
    sections.push(`\nPRIMARY DIAGNOSIS: ${input.diagnosis}`);
  } else if (input.diagnoses?.length) {
    sections.push(`\nDIAGNOSES: ${input.diagnoses.join(", ")}`);
  }

  if (input.procedures?.length) {
    sections.push(`PROCEDURES: ${input.procedures.join(", ")}`);
  }

  if (input.treatments?.length) {
    sections.push(`TREATMENTS: ${input.treatments.join(", ")}`);
  }

  if (input.medications?.length) {
    sections.push(`\nMEDICATIONS PRESCRIBED:`);
    input.medications.forEach((med) => {
      const parts = [med.name];
      if (med.dosage) parts.push(med.dosage);
      if (med.frequency) parts.push(med.frequency);
      if (med.duration) parts.push(`for ${med.duration}`);
      sections.push(`  - ${parts.join(" ")}`);
    });
  }

  if (input.followUpInstructions) {
    sections.push(`\nFOLLOW-UP INSTRUCTIONS: ${input.followUpInstructions}`);
  }

  if (input.soapContent) {
    sections.push(`\nRAW CLINICAL NOTES:\n${input.soapContent}`);
  }

  return sections.join("\n");
}

/* ========================================
   Main Generation Function
   ======================================== */

export async function generateCallIntelligence(
  input: GenerateCallIntelligenceInput,
): Promise<GeneratedCallIntelligence> {
  try {
    const llm = getDischargeSummaryLLM();

    console.log("[CALL_INTELLIGENCE] Generating case-specific call content", {
      petName: input.petName,
      diagnosis: input.diagnosis,
      hasMedications: (input.medications?.length ?? 0) > 0,
      hasProcedures: (input.procedures?.length ?? 0) > 0,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: CALL_INTELLIGENCE_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Generate hyper-specific follow-up call content for this case:\n\n${formatInputForPrompt(input)}\n\nReturn ONLY the JSON object.`,
      },
    ];

    const response = await llm.chat({ messages });
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
      console.error(
        "[CALL_INTELLIGENCE] Failed to parse JSON response:",
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
      GeneratedCallIntelligenceSchema.safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error(
        "[CALL_INTELLIGENCE] Validation failed:",
        validationResult.error,
      );
      throw new Error(
        `Call intelligence validation failed: ${validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
      );
    }

    console.log(
      "[CALL_INTELLIGENCE] Successfully generated call intelligence",
      {
        petName: input.petName,
        questionCount: validationResult.data.assessmentQuestions.length,
        shouldAsk: validationResult.data.shouldAskClinicalQuestions,
        callApproach: validationResult.data.callApproach,
        confidence: validationResult.data.confidence,
      },
    );

    return validationResult.data;
  } catch (error) {
    const statusCode = extractApiErrorStatus(error);
    if (statusCode !== null) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown API error";
      console.error("[CALL_INTELLIGENCE] API error:", {
        status: statusCode,
        message: errorMessage,
      });
      throw new Error(`API error (${statusCode}): ${errorMessage}`);
    }

    console.error("[CALL_INTELLIGENCE] Unexpected error:", error);
    throw error;
  }
}

/* ========================================
   Retry Logic
   ======================================== */

export async function generateCallIntelligenceWithRetry(
  input: GenerateCallIntelligenceInput,
  maxRetries = 2,
): Promise<GeneratedCallIntelligence> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateCallIntelligence(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const statusCode = extractApiErrorStatus(error);
      if (statusCode !== null) {
        const isRetryable =
          statusCode === 429 || statusCode === 500 || statusCode === 503;

        if (!isRetryable || attempt === maxRetries - 1) {
          throw lastError;
        }

        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `[CALL_INTELLIGENCE] Generation failed (attempt ${
            attempt + 1
          }/${maxRetries}), retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // For JSON parse errors, retry once
      if (lastError.message.includes("Invalid JSON") && attempt < 1) {
        console.warn("[CALL_INTELLIGENCE] JSON parse failed, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      throw lastError;
    }
  }

  throw (
    lastError ?? new Error("Call intelligence generation failed after retries")
  );
}

/* ========================================
   Convenience: Generate from NormalizedEntities
   ======================================== */

export async function generateCallIntelligenceFromEntities(
  entities: NormalizedEntities,
  soapContent?: string,
): Promise<GeneratedCallIntelligence> {
  const input: GenerateCallIntelligenceInput = {
    petName: entities.patient.name || "your pet",
    species: entities.patient.species,
    breed: entities.patient.breed,
    age: entities.patient.age,
    diagnosis: entities.clinical.diagnoses?.[0],
    diagnoses: entities.clinical.diagnoses,
    medications: entities.clinical.medications,
    procedures: entities.clinical.procedures,
    treatments: entities.clinical.treatments,
    visitReason: entities.clinical.visitReason,
    chiefComplaint: entities.clinical.chiefComplaint,
    presentingSymptoms: entities.clinical.presentingSymptoms,
    followUpInstructions: entities.clinical.followUpInstructions,
    soapContent,
  };

  return generateCallIntelligenceWithRetry(input);
}

/* ========================================
   Fallback: Return null on failure
   ======================================== */

export async function generateCallIntelligenceSafe(
  input: GenerateCallIntelligenceInput,
): Promise<GeneratedCallIntelligence | null> {
  try {
    return await generateCallIntelligenceWithRetry(input);
  } catch (error) {
    console.error(
      "[CALL_INTELLIGENCE] Failed to generate, will use static KB fallback:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
