/**
 * IDEXX Neo Sync Service
 *
 * A standalone Node.js application for automated IDEXX Neo data synchronization.
 * Triggered by QStash cron schedules, deployed on Railway via Docker.
 *
 * Endpoints:
 * - POST /api/idexx/sync - Main sync endpoint (QStash-triggered)
 * - GET /api/idexx/sync-status - Status check for monitoring
 * - GET /health - Railway health check
 */

import express from "express";
import { syncRouter } from "./routes/sync";
import { statusRouter } from "./routes/status";
import { healthRouter } from "./routes/health";

const host = process.env.HOST ?? "0.0.0.0";
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
    );
  });
  next();
});

// Routes
app.use("/api/idexx", syncRouter);
app.use("/api/idexx", statusRouter);
app.use("/", healthRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "idexx-sync",
    version: "1.0.0",
    description: "IDEXX Neo Sync Automation Service",
    endpoints: {
      sync: "POST /api/idexx/sync?type=pre-open|eod",
      status: "GET /api/idexx/sync-status",
      health: "GET /health",
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
    console.error(`[ERROR] ${err.message}`, err.stack);
    res.status(500).json({
      success: false,
      error: err.message ?? "Unknown error",
      timestamp: new Date().toISOString(),
    });
  },
);

app.listen(port, host, () => {
  console.log(`[IDEXX-SYNC] Server started at http://${host}:${port}`);
  console.log(
    `[IDEXX-SYNC] Environment: ${process.env.NODE_ENV ?? "development"}`,
  );
});
