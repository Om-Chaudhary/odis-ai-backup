/**
 * Routes Index
 *
 * Aggregates all routes and exports a single router setup function.
 */

import type { Express } from "express";
import { scrapeRouter } from "./scrape.route";
import { statusRouter } from "./status.route";
import { healthRouter } from "./health.route";
import { scheduleSyncRouter } from "./schedule-sync.route";
import { metricsRouter } from "./metrics.route";
import { createStreamRouter } from "./stream.route";

/**
 * Setup all routes on the Express app
 */
export function setupRoutes(app: Express): void {
  // API routes under /api/idexx
  app.use("/api/idexx", scrapeRouter);
  app.use("/api/idexx", statusRouter);
  app.use("/api/idexx", scheduleSyncRouter);
  app.use("/api/idexx/schedule-sync", createStreamRouter());

  // Health and metrics routes at root
  app.use("/", healthRouter);
  app.use("/", metricsRouter);
}

// Re-export individual routers for testing
export { scrapeRouter } from "./scrape.route";
export { statusRouter } from "./status.route";
export { healthRouter } from "./health.route";
export { scheduleSyncRouter } from "./schedule-sync.route";
export { metricsRouter } from "./metrics.route";
export { createStreamRouter, registerSyncForStreaming } from "./stream.route";
