/**
 * Chrome extension shared utilities
 *
 * @packageDocumentation
 */

// Types
export * from "./types";

// Messaging utilities
export {
  sendMessage,
  sendTabMessage,
  createMessageHandler,
  successResponse,
  errorResponse,
} from "./messaging";

// Storage utilities
export {
  getSettings,
  updateSettings,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  clearAll,
  onStorageChange,
} from "./storage";

// Auth utilities
export {
  getClerkPublishableKey,
  getDashboardUrl,
  getApiBaseUrl,
  createAuthState,
  isAuthConfigured,
} from "./auth";
