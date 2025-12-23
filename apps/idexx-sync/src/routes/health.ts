/**
 * Health Check Route
 *
 * GET /health - Railway health check endpoint
 *
 * Returns service health status for container orchestration.
 */

import { Router } from "express";
import type { Request, Response } from "express";

export const healthRouter: ReturnType<typeof Router> = Router();

interface HealthResponse {
  status: "healthy" | "unhealthy";
  service: string;
  version: string;
  timestamp: string;
  uptime_seconds: number;
  checks: {
    name: string;
    status: "pass" | "fail";
    message?: string;
  }[];
}

const startTime = Date.now();

/**
 * GET /health
 *
 * Returns health status for Railway container monitoring.
 * Used by Railway HEALTHCHECK in Dockerfile.
 */
healthRouter.get("/health", (req: Request, res: Response) => {
  const checks: HealthResponse["checks"] = [];

  // Check 1: Process is running (always passes if we get here)
  checks.push({
    name: "process",
    status: "pass",
    message: "Process is running",
  });

  // Check 2: Memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryHealthy = heapUsedMB < 900; // Less than 900MB

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

  const allHealthy = checks.every((check) => check.status === "pass");

  const response: HealthResponse = {
    status: allHealthy ? "healthy" : "unhealthy",
    service: "idexx-sync",
    version: "1.0.0",
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
  // Check if essential environment variables are present
  const isReady =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

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
