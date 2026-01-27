/**
 * Chrome extension service worker (background script)
 *
 * Handles:
 * - Message routing between content scripts and popup
 * - Auth state management
 * - Storage operations
 */

import {
  createMessageHandler,
  successResponse,
  errorResponse,
  getSettings,
  updateSettings,
  getAuthToken,
  clearAuthToken,
  getDashboardUrl,
} from "@odis-ai/extension/shared";
import type { ExtensionSettings } from "@odis-ai/extension/shared";

console.log("[ODIS Extension] Service worker initialized");

/**
 * Message handlers for different message types
 */
const messageHandler = createMessageHandler({
  GET_AUTH_STATUS: async () => {
    const token = await getAuthToken();
    return successResponse({ isAuthenticated: Boolean(token) });
  },

  GET_AUTH_TOKEN: async () => {
    const token = await getAuthToken();
    if (token) {
      return successResponse({ token });
    }
    return errorResponse("Not authenticated");
  },

  SIGN_OUT: async () => {
    await clearAuthToken();
    return successResponse(undefined);
  },

  GET_SETTINGS: async () => {
    const settings = await getSettings();
    return successResponse(settings);
  },

  UPDATE_SETTINGS: async (payload) => {
    const updates = payload as Partial<ExtensionSettings>;
    const settings = await updateSettings(updates);
    return successResponse(settings);
  },

  OPEN_DASHBOARD: async () => {
    const dashboardUrl = getDashboardUrl();
    await chrome.tabs.create({ url: dashboardUrl });
    return successResponse(undefined);
  },

  IDEXX_DATA_DETECTED: async (payload, sender) => {
    console.log("[ODIS Extension] IDEXX data detected from tab:", sender.tab?.id, payload);
    // Could notify popup or trigger other actions
    return successResponse(undefined);
  },
});

// Register message listener
chrome.runtime.onMessage.addListener(messageHandler);

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[ODIS Extension] Installed");
    // Could open onboarding page
  } else if (details.reason === "update") {
    console.log("[ODIS Extension] Updated to version", chrome.runtime.getManifest().version);
  }
});

// Export for testing
export { messageHandler };
