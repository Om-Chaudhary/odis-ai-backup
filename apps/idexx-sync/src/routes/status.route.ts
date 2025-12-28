/**
 * Status Route
 *
 * GET /api/idexx/status - Returns scrape status for monitoring
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { logger } from "../lib/logger";
import { PersistenceService } from "../services";
import type { StatusResponse } from "../types";

export const statusRouter: ReturnType<typeof Router> = Router();

const startTime = Date.now();

/**
 * GET /api/idexx/status
 *
 * Returns the status of the last scrape operation and system health.
 */
statusRouter.get("/status", (req: Request, res: Response) => {
  void handleStatus(req, res);
});

// Keep old endpoint for backwards compatibility
statusRouter.get("/sync-status", (req: Request, res: Response) => {
  void handleStatus(req, res);
});

async function handleStatus(_req: Request, res: Response): Promise<void> {
  try {
    const persistence = new PersistenceService();
    const lastSession = await persistence.getLastSession();

    // Determine system status
    let systemStatus: StatusResponse["system_status"] = "healthy";
    if (lastSession?.status === "failed") {
      systemStatus = "degraded";
    }

    const response: StatusResponse = {
      last_scrape: lastSession
        ? {
            type: lastSession.session_type ?? "unknown",
            status: lastSession.status ?? "unknown",
            timestamp:
              lastSession.completed_at ??
              lastSession.started_at ??
              new Date().toISOString(),
            records_scraped:
              (lastSession.appointments_synced ?? 0) +
              (lastSession.consultations_synced ?? 0),
            errors: lastSession.error_message
              ? [lastSession.error_message]
              : undefined,
          }
        : null,
      system_status: systemStatus,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    };

    res.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error(`Error fetching status: ${errorMessage}`);

    res.status(500).json({
      success: false,
      error: errorMessage,
      system_status: "error",
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    });
  }
}
