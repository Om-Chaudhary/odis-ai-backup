/**
 * Type-safe Chrome runtime messaging utilities
 */

import type {
  ExtensionMessage,
  ExtensionResponse,
  MessageType,
} from "./types";

/**
 * Send a message to the background service worker
 */
export async function sendMessage<TPayload = unknown, TResponse = unknown>(
  type: MessageType,
  payload?: TPayload
): Promise<ExtensionResponse<TResponse>> {
  try {
    const message: ExtensionMessage<TPayload> = { type, payload };
    const response = await chrome.runtime.sendMessage<
      ExtensionMessage<TPayload>,
      ExtensionResponse<TResponse>
    >(message);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a message to a specific tab's content script
 */
export async function sendTabMessage<TPayload = unknown, TResponse = unknown>(
  tabId: number,
  type: MessageType,
  payload?: TPayload
): Promise<ExtensionResponse<TResponse>> {
  try {
    const message: ExtensionMessage<TPayload> = { type, payload };
    const response = await chrome.tabs.sendMessage<
      ExtensionMessage<TPayload>,
      ExtensionResponse<TResponse>
    >(tabId, message);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a type-safe message handler
 */
export function createMessageHandler(
  handlers: Partial<
    Record<
      MessageType,
      (
        payload: unknown,
        sender: chrome.runtime.MessageSender
      ) => Promise<ExtensionResponse>
    >
  >
): (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ExtensionResponse) => void
) => boolean {
  return (message, sender, sendResponse) => {
    const handler = handlers[message.type];
    if (handler) {
      handler(message.payload, sender)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        });
      // Return true to indicate async response
      return true;
    }
    return false;
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(data?: T): ExtensionResponse<T> {
  return { success: true, data };
}

/**
 * Error response helper
 */
export function errorResponse(error: string): ExtensionResponse<never> {
  return { success: false, error };
}
