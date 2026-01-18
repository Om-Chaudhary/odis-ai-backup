/**
 * Routes Index
 *
 * Aggregates all routes and exports a single router setup function.
 */

import type { Express } from "express";
import { healthRouter } from "./health.route";
import { metricsRouter } from "./metrics.route";
import { syncRouter } from "./sync.route";

/**
 * Setup all routes on the Express app
 */
export function setupRoutes(app: Express): void {
  // PIMS sync routes (API-key authenticated)
  app.use("/api/sync", syncRouter);

  // Health and metrics routes (no auth)
  app.use("/", healthRouter);
  app.use("/", metricsRouter);
}

// Re-export individual routers for testing
export { healthRouter } from "./health.route";
export { metricsRouter } from "./metrics.route";
export { syncRouter } from "./sync.route";
