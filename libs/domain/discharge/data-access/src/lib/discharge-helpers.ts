/**
 * Discharge Helper Functions
 *
 * Helper utilities for the discharge orchestrator.
 */

import type { Database } from "@odis-ai/shared/types";
import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { StructuredDischargeSummary } from "@odis-ai/shared/validators/discharge-summary";
import type { StepResult, StepName } from "@odis-ai/shared/types/orchestration";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

/**
 * Discharge summary with both plaintext and structured content
 */
export interface DischargeSummaryWithStructured {
  content: string;
  structuredContent: StructuredDischargeSummary | null;
}

/**
 * Normalize patient data from various formats
 */
export function normalizePatient(
  patient: PatientRow | PatientRow[] | null,
): PatientRow | null {
  return Array.isArray(patient) ? (patient[0] ?? null) : (patient ?? null);
}

/**
 * Get discharge summary content for a case
 * Tries to get from step results first, then falls back to database
 */
export async function getDischargeSummary(
  supabase: SupabaseClientType,
  caseId: string,
  results: Map<StepName, StepResult>,
): Promise<string> {
  // Try to get from results first (from generateSummary step)
  const summaryResult = results.get("generateSummary");
  if (summaryResult?.data && typeof summaryResult.data === "object") {
    const data = summaryResult.data as { content?: string };
    if (data.content) {
      return data.content;
    }
  }

  // Fallback to database
  const { data: summaries, error } = await supabase
    .from("discharge_summaries")
    .select("content")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !summaries?.content) {
    throw new Error(
      `Discharge summary not found: ${error?.message ?? "Unknown error"}`,
    );
  }

  return summaries.content;
}

/**
 * Get discharge summary with both plaintext and structured content
 * Tries to get from step results first, then falls back to database
 */
export async function getDischargeSummaryWithStructured(
  supabase: SupabaseClientType,
  caseId: string,
  results: Map<StepName, StepResult>,
): Promise<DischargeSummaryWithStructured> {
  // Try to get from results first (from generateSummary step)
  const summaryResult = results.get("generateSummary");
  if (summaryResult?.data && typeof summaryResult.data === "object") {
    const data = summaryResult.data as {
      content?: string;
      structuredContent?: StructuredDischargeSummary;
    };
    if (data.content) {
      return {
        content: data.content,
        structuredContent: data.structuredContent ?? null,
      };
    }
  }

  // Fallback to database - fetch both content and structured_content
  const { data: summary, error } = await supabase
    .from("discharge_summaries")
    .select("content, structured_content")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !summary?.content) {
    throw new Error(
      `Discharge summary not found: ${error?.message ?? "Unknown error"}`,
    );
  }

  // Parse structured_content from JSON if it exists
  let structuredContent: StructuredDischargeSummary | null = null;
  if (summary.structured_content) {
    try {
      structuredContent =
        summary.structured_content as unknown as StructuredDischargeSummary;
    } catch (e) {
      console.warn(
        "[DischargeHelpers] Failed to parse structured_content, falling back to plaintext",
        { caseId, error: e },
      );
    }
  }

  return {
    content: summary.content,
    structuredContent,
  };
}

/**
 * Get case ID from ingest result or existing case input
 */
export function getCaseIdFromResults(
  results: Map<StepName, StepResult>,
  requestInput: unknown,
): string | null {
  // Try to get from ingest result
  const ingestResult = results.get("ingest");
  if (ingestResult?.data && typeof ingestResult.data === "object") {
    const data = ingestResult.data as { caseId?: string };
    if (data.caseId) return data.caseId;
  }

  // Try to get from existing case input
  if (
    requestInput &&
    typeof requestInput === "object" &&
    "existingCase" in requestInput
  ) {
    const input = requestInput as { existingCase: { caseId: string } };
    return input.existingCase.caseId;
  }

  return null;
}

/**
 * Type-safe helper to extract typed result data
 */
export function getTypedResult<T>(
  results: Map<StepName, StepResult>,
  step: StepName,
): T | undefined {
  const result = results.get(step);
  if (!result?.data) return undefined;
  // Explicitly cast through unknown to satisfy strict type checking
  return result.data as unknown as T;
}
