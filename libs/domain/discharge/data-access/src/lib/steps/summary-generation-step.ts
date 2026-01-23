/**
 * Summary Generation Step
 *
 * Generates discharge summaries using AI from case data.
 */

import type { NormalizedEntities } from "@odis-ai/shared/validators";
import type {
  ExtractEntitiesResult,
  StepResult,
} from "@odis-ai/shared/types/orchestration";
import type { Database, Json } from "@odis-ai/shared/types";

import type { StepContext } from "./types";
import {
  normalizePatient,
  getCaseIdFromResults,
} from "../discharge-helpers";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

interface SoapNote {
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  client_instructions?: string | null;
}

/**
 * Extract SOAP content from SOAP notes
 */
function extractSoapContent(soapNotes: SoapNote[] | null): string | null {
  if (!soapNotes || soapNotes.length === 0) return null;

  const latestSoapNote = soapNotes[0];
  if (!latestSoapNote) return null;

  if (latestSoapNote.client_instructions) {
    return latestSoapNote.client_instructions;
  }

  const sections: string[] = [];
  if (latestSoapNote.subjective) {
    sections.push(`Subjective:\n${latestSoapNote.subjective}`);
  }
  if (latestSoapNote.objective) {
    sections.push(`Objective:\n${latestSoapNote.objective}`);
  }
  if (latestSoapNote.assessment) {
    sections.push(`Assessment:\n${latestSoapNote.assessment}`);
  }
  if (latestSoapNote.plan) {
    sections.push(`Plan:\n${latestSoapNote.plan}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : null;
}

/**
 * Execute summary generation step
 */
export async function executeSummaryGeneration(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const stepConfig = ctx.plan.getStepConfig("generateSummary");
  if (!stepConfig?.enabled) {
    return { step: "generateSummary", status: "skipped", duration: 0 };
  }

  const caseId = getCaseIdFromResults(ctx.results, ctx.request.input);
  if (!caseId) {
    throw new Error("Case ID required for summary generation");
  }

  const caseInfo = await ctx.casesService.getCaseWithEntities(
    ctx.supabase,
    caseId,
  );
  if (!caseInfo) {
    throw new Error("Case not found");
  }

  const patient = normalizePatient(caseInfo.patient as PatientRow | null);

  // Get entities from extractEntities step or case
  const extractEntitiesResult = ctx.results.get("extractEntities");
  let freshEntities: NormalizedEntities | null = null;
  if (
    extractEntitiesResult?.status === "completed" &&
    extractEntitiesResult.data
  ) {
    const data = extractEntitiesResult.data as ExtractEntitiesResult;
    freshEntities = data.entities;
  }

  const soapContent = extractSoapContent(caseInfo.soapNotes as SoapNote[] | null);
  const entitiesToUse = freshEntities ?? caseInfo.entities ?? null;

  const { generateStructuredDischargeSummaryWithRetry } = await import(
    "@odis-ai/integrations/ai/generate-structured-discharge"
  );
  const { structured: structuredContent, plainText: summaryContent } =
    await generateStructuredDischargeSummaryWithRetry({
      soapContent,
      entityExtraction: entitiesToUse,
      patientData: {
        name: patient?.name ?? undefined,
        species: patient?.species ?? undefined,
        breed: patient?.breed ?? undefined,
        owner_name: patient?.owner_name ?? undefined,
      },
    });

  const { data: summary, error } = await ctx.supabase
    .from("discharge_summaries")
    .insert({
      case_id: caseId,
      user_id: ctx.user.id,
      content: summaryContent,
      structured_content: structuredContent as unknown as Json,
    })
    .select("id")
    .single();

  if (error || !summary) {
    throw new Error(`Failed to save summary: ${error?.message}`);
  }

  return {
    step: "generateSummary",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      summaryId: summary.id,
      content: summaryContent,
      structuredContent,
    },
  };
}
