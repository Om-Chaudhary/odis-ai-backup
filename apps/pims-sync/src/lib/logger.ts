/**
 * IDEXX Sync Service Logger
 *
 * Structured logging using the shared logger from the monorepo.
 */

import { createLogger } from "@odis-ai/shared/logger";

/**
 * Main logger instance for the IDEXX sync service
 */
export const logger = createLogger("idexx-sync");

/**
 * Child loggers for specific domains
 */
export const browserLogger = logger.child("browser");
export const authLogger = logger.child("auth");
export const scrapeLogger = logger.child("scrape");
export const persistenceLogger = logger.child("persistence");
export const scheduleLogger = logger.child("schedule-scraper");
export const consultationLogger = logger.child("consultation-scraper");
