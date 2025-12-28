/**
 * Health Route
 *
 * GET /health - Railway health check endpoint
 * GET /ready - Readiness probe endpoint
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { config, SERVICE_INFO, HEALTH_THRESHOLDS } from "../config";
import type { HealthResponse, HealthCheck } from "../types";
import { syncQueue } from "../services/sync-queue.service";
import { browserPool } from "../services/browser-pool.service";

export const healthRouter: ReturnType<typeof Router> = Router();

const startTime = Date.now();

/**
 * GET /health
 *
 * Returns health status for Railway container monitoring.
 */
healthRouter.get("/health", (req: Request, res: Response) => {
  const checks: HealthCheck[] = [];

  // Check 1: Process is running
  checks.push({
    name: "process",
    status: "pass",
    message: "Process is running",
  });

  // Check 2: Memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryHealthy = heapUsedMB < HEALTH_THRESHOLDS.MAX_HEAP_MB;

  checks.push({
    name: "memory",
    status: memoryHealthy ? "pass" : "fail",
    message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB`,
  });

  // Check 3: Environment variables
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ENCRYPTION_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  const envHealthy = missingEnvVars.length === 0;

  checks.push({
    name: "environment",
    status: envHealthy ? "pass" : "fail",
    message: envHealthy
      ? "All required environment variables set"
      : `Missing: ${missingEnvVars.join(", ")}`,
  });

  // Check 4: Sync queue status
  const queueStats = syncQueue.getQueueStats();
  const queueHealthy = queueStats.totalActive < 10; // Alert if too many active syncs

  checks.push({
    name: "sync_queue",
    status: queueHealthy ? "pass" : "warn",
    message: `Active: ${queueStats.totalActive}, Queued: ${queueStats.totalQueued}`,
  });

  // Check 5: Browser pool status
  const browserStats = browserPool.getStats();
  const browserHealthy = browserStats.total <= browserStats.maxSize;

  checks.push({
    name: "browser_pool",
    status: browserHealthy ? "pass" : "warn",
    message: `Available: ${browserStats.available}/${browserStats.total} (max: ${browserStats.maxSize})`,
  });

  const allHealthy = checks.every(
    (check) => check.status === "pass" || check.status === "warn",
  );

  const response: HealthResponse = {
    status: allHealthy ? "healthy" : "unhealthy",
    service: SERVICE_INFO.NAME,
    version: SERVICE_INFO.VERSION,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };

  res.status(allHealthy ? 200 : 503).json(response);
});

/**
 * GET /ready
 *
 * Readiness probe - indicates if the service is ready to accept traffic.
 */
healthRouter.get("/ready", (req: Request, res: Response) => {
  const isReady = !!config.SUPABASE_URL && !!config.SUPABASE_SERVICE_ROLE_KEY;

  if (isReady) {
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      ready: false,
      message: "Missing required environment variables",
      timestamp: new Date().toISOString(),
    });
  }
});
