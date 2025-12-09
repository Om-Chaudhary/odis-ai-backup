import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@odis/db/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { getUser } from "~/server/actions/auth";
import type { IngestPayload } from "~/types/services";

// Dynamic import to avoid bundling @react-email/components during static generation
async function getCasesService() {
  const { CasesService } = await import("@odis/services/cases-service");
  return CasesService;
}
import { z } from "zod";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis/api/cors";

// --- Schemas ---
const IngestPayloadSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("text"),
    source: z.enum([
      "manual",
      "mobile_app",
      "web_dashboard",
      "idexx_neo",
      "idexx_extension",
      "ezyvet_api",
    ]),
    text: z.string().min(1),
    options: z
      .object({
        autoSchedule: z.boolean().optional(),
        inputType: z.string().optional(),
      })
      .optional(),
  }),
  z.object({
    mode: z.literal("structured"),
    source: z.enum([
      "manual",
      "mobile_app",
      "web_dashboard",
      "idexx_neo",
      "idexx_extension",
      "ezyvet_api",
    ]),
    data: z.record(z.any()),
    options: z
      .object({
        autoSchedule: z.boolean().optional(),
      })
      .optional(),
  }),
]);

// --- Auth Helper ---
async function authenticateRequest(request: NextRequest) {
  // Check for Authorization header (browser extension/API)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

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
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return { user: null, supabase: null };
    return { user, supabase };
  }

  // Fall back to cookie-based auth (web app)
  const user = await getUser();
  if (!user) return { user: null, supabase: null };

  const supabase = await createClient();
  return { user, supabase };
}

// --- Route Handler ---
export async function GET(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json({
      message: "Cases ingest endpoint is available",
      methods: ["POST", "OPTIONS"],
      endpoint: "/api/cases/ingest",
    }),
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { user, supabase } = await authenticateRequest(request);
    if (!user || !supabase) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Unauthorized" },
          {
            status: 401,
          },
        ),
      );
    }

    // 2. Parse & Validate
    const body = await request.json();
    const validation = IngestPayloadSchema.safeParse(body);

    if (!validation.success) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Validation failed",
            details: validation.error.format(),
          },
          { status: 400 },
        ),
      );
    }

    const payload = validation.data as IngestPayload;

    // 3. Execute Service
    const CasesService = await getCasesService();
    const result = await CasesService.ingest(supabase, user.id, payload);

    // 4. Response
    return withCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        data: result,
      }),
    );
  } catch (error) {
    console.error("[CASES_INGEST] Error:", error);
    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Internal Server Error",
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

/**
 * Handle unsupported HTTP methods
 * This helps debug 405 errors by providing clear error messages
 */
export async function PUT(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json(
      {
        error: "Method Not Allowed",
        message: "PUT method is not supported. Use POST instead.",
        allowedMethods: ["GET", "POST", "OPTIONS"],
      },
      { status: 405 },
    ),
  );
}

export async function DELETE(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json(
      {
        error: "Method Not Allowed",
        message: "DELETE method is not supported. Use POST instead.",
        allowedMethods: ["GET", "POST", "OPTIONS"],
      },
      { status: 405 },
    ),
  );
}

export async function PATCH(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json(
      {
        error: "Method Not Allowed",
        message: "PATCH method is not supported. Use POST instead.",
        allowedMethods: ["GET", "POST", "OPTIONS"],
      },
      { status: 405 },
    ),
  );
}
