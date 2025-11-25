/**
 * GET /api/vapi/calls
 *
 * Lists all VAPI calls for the authenticated user with optional filtering.
 *
 * Query parameters:
 * - status: Filter by call status (e.g., 'queued', 'in-progress', 'ended')
 * - conditionCategory: Filter by condition category
 * - limit: Maximum number of results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { listVapiCalls } from "~/lib/vapi/call-manager";
import { handleCorsPreflightRequest, withCorsHeaders } from "~/lib/api/cors";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { getUser } from "~/server/actions/auth";

/**
 * Authenticate user from either cookies (web app) or Authorization header (extension)
 */
async function authenticateRequest(request: NextRequest) {
  // Check for Authorization header (browser extension)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    // Create a Supabase client with the token
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
      return { user: null, supabase: null };
    }

    return { user, supabase };
  }

  // Fall back to cookie-based auth (web app)
  const user = await getUser();
  if (!user) {
    return { user: null, supabase: null };
  }

  const supabase = await createClient();
  return { user, supabase };
}

export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const { user, supabase } = await authenticateRequest(request);

    if (!user || !supabase) {
      return withCorsHeaders(
        request,
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    // Step 2: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") ?? undefined;
    const conditionCategory =
      searchParams.get("conditionCategory") ?? undefined;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || isNaN(offset)) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Invalid limit or offset parameter" },
          { status: 400 },
        ),
      );
    }

    // Step 3: Get calls from database
    const calls = await listVapiCalls(user.id, {
      status,
      conditionCategory,
      limit,
      offset,
    });

    // Step 4: Return response
    return withCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        data: calls,
        pagination: {
          limit,
          offset,
          count: calls.length,
        },
      }),
    );
  } catch (error) {
    console.error("Error listing VAPI calls:", error);
    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          error: "Internal server error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
        { status: 500 },
      ),
    );
  }
}

/**
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
