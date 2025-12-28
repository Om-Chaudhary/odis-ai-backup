/**
 * Schedule Sync Cron Endpoint
 *
 * POST /api/cron/sync-schedules
 *
 * Triggered by QStash cron to sync IDEXX schedules for all configured clinics.
 * Runs every 15 minutes to keep appointment availability data fresh.
 *
 * Security: QStash signature verification ensures only QStash can trigger this
 *
 * QStash Schedule: "0/15 * * * *" (every 15 minutes)
 * Configure at: https://console.upstash.com/qstash
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { env } from "~/env";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("cron-sync-schedules");

// IDEXX sync service URL (separate service running Playwright)
const IDEXX_SYNC_URL = env.IDEXX_SYNC_SERVICE_URL ?? "http://localhost:3001";

interface SyncResult {
  clinicId: string;
  clinicName: string;
  success: boolean;
  recordsScraped?: number;
  error?: string;
  durationMs?: number;
}

interface CronResponse {
  success: boolean;
  clinicsProcessed: number;
  successCount: number;
  failureCount: number;
  results: SyncResult[];
  durationMs: number;
}

/**
 * Get clinics that have active IDEXX credentials
 */
async function getClinicsToSync() {
  const supabase = await createServiceClient();

  // Get clinics with active IDEXX credentials
  const { data: credentials, error } = await supabase
    .from("idexx_credentials")
    .select(
      `
      clinic_id,
      clinics!inner (
        id,
        name
      )
    `,
    )
    .eq("is_active", true);

  if (error) {
    logger.error("Failed to fetch clinics with IDEXX credentials", { error });
    throw new Error(`Database error: ${error.message}`);
  }

  // Extract unique clinics
  const clinicsMap = new Map<string, { id: string; name: string }>();
  for (const cred of credentials ?? []) {
    const clinic = cred.clinics as unknown as { id: string; name: string };
    if (clinic?.id && !clinicsMap.has(clinic.id)) {
      clinicsMap.set(clinic.id, { id: clinic.id, name: clinic.name });
    }
  }

  return Array.from(clinicsMap.values());
}

/**
 * Trigger sync for a single clinic via idexx-sync service
 */
async function triggerClinicSync(clinicId: string): Promise<{
  success: boolean;
  recordsScraped?: number;
  error?: string;
  durationMs?: number;
}> {
  try {
    const response = await fetch(`${IDEXX_SYNC_URL}/api/idexx/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "schedule",
        clinicId,
      }),
    });

    const result = (await response.json()) as {
      success: boolean;
      recordsScraped?: number;
      errors?: string[];
      durationMs?: number;
    };

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.errors?.[0] ?? `HTTP ${response.status}`,
        durationMs: result.durationMs,
      };
    }

    return {
      success: true,
      recordsScraped: result.recordsScraped,
      durationMs: result.durationMs,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Handle cron trigger
 */
async function handler(_req: NextRequest) {
  const startTime = Date.now();
  const results: SyncResult[] = [];

  try {
    logger.info("Schedule sync cron triggered");

    // Get clinics to sync
    const clinics = await getClinicsToSync();

    if (clinics.length === 0) {
      logger.info("No clinics configured for IDEXX sync");
      return NextResponse.json({
        success: true,
        clinicsProcessed: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
        durationMs: Date.now() - startTime,
      } satisfies CronResponse);
    }

    logger.info(`Processing ${clinics.length} clinics for schedule sync`);

    // Process clinics sequentially to avoid overwhelming the sync service
    // (Playwright can only handle one browser at a time)
    for (const clinic of clinics) {
      logger.info(`Syncing schedule for clinic: ${clinic.name}`, {
        clinicId: clinic.id,
      });

      const syncResult = await triggerClinicSync(clinic.id);

      results.push({
        clinicId: clinic.id,
        clinicName: clinic.name,
        success: syncResult.success,
        recordsScraped: syncResult.recordsScraped,
        error: syncResult.error,
        durationMs: syncResult.durationMs,
      });

      if (syncResult.success) {
        logger.info(`Sync completed for ${clinic.name}`, {
          recordsScraped: syncResult.recordsScraped,
          durationMs: syncResult.durationMs,
        });
      } else {
        logger.warn(`Sync failed for ${clinic.name}`, {
          error: syncResult.error,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    logger.info("Schedule sync cron completed", {
      clinicsProcessed: clinics.length,
      successCount,
      failureCount,
      totalDurationMs: Date.now() - startTime,
    });

    // Return 200 even on partial failures to prevent QStash retries
    return NextResponse.json({
      success: failureCount === 0,
      clinicsProcessed: clinics.length,
      successCount,
      failureCount,
      results,
      durationMs: Date.now() - startTime,
    } satisfies CronResponse);
  } catch (error) {
    logger.error("Unexpected error in schedule sync cron", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        clinicsProcessed: 0,
        successCount: 0,
        failureCount: 0,
        results,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      },
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
    message: "Schedule sync cron endpoint is active",
    schedule: "Every 15 minutes",
    idexxSyncUrl: IDEXX_SYNC_URL,
  });
}
