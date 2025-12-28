/**
 * Session/Auth Selectors
 *
 * Selectors for detecting session expiry and auth states.
 */

import type { SelectorSet } from "../types";

/** Session expired indicator */
export const SESSION_EXPIRED: SelectorSet = {
  primary: ".session-expired",
  fallback1: '[data-testid="session-expired"]',
  fallback2: ':has-text("session expired")',
};

/** Login required indicator */
export const LOGIN_REQUIRED: SelectorSet = {
  primary: ".login-required",
  fallback1: '[data-testid="login-required"]',
  fallback2: ':has-text("please log in")',
};

/** Aggregated session selectors */
export const SESSION_SELECTORS = {
  sessionExpired: SESSION_EXPIRED,
  loginRequired: LOGIN_REQUIRED,
} as const;
