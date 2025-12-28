/**
 * IDEXX Sync Service Constants
 *
 * Static configuration values for the scraping service.
 */

/** IDEXX Neo URLs */
export const IDEXX_URLS = {
  BASE: "https://us.idexxneo.com",
  LOGIN: "https://us.idexxneo.com/login",
  SCHEDULE: "https://us.idexxneo.com/schedule",
  CONSULTATIONS: "https://us.idexxneo.com/consultations",
} as const;

/** Browser configuration defaults */
export const BROWSER_DEFAULTS = {
  TIMEOUT_MS: 30000,
  VIEWPORT: { width: 1920, height: 1080 },
  USER_AGENT:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  LOCALE: "en-US",
  TIMEZONE: "America/Los_Angeles",
} as const;

/** Health check thresholds */
export const HEALTH_THRESHOLDS = {
  MAX_HEAP_MB: 900,
} as const;

/** Service metadata */
export const SERVICE_INFO = {
  NAME: "idexx-scrape",
  VERSION: "2.0.0",
  DESCRIPTION: "IDEXX Neo On-Demand Scraping Service",
} as const;

/** Scrape types */
export const SCRAPE_TYPES = {
  SCHEDULE: "schedule",
  CONSULTATION: "consultation",
} as const;

export type ScrapeType = (typeof SCRAPE_TYPES)[keyof typeof SCRAPE_TYPES];
