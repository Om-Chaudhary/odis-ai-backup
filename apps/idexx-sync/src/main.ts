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
import { syncQueue } from "./services/sync-queue.service";
import { browserPool } from "./services/browser-pool.service";

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
const server = app.listen(config.PORT, config.HOST, () => {
  logger.info(
    `${SERVICE_INFO.NAME} started at http://${config.HOST}:${config.PORT} (${config.NODE_ENV})`,
  );
});

// Graceful shutdown handler
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress, forcing exit...");
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info("HTTP server closed");
  });

  try {
    // Cancel all queued syncs
    syncQueue.cancelAllQueued();
    logger.info("Cancelled all queued syncs");

    // Wait for active syncs to complete (max 30 seconds)
    logger.info("Waiting for active syncs to complete (max 30s)...");
    await syncQueue.waitForActiveSyncs(30000);
    logger.info("All active syncs completed or timed out");

    // Close all browser instances
    logger.info("Closing browser pool...");
    await browserPool.closeAll();
    logger.info("Browser pool closed");

    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error during graceful shutdown: ${msg}`);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

// Handle uncaught errors
process.on("uncaughtException", (error: Error) => {
  logger.error(`Uncaught exception: ${error.message}`, { stack: error.stack });
  void gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  logger.error(`Unhandled rejection: ${msg}`);
  void gracefulShutdown("unhandledRejection");
});
