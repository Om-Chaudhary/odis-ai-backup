import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@odis-ai/data-access/db/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { getUser } from "~/server/actions/auth";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/data-access/api/cors";

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

/**
 * Generate SOAP Notes API Route
 *
 * POST /api/generate-soap
 *
 * Proxies requests to Supabase Edge Function for SOAP note generation.
 * Requires authentication via cookies (web app) or Bearer token (extension).
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate from either cookies or Authorization header
    const { user, supabase } = await authenticateRequest(request);

    if (!user || !supabase) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Unauthorized: Authentication required" },
          { status: 401 },
        ),
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const response = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-soap-notes-v2`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: `API Error: ${response.status} - ${errorText}` },
          { status: response.status },
        ),
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    return withCorsHeaders(request, NextResponse.json(data));
  } catch (error) {
    console.error("Error proxying SOAP generation:", error);
    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate SOAP note",
        },
        { status: 500 },
      ),
    );
  }
}

/**
 * OPTIONS /api/generate-soap
 *
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
