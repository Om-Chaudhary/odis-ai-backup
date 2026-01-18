/**
 * Metrics Route
 *
 * Exposes metrics for monitoring and observability.
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { metrics } from "../lib/metrics";

export const metricsRouter: ReturnType<typeof Router> = Router();

/**
 * GET /metrics
 *
 * Returns metrics in Prometheus-compatible text format.
 */
metricsRouter.get("/metrics", (_req: Request, res: Response) => {
  // Export metrics
  const metricsText = metrics.export();

  res.setHeader("Content-Type", "text/plain");
  res.send(metricsText);
});
