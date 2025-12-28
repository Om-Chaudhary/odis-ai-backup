/**
 * Metrics Route
 *
 * Exposes metrics for monitoring and observability.
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { metrics } from "../lib/metrics";
import { syncQueue } from "../services/sync-queue.service";
import { browserPool } from "../services/browser-pool.service";

export const metricsRouter: ReturnType<typeof Router> = Router();

/**
 * GET /metrics
 *
 * Returns metrics in Prometheus-compatible text format.
 */
metricsRouter.get("/metrics", (_req: Request, res: Response) => {
  // Update gauge metrics before export
  const queueStats = syncQueue.getQueueStats();
  metrics.setGauge("sync_queue_active", queueStats.totalActive);
  metrics.setGauge("sync_queue_queued", queueStats.totalQueued);

  const browserStats = browserPool.getStats();
  metrics.setGauge("browser_pool_total", browserStats.total);
  metrics.setGauge("browser_pool_in_use", browserStats.inUse);
  metrics.setGauge("browser_pool_available", browserStats.available);

  // Export metrics
  const metricsText = metrics.export();

  res.setHeader("Content-Type", "text/plain");
  res.send(metricsText);
});
