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

// ============================================================================
// Schedule Sync Types
// ============================================================================

/**
 * IDEXX schedule configuration from /schedule/getScheduleConfigs API
 */
export interface IdexxScheduleConfig {
  businessHours?: {
    start?: string; // e.g., "08:00"
    end?: string; // e.g., "18:00"
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  };
  slotDuration?: number; // in minutes
  providers?: Array<{
    id?: string | number;
    name?: string;
    color?: string;
  }>;
  rooms?: Array<{
    id?: string | number;
    name?: string;
  }>;
  [key: string]: unknown;
}

/**
 * Clinic schedule configuration from database
 */
export interface ClinicScheduleConfig {
  id: string;
  clinic_id: string;
  open_time: string; // HH:MM:SS
  close_time: string; // HH:MM:SS
  days_of_week: number[]; // 0-6
  slot_duration_minutes: number;
  default_capacity: number;
  sync_horizon_days: number;
  stale_threshold_minutes: number;
  timezone: string;
  idexx_config_snapshot: IdexxScheduleConfig | null;
}

/**
 * Blocked period (lunch breaks, meetings)
 */
export interface BlockedPeriod {
  id: string;
  clinic_id: string;
  name: string;
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  days_of_week: number[];
  is_active: boolean;
}

/**
 * Generated slot (before persistence)
 */
export interface GeneratedSlot {
  clinic_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  capacity: number;
}

/**
 * Schedule sync session for audit logging
 */
export interface ScheduleSyncSession {
  id: string;
  clinic_id: string;
  sync_start_date: string;
  sync_end_date: string;
  status: "in_progress" | "completed" | "failed";
  slots_created: number;
  slots_updated: number;
  appointments_added: number;
  appointments_updated: number;
  appointments_removed: number;
  conflicts_detected: number;
  conflicts_resolved: number;
  idexx_config: IdexxScheduleConfig | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

/**
 * Result from schedule sync operation
 */
export interface ScheduleSyncResult {
  success: boolean;
  syncId: string;
  stats: {
    slotsCreated: number;
    slotsUpdated: number;
    appointmentsAdded: number;
    appointmentsUpdated: number;
    appointmentsRemoved: number;
    conflictsDetected: number;
    conflictsResolved: number;
  };
  durationMs: number;
  errors: string[];
}

/**
 * Appointment reconciliation action
 */
export type ReconciliationAction = "add" | "update" | "remove" | "unchanged";

/**
 * Reconciliation plan for an appointment
 */
export interface ReconciliationPlan {
  neo_appointment_id: string;
  action: ReconciliationAction;
  appointment: ScrapedAppointment;
  existingHash: string | null;
  newHash: string;
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
