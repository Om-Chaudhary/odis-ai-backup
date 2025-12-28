/**
 * Routes Index
 *
 * Aggregates all routes and exports a single router setup function.
 */

import type { Express } from "express";
import { scrapeRouter } from "./scrape.route";
import { statusRouter } from "./status.route";
import { healthRouter } from "./health.route";

/**
 * Setup all routes on the Express app
 */
export function setupRoutes(app: Express): void {
  // API routes under /api/idexx
  app.use("/api/idexx", scrapeRouter);
  app.use("/api/idexx", statusRouter);

  // Health routes at root
  app.use("/", healthRouter);
}

// Re-export individual routers for testing
export { scrapeRouter } from "./scrape.route";
export { statusRouter } from "./status.route";
export { healthRouter } from "./health.route";
