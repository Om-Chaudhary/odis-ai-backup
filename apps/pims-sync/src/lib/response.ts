/**
 * Response Utilities
 *
 * Standardized response builders for API handlers.
 * Ensures consistent response format across all endpoints.
 */

/**
 * Standard API response shape
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
  timestamp: string;
}

/**
 * Error response shape
 */
export interface ErrorResponse {
  success: false;
  error: string;
  durationMs: number;
  timestamp: string;
}

/**
 * Build a success response
 */
export function buildSuccessResponse<T>(
  data: T,
  startTime: number,
): ApiResponse<T> {
  return {
    success: true,
    data,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build an error response from an error object
 */
export function buildErrorResponse(
  error: unknown,
  startTime: number,
): ErrorResponse {
  return {
    success: false,
    error: extractErrorMessage(error),
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build an authentication failed response
 */
export function buildAuthFailedResponse(startTime: number): ErrorResponse {
  return {
    success: false,
    error: "PIMS authentication failed",
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract error message from unknown error type
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}
