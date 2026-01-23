/**
 * Entity Extraction Step
 *
 * Extracts patient and owner entities from case data using AI.
 */

import type { NormalizedEntities } from "@odis-ai/shared/validators";
import type {
  ExtractEntitiesResult,
  StepResult,
} from "@odis-ai/shared/types/orchestration";
import type { Database, Json } from "@odis-ai/shared/types";

import type { StepContext } from "./types";
import { getCaseIdFromResults } from "../discharge-helpers";
import { cleanHtmlContent, detectEuthanasia } from "./step-utils";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

interface CaseTranscription {
  id: string;
  transcript: string | null;
  created_at: string;
}

interface CaseMetadata {
  idexx?: {
    consultation_notes?: string;
    appointment_type?: string;
  };
  entities?: {
    caseType?: string;
  };
}

/**
 * Determine text source and extraction type for entity extraction
 */
function determineTextSource(
  transcriptions: CaseTranscription[] | null,
  caseSource: string | null,
  metadata: CaseMetadata | null,
): { text: string | null; source: "transcription" | "idexx_consultation_notes" } {
  const latestTranscription = transcriptions?.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )?.[0];

  if (latestTranscription?.transcript) {
    return {
      text: latestTranscription.transcript,
      source: "transcription",
    };
  }

  if (caseSource === "idexx_neo" || caseSource === "idexx_extension") {
    const consultationNotes = metadata?.idexx?.consultation_notes;
    if (consultationNotes) {
      return {
        text: cleanHtmlContent(consultationNotes),
        source: "idexx_consultation_notes",
      };
    }
  }

  return { text: null, source: "transcription" };
}

/**
 * Execute entity extraction step
 */
export async function executeEntityExtraction(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const stepConfig = ctx.plan.getStepConfig("extractEntities");
  if (!stepConfig?.enabled) {
    return { step: "extractEntities", status: "skipped", duration: 0 };
  }

  const caseId = getCaseIdFromResults(ctx.results, ctx.request.input);
  if (!caseId) {
    throw new Error("Case ID required for entity extraction");
  }

  console.log("[DischargeSteps] Starting entity extraction", { caseId });

  const { data: caseData, error: caseError } = await ctx.supabase
    .from("cases")
    .select(
      `
      id,
      source,
      metadata,
      entity_extraction,
      transcriptions (id, transcript, created_at)
    `,
    )
    .eq("id", caseId)
    .single();

  if (caseError || !caseData) {
    throw new Error(
      `Failed to fetch case: ${caseError?.message ?? "Case not found"}`,
    );
  }

  // Check for pre-extracted entities
  if (caseData.entity_extraction) {
    const preExtractedEntities =
      caseData.entity_extraction as unknown as NormalizedEntities;

    if (
      preExtractedEntities.patient?.name &&
      preExtractedEntities.confidence?.overall
    ) {
      console.log("[DischargeSteps] Using pre-extracted entities from ingest", {
        caseId,
        patientName: preExtractedEntities.patient.name,
        confidence: preExtractedEntities.confidence.overall,
      });

      return {
        step: "extractEntities",
        status: "completed",
        duration: Date.now() - startTime,
        data: {
          caseId,
          entities: preExtractedEntities,
          source: "existing",
        } as ExtractEntitiesResult,
      };
    }
  }

  // Determine text source
  const transcriptions = caseData.transcriptions as CaseTranscription[] | null;
  const metadata = caseData.metadata as CaseMetadata | null;
  const { text: textToExtract, source: extractionSource } = determineTextSource(
    transcriptions,
    caseData.source,
    metadata,
  );

  // Check for euthanasia
  if (detectEuthanasia(textToExtract, metadata)) {
    console.warn("[DischargeSteps] Euthanasia case detected - blocking", {
      caseId,
    });
    throw new Error(
      "Euthanasia case detected. Discharge workflow is not applicable.",
    );
  }

  if (!textToExtract || textToExtract.length < 50) {
    return {
      step: "extractEntities",
      status: "completed",
      duration: Date.now() - startTime,
      data: {
        caseId,
        entities: null,
        source: extractionSource,
        skipped: true,
        reason: "Minimal text - using database patient data",
      } as ExtractEntitiesResult,
    };
  }

  const { extractEntitiesWithRetry } = await import(
    "@odis-ai/integrations/ai/normalize-scribe"
  );
  const entities = await extractEntitiesWithRetry(
    textToExtract,
    extractionSource,
  );

  // Enrich with patient data
  const { data: patientData } = await ctx.supabase
    .from("cases")
    .select(`patients (*)`)
    .eq("id", caseId)
    .single();

  if (patientData?.patients) {
    const patient = Array.isArray(patientData.patients)
      ? patientData.patients[0]
      : patientData.patients;

    if (patient) {
      ctx.casesService.enrichEntitiesWithPatient(
        entities,
        patient as PatientRow,
      );
    }
  }

  // Save entities
  const { error: updateError } = await ctx.supabase
    .from("cases")
    .update({ entity_extraction: entities as unknown as Json })
    .eq("id", caseId);

  if (updateError) {
    throw new Error(
      `Failed to save extracted entities: ${updateError.message}`,
    );
  }

  return {
    step: "extractEntities",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      caseId,
      entities,
      source: extractionSource,
    } as ExtractEntitiesResult,
  };
}
