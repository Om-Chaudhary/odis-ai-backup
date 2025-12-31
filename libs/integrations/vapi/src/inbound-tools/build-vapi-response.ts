/**
 * VAPI Response Building Utilities
 *
 * Builds properly formatted responses for VAPI tool calls.
 * Handles CORS and the correct response structure.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  withCorsHeaders,
  handleCorsPreflightRequest,
} from "@odis-ai/data-access/api/cors";

/**
 * VAPI tool result format
 */
export interface VapiToolResult {
  results: Array<{
    toolCallId: string;
    result: string;
  }>;
}

/**
 * Build a response in VAPI tool call format
 *
 * When a toolCallId is present, VAPI expects the response in a specific format:
 * ```json
 * {
 *   "results": [{
 *     "toolCallId": "xxx",
 *     "result": "{...stringified JSON...}"
 *   }]
 * }
 * ```
 *
 * When no toolCallId is present (direct testing), returns the result directly.
 *
 * @param request - The NextRequest (for CORS headers)
 * @param result - The result object to return
 * @param toolCallId - The VAPI tool call ID (if present)
 * @param status - HTTP status code (default 200)
 * @returns NextResponse with proper CORS headers
 *
 * @example
 * ```ts
 * // Success response
 * return buildVapiResponse(request, {
 *   success: true,
 *   message: "Appointment booked",
 *   confirmation_number: "ABC123"
 * }, toolCallId);
 *
 * // Error response
 * return buildVapiResponse(request, {
 *   success: false,
 *   error: "Invalid input",
 *   message: "Please provide your name"
 * }, toolCallId, 400);
 * ```
 */
export function buildVapiResponse(
  request: NextRequest,
  result: Record<string, unknown>,
  toolCallId?: string,
  status = 200,
): NextResponse {
  if (toolCallId) {
    // VAPI expects this specific format for tool results
    return withCorsHeaders(
      request,
      NextResponse.json({
        results: [
          {
            toolCallId,
            result: JSON.stringify(result),
          },
        ],
      }),
    );
  }

  // Direct response for testing without VAPI
  return withCorsHeaders(request, NextResponse.json(result, { status }));
}

/**
 * Build a success response
 *
 * @param request - The NextRequest
 * @param data - Success data to include
 * @param message - Human-readable message for the voice AI
 * @param toolCallId - The VAPI tool call ID
 * @returns NextResponse with success format
 */
export function buildSuccessResponse(
  request: NextRequest,
  data: Record<string, unknown>,
  message: string,
  toolCallId?: string,
): NextResponse {
  return buildVapiResponse(
    request,
    {
      success: true,
      ...data,
      message,
    },
    toolCallId,
  );
}

/**
 * Build an error response
 *
 * @param request - The NextRequest
 * @param error - Error code/type
 * @param message - Human-readable error message for the voice AI
 * @param toolCallId - The VAPI tool call ID
 * @param status - HTTP status code (default 400)
 * @returns NextResponse with error format
 */
export function buildErrorResponse(
  request: NextRequest,
  error: string,
  message: string,
  toolCallId?: string,
  status = 400,
): NextResponse {
  return buildVapiResponse(
    request,
    {
      success: false,
      error,
      message,
    },
    toolCallId,
    status,
  );
}

/**
 * Handle CORS preflight OPTIONS request
 *
 * Re-exported from data-access/api for convenience
 */
export { handleCorsPreflightRequest };
