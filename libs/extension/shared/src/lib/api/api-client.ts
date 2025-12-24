/**
 * Unified API client for extension
 *
 * Sends API requests via background script to bypass CORS restrictions.
 * Use this client from content scripts or other extension contexts that
 * need to make cross-origin requests.
 */

import { logger } from "../utils/logger";
import type { ApiRequestOptions } from "./types";

const apiLogger = logger.child("[ApiClient]");

// Default timeout for API requests (60 seconds)
const DEFAULT_API_TIMEOUT_MS = 60000;

/**
 * Send API request via background script to handle CORS
 *
 * This function sends a message to the background script which performs
 * the actual fetch. This bypasses CORS restrictions that would normally
 * block cross-origin requests from content scripts.
 *
 * @template T The expected response data type
 * @param url The API endpoint URL
 * @param method The HTTP method
 * @param body The request body (will be JSON stringified)
 * @param authToken Optional Bearer token for Authorization header
 * @param options Optional request options (timeout, additional headers)
 * @returns Promise resolving to the response data
 * @throws Error if the request fails or returns an error status
 *
 * @example
 * ```typescript
 * const data = await sendApiRequest<MyResponse>(
 *   'https://api.example.com/data',
 *   'POST',
 *   { foo: 'bar' },
 *   session.access_token,
 *   { timeout: 30000 }
 * );
 * ```
 */
const sendApiRequest = async <T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  authToken?: string,
  options?: ApiRequestOptions,
): Promise<T> => {
  const timeout = options?.timeout ?? DEFAULT_API_TIMEOUT_MS;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await chrome.runtime.sendMessage({
    type: "API_REQUEST",
    url,
    method,
    headers,
    body,
    timeout,
  });

  if (!response.success) {
    apiLogger.error("API request failed", { url, method, response });
    throw new Error(response.error ?? `API request failed: ${response.status}`);
  }

  return response.data as T;
};

/**
 * Extract error message from API response
 *
 * Handles various error formats and HTTP status codes to provide
 * user-friendly error messages.
 *
 * @param response The fetch Response object
 * @param data The parsed response data
 * @param rawText Optional raw response text (for non-JSON responses)
 * @returns A user-friendly error message
 *
 * @example
 * ```typescript
 * const errorMessage = extractApiErrorMessage(response, responseData);
 * throw new Error(errorMessage);
 * ```
 */
const extractApiErrorMessage = (
  response: { status: number; statusText: string; url: string },
  data: unknown,
  rawText?: string,
): string => {
  // Handle specific HTTP status codes with helpful messages
  if (response.status === 405) {
    return `Method Not Allowed: The endpoint ${response.url} does not accept requests. The endpoint may not exist or may only accept a different HTTP method.`;
  }

  if (response.status === 404) {
    return `Not Found: The endpoint ${response.url} does not exist on the server.`;
  }

  if (response.status === 401) {
    return `Unauthorized: Authentication failed. Please sign in again.`;
  }

  if (response.status === 403) {
    return `Forbidden: You do not have permission to access ${response.url}.`;
  }

  if (response.status >= 500) {
    return `Server Error: The server encountered an error processing your request. Please try again later.`;
  }

  // Try to extract error message from raw text
  if (rawText) {
    return rawText;
  }

  // Try to extract error message from common fields
  if (typeof data === "object" && data !== null) {
    const errorObj = data as Record<string, unknown>;

    const errorMessage =
      (typeof errorObj.error === "string" ? errorObj.error : undefined) ??
      (typeof errorObj.message === "string" ? errorObj.message : undefined) ??
      (typeof errorObj.details === "string" ? errorObj.details : undefined);

    if (errorMessage) {
      return errorMessage;
    }
  }

  // Default error message
  return `API error: ${response.status} ${response.statusText}`;
};

// Exports (ESLint rule: exports at end of file)
export { sendApiRequest, extractApiErrorMessage };
