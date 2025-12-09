/**
 * API Authentication & Authorization Utilities
 *
 * Provides reusable authentication patterns for Next.js API routes:
 * - Automatic detection of cookie-based or Bearer token auth
 * - Role-based authorization with hierarchy
 * - Standardized error handling
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@odis-ai/db/server";
import { env } from "@odis-ai/env";
import type { User } from "@supabase/supabase-js";
import { getCorsHeaders } from "./cors";

/* ========================================
   Type Definitions
   ======================================== */

/**
 * Authentication result containing user and Supabase client
 */
export interface AuthResult {
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * User role from database
 */
type UserRole = "admin" | "user" | "guest";

/**
 * Options for authentication middleware
 */
export interface AuthOptions {
  /**
   * Required role for this endpoint
   * @default undefined (any authenticated user)
   */
  requireRole?: UserRole;

  /**
   * Custom error messages
   */
  messages?: {
    unauthorized?: string;
    forbidden?: string;
  };
}

/* ========================================
   Authentication
   ======================================== */

/**
 * Authenticate user from either cookies or Bearer token
 *
 * Automatically detects authentication method:
 * 1. Bearer token (browser extensions) - Authorization: Bearer <token>
 * 2. Cookie-based (web app) - Supabase session cookies
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const auth = await authenticateUser(request);
 *   if (!auth.success) return auth.response;
 *
 *   const { user, supabase } = auth.data;
 *   // ... your logic
 * }
 * ```
 */
export async function authenticateUser(
  request: NextRequest,
  options: AuthOptions = {},
): Promise<
  | { success: true; data: AuthResult }
  | { success: false; response: NextResponse<ApiErrorResponse> }
> {
  const { requireRole, messages = {} } = options;

  // Try Bearer token first, then fall back to cookies
  const authResult =
    (await authenticateWithBearerToken(request)) ??
    (await authenticateWithCookies());

  // No valid authentication found
  if (!authResult) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: messages.unauthorized ?? "Authentication required",
        },
        { status: 401 },
      ),
    };
  }

  // Check role requirement if specified
  if (requireRole) {
    const hasRole = await checkUserRole(
      authResult.user.id,
      requireRole,
      authResult.supabase,
    );

    if (!hasRole) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Forbidden",
            message:
              messages.forbidden ??
              `${requireRole.charAt(0).toUpperCase() + requireRole.slice(1)} access required`,
          },
          { status: 403 },
        ),
      };
    }
  }

  return {
    success: true,
    data: authResult,
  };
}

/**
 * Authenticate using Authorization Bearer token
 * Used by browser extensions and external clients
 */
async function authenticateWithBearerToken(
  request: NextRequest,
): Promise<AuthResult | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  // Create Supabase client with token
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for token-based auth
        },
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}

/**
 * Authenticate using session cookies
 * Standard authentication for web app users
 */
async function authenticateWithCookies(): Promise<AuthResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}

/**
 * Check if user has required role
 */
async function checkUserRole(
  userId: string,
  requiredRole: UserRole,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile?.role) {
    return false;
  }

  // Role hierarchy: admin > user > guest
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    user: 2,
    guest: 1,
  };

  const userRoleLevel = roleHierarchy[profile.role as UserRole] ?? 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] ?? 0;

  return userRoleLevel >= requiredRoleLevel;
}

/* ========================================
   Helper Functions
   ======================================== */

/**
 * Standard error response helper
 *
 * @param error - Error message
 * @param status - HTTP status code
 * @param details - Additional error details
 * @param request - Optional request for CORS headers
 */
export function errorResponse(
  error: string,
  status = 500,
  details?: Record<string, unknown>,
  request?: NextRequest,
): NextResponse<ApiErrorResponse> {
  const headers = request ? getCorsHeaders(request.headers.get("origin")) : {};

  return NextResponse.json(
    {
      error,
      ...details,
    },
    { status, headers },
  );
}

/**
 * Standard success response helper
 *
 * @param data - Response data
 * @param status - HTTP status code
 * @param request - Optional request for CORS headers
 */
export function successResponse<T>(
  data: T,
  status = 200,
  request?: NextRequest,
): NextResponse<T> {
  const headers = request ? getCorsHeaders(request.headers.get("origin")) : {};

  return NextResponse.json(data, { status, headers });
}

/* ========================================
   Higher-Order Function Pattern
   ======================================== */

/**
 * Type for API route handler
 */
type RouteHandler<T = unknown> = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse<T>>;

/**
 * Type for authenticated route handler
 */
type AuthenticatedRouteHandler<T = unknown> = (
  request: NextRequest,
  auth: AuthResult,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse<T | ApiErrorResponse>>;

/**
 * Higher-order function to create authenticated API routes
 *
 * Automatically detects authentication method (cookies or Bearer token)
 * and wraps your route handler with authentication and error handling.
 *
 * @example
 * ```ts
 * // Any authenticated user (extension or web app)
 * export const POST = withAuth(async (request, { user, supabase }) => {
 *   // user and supabase are guaranteed to exist
 *   return successResponse({ data: "..." });
 * });
 *
 * // Admin only
 * export const DELETE = withAuth(
 *   async (request, { user, supabase }) => {
 *     // Only admins can access
 *     return successResponse({ deleted: true });
 *   },
 *   { requireRole: 'admin' }
 * );
 * ```
 */
export function withAuth<T = unknown>(
  handler: AuthenticatedRouteHandler<T>,
  options: AuthOptions = {},
): RouteHandler<T | ApiErrorResponse> {
  return async (request, context) => {
    try {
      // Authenticate user (auto-detects cookie or Bearer token)
      const auth = await authenticateUser(request, options);
      if (!auth.success) {
        return auth.response;
      }

      // Call the actual handler
      return await handler(request, auth.data, context);
    } catch (error) {
      console.error("[API] Error in authenticated route:", error);
      return errorResponse("Internal server error", 500, {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
