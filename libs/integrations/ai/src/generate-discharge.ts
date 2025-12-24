/**
 * AI Discharge Summary Generation
 *
 * Generates client-friendly discharge summaries from:
 * - SOAP notes (when available), OR
 * - Entity extraction data (when SOAP notes unavailable)
 */

import { getDischargeSummaryLLM } from "./llamaindex/config";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";
import type { ChatMessage } from "llamaindex";
import type { NormalizedEntities } from "@odis-ai/shared/validators";

/* ========================================
   Prompt Engineering
   ======================================== */

const SYSTEM_PROMPT = `You are OdisAI, an expert veterinary discharge instruction generator. Your role is to transform clinical data into clear, comprehensive, client-friendly discharge instructions.

Your expertise includes:
- Converting medical terminology into language pet owners can understand
- Organizing complex care instructions into logical, easy-to-follow sections
- Ensuring all critical information is included without overwhelming the client
- Maintaining medical accuracy while being accessible
- Emphasizing important safety information and warning signs

Requirements:
- ACCURATE: Only include information explicitly stated in the provided data
- CLEAR: Use simple, jargon-free language appropriate for pet owners
- COMPLETE: Cover all aspects of post-visit care mentioned in the materials
- ORGANIZED: Structure information with clear headings and formatting
- ACTIONABLE: Provide specific, concrete instructions the owner can follow
- SAFETY-FOCUSED: Clearly highlight warning signs and emergency situations

Guidelines:
- Never add medical advice not mentioned in the source materials
- If medications are prescribed, include clear administration instructions
- Always specify when to return for follow-up care
- Use bullet points and numbered lists for clarity
- Avoid medical jargon; when technical terms are necessary, explain them
- Format for easy scanning and reference
- If information is unclear or missing, note that the owner should call the clinic for clarification`;

interface PatientData {
  name?: string;
  species?: string;
  breed?: string;
  age?: string;
  owner_name?: string;
}

function formatEntityExtractionForPrompt(entities: NormalizedEntities): string {
  const sections: string[] = [];

  // Patient Information
  sections.push("PATIENT INFORMATION:");
  sections.push(`Name: ${entities.patient.name || "Not specified"}`);
  sections.push(`Species: ${entities.patient.species}`);
  if (entities.patient.breed) sections.push(`Breed: ${entities.patient.breed}`);
  if (entities.patient.age) sections.push(`Age: ${entities.patient.age}`);
  if (entities.patient.sex) sections.push(`Sex: ${entities.patient.sex}`);
  if (entities.patient.weight) {
    sections.push(`Weight: ${entities.patient.weight}`);
  }
  sections.push(`Owner: ${entities.patient.owner.name || "Not specified"}`);
  sections.push("");

  // Clinical Information
  sections.push("CLINICAL SUMMARY:");

  if (entities.clinical.chiefComplaint) {
    sections.push(`Chief Complaint: ${entities.clinical.chiefComplaint}`);
  }

  if (entities.clinical.visitReason) {
    sections.push(`Reason for Visit: ${entities.clinical.visitReason}`);
  }

  if (entities.clinical.presentingSymptoms?.length) {
    sections.push("\nPresenting Symptoms:");
    entities.clinical.presentingSymptoms.forEach((symptom) => {
      sections.push(`- ${symptom}`);
    });
  }

  if (entities.clinical.vitalSigns) {
    const vitals = entities.clinical.vitalSigns;
    const vitalsList = [
      vitals.temperature && `Temperature: ${vitals.temperature}`,
      vitals.heartRate && `Heart Rate: ${vitals.heartRate}`,
      vitals.respiratoryRate && `Respiratory Rate: ${vitals.respiratoryRate}`,
      vitals.weight && `Weight: ${vitals.weight}`,
    ].filter(Boolean);

    if (vitalsList.length > 0) {
      sections.push("\nVital Signs:");
      vitalsList.forEach((vital) => sections.push(`- ${vital}`));
    }
  }

  if (entities.clinical.physicalExamFindings?.length) {
    sections.push("\nPhysical Exam Findings:");
    entities.clinical.physicalExamFindings.forEach((finding) => {
      sections.push(`- ${finding}`);
    });
  }

  if (entities.clinical.diagnoses?.length) {
    sections.push("\nDiagnosis:");
    entities.clinical.diagnoses.forEach((diagnosis) => {
      sections.push(`- ${diagnosis}`);
    });
  }

  if (entities.clinical.medications?.length) {
    sections.push("\nMedications Prescribed:");
    entities.clinical.medications.forEach((med) => {
      const medParts = [med.name];
      if (med.dosage) medParts.push(med.dosage);
      if (med.frequency) medParts.push(med.frequency);
      if (med.duration) medParts.push(`for ${med.duration}`);
      if (med.route) medParts.push(`(${med.route})`);
      sections.push(`- ${medParts.join(" ")}`);
    });
  }

  if (entities.clinical.treatments?.length) {
    sections.push("\nTreatments Performed:");
    entities.clinical.treatments.forEach((treatment) => {
      sections.push(`- ${treatment}`);
    });
  }

  if (entities.clinical.procedures?.length) {
    sections.push("\nProcedures:");
    entities.clinical.procedures.forEach((procedure) => {
      sections.push(`- ${procedure}`);
    });
  }

  if (entities.clinical.labResults?.length) {
    sections.push("\nLaboratory Results:");
    entities.clinical.labResults.forEach((result) => {
      sections.push(`- ${result}`);
    });
  }

  if (entities.clinical.imagingResults?.length) {
    sections.push("\nImaging Results:");
    entities.clinical.imagingResults.forEach((result) => {
      sections.push(`- ${result}`);
    });
  }

  if (entities.clinical.followUpInstructions) {
    sections.push(
      `\nFollow-up Instructions: ${entities.clinical.followUpInstructions}`,
    );
  }

  if (entities.clinical.followUpDate) {
    sections.push(`Follow-up Date: ${entities.clinical.followUpDate}`);
  }

  if (entities.clinical.prognosis) {
    sections.push(`\nPrognosis: ${entities.clinical.prognosis}`);
  }

  if (entities.clinical.clinicalNotes) {
    sections.push(`\nAdditional Notes: ${entities.clinical.clinicalNotes}`);
  }

  return sections.join("\n");
}

function createUserPrompt(
  soapContent: string | null,
  entityExtraction: NormalizedEntities | null,
  patientData: PatientData | null,
  template?: string,
): string {
  const sections: string[] = [];

  // Patient context
  if (patientData) {
    sections.push("PATIENT INFORMATION:");
    if (patientData.name) sections.push(`Name: ${patientData.name}`);
    if (patientData.species) sections.push(`Species: ${patientData.species}`);
    if (patientData.breed) sections.push(`Breed: ${patientData.breed}`);
    if (patientData.age) sections.push(`Age: ${patientData.age}`);
    if (patientData.owner_name) {
      sections.push(`Owner: ${patientData.owner_name}`);
    }
    sections.push("");
  }

  // Clinical content - prioritize SOAP note, fall back to entity extraction
  if (soapContent) {
    sections.push("<soap-note>");
    sections.push(soapContent);
    sections.push("</soap-note>");
  } else if (entityExtraction) {
    sections.push("<clinical-data>");
    sections.push(formatEntityExtractionForPrompt(entityExtraction));
    sections.push("</clinical-data>");
  }

  // Template instructions
  if (template) {
    sections.push("");
    sections.push("<template-instructions>");
    sections.push(template);
    sections.push("</template-instructions>");
  }

  sections.push("");
  sections.push(
    "Generate the discharge instructions following the template. Output ONLY the discharge instructions themselves - do not include any preamble, introduction, or explanatory text about what you are doing. Start directly with the first section heading or instruction. Ensure all information comes from the clinical data provided. Use clear, client-friendly language organized with headings and bullet points. Do not use markdown formatting - use plain text with clear section headers and simple bullet points (using hyphens or asterisks).",
  );

  return sections.join("\n");
}

/* ========================================
   Main Generation Function
   ======================================== */

export interface GenerateDischargeSummaryInput {
  soapContent?: string | null;
  entityExtraction?: NormalizedEntities | null;
  patientData?: PatientData | null;
  template?: string;
}

export async function generateDischargeSummary(
  input: GenerateDischargeSummaryInput,
): Promise<string> {
  const { soapContent, entityExtraction, patientData, template } = input;

  // Validate we have at least one data source
  if (!soapContent && !entityExtraction) {
    throw new Error(
      "Must provide either soapContent or entityExtraction to generate discharge summary",
    );
  }

  try {
    const llm = getDischargeSummaryLLM();

    console.log("[DISCHARGE_AI] Generating discharge summary", {
      hasSoapContent: !!soapContent,
      hasEntityExtraction: !!entityExtraction,
      hasTemplate: !!template,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: createUserPrompt(
          soapContent ?? null,
          entityExtraction ?? null,
          patientData ?? null,
          template,
        ),
      },
    ];

    const response = await llm.chat({ messages });

    // Extract text content from LlamaIndex response (handles both string and array formats)
    const summaryText = extractTextFromResponse(response);

    console.log("[DISCHARGE_AI] Successfully generated discharge summary", {
      contentLength: summaryText.length,
    });

    return summaryText.trim();
  } catch (error) {
    // Extract API error status if present
    const statusCode = extractApiErrorStatus(error);
    if (statusCode !== null) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown LlamaIndex API error";
      console.error("[DISCHARGE_AI] LlamaIndex API error:", {
        status: statusCode,
        message: errorMessage,
      });
      throw new Error(`LlamaIndex API error (${statusCode}): ${errorMessage}`);
    }

    console.error("[DISCHARGE_AI] Unexpected error:", error);
    throw error;
  }
}

/* ========================================
   Retry Logic
   ======================================== */

export async function generateDischargeSummaryWithRetry(
  input: GenerateDischargeSummaryInput,
  maxRetries = 3,
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateDischargeSummary(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
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
          `[DISCHARGE_AI] Generation failed (attempt ${
            attempt + 1
          }/${maxRetries}), retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw (
    lastError ?? new Error("Discharge summary generation failed after retries")
  );
}
