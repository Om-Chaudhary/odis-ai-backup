/**
 * Clerk authentication helpers for Chrome extension
 *
 * Uses @clerk/chrome-extension for authentication.
 * See: https://clerk.com/docs/references/chrome-extension/overview
 */

import type { AuthState } from "./types";

// In a Chrome extension, these should be set at build time via your bundler
// For development, you can set them in your bundler config (e.g., webpack DefinePlugin)
// These declarations allow TypeScript to recognize build-time constants
declare const VITE_CLERK_PUBLISHABLE_KEY: string | undefined;
declare const VITE_DASHBOARD_URL: string | undefined;
declare const VITE_API_BASE_URL: string | undefined;

// Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY =
  typeof VITE_CLERK_PUBLISHABLE_KEY !== "undefined"
    ? VITE_CLERK_PUBLISHABLE_KEY
    : "";

/**
 * Get the Clerk publishable key
 * Used by popup and background to initialize Clerk
 */
export function getClerkPublishableKey(): string {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn(
      "[ODIS Extension] VITE_CLERK_PUBLISHABLE_KEY is not configured",
    );
  }
  return CLERK_PUBLISHABLE_KEY;
}

/**
 * Dashboard URL for the ODIS AI web app
 */
export function getDashboardUrl(): string {
  return typeof VITE_DASHBOARD_URL !== "undefined"
    ? VITE_DASHBOARD_URL
    : "https://odis-ai-web.vercel.app/dashboard";
}

/**
 * API base URL for ODIS AI
 */
export function getApiBaseUrl(): string {
  return typeof VITE_API_BASE_URL !== "undefined"
    ? VITE_API_BASE_URL
    : "https://odis-ai-web.vercel.app/api";
}

/**
 * Create an auth state object
 */
export function createAuthState(
  isAuthenticated: boolean,
  userId?: string,
  email?: string,
): AuthState {
  return { isAuthenticated, userId, email };
}

/**
 * Check if the extension is configured for authentication
 */
export function isAuthConfigured(): boolean {
  return Boolean(CLERK_PUBLISHABLE_KEY);
}
