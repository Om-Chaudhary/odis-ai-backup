/**
 * PIMS Sync Service Types
 *
 * Type definitions for the PIMS sync service.
 */

/**
 * Health check status
 */
export interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message?: string;
}

/**
 * Health response
 */
export interface HealthResponse {
  status: "healthy" | "unhealthy";
  service: string;
  version: string;
  timestamp: string;
  uptime_seconds: number;
  checks: HealthCheck[];
}
