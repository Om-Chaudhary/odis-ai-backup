/**
 * VAPI Backfill Outcome Endpoint
 *
 * POST /api/webhooks/vapi/backfill-outcome
 *
 * Fetches call data from VAPI API and backfills missing outcome/structured data
 * for inbound calls that received incomplete end-of-call-report webhooks.
 *
 * Called via QStash when a status-update webhook detects missing outcomes.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("vapi-backfill-outcome");

const BackfillSchema = z.object({
  callId: z.string(),
  dbId: z.string(),
  isInbound: z.boolean().optional().default(true),
});

type BackfillInput = z.infer<typeof BackfillSchema>;

/**
 * Extract structured outputs from call data (same logic as webhook handler)
 */
function parseStructuredOutputs(
  structuredOutputs: Record<string, unknown> | undefined,
): {
  callOutcome: Record<string, unknown> | null;
  petHealth: Record<string, unknown> | null;
  medicationCompliance: Record<string, unknown> | null;
  ownerSentiment: Record<string, unknown> | null;
  escalation: Record<string, unknown> | null;
  followUp: Record<string, unknown> | null;
} {
  if (!structuredOutputs) {
    return {
      callOutcome: null,
      petHealth: null,
      medicationCompliance: null,
      ownerSentiment: null,
      escalation: null,
      followUp: null,
    };
  }

  // Extract by schema name from structured outputs array
  const extractByName = (name: string): Record<string, unknown> | null => {
    const outputs = Array.isArray(structuredOutputs)
      ? structuredOutputs
      : Object.values(structuredOutputs);

    for (const output of outputs) {
      if (typeof output === "object" && output && "schema" in output) {
        const schema = output.schema as { name?: string };
        if (schema.name === name && "data" in output) {
          return output.data as Record<string, unknown>;
        }
      }
    }
    return null;
  };

  return {
    callOutcome: extractByName("call_outcome"),
    petHealth: extractByName("pet_health_status"),
    medicationCompliance: extractByName("medication_compliance"),
    ownerSentiment: extractByName("owner_sentiment"),
    escalation: extractByName("escalation_tracking"),
    followUp: extractByName("follow_up_status"),
  };
}

/**
 * Handle POST request - backfill outcome for incomplete calls
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = BackfillSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Validation failed", {
        errors: validation.error.format(),
      });
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const input: BackfillInput = validation.data;
    const supabase = await createServiceClient();

    logger.info("Starting outcome backfill", {
      callId: input.callId,
      dbId: input.dbId,
    });

    // Fetch from VAPI API (dynamic import due to module boundary)
    const { getVapiClient } = await import("@odis-ai/integrations/vapi");
    const vapiClient = getVapiClient();

    const vapiCall = await vapiClient.calls.get(input.callId);

    if (!vapiCall) {
      logger.warn("Call not found in VAPI API", { callId: input.callId });
      return NextResponse.json(
        { success: false, error: "Call not found in VAPI" },
        { status: 404 },
      );
    }

    // Extract structured outputs from VAPI response
    const artifact = (
      vapiCall as unknown as { artifact?: { structuredOutputs?: unknown } }
    ).artifact;
    const structuredOutputs = parseStructuredOutputs(
      artifact?.structuredOutputs as Record<string, unknown> | undefined,
    );

    // Prepare update data
    const updateData: Record<string, unknown> = {
      outcome:
        (structuredOutputs.callOutcome as { call_outcome?: string } | null)
          ?.call_outcome ?? null,
      call_outcome_data: structuredOutputs.callOutcome,
      pet_health_data: structuredOutputs.petHealth,
      medication_compliance_data: structuredOutputs.medicationCompliance,
      owner_sentiment_data: structuredOutputs.ownerSentiment,
      escalation_data: structuredOutputs.escalation,
      follow_up_data: structuredOutputs.followUp,
    };

    // Update database
    const { error: updateError } = await supabase
      .from("inbound_vapi_calls")
      .update(updateData)
      .eq("id", input.dbId);

    if (updateError) {
      logger.error("Failed to update call with backfilled data", {
        callId: input.callId,
        dbId: input.dbId,
        error: updateError.message,
      });
      return NextResponse.json(
        { success: false, error: "Failed to update database" },
        { status: 500 },
      );
    }

    logger.info("Outcome backfilled successfully", {
      callId: input.callId,
      dbId: input.dbId,
      hasOutcome: !!structuredOutputs.callOutcome,
      outcome: updateData.outcome,
    });

    return NextResponse.json({
      success: true,
      callId: input.callId,
      dbId: input.dbId,
      outcome: updateData.outcome,
    });
  } catch (error) {
    logger.error("Unexpected error in backfill-outcome", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
