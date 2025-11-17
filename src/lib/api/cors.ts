/**
 * CORS Utilities for API Routes
 *
 * Provides CORS support for routes that need to be accessed from IDEXX Neo domains.
 * Handles preflight OPTIONS requests and adds appropriate CORS headers to responses.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ========================================
   Configuration
   ======================================== */

/**
 * Allowed IDEXX Neo domains for CORS
 *
 * Based on the IDEXX Neo browser extension manifest:
 * - Regional domains (US, CA, UK)
 * - Cloud domains
 * - Neo.vet domain
 * - NeoSuite domains
 */
export const IDEXX_ALLOWED_ORIGINS = [
  // Regional IDEXX Neo domains
  "https://us.idexxneo.com",
  "https://ca.idexxneo.com",
  "https://uk.idexxneo.com",

  // IDEXX Neo Cloud domains
  "https://idexxneocloud.com",
  "https://*.idexxneocloud.com",

  // Neo.vet domain
  "https://neo.vet",

  // NeoSuite domains
  "https://neosuite.com",
  "https://*.neosuite.com",
] as const;

/**
 * Allowed HTTP methods for CORS
 */
export const CORS_ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"] as const;

/**
 * Allowed headers for CORS
 */
export const CORS_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Accept",
] as const;

/**
 * Max age for preflight cache (24 hours)
 */
export const CORS_MAX_AGE = 86400;

/* ========================================
   CORS Headers
   ======================================== */

/**
 * Get CORS headers for a given origin
 *
 * @param origin - The request origin (from request.headers.get('origin'))
 * @param allowCredentials - Whether to allow credentials (cookies, auth)
 * @returns Headers object with CORS headers
 */
export function getCorsHeaders(
  origin: string | null,
  allowCredentials = true,
): HeadersInit {
  // Check if origin is allowed
  const isAllowed = origin && isOriginAllowed(origin);

  return {
    // Allow specific origin or all origins
    "Access-Control-Allow-Origin": isAllowed ? origin : "*",

    // Allow credentials (cookies, authorization headers)
    ...(allowCredentials && isAllowed && {
      "Access-Control-Allow-Credentials": "true",
    }),

    // Allowed methods
    "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS.join(", "),

    // Allowed headers
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS.join(", "),

    // Max age for preflight cache
    "Access-Control-Max-Age": CORS_MAX_AGE.toString(),
  };
}

/**
 * Check if an origin is allowed
 *
 * Supports both exact matches and wildcard patterns (*.domain.com)
 *
 * @param origin - The origin to check
 * @returns true if origin is allowed
 */
export function isOriginAllowed(origin: string): boolean {
  return IDEXX_ALLOWED_ORIGINS.some((allowedOrigin) => {
    // Exact match
    if (allowedOrigin === origin) {
      return true;
    }

    // Wildcard pattern (*.domain.com)
    if (allowedOrigin.includes("*")) {
      const pattern = allowedOrigin.replace("*", ".*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }

    return false;
  });
}

/* ========================================
   Preflight Handler
   ======================================== */

/**
 * Handle CORS preflight OPTIONS request
 *
 * Returns a 204 No Content response with CORS headers
 *
 * @example
 * ```ts
 * export async function OPTIONS(request: NextRequest) {
 *   return handleCorsPreflightRequest(request);
 * }
 * ```
 *
 * @param request - The NextRequest object
 * @returns NextResponse with CORS headers
 */
export function handleCorsPreflightRequest(
  request: NextRequest,
): NextResponse {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/* ========================================
   Response Wrapper
   ======================================== */

/**
 * Add CORS headers to an existing NextResponse
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const response = NextResponse.json({ data: "..." });
 *   return withCorsHeaders(request, response);
 * }
 * ```
 *
 * @param request - The NextRequest object
 * @param response - The NextResponse to add headers to
 * @returns NextResponse with CORS headers added
 */
export function withCorsHeaders(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Add CORS headers to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create a JSON response with CORS headers
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   return corsJsonResponse(request, { data: "..." });
 * }
 * ```
 *
 * @param request - The NextRequest object
 * @param data - The data to return as JSON
 * @param init - Response init options (status, headers, etc.)
 * @returns NextResponse with JSON data and CORS headers
 */
export function corsJsonResponse<T>(
  request: NextRequest,
  data: T,
  init?: ResponseInit,
): NextResponse<T> {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  });
}
