/**
 * IDEXX Scrape Service
 *
 * A standalone Node.js application for on-demand IDEXX Neo data scraping.
 * Deployed on Railway via Docker.
 *
 * Endpoints:
 * - POST /api/idexx/scrape - On-demand scraping endpoint
 * - GET /api/idexx/status - Status check for monitoring
 * - GET /health - Railway health check
 * - GET /ready - Readiness probe
 */

import express from "express";
import { config, SERVICE_INFO } from "./config";
import { logger } from "./lib/logger";
import { setupRoutes } from "./routes";

const app = express();

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.debug(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
    );
  });
  next();
});

// Setup all routes
setupRoutes(app);

// Root endpoint - service info
app.get("/", (req, res) => {
  res.json({
    service: SERVICE_INFO.NAME,
    version: SERVICE_INFO.VERSION,
    description: SERVICE_INFO.DESCRIPTION,
    endpoints: {
      scrape: {
        method: "POST",
        path: "/api/idexx/scrape",
        body: {
          type: "schedule | consultation",
          clinicId: "uuid (required)",
          date: "YYYY-MM-DD (optional, defaults to today)",
        },
      },
      status: "GET /api/idexx/status",
      health: "GET /health",
      ready: "GET /ready",
    },
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
    res.status(500).json({
      success: false,
      error: err.message ?? "Unknown error",
      timestamp: new Date().toISOString(),
    });
  },
);

// Start server
app.listen(config.PORT, config.HOST, () => {
  logger.info(
    `${SERVICE_INFO.NAME} started at http://${config.HOST}:${config.PORT} (${config.NODE_ENV})`,
  );
});
