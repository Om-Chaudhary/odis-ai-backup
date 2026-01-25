/**
 * Auto-Schedule Cron Endpoint
 *
 * POST /api/cron/auto-schedule
 *
 * Triggered by QStash cron to automatically schedule discharge emails and calls
 * for eligible cases. Runs daily at 7 PM Pacific (after business hours).
 *
 * This endpoint:
 * 1. Gets all clinics with auto-scheduling enabled
 * 2. For each clinic, finds eligible cases (completed, with contact info, not extreme cases)
 * 3. Schedules emails (default: 1 day after case creation)
 * 4. Schedules calls (default: 3 days after case creation)
 * 5. Records results for monitoring
 *
 * Security: QStash signature verification ensures only QStash can trigger this
 *
 * QStash Schedule: "0 19 * * *" (7 PM Pacific daily)
 * Configure at: https://console.upstash.com/qstash
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { loggers } from "@odis-ai/shared/logger";
// eslint-disable-next-line @nx/enforce-module-boundaries -- Cron endpoint imports domain library
import {
  runForAllClinics,
} from "@odis-ai/domain/auto-scheduling";

const logger = loggers.api.child("cron-auto-schedule");

interface CronResponse {
  success: boolean;
  runId: string;
  clinicsProcessed: number;
  totalCasesProcessed: number;
  totalEmailsScheduled: number;
  totalCallsScheduled: number;
  totalErrors: number;
  durationMs: number;
  errorMessage?: string;
}

/**
 * Handle cron trigger
 */
async function handler(_req: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info("Auto-schedule cron triggered");

    // Get service client (bypasses RLS for background job)
    const supabase = await createServiceClient();

    // Run auto-scheduling for all enabled clinics
    const result = await runForAllClinics(supabase);

    const durationMs = Date.now() - startTime;

    logger.info("Auto-schedule cron completed", {
      runId: result.id,
      status: result.status,
      totalCasesProcessed: result.totalCasesProcessed,
      totalEmailsScheduled: result.totalEmailsScheduled,
      totalCallsScheduled: result.totalCallsScheduled,
      totalErrors: result.totalErrors,
      durationMs,
    });

    // Return 200 even on partial failures to prevent QStash retries
    return NextResponse.json({
      success: result.status === "completed",
      runId: result.id,
      clinicsProcessed: result.results.length,
      totalCasesProcessed: result.totalCasesProcessed,
      totalEmailsScheduled: result.totalEmailsScheduled,
      totalCallsScheduled: result.totalCallsScheduled,
      totalErrors: result.totalErrors,
      durationMs,
      errorMessage: result.errorMessage ?? undefined,
    } satisfies CronResponse);
  } catch (error) {
    logger.error("Unexpected error in auto-schedule cron", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        runId: "error",
        clinicsProcessed: 0,
        totalCasesProcessed: 0,
        totalEmailsScheduled: 0,
        totalCallsScheduled: 0,
        totalErrors: 1,
        durationMs,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      } satisfies CronResponse,
      { status: 500 },
    );
  }
}

// Wrap handler with QStash signature verification
export const POST = verifySignatureAppRouter(handler);

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Auto-schedule cron endpoint is active",
    schedule: "Daily at 7 PM Pacific (0 19 * * *)",
    timezone: "America/Los_Angeles",
    description:
      "Automatically schedules discharge emails and calls for eligible cases",
  });
}
