import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@odis-ai/db/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { getUser } from "~/server/actions/auth";
import type { IngestPayload } from "@odis-ai/types";

// Dynamic import to avoid bundling @react-email/components during static generation
async function getCasesService() {
  const { CasesService } = await import("@odis-ai/services-cases");
  return CasesService;
}
import { z } from "zod";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/api/cors";
import {
  IdexxIngestRequestSchema,
  type IdexxIngestResponse,
} from "@odis-ai/validators";

// --- Schemas ---

/**
 * Legacy IngestPayload schema (for backward compatibility)
 */
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

/**
 * Check if the request body is in the new IDEXX appointment format
 */
function isIdexxFormat(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "appointment" in body &&
    typeof (body as Record<string, unknown>).appointment === "object"
  );
}

/**
 * Transform IDEXX appointment data to IngestPayload format
 */
function transformIdexxToPayload(
  appointment: Record<string, unknown>,
  options?: { autoSchedule?: boolean },
): IngestPayload {
  return {
    mode: "structured",
    source: "idexx_extension",
    data: appointment,
    options: {
      autoSchedule: options?.autoSchedule ?? false,
    },
  };
}

// --- Route Handler ---
export async function GET(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json({
      message: "Cases ingest endpoint is available",
      methods: ["POST", "OPTIONS"],
      endpoint: "/api/cases/ingest",
      formats: [
        {
          name: "idexx",
          description: "IDEXX appointment format with generation tracking",
          example: {
            appointment: {
              pet_name: "Max",
              species: "dog",
              consultation_notes: "...",
            },
            options: { autoSchedule: false },
          },
        },
        {
          name: "legacy",
          description: "Legacy structured/text format",
          example: {
            mode: "structured",
            source: "idexx_extension",
            data: { pet_name: "Max" },
          },
        },
      ],
    }),
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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

    // 2. Parse body
    const body = await request.json();

    // 3. Detect format and validate
    if (isIdexxFormat(body)) {
      // New IDEXX appointment format
      const validation = IdexxIngestRequestSchema.safeParse(body);

      if (!validation.success) {
        return withCorsHeaders(
          request,
          NextResponse.json(
            {
              success: false,
              error: "Validation failed",
              details: validation.error.format(),
            } satisfies Partial<IdexxIngestResponse>,
            { status: 400 },
          ),
        );
      }

      const { appointment, options } = validation.data;

      // Check for euthanasia before processing
      const isEuthanasia =
        appointment.consultation_notes?.toLowerCase().includes("euthanasia") ||
        appointment.consultation_notes?.toLowerCase().includes("euthanize") ||
        appointment.appointment_type?.toLowerCase().includes("euthanasia");

      if (isEuthanasia) {
        console.warn("[CASES_INGEST] Euthanasia case detected - skipping", {
          userId: user.id,
          petName: appointment.pet_name,
        });

        return withCorsHeaders(
          request,
          NextResponse.json(
            {
              success: false,
              error:
                "Euthanasia cases are not eligible for discharge workflow",
            } satisfies Partial<IdexxIngestResponse>,
            { status: 422 },
          ),
        );
      }

      // Transform to IngestPayload
      const payload = transformIdexxToPayload(
        appointment as unknown as Record<string, unknown>,
        options,
      );

      console.log("[CASES_INGEST] Processing IDEXX appointment", {
        userId: user.id,
        petName: appointment.pet_name,
        hasConsultationNotes: !!appointment.consultation_notes,
        autoSchedule: options?.autoSchedule ?? false,
      });

      // Execute with timing
      const entityStart = Date.now();
      const CasesService = await getCasesService();
      const result = await CasesService.ingest(supabase, user.id, payload);
      const entityEnd = Date.now();

      // Build detailed response
      const response: IdexxIngestResponse = {
        success: true,
        data: {
          caseId: result.caseId,
          patientName: result.entities.patient.name,
          ownerName: result.entities.patient.owner.name,
          ownerPhone: result.entities.patient.owner.phone,
          ownerEmail: result.entities.patient.owner.email,
          generation: {
            entityExtraction: result.entities ? "completed" : "failed",
            dischargeSummary: "completed", // CasesService.ingest() auto-generates for IDEXX
            callIntelligence: "completed", // CasesService.ingest() auto-generates for IDEXX
          },
          scheduledCall: result.scheduledCall
            ? {
                id: result.scheduledCall.id,
                scheduledFor: result.scheduledCall.scheduled_for,
              }
            : null,
          timing: {
            totalMs: Date.now() - startTime,
            entityExtractionMs: entityEnd - entityStart,
          },
        },
      };

      console.log("[CASES_INGEST] Successfully processed IDEXX appointment", {
        userId: user.id,
        caseId: result.caseId,
        patientName: result.entities.patient.name,
        totalMs: response.data?.timing.totalMs,
      });

      return withCorsHeaders(request, NextResponse.json(response));
    } else {
      // Legacy format
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

      // Execute Service
      const CasesService = await getCasesService();
      const result = await CasesService.ingest(supabase, user.id, payload);

      // Response (legacy format)
      return withCorsHeaders(
        request,
        NextResponse.json({
          success: true,
          data: result,
        }),
      );
    }
  } catch (error) {
    console.error("[CASES_INGEST] Error:", error);
    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Internal Server Error",
        } satisfies Partial<IdexxIngestResponse>,
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
