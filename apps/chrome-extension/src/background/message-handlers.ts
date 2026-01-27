/**
 * Additional message handlers for background script
 *
 * This file can be extended to add more complex message handling logic
 * that doesn't belong in the main background index.
 */

import type { ExtensionResponse } from "@odis-ai/extension/shared";
import { errorResponse } from "@odis-ai/extension/shared";

/**
 * Validate that we're on an IDEXX Neo page
 */
export function isIdexxNeoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith(".idexxneo.com") ||
      parsed.hostname === "localhost"
    );
  } catch {
    return false;
  }
}

/**
 * Get the current active tab if it's an IDEXX Neo page
 */
export async function getActiveIdexxTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab?.url && isIdexxNeoUrl(tab.url)) {
    return tab;
  }

  return null;
}

/**
 * Send a message to the active IDEXX tab's content script
 */
export async function sendToActiveIdexxTab<T>(
  message: unknown
): Promise<ExtensionResponse<T>> {
  const tab = await getActiveIdexxTab();

  if (!tab?.id) {
    return errorResponse("No active IDEXX Neo tab found");
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response;
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to send message"
    );
  }
}

/**
 * Update badge to indicate extension state
 */
export async function updateBadge(state: "active" | "inactive" | "error"): Promise<void> {
  const config: Record<string, { text: string; color: string }> = {
    active: { text: "", color: "#22c55e" },
    inactive: { text: "OFF", color: "#6b7280" },
    error: { text: "!", color: "#ef4444" },
  };

  const { text, color } = config[state] ?? config.inactive;

  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}
