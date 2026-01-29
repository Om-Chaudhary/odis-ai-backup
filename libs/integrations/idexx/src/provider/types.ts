/**
 * IDEXX Provider types and configuration
 */

import type { BrowserService } from "../browser/browser-service";

/**
 * IDEXX Provider configuration
 */
export interface IdexxProviderConfig {
  /**
   * Browser service instance
   */
  browserService: BrowserService;

  /**
   * IDEXX Neo base URL
   * @default 'https://us.idexxneo.com'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Default timeout for browser operations in milliseconds
   * @default 30000
   */
  defaultTimeout?: number;

  /**
   * Run browser in headless mode
   * @default true
   */
  headless?: boolean;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * IDEXX authentication state
 */
export interface IdexxAuthState {
  authenticated: boolean;
  sessionCookies?: string;
  companyId?: string;
  userId?: string;
  expiresAt?: Date;
}

/**
 * IDEXX API endpoints
 * Based on proven endpoints from Chrome extension
 */
export const IDEXX_ENDPOINTS = {
  LOGIN: "/login",
  /**
   * Calendar appointments API - returns appointments in date range
   * Query params: start, end (format: "YYYY-MM-DD HH:MM:SS")
   */
  APPOINTMENTS: "/appointments/getCalendarEventData",
  /**
   * Consultation page-data - returns full consultation details
   * Including: patient, client, providers, consultationNotes, consultationLines
   */
  CONSULTATION: (id: string) => `/consultations/${id}/page-data`,
} as const;

/**
 * IDEXX selectors for web scraping
 */
export const IDEXX_SELECTORS = {
  // Login page
  USERNAME_INPUT: 'input[name="username"], input[type="email"]',
  PASSWORD_INPUT: 'input[name="password"], input[type="password"]',
  COMPANY_ID_INPUT: 'input[name="company_id"], input[type="company_id"]',
  LOGIN_BUTTON: 'button[type="submit"]',
  LOGIN_ERROR: ".error-message, .alert-danger",

  // Schedule page
  SCHEDULE_CONTAINER: ".schedule-container",
  APPOINTMENT_CARD: ".appointment-card",

  // Consultation page
  CONSULTATION_NOTES: ".consultation-notes",
  PATIENT_INFO: ".patient-info",
  CLIENT_INFO: ".client-info",
} as const;
