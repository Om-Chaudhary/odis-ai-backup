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

/**
 * Selector set with primary and fallback selectors for Playwright
 */
export interface SelectorSet {
  primary: string;
  fallback1?: string;
  fallback2?: string;
  fallback3?: string;
  fallback4?: string;
}

/**
 * Type of scrape operation
 */
export type ScrapeType = "schedule" | "consultation";

/**
 * Scraped appointment data from IDEXX Neo
 */
export interface ScrapedAppointment {
  neo_appointment_id: string;
  date: string;
  start_time: string;
  end_time?: string;
  patient_name: string;
  client_name: string;
  client_phone?: string;
  provider_name?: string;
  appointment_type?: string;
  status?: string;
}

/**
 * Scraped consultation data from IDEXX Neo
 */
export interface ScrapedConsultation {
  neo_consultation_id?: string;
  neo_appointment_id?: string;
  date: string;
  has_notes: boolean;
  clinical_notes?: string;
  discharge_summary?: string;
  patient_name?: string;
  client_name?: string;
  vitals?: string;
  diagnoses?: string;
}
