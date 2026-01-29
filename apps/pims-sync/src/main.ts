/**
 * IDEXX Scrape Service
 *
 * A standalone Node.js application for on-demand IDEXX Neo data scraping.
 * Deployed on Railway via Docker.
 * Version: 1.0.1
 *
 * Endpoints:
 * - POST /api/idexx/scrape - On-demand scraping endpoint
 * - GET /api/idexx/status - Status check for monitoring
 * - GET /health - Railway health check
 * - GET /ready - Readiness probe
 */

import express from "express";
import type { IPimsProvider } from "@odis-ai/domain/sync";
import { config, SERVICE_INFO } from "./config";
import { logger } from "./lib/logger";
import { setupRoutes } from "./routes";
import { SyncScheduler } from "./scheduler";
import { PersistenceService } from "./services/persistence.service";
import { setSchedulerInstance } from "./lib/scheduler-manager";
import { createSupabaseServiceClient } from "./lib/supabase";

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
      sync: {
        inbound: {
          method: "POST",
          path: "/api/sync/inbound",
          auth: "X-API-Key header",
          description: "Sync appointments from PIMS to database",
          body: {
            startDate: "YYYY-MM-DD (optional, flat format)",
            endDate: "YYYY-MM-DD (optional, flat format)",
            daysAhead: "number (default: 7)",
            dateRange:
              "{ start: YYYY-MM-DD, end: YYYY-MM-DD } (optional, nested format)",
          },
        },
        cases: {
          method: "POST",
          path: "/api/sync/cases",
          auth: "X-API-Key header",
          description:
            "Enrich cases with consultation data from PIMS (only past appointments)",
          body: {
            startDate: "YYYY-MM-DD (optional, flat format)",
            endDate: "YYYY-MM-DD (optional, flat format, capped at now)",
            parallelBatchSize: "number (optional)",
            dateRange:
              "{ start: YYYY-MM-DD, end: YYYY-MM-DD } (optional, nested format)",
          },
        },
        reconcile: {
          method: "POST",
          path: "/api/sync/reconcile",
          auth: "X-API-Key header",
          description: "Reconcile local cases with PIMS source of truth",
          body: {
            lookbackDays: "number (default: 7)",
          },
        },
        full: {
          method: "POST",
          path: "/api/sync/full",
          auth: "X-API-Key header",
          description:
            "Run full sync pipeline (inbound + cases + reconciliation)",
          body: {
            startDate: "YYYY-MM-DD (optional, flat format)",
            endDate: "YYYY-MM-DD (optional, flat format)",
            daysAhead: "number (default: 7)",
            lookbackDays: "number (default: 7)",
            dateRange:
              "{ start: YYYY-MM-DD, end: YYYY-MM-DD } (optional, nested format)",
          },
        },
      },
      health: {
        method: "GET",
        path: "/health",
        description: "Health check for monitoring",
      },
      ready: {
        method: "GET",
        path: "/ready",
        description: "Readiness probe for deployment",
      },
      metrics: {
        method: "GET",
        path: "/metrics",
        description: "Prometheus-compatible metrics",
      },
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

// Provider factory for scheduler
async function createProviderForScheduler(
  clinicId: string,
): Promise<IPimsProvider> {
  // Get credentials
  const persistence = new PersistenceService();
  const credentialResult = await persistence.getClinicCredentials(clinicId);

  if (!credentialResult) {
    throw new Error(`No credentials found for clinic ${clinicId}`);
  }

  // Import browser and provider
  const { BrowserService } = await import("@odis-ai/integrations/idexx");
  const { IdexxProvider } = await import("@odis-ai/integrations/idexx");

  // Create browser service
  const browserService = new BrowserService({
    headless: config.HEADLESS,
    defaultTimeout: config.SYNC_TIMEOUT_MS,
  });

  // Launch browser
  await browserService.launch();

  // Create provider
  const provider = new IdexxProvider({
    browserService,
    debug: config.NODE_ENV === "development",
  });

  // Authenticate
  const credentials = {
    username: credentialResult.credentials.username,
    password: credentialResult.credentials.password,
    companyId: credentialResult.credentials.companyId,
  };

  await provider.authenticate(credentials);

  return provider;
}

// Initialize AI client if API key is configured
if (config.ANTHROPIC_API_KEY) {
  void (async () => {
    try {
      const { initializeLlamaIndex } =
        await import("@odis-ai/integrations/ai/llamaindex/init");
      initializeLlamaIndex();
      logger.info("LlamaIndex initialized for AI generation");
    } catch (error) {
      logger.warn(
        "Failed to initialize LlamaIndex - AI generation will be skipped",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  })();
} else {
  logger.warn(
    "ANTHROPIC_API_KEY not configured - AI generation will be skipped",
  );
}

// Initialize scheduler (if enabled)
let scheduler: SyncScheduler | null = null;

// Start server
const server = app.listen(config.PORT, config.HOST, () => {
  logger.info(
    `${SERVICE_INFO.NAME} started at http://${config.HOST}:${config.PORT} (${config.NODE_ENV})`,
  );

  // Start scheduler if enabled (async, but not blocking server start)
  if (config.ENABLE_SCHEDULER) {
    void (async () => {
      try {
        const supabase = createSupabaseServiceClient();
        scheduler = new SyncScheduler(supabase, createProviderForScheduler);
        await scheduler.start();
        setSchedulerInstance(scheduler);
        logger.info("Per-clinic scheduler enabled and started");
      } catch (error) {
        logger.error("Failed to start scheduler", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    })();
  } else {
    logger.info("Per-clinic scheduler disabled (ENABLE_SCHEDULER=false)");
  }
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
    // Stop scheduler
    if (scheduler) {
      logger.info("Stopping scheduler...");
      await scheduler.stop();
      logger.info("Scheduler stopped");
    }

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
