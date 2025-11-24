/**
 * Standardized API Response Utilities
 *
 * Provides consistent response formats across all API routes for:
 * - Success responses with data
 * - Error responses with standardized error codes
 * - Metadata (timestamps, request IDs, etc.)
 *
 * @example
 * ```ts
 * // Success response
 * return successResponse({ userId: "123", name: "John" });
 *
 * // Error response
 * return errorResponse(new ValidationError("Invalid email"), 400);
 * ```
 */

import { NextResponse } from "next/server";
import type { ApiError } from "./errors";

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

/**
 * Creates a successful API response
 *
 * @param data - Response data payload
 * @param meta - Optional metadata (e.g., pagination, timestamps)
 * @returns NextResponse with standardized success format
 *
 * @example
 * ```ts
 * return successResponse({
 *   callId: "123",
 *   status: "queued"
 * }, {
 *   requestId: "req_abc"
 * });
 * ```
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status: 200 },
  );
}

/**
 * Creates an error API response
 *
 * @param error - ApiError instance with code, message, and details
 * @param status - HTTP status code (default: error.status or 500)
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```ts
 * return errorResponse(
 *   new ValidationError("Invalid phone number", { field: "phoneNumber" }),
 *   400
 * );
 * ```
 */
export function errorResponse(
  error: ApiError,
  status?: number,
): NextResponse<ApiResponse> {
  const statusCode = status ?? error.status ?? 500;

  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode },
  );
}

/**
 * Creates a successful response with custom HTTP status code
 *
 * @param data - Response data payload
 * @param status - HTTP status code
 * @param meta - Optional metadata
 * @returns NextResponse with custom status code
 *
 * @example
 * ```ts
 * // 201 Created
 * return successResponseWithStatus({ id: "123" }, 201);
 *
 * // 204 No Content
 * return successResponseWithStatus(null, 204);
 * ```
 */
export function successResponseWithStatus<T>(
  data: T,
  status: number,
  meta?: Record<string, unknown>,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status },
  );
}

/**
 * Creates a paginated response with metadata
 *
 * @param data - Array of items
 * @param pagination - Pagination metadata (total, page, perPage, etc.)
 * @returns NextResponse with pagination metadata
 *
 * @example
 * ```ts
 * return paginatedResponse(calls, {
 *   total: 100,
 *   page: 1,
 *   perPage: 20,
 *   totalPages: 5
 * });
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  },
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination,
      },
    },
    { status: 200 },
  );
}
