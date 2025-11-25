/**
 * Discharge Orchestration API Route
 *
 * POST /api/discharge/orchestrate
 *
 * Orchestrates the execution of discharge workflow steps including:
 * - Data ingestion
 * - Summary generation
 * - Email preparation and scheduling
 * - Call scheduling
 *
 * Supports both raw data input and existing case continuation.
 *
 * Request body:
 * {
 *   input: {
 *     rawData?: { mode, source, text/data }
 *     existingCase?: { caseId, summaryId?, emailContent? }
 *   },
 *   steps: {
 *     ingest?: boolean | { options: {...} }
 *     generateSummary?: boolean | { templateId?, useLatestEntities? }
 *     prepareEmail?: boolean | { templateId? }
 *     scheduleEmail?: boolean | { recipientEmail, scheduledFor? }
 *     scheduleCall?: boolean | { phoneNumber, scheduledFor? }
 *   },
 *   options?: {
 *     stopOnError?: boolean
 *     parallel?: boolean
 *     dryRun?: boolean
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     completedSteps: string[]
 *     skippedSteps: string[]
 *     failedSteps: string[]
 *     ingestion?: { caseId: string }
 *     summary?: { summaryId: string, content: string }
 *     email?: { subject: string, html: string, text: string }
 *     ...
 *   },
 *   metadata: {
 *     totalProcessingTime: number
 *     stepTimings: Record<string, number>
 *   }
 * }
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticateUser } from "~/lib/api/auth";
import { handleCorsPreflightRequest, withCorsHeaders } from "~/lib/api/cors";
import { DischargeOrchestrator } from "~/lib/services/discharge-orchestrator";
import { OrchestrationRequestSchema } from "~/lib/validators/orchestration";

/**
 * POST /api/discharge/orchestrate
 *
 * Execute discharge workflow orchestration
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (supports both Bearer token and cookies)
    const auth = await authenticateUser(request);
    if (!auth.success) {
      return withCorsHeaders(request, auth.response);
    }

    const { user, supabase } = auth.data;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Invalid JSON",
            message: "Request body must be valid JSON",
          },
          { status: 400 },
        ),
      );
    }

    // Validate request schema
    const validationResult = OrchestrationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Validation failed",
            message: "Invalid request format",
            details: validationResult.error.errors,
          },
          { status: 400 },
        ),
      );
    }

    const orchestrationRequest = validationResult.data;

    console.log("[ORCHESTRATE] Starting orchestration", {
      userId: user.id,
      steps: Object.keys(orchestrationRequest.steps),
      inputType:
        "rawData" in orchestrationRequest.input ? "rawData" : "existingCase",
    });

    // Create orchestrator and execute workflow
    const orchestrator = new DischargeOrchestrator(supabase, user);
    const result = await orchestrator.orchestrate(orchestrationRequest);

    // Return result with CORS headers
    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          success: result.success,
          data: result.data,
          metadata: result.metadata,
        },
        { status: result.success ? 200 : 500 },
      ),
    );
  } catch (error) {
    console.error("[ORCHESTRATE] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          error: "Internal server error",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        },
        { status: 500 },
      ),
    );
  }
}

/**
 * GET /api/discharge/orchestrate
 *
 * Health check endpoint
 */
export function GET(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json(
      {
        status: "ok",
        service: "discharge-orchestration",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    ),
  );
}

/**
 * OPTIONS /api/discharge/orchestrate
 *
 * Handle CORS preflight requests
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
