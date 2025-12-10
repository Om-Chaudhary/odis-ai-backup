/**
 * AI Veterinary Scribe Entity Extraction API
 *
 * POST /api/normalize
 *
 * Extracts structured clinical entities from ANY veterinary clinical text:
 * - Transcripts (from voice recording)
 * - Existing SOAP notes
 * - Visit notes
 * - Discharge summaries
 * - Any clinical narrative
 *
 * This is Step 1 of a two-step process:
 * 1. /api/normalize - Extract entities (THIS ENDPOINT)
 * 2. /api/generate/* - Generate SOAP/discharge/summaries from entities
 *
 * Authentication: Automatic (cookies or Bearer token)
 * Authorization: Any authenticated user
 */

import type { NextRequest } from "next/server";
import { errorResponse, successResponse, withAuth } from "@odis-ai/api/auth";
import { handleCorsPreflightRequest } from "@odis-ai/api/cors";
import {
  NormalizeRequestSchema,
  type NormalizeResponse,
} from "@odis-ai/validators/scribe";

// Dynamic import to avoid bundling @react-email/components during static generation
async function getCasesService() {
  const { CasesService } = await import("@odis-ai/services-cases");
  return CasesService;
}

/* ========================================
   Main API Handler
   ======================================== */

/**
 * POST /api/normalize
 *
 * Extract structured clinical entities from veterinary text
 */
export const POST = withAuth<NormalizeResponse>(
  async (request, { user, supabase }) => {
    const startTime = Date.now();

    try {
      // Step 1: Parse and validate request body
      const body = await request.json();
      const validation = NormalizeRequestSchema.safeParse(body);

      if (!validation.success) {
        return errorResponse(
          "Validation failed",
          400,
          {
            errors: validation.error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          request,
        );
      }

      const { input, inputType } = validation.data;

      // Step 2: Validate input length
      if (input.trim().length < 50) {
        return errorResponse(
          "Input too short for entity extraction (minimum 50 characters)",
          400,
          undefined,
          request,
        );
      }

      console.log(
        `[NORMALIZE] Starting ingestion via CasesService for user ${user.id} (${input.length} chars)`,
      );

      // Step 3: Call CasesService
      const CasesService = await getCasesService();
      const result = await CasesService.ingest(supabase, user.id, {
        mode: "text",
        source: "mobile_app", // Assumption: This endpoint is primarily mobile/web
        text: input,
        options: {
          inputType: inputType,
          // metadata could be passed if service supported it, but for now we focus on entities
        },
      });

      // Step 4: Fetch formatted data for response (Compatibility Mode)
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select(
          `
        *,
        patient:patients(*)
      `,
        )
        .eq("id", result.caseId)
        .single();

      if (caseError || !caseData) {
        throw new Error("Failed to retrieve case after ingestion");
      }

      // Format patient data (Supabase returns array or object depending on relation, but usually object for single)
      // In database.types, it is defined as OneToMany usually, but here we want the specific patient.
      // Actually `cases` doesn't point to `patients` via FK, `patients` points to `cases`.
      // So `patient:patients(*)` works as a reverse lookup.
      // Since a case can technically have multiple patients (though logically one per visit usually),
      // we grab the first one.
      const patientData = Array.isArray(caseData.patient)
        ? caseData.patient[0]
        : caseData.patient;

      if (!patientData) {
        throw new Error("Patient not found for case");
      }

      // Step 5: Build success response
      const processingTime = Date.now() - startTime;

      const response: NormalizeResponse = {
        success: true,
        data: {
          case: {
            id: caseData.id,
            type: caseData.type ?? "checkup",
            status: caseData.status ?? "ongoing",
            metadata: (caseData.metadata as Record<string, unknown>) ?? {},
            created_at: caseData.created_at ?? new Date().toISOString(),
          },
          patient: {
            id: patientData.id,
            name: patientData.name,
            species: patientData.species ?? "unknown",
            owner_name: patientData.owner_name ?? "Unknown",
          },
          entities: result.entities,
        },
        metadata: {
          confidence: result.entities.confidence.overall,
          warnings: result.entities.warnings,
          processingTime,
        },
      };

      console.log(
        `[NORMALIZE] Success! Processed case ${result.caseId} in ${processingTime}ms`,
      );

      return successResponse(response, 200, request);
    } catch (error) {
      console.error("[NORMALIZE] Unexpected error:", error);
      return errorResponse(
        "Internal server error",
        500,
        {
          message: error instanceof Error ? error.message : "Unknown error",
        },
        request,
      );
    }
  },
);

/* ========================================
   GET Handler - Check Entity Extraction Status
   ======================================== */

/**
 * GET /api/normalize?caseId=xxx
 *
 * Check if a case has extracted entities
 */
export const GET = withAuth<{
  caseId: string;
  hasEntities: boolean;
  entities: {
    patientName: string | undefined;
    caseType: NormalizeResponse["data"]["case"]["type"] | undefined;
    confidence: number | undefined;
    extractedAt: string | undefined;
  } | null;
}>(async (request, { supabase }) => {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return errorResponse("Missing caseId parameter", 400, undefined, request);
    }

    // Fetch case with entities
    const CasesService = await getCasesService();
    const result = await CasesService.getCaseWithEntities(supabase, caseId);

    if (!result) {
      return errorResponse(
        "Case not found or access denied",
        404,
        undefined,
        request,
      );
    }

    const hasEntities = !!result.entities;
    const entities = result.entities;

    return successResponse(
      {
        caseId,
        hasEntities,
        entities:
          hasEntities && entities
            ? {
                patientName: entities.patient.name,
                caseType: entities.caseType,
                confidence: entities.confidence.overall,
                extractedAt: entities.extractedAt,
              }
            : null,
      },
      200,
      request,
    );
  } catch (error) {
    console.error("[NORMALIZE] GET error:", error);
    return errorResponse(
      "Failed to check entity extraction status",
      500,
      {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      request,
    );
  }
});

/* ========================================
   Health Check
   ======================================== */

/**
 * OPTIONS /api/normalize
 *
 * CORS preflight / Health check
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
