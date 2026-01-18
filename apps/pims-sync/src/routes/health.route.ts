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
import { getSchedulerInstance } from "../lib/scheduler-manager";

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
    "IDEXX_ENCRYPTION_KEY",
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

  // Check 4: Scheduler status (if enabled)
  const scheduler = getSchedulerInstance();
  if (scheduler) {
    const schedulerStatus = scheduler.getStatus();
    checks.push({
      name: "scheduler",
      status: schedulerStatus.running ? "pass" : "fail",
      message: `${schedulerStatus.running ? "Running" : "Stopped"} - ${schedulerStatus.totalJobs} jobs scheduled`,
    });
  } else if (config.ENABLE_SCHEDULER) {
    checks.push({
      name: "scheduler",
      status: "warn",
      message: "Scheduler enabled but not initialized",
    });
  }

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
