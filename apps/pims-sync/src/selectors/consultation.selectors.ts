/**
 * Consultation Page Selectors
 *
 * Selectors for IDEXX Neo consultation page elements.
 */

import type { SelectorSet } from "../types";

/** Consultation row in list */
export const CONSULTATION_ROW: SelectorSet = {
  primary: '[data-testid="consultation-row"]',
  fallback1: ".consultation-item",
  fallback2: 'tr[class*="consultation"]',
};

/** Notes indicator badge */
export const NOTES_INDICATOR: SelectorSet = {
  primary: '[data-testid="notes-indicator"]',
  fallback1: ".notes-indicator",
  fallback2: ".has-notes",
};

/** Search/filter button */
export const SEARCH_BUTTON: SelectorSet = {
  primary: '[data-testid="search"]',
  fallback1: 'button:has-text("Search")',
  fallback2: 'button[type="submit"]',
};

/** Start date filter input */
export const START_DATE_INPUT: SelectorSet = {
  primary: 'input[name="startDate"]',
  fallback1: '[data-testid="start-date"]',
  fallback2: 'input[placeholder*="start" i]',
};

/** End date filter input */
export const END_DATE_INPUT: SelectorSet = {
  primary: 'input[name="endDate"]',
  fallback1: '[data-testid="end-date"]',
  fallback2: 'input[placeholder*="end" i]',
};

/** Clinical notes container (SOAP notes) */
export const CLINICAL_NOTES: SelectorSet = {
  primary: '[data-testid="clinical-notes"]',
  fallback1: ".clinical-notes",
  fallback2: ".soap-notes",
  fallback3: '[class*="notes-content"]',
};

/** Vitals section */
export const VITALS_SECTION: SelectorSet = {
  primary: '[data-testid="vitals"]',
  fallback1: ".vitals-section",
  fallback2: '[class*="vital"]',
};

/** Diagnosis section */
export const DIAGNOSIS_SECTION: SelectorSet = {
  primary: '[data-testid="diagnosis"]',
  fallback1: ".diagnosis-section",
  fallback2: '[class*="diagnosis"]',
};

/** Status indicator badge */
export const STATUS_INDICATOR: SelectorSet = {
  primary: '[data-testid="status"]',
  fallback1: ".status-badge",
  fallback2: '[class*="status"]',
};

/** Aggregated consultation selectors */
export const CONSULTATION_SELECTORS = {
  consultationRow: CONSULTATION_ROW,
  notesIndicator: NOTES_INDICATOR,
  searchButton: SEARCH_BUTTON,
  startDateInput: START_DATE_INPUT,
  endDateInput: END_DATE_INPUT,
  clinicalNotes: CLINICAL_NOTES,
  vitalsSection: VITALS_SECTION,
  diagnosisSection: DIAGNOSIS_SECTION,
  statusIndicator: STATUS_INDICATOR,
} as const;
