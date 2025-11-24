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
import { withAuth, successResponse, errorResponse } from "~/lib/api/auth";
import { handleCorsPreflightRequest } from "~/lib/api/cors";
import {
  NormalizeRequestSchema,
  type NormalizeResponse,
} from "~/lib/validators/scribe";
import {
  extractEntitiesWithRetry,
  createExtractionSummary,
  analyzeExtractionQuality,
} from "~/lib/ai/normalize-scribe";
import {
  storeNormalizedEntities,
  fetchCaseWithEntities,
} from "~/lib/db/scribe-transactions";

/* ========================================
   Main API Handler
   ======================================== */

/**
 * POST /api/normalize
 *
 * Extract structured clinical entities from veterinary text
 */
export const POST = withAuth<NormalizeResponse>(async (request, { user, supabase }, context) => {
  const startTime = Date.now();

  try {
    // Step 1: Parse and validate request body
    const body = await request.json();
    const validation = NormalizeRequestSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, {
        errors: validation.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      }, request);
    }

    const { input, caseId, inputType, metadata } = validation.data;

    // Step 2: If case ID provided, check if already normalized
    if (caseId) {
      const existingCase = await fetchCaseWithEntities(
        supabase,
        caseId,
        user.id,
      );

      if (!existingCase.success) {
        return errorResponse("Case not found or access denied", 404, {
          details: existingCase.error,
        }, request);
      }

      // Warn if case already has entities (but allow update)
      if (existingCase.entities) {
        console.warn(
          `[NORMALIZE] Case ${caseId} already has entities. Will update.`,
        );
      }
    }

    // Step 3: Validate input length
    if (input.trim().length < 50) {
      return errorResponse(
        "Input too short for entity extraction (minimum 50 characters)",
        400,
        undefined,
        request,
      );
    }

    // Step 4: Extract entities using AI
    console.log(
      `[NORMALIZE] Starting entity extraction for user ${user.id} (${input.length} chars, type: ${inputType || "other"})`,
    );

    let entities;
    try {
      entities = await extractEntitiesWithRetry(input, inputType, 3);
    } catch (aiError) {
      console.error("[NORMALIZE] AI entity extraction failed:", aiError);
      return errorResponse("AI entity extraction failed", 500, {
        message: aiError instanceof Error ? aiError.message : "Unknown AI error",
      }, request);
    }

    // Log extraction summary
    const summary = createExtractionSummary(entities);
    console.log(`[NORMALIZE] AI extraction: ${summary}`);

    // Analyze quality
    const quality = analyzeExtractionQuality(entities);
    if (!quality.isHighConfidence) {
      console.warn(
        `[NORMALIZE] Low confidence extraction: ${quality.missingCriticalFields.join(", ")}`,
      );
    }

    // Step 5: Store entities in case.metadata
    const dbResult = await storeNormalizedEntities(
      supabase,
      user.id,
      entities,
      caseId, // Will update if provided, create if not
      {
        ...metadata,
        input_length: input.length,
        input_type: inputType,
      },
    );

    if (!dbResult.success) {
      console.error("[NORMALIZE] Database storage failed:", dbResult.error);
      return errorResponse("Failed to store extracted entities", 500, {
        error: dbResult.error,
        details: dbResult.details,
      }, request);
    }

    // Step 6: Build success response
    const processingTime = Date.now() - startTime;

    const response: NormalizeResponse = {
      success: true,
      data: {
        case: {
          ...dbResult.case,
          type: dbResult.case.type as NormalizeResponse["data"]["case"]["type"],
        },
        patient: dbResult.patient,
        entities: dbResult.entities,
      },
      metadata: {
        confidence: entities.confidence.overall,
        warnings: entities.warnings,
        processingTime,
      },
    };

    console.log(
      `[NORMALIZE] Success! ${caseId ? "Updated" : "Created"} case ${dbResult.case.id} in ${processingTime}ms`,
    );

    return successResponse(response, caseId ? 200 : 201, request);
  } catch (error) {
    console.error("[NORMALIZE] Unexpected error:", error);
    return errorResponse("Internal server error", 500, {
      message: error instanceof Error ? error.message : "Unknown error",
    }, request);
  }
});

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
}>(async (request, { user, supabase }, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return errorResponse("Missing caseId parameter", 400, undefined, request);
    }

    // Fetch case with entities
    const result = await fetchCaseWithEntities(supabase, caseId, user.id);

    if (!result.success) {
      return errorResponse("Case not found or access denied", 404, {
        details: result.error,
      }, request);
    }

    const hasEntities = !!result.entities;

    return successResponse({
      caseId,
      hasEntities,
      entities: hasEntities
        ? {
            patientName: result.entities?.patient.name,
            caseType: result.entities?.caseType,
            confidence: result.entities?.confidence.overall,
            extractedAt: result.entities?.extractedAt,
          }
        : null,
    }, 200, request);
  } catch (error) {
    console.error("[NORMALIZE] GET error:", error);
    return errorResponse("Failed to check entity extraction status", 500, {
      message: error instanceof Error ? error.message : "Unknown error",
    }, request);
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
