/**
 * IDEXX Neo integration module
 *
 * Handles:
 * - DOM observation for patient data
 * - UI enhancements and overlays
 * - Data extraction from IDEXX Neo pages
 */

import { IDEXX_SELECTORS } from "./selectors";
import { extractPatientData } from "./ui-overrides";
import type { IdexxPatientData } from "./types";
import { sendMessage } from "@odis-ai/extension/shared";

let observer: MutationObserver | null = null;
let lastDetectedData: IdexxPatientData | null = null;

/**
 * Initialize IDEXX Neo page overrides and observers
 */
export function initIdexxNeoOverrides(): void {
  console.log("[ODIS Extension] Initializing IDEXX Neo overrides");

  // Initial scan
  scanForPatientData();

  // Set up mutation observer for dynamic content
  observer = new MutationObserver((mutations) => {
    // Debounce - only process if we have relevant changes
    const hasRelevantChanges = mutations.some(
      (mutation) =>
        mutation.type === "childList" &&
        mutation.addedNodes.length > 0
    );

    if (hasRelevantChanges) {
      scanForPatientData();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Clean up observers and injected elements
 */
export function cleanupIdexxNeoOverrides(): void {
  console.log("[ODIS Extension] Cleaning up IDEXX Neo overrides");

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // Remove any injected UI elements
  document
    .querySelectorAll("[data-odis-extension]")
    .forEach((el) => el.remove());

  lastDetectedData = null;
}

/**
 * Scan the page for patient data
 */
function scanForPatientData(): void {
  const data = extractPatientData();

  if (!data) return;

  // Only notify if data has changed
  if (JSON.stringify(data) !== JSON.stringify(lastDetectedData)) {
    lastDetectedData = data;
    console.log("[ODIS Extension] Patient data detected:", data);

    // Notify background script
    sendMessage("IDEXX_DATA_DETECTED", data).catch((error) => {
      console.error("[ODIS Extension] Failed to send patient data:", error);
    });
  }
}

// Re-export for external use
export { IDEXX_SELECTORS };
export type { IdexxPatientData };
