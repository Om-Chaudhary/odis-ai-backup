/**
 * Sync Route Handler
 *
 * POST /api/idexx/sync - Main sync endpoint triggered by QStash
 *
 * Query Parameters:
 * - type: 'pre-open' | 'eod' (required)
 *
 * Pre-Open Sync (6:00 AM): Fetches today's schedule
 * EOD Sync (6:30 PM): Pulls consultation data before discharge batch
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { verifyQStashSignature } from "../middleware/qstash-verify";
import { SyncEngine } from "../services/sync-engine";

export const syncRouter: ReturnType<typeof Router> = Router();

type SyncType = "pre-open" | "eod";

interface SyncResponse {
  success: boolean;
  sync_session_id?: string;
  sync_type: SyncType;
  records_synced: number;
  errors: string[];
  duration_ms: number;
  timestamp: string;
}

/**
 * POST /api/idexx/sync
 *
 * Main sync endpoint called by QStash cron schedules.
 * Verifies QStash signature before processing.
 */
syncRouter.post(
  "/sync",
  verifyQStashSignature,
  (req: Request, res: Response) => {
    void handleSync(req, res);
  },
);

async function handleSync(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const syncType = req.query.type as SyncType;

  // Validate sync type
  if (!syncType || !["pre-open", "eod"].includes(syncType)) {
    res.status(400).json({
      success: false,
      error: "Invalid or missing sync type. Must be 'pre-open' or 'eod'",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  console.log(
    `[SYNC] Starting ${syncType} sync at ${new Date().toISOString()}`,
  );

  try {
    const syncEngine = new SyncEngine();
    const result = await syncEngine.runSync(syncType);

    const response: SyncResponse = {
      success: result.success,
      sync_session_id: result.sessionId,
      sync_type: syncType,
      records_synced: result.recordsSynced,
      errors: result.errors,
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[SYNC] ${syncType} sync completed: ${result.recordsSynced} records synced`,
    );

    res.status(result.success ? 200 : 500).json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error(`[SYNC] ${syncType} sync failed:`, errorMessage);

    const response: SyncResponse = {
      success: false,
      sync_type: syncType,
      records_synced: 0,
      errors: [errorMessage],
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
}

/**
 * POST /api/idexx/sync-failed
 *
 * QStash failure callback endpoint.
 * Called when all retries have been exhausted.
 */
syncRouter.post(
  "/sync-failed",
  verifyQStashSignature,
  (req: Request, res: Response) => {
    const syncType = req.query.type as SyncType;

    console.error(
      `[SYNC-FAILED] ${syncType ?? "unknown"} sync failed after all retries`,
    );

    // TODO: Send alert to PostHog/Slack
    // await sendSyncFailureAlert({ syncType, body: req.body });

    res.status(200).json({
      acknowledged: true,
      message: "Failure notification received",
      sync_type: syncType,
      timestamp: new Date().toISOString(),
    });
  },
);
