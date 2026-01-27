/**
 * Shared types for Chrome extension messaging and storage
 */

/**
 * Message types for communication between extension components
 */
export type MessageType =
  | "GET_AUTH_STATUS"
  | "GET_AUTH_TOKEN"
  | "SIGN_OUT"
  | "GET_SETTINGS"
  | "UPDATE_SETTINGS"
  | "IDEXX_DATA_DETECTED"
  | "OPEN_DASHBOARD";

/**
 * Base message structure for Chrome runtime messaging
 */
export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
}

/**
 * Response wrapper for extension messages
 */
export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Extension settings stored in chrome.storage
 */
export interface ExtensionSettings {
  /** Whether the extension is enabled */
  enabled: boolean;
  /** Whether to auto-detect IDEXX Neo data */
  autoDetect: boolean;
  /** Dashboard URL override (for development) */
  dashboardUrl?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
}

/**
 * IDEXX Neo patient data detected from the page
 */
export interface IdexxPatientData {
  patientId?: string;
  patientName?: string;
  clientName?: string;
  species?: string;
  breed?: string;
}

/**
 * Default extension settings
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  autoDetect: true,
  dashboardUrl: undefined,
};
