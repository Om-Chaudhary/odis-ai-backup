/**
 * PIMS Sync Service Constants
 *
 * Static configuration values for the sync service.
 */

/** Health check thresholds */
export const HEALTH_THRESHOLDS = {
  MAX_HEAP_MB: 900,
} as const;

/** Service metadata */
export const SERVICE_INFO = {
  NAME: "pims-sync",
  VERSION: "3.0.0",
  DESCRIPTION: "Provider-Agnostic PIMS Sync Service",
} as const;
