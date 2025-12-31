/**
 * SSE Streaming Route
 *
 * Provides real-time updates for schedule sync operations via Server-Sent Events
 */

import type { Request, Response } from "express";
import { Router } from "express";
import { scheduleLogger as logger } from "../lib/logger";
import type { ScheduleSyncService } from "../services/schedule-sync.service";

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
      logger.warn(`No active sync found for ${syncId}`);
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "Sync not found or already completed" })}\n\n`,
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
      logger.debug(`Progress event for ${syncId}: ${String(data.percentage)}%`);
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
      res.write(`data: ${JSON.stringify({ type: "completed", ...data })}\n\n`);

      // Close the connection after a brief delay
      setTimeout(() => {
        res.end();
      }, 1000);
    };

    // Attach listeners
    syncService.on("phase", onPhase);
    syncService.on("progress", onProgress);
    syncService.on("date_completed", onDateCompleted);
    syncService.on("completed", onCompleted);

    // Handle client disconnect
    req.on("close", () => {
      logger.info(`SSE stream closed for sync ${syncId}`);

      // Remove listeners
      syncService.off("phase", onPhase);
      syncService.off("progress", onProgress);
      syncService.off("date_completed", onDateCompleted);
      syncService.off("completed", onCompleted);
    });

    // Keep alive ping every 30 seconds
    const keepAliveInterval = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 30000);

    req.on("close", () => {
      clearInterval(keepAliveInterval);
    });
  });

  return router;
}
