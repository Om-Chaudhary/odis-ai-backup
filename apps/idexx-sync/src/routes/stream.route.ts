/**
 * SSE Streaming Route
 *
 * Provides real-time updates for schedule sync operations via Server-Sent Events
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { scheduleLogger as logger } from "../lib/logger";
import type { ScheduleSyncService } from "../services/schedule-sync.service";

/**
 * Check database for sync status when not found in active syncs
 */
async function getSyncStatusFromDb(syncId: string): Promise<{
  found: boolean;
  status?: string;
  result?: Record<string, unknown>;
}> {
  try {
    const { createServiceClient } = await import("@odis-ai/data-access/db");
    const supabase = await createServiceClient();

    const { data: sync } = await supabase
      .from("schedule_syncs")
      .select("id, status, stats, duration_ms, error_message, completed_at")
      .eq("id", syncId)
      .maybeSingle();

    if (!sync) {
      return { found: false };
    }

    return {
      found: true,
      status: sync.status,
      result: {
        syncId: sync.id,
        success: sync.status === "completed",
        stats: sync.stats,
        durationMs: sync.duration_ms,
        errors: sync.error_message ? [sync.error_message] : undefined,
        completedAt: sync.completed_at,
      },
    };
  } catch (error) {
    logger.error("Failed to check sync status from database", {
      syncId,
      error,
    });
    return { found: false };
  }
}

// Global registry to track active sync services by syncId
const activeSyncs = new Map<string, ScheduleSyncService>();

/**
 * Register a sync service for streaming
 */
export function registerSyncForStreaming(
  syncId: string,
  service: ScheduleSyncService,
): void {
  activeSyncs.set(syncId, service);

  // Clean up after sync completes
  service.once("completed", () => {
    setTimeout(() => {
      activeSyncs.delete(syncId);
    }, 5000); // Keep for 5s after completion for final messages
  });
}

/**
 * Create SSE streaming router
 */
export function createStreamRouter(): Router {
  const router = Router();

  /**
   * GET /stream/:syncId
   * Stream real-time sync progress events
   */
  router.get("/stream/:syncId", (req: Request, res: Response) => {
    void (async () => {
      const { syncId } = req.params;

      if (!syncId) {
        res.status(400).json({ error: "syncId parameter is required" });
        return;
      }

      logger.info(`SSE stream started for sync ${syncId}`);

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

      // Send initial connection message
      res.write(`data: ${JSON.stringify({ type: "connected", syncId })}\n\n`);

      // Get the sync service
      const syncService = activeSyncs.get(syncId);

      if (!syncService) {
        logger.warn(`No active sync found for ${syncId}, checking database...`);

        // Check database to see if sync completed before we connected
        const dbStatus = await getSyncStatusFromDb(syncId);

        if (dbStatus.found && dbStatus.status === "completed") {
          // Sync already completed successfully - send completed event
          logger.info(
            `Sync ${syncId} already completed, sending result from database`,
          );
          res.write(
            `data: ${JSON.stringify({ type: "completed", ...dbStatus.result })}\n\n`,
          );
          res.end();
          return;
        }

        if (dbStatus.found && dbStatus.status === "failed") {
          // Sync failed - send error with details
          logger.warn(`Sync ${syncId} failed, sending error from database`);
          const errors = dbStatus.result?.errors as string[] | undefined;
          res.write(
            `data: ${JSON.stringify({ type: "error", message: errors?.[0] ?? "Sync failed" })}\n\n`,
          );
          res.end();
          return;
        }

        if (dbStatus.found && dbStatus.status === "in_progress") {
          // Sync is in progress but not in activeSyncs - this is a transient state
          // Wait briefly and retry
          logger.info(
            `Sync ${syncId} is in_progress in DB but not in memory, waiting...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const retryService = activeSyncs.get(syncId);
          if (!retryService) {
            // Still not available, check DB again
            const retryStatus = await getSyncStatusFromDb(syncId);
            if (retryStatus.found && retryStatus.status === "completed") {
              res.write(
                `data: ${JSON.stringify({ type: "completed", ...retryStatus.result })}\n\n`,
              );
              res.end();
              return;
            }

            // Give up and report as completed check
            res.write(
              `data: ${JSON.stringify({ type: "error", message: "Sync completed before stream connected. Check dashboard for results." })}\n\n`,
            );
            res.end();
            return;
          }
          // Fall through to use retryService
        } else {
          // Sync not found at all
          res.write(
            `data: ${JSON.stringify({ type: "error", message: "Sync not found" })}\n\n`,
          );
          res.end();
          return;
        }
      }

      // Use the sync service (original or from retry)
      const service = activeSyncs.get(syncId) ?? syncService;
      if (!service) {
        res.write(
          `data: ${JSON.stringify({ type: "error", message: "Sync service unavailable" })}\n\n`,
        );
        res.end();
        return;
      }

      // Event listeners
      const onPhase = (data: Record<string, unknown>) => {
        logger.debug(`Phase event for ${syncId}: ${String(data.phase)}`);
        res.write(`data: ${JSON.stringify({ type: "phase", ...data })}\n\n`);
      };

      const onProgress = (data: Record<string, unknown>) => {
        logger.debug(
          `Progress event for ${syncId}: ${String(data.percentage)}%`,
        );
        res.write(`data: ${JSON.stringify({ type: "progress", ...data })}\n\n`);
      };

      const onDateCompleted = (data: Record<string, unknown>) => {
        logger.debug(`Date completed for ${syncId}: ${String(data.date)}`);
        res.write(
          `data: ${JSON.stringify({ type: "date_completed", ...data })}\n\n`,
        );
      };

      const onCompleted = (data: Record<string, unknown>) => {
        logger.info(`Sync ${syncId} completed, closing SSE stream`);
        res.write(
          `data: ${JSON.stringify({ type: "completed", ...data })}\n\n`,
        );

        // Close the connection after a brief delay
        setTimeout(() => {
          res.end();
        }, 1000);
      };

      // Attach listeners
      service.on("phase", onPhase);
      service.on("progress", onProgress);
      service.on("date_completed", onDateCompleted);
      service.on("completed", onCompleted);

      // Handle client disconnect
      req.on("close", () => {
        logger.info(`SSE stream closed for sync ${syncId}`);

        // Remove listeners
        service.off("phase", onPhase);
        service.off("progress", onProgress);
        service.off("date_completed", onDateCompleted);
        service.off("completed", onCompleted);
      });

      // Keep alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        res.write(`: keepalive\n\n`);
      }, 30000);

      req.on("close", () => {
        clearInterval(keepAliveInterval);
      });
    })();
  });

  return router;
}
