/**
 * Content script entry point
 *
 * Runs on IDEXX Neo pages to detect patient data and provide UI enhancements.
 */

import {
  createMessageHandler,
  successResponse,
  getSettings,
} from "@odis-ai/extension/shared";
import {
  initIdexxNeoOverrides,
  cleanupIdexxNeoOverrides,
} from "./idexx-neo";

console.log("[ODIS Extension] Content script loaded on:", window.location.href);

let isInitialized = false;

/**
 * Initialize the content script based on settings
 */
async function initialize(): Promise<void> {
  if (isInitialized) return;

  const settings = await getSettings();

  if (!settings.enabled) {
    console.log("[ODIS Extension] Extension is disabled");
    return;
  }

  // Initialize IDEXX Neo integrations
  initIdexxNeoOverrides();
  isInitialized = true;

  console.log("[ODIS Extension] Initialized with settings:", settings);
}

/**
 * Cleanup when extension is disabled
 */
function cleanup(): void {
  if (!isInitialized) return;

  cleanupIdexxNeoOverrides();
  isInitialized = false;

  console.log("[ODIS Extension] Cleaned up");
}

/**
 * Message handler for content script
 */
const messageHandler = createMessageHandler({
  GET_SETTINGS: async () => {
    const settings = await getSettings();
    return successResponse(settings);
  },

  UPDATE_SETTINGS: async (payload) => {
    const { enabled } = payload as { enabled?: boolean };
    if (enabled === false) {
      cleanup();
    } else if (enabled === true && !isInitialized) {
      await initialize();
    }
    return successResponse(undefined);
  },
});

// Register message listener
chrome.runtime.onMessage.addListener(messageHandler);

// Initialize on load
initialize().catch((error) => {
  console.error("[ODIS Extension] Failed to initialize:", error);
});

// Cleanup on unload
window.addEventListener("unload", cleanup);
