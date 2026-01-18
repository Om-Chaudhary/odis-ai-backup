/**
 * Schedule Page Selectors
 *
 * Selectors for IDEXX Neo schedule/appointment page elements.
 */

import type { SelectorSet } from "../types";

/** Date picker input */
export const DATE_PICKER: SelectorSet = {
  primary: '[data-testid="date-picker"]',
  fallback1: 'input[type="date"]',
  fallback2: ".date-picker",
};

/** Appointment row in schedule table */
export const APPOINTMENT_ROW: SelectorSet = {
  primary: '[data-testid="appointment-row"]',
  fallback1: ".appointment-item",
  fallback2: 'tr[class*="appointment"]',
  fallback3: ".schedule-row",
};

/** Appointment time cell */
export const APPOINTMENT_TIME: SelectorSet = {
  primary: '[data-testid="appointment-time"]',
  fallback1: ".appointment-time",
  fallback2: ".time-slot",
};

/** Patient name cell */
export const PATIENT_NAME: SelectorSet = {
  primary: '[data-testid="patient-name"]',
  fallback1: ".patient-name",
  fallback2: '[class*="patient"]',
};

/** Client name cell */
export const CLIENT_NAME: SelectorSet = {
  primary: '[data-testid="client-name"]',
  fallback1: ".client-name",
  fallback2: '[class*="owner"]',
};

/** Client phone cell */
export const CLIENT_PHONE: SelectorSet = {
  primary: '[data-testid="client-phone"]',
  fallback1: ".client-phone",
  fallback2: 'a[href^="tel:"]',
};

/** Provider name cell */
export const PROVIDER_NAME: SelectorSet = {
  primary: '[data-testid="provider-name"]',
  fallback1: ".provider-name",
  fallback2: '[class*="doctor"]',
};

/** Appointment type cell */
export const APPOINTMENT_TYPE: SelectorSet = {
  primary: '[data-testid="appointment-type"]',
  fallback1: ".appointment-type",
  fallback2: '[class*="reason"]',
};

/** Aggregated schedule selectors */
export const SCHEDULE_SELECTORS = {
  datePicker: DATE_PICKER,
  appointmentRow: APPOINTMENT_ROW,
  appointmentTime: APPOINTMENT_TIME,
  patientName: PATIENT_NAME,
  clientName: CLIENT_NAME,
  clientPhone: CLIENT_PHONE,
  providerName: PROVIDER_NAME,
  appointmentType: APPOINTMENT_TYPE,
} as const;
