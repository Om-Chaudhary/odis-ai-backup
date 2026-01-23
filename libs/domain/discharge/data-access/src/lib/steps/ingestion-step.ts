/**
 * Ingestion Step
 *
 * Handles data ingestion for discharge workflows.
 */

import type { StepResult } from "@odis-ai/shared/types/orchestration";
import type {
  IngestPayload,
  IngestSource,
} from "@odis-ai/shared/types/services";

import type { StepContext } from "./types";

/**
 * Execute ingestion step
 */
export async function executeIngestion(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const input = ctx.request.input;

  // Handle existing case - no ingestion needed
  if ("existingCase" in input) {
    return {
      step: "ingest",
      status: "completed",
      duration: Date.now() - startTime,
      data: { caseId: input.existingCase.caseId },
    };
  }

  const stepConfig = ctx.plan.getStepConfig("ingest");
  if (!stepConfig?.enabled) {
    return { step: "ingest", status: "skipped", duration: 0 };
  }

  const payload = buildIngestPayload(input.rawData, stepConfig.options);

  const result = await ctx.casesService.ingest(
    ctx.supabase,
    ctx.user.id,
    payload,
  );

  return {
    step: "ingest",
    status: "completed",
    duration: Date.now() - startTime,
    data: result,
  };
}

/**
 * Build ingestion payload from raw data input
 */
function buildIngestPayload(
  rawData: { mode: "text"; source: IngestSource; text?: string } | { mode: "structured"; source: IngestSource; data?: Record<string, unknown> },
  stepOptions: unknown,
): IngestPayload {
  const options =
    typeof stepOptions === "object" && stepOptions !== null
      ? (stepOptions as { autoSchedule?: boolean; inputType?: string })
      : undefined;

  if (rawData.mode === "text") {
    return {
      mode: "text",
      source: rawData.source,
      text: rawData.text ?? "",
      options,
    };
  }

  return {
    mode: "structured",
    source: rawData.source,
    data: rawData.data ?? {},
    options,
  };
}
