/**
 * IDEXX Sync Service Types
 *
 * Centralized type definitions for the scraping service.
 */

import type { ScrapeType } from "../config/constants";

// Re-export ScrapeType from constants
export type { ScrapeType };

/**
 * IDEXX credentials for authentication
 */
export interface IdexxCredentials {
  username: string;
  password: string;
  companyId: string;
}

/**
 * Result of credential lookup
 */
export interface CredentialsResult {
  credentials: IdexxCredentials;
  userId: string;
}

/**
 * Options for a scrape operation
 */
export interface ScrapeOptions {
  type: ScrapeType;
  clinicId: string;
  date?: string; // YYYY-MM-DD format
}

/**
 * Result of a scrape operation
 */
export interface ScrapeResult {
  success: boolean;
  sessionId: string;
  recordsScraped: number;
  errors: string[];
}

/**
 * Scraped appointment data
 */
export interface ScrapedAppointment {
  neo_appointment_id: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  patient_name: string | null;
  client_name: string | null;
  client_phone: string | null;
  provider_name: string | null;
  appointment_type: string | null;
  status: string;
}

/**
 * Result from schedule scraper
 */
export interface ScheduleScraperResult {
  appointments: ScrapedAppointment[];
  scrapedAt: Date;
  errors: string[];
}

/**
 * Scraped consultation vitals
 */
export interface ScrapedVitals {
  temperature?: number;
  temperature_unit?: "F" | "C";
  pulse?: number;
  respiration?: number;
  weight?: number;
  weight_unit?: "kg" | "lb";
  blood_pressure?: string;
}

/**
 * Scraped consultation data
 */
export interface ScrapedConsultation {
  neo_consultation_id: string | null;
  neo_appointment_id: string | null;
  patient_name: string | null;
  date: string;
  status: "in_progress" | "completed" | "cancelled";
  has_notes: boolean;
  clinical_notes: string | null;
  vitals: ScrapedVitals | null;
  diagnoses: string[];
}

/**
 * Result from consultation scraper
 */
export interface ConsultationScraperResult {
  consultations: ScrapedConsultation[];
  scrapedAt: Date;
  errors: string[];
}

/**
 * Selector set for multi-fallback strategy
 */
export interface SelectorSet {
  primary: string;
  fallback1?: string;
  fallback2?: string;
  fallback3?: string;
  fallback4?: string;
}

/**
 * Browser configuration
 */
export interface BrowserConfig {
  headless: boolean;
  timeout: number;
  viewport: { width: number; height: number };
}

/**
 * Health check status
 */
export interface HealthCheck {
  name: string;
  status: "pass" | "fail";
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

/**
 * Scrape API request body
 */
export interface ScrapeRequest {
  type: ScrapeType;
  clinicId: string;
  date?: string;
}

/**
 * Scrape API response
 */
export interface ScrapeResponse {
  success: boolean;
  sessionId?: string;
  scrapeType: ScrapeType;
  recordsScraped: number;
  errors: string[];
  durationMs: number;
  timestamp: string;
}

/**
 * Status API response
 */
export interface StatusResponse {
  last_scrape: {
    type: string;
    status: string;
    timestamp: string;
    records_scraped: number;
    errors?: string[];
  } | null;
  system_status: "healthy" | "degraded" | "error";
  uptime_seconds: number;
}
