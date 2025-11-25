/**
 * GET /api/vapi/calls/[id]
 *
 * Gets the status and details of a specific VAPI call by its database ID.
 *
 * Path parameters:
 * - id: Database ID of the call
 */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { getVapiCallStatus } from "~/lib/vapi/call-manager";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Step 1: Authenticate user
    const { user, supabase } = await authenticateRequest(request);

    if (!user || !supabase) {
      return withCorsHeaders(
        request,
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    // Step 2: Get call status
    const callStatus = await getVapiCallStatus(id, user.id);

    if (!callStatus) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Call not found or you do not have permission to view it" },
          { status: 404 },
        ),
      );
    }

    // Step 3: Return response
    return withCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        data: callStatus,
      }),
    );
  } catch (error) {
    console.error("Error getting VAPI call status:", error);
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
