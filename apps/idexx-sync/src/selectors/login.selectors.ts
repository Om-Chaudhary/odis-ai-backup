/**
 * Login Page Selectors
 *
 * Selectors for IDEXX Neo login page elements.
 */

import type { SelectorSet } from "../types";

/** Company ID input field */
export const COMPANY_ID_INPUT: SelectorSet = {
  primary: 'input[name="companyId"]',
  fallback1: 'input[name="company_id"]',
  fallback2: "#companyId",
  fallback3: "input:first-of-type",
  fallback4: 'input[placeholder*="Company" i]',
};

/** Username input field */
export const USERNAME_INPUT: SelectorSet = {
  primary: 'input[name="username"]',
  fallback1: 'input[placeholder="username"]',
  fallback2: 'input[type="email"]',
  fallback3: "#username",
  fallback4: 'input[placeholder*="email" i]',
};

/** Password input field */
export const PASSWORD_INPUT: SelectorSet = {
  primary: 'input[name="password"]',
  fallback1: 'input[placeholder="password"]',
  fallback2: 'input[type="password"]',
  fallback3: "#password",
};

/** Login submit button */
export const SUBMIT_BUTTON: SelectorSet = {
  primary: 'button:has-text("Login")',
  fallback1: 'button[type="submit"]',
  fallback2: 'button:has-text("Sign In")',
  fallback3: 'input[type="submit"]',
};

/** Login error message */
export const ERROR_MESSAGE: SelectorSet = {
  primary: '[data-testid="login-error"]',
  fallback1: ".error-message",
  fallback2: '[role="alert"]',
};

/** Two-factor authentication input */
export const TWO_FACTOR_INPUT: SelectorSet = {
  primary: 'input[name="code"]',
  fallback1: 'input[name="otp"]',
  fallback2: 'input[placeholder*="code" i]',
};

/** Aggregated login selectors */
export const LOGIN_SELECTORS = {
  companyIdInput: COMPANY_ID_INPUT,
  usernameInput: USERNAME_INPUT,
  passwordInput: PASSWORD_INPUT,
  submitButton: SUBMIT_BUTTON,
  errorMessage: ERROR_MESSAGE,
  twoFactorInput: TWO_FACTOR_INPUT,
} as const;
