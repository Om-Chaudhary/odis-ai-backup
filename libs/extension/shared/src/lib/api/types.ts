/**
 * Shared API types for extension API communication
 */

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Additional headers to include */
  headers?: Record<string, string>;
}

/**
 * API response from background script
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request succeeded */
  success: boolean;
  /** Response data (when successful) */
  data?: T;
  /** Error message (when failed) */
  error?: string;
  /** HTTP status code */
  status?: number;
}

/**
 * API request message sent to background script
 */
export interface ApiRequestMessage {
  type: "API_REQUEST";
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}
