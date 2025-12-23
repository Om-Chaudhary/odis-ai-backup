/**
 * Status Route Handler
 *
 * GET /api/idexx/sync-status - Returns current sync status for monitoring
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { createServiceClient } from "@odis-ai/db";

export const statusRouter: ReturnType<typeof Router> = Router();

interface SyncStatusResponse {
  last_sync: {
    type: string;
    status: string;
    timestamp: string;
    records_synced: number;
    errors?: string[];
  } | null;
  next_scheduled: {
    pre_open: string;
    eod: string;
  };
  system_status: "healthy" | "degraded" | "error";
  uptime_seconds: number;
}

const startTime = Date.now();

/**
 * GET /api/idexx/sync-status
 *
 * Returns the status of the last sync operation and system health.
 */
statusRouter.get("/sync-status", (req: Request, res: Response) => {
  void handleSyncStatus(req, res);
});

async function handleSyncStatus(_req: Request, res: Response): Promise<void> {
  try {
    const supabase = await createServiceClient();

    // Fetch the most recent sync session
    const { data: lastSync, error } = await supabase
      .from("idexx_sync_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    // Calculate next scheduled sync times
    const now = new Date();
    const nextPreOpen = getNextScheduledTime(now, 6, 0); // 6:00 AM
    const nextEod = getNextScheduledTime(now, 18, 30); // 6:30 PM

    // Determine system status
    let systemStatus: "healthy" | "degraded" | "error" = "healthy";
    if (lastSync?.status === "failed") {
      systemStatus = "degraded";
    }

    const response: SyncStatusResponse = {
      last_sync: lastSync
        ? {
            type: lastSync.session_type ?? "unknown",
            status: lastSync.status ?? "unknown",
            timestamp:
              lastSync.completed_at ??
              lastSync.started_at ??
              new Date().toISOString(),
            records_synced:
              (lastSync.appointments_synced ?? 0) +
              (lastSync.consultations_synced ?? 0),
            errors: lastSync.error_message
              ? [lastSync.error_message]
              : undefined,
          }
        : null,
      next_scheduled: {
        pre_open: nextPreOpen.toISOString(),
        eod: nextEod.toISOString(),
      },
      system_status: systemStatus,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    };

    res.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("[STATUS] Error fetching sync status:", errorMessage);

    res.status(500).json({
      success: false,
      error: errorMessage,
      system_status: "error",
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    });
  }
}

/**
 * Calculate the next occurrence of a scheduled time
 */
function getNextScheduledTime(from: Date, hour: number, minute: number): Date {
  const next = new Date(from);
  next.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (next <= from) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}
