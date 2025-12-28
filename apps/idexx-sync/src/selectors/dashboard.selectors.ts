/**
 * Dashboard Selectors
 *
 * Selectors for IDEXX Neo dashboard navigation elements.
 */

import type { SelectorSet } from "../types";

/** User menu (indicates successful login) */
export const USER_MENU: SelectorSet = {
  primary: '[data-testid="user-menu"]',
  fallback1: ".user-menu",
  fallback2: '[class*="avatar"]',
};

/** Navigation to schedule page */
export const SCHEDULE_NAV: SelectorSet = {
  primary: '[data-testid="nav-schedule"]',
  fallback1: 'a[href*="schedule"]',
  fallback2: 'nav a:has-text("Schedule")',
};

/** Navigation to consultations page */
export const CONSULTATIONS_NAV: SelectorSet = {
  primary: '[data-testid="nav-consultations"]',
  fallback1: 'a[href*="consultation"]',
  fallback2: 'nav a:has-text("Consultations")',
};

/** Aggregated dashboard selectors */
export const DASHBOARD_SELECTORS = {
  userMenu: USER_MENU,
  scheduleNav: SCHEDULE_NAV,
  consultationsNav: CONSULTATIONS_NAV,
} as const;
