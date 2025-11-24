import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { generateSummarySchema } from "~/lib/validators/discharge";
import { getUser } from "~/server/actions/auth";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { handleCorsPreflightRequest, withCorsHeaders } from "~/lib/api/cors";
import { generateDischargeSummaryWithRetry } from "~/lib/ai/generate-discharge";
import { normalizePhoneNumber } from "~/lib/utils/phone";
import { CasesService } from "~/lib/services/cases-service";

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
      return { user: null, supabase: null, token: null };
    }

    return { user, supabase, token };
  }

  // Fall back to cookie-based auth (web app)
  const user = await getUser();
  if (!user) {
    return { user: null, supabase: null, token: null };
  }

  const supabase = await createClient();
  return { user, supabase, token: null };
}

/**
 * Generate Discharge Summary API Route
 *
 * POST /api/generate/discharge-summary
 *
 * Generates a discharge summary from case data and SOAP notes,
 * then schedules a VAPI call with the summary content.
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

    // Parse and validate request body
    const body = await request.json();
    const validated = generateSummarySchema.parse(body);

    console.log("[GENERATE_SUMMARY] Received request", {
      userId: user.id,
      caseId: validated.caseId,
      soapNoteId: validated.soapNoteId,
      ownerPhone: validated.ownerPhone,
      vapiScheduledFor: validated.vapiScheduledFor?.toISOString() ?? null,
    });

    // Fetch case data via Service
    const caseInfo = await CasesService.getCaseWithEntities(
      supabase,
      validated.caseId,
    );

    if (!caseInfo) {
      console.error("[GENERATE_SUMMARY] Case not found", {
        caseId: validated.caseId,
      });
      return withCorsHeaders(
        request,
        NextResponse.json({ error: "Case not found" }, { status: 404 }),
      );
    }

    const { entities: entityExtraction, patient: patientRaw } = caseInfo;

    // Normalize patient data (can be single object, array, or null)
    const patient = Array.isArray(patientRaw)
      ? (patientRaw[0] ?? null)
      : (patientRaw ?? null);

    // Fetch SOAP note (optional - can work with just entity extraction)
    let soapNote: { id: string; content: string } | null = null;

    let soapQuery = supabase
      .from("soap_notes")
      .select("id, content, created_at")
      .eq("case_id", validated.caseId);

    if (validated.soapNoteId) {
      soapQuery = soapQuery.eq("id", validated.soapNoteId);
    }

    const { data: soapNotes } = await soapQuery
      .order("created_at", { ascending: false })
      .limit(1);

    if (soapNotes && soapNotes.length > 0) {
      soapNote = soapNotes[0]!;
      console.log("[GENERATE_SUMMARY] Using SOAP note:", soapNote.id);
    } else {
      console.log(
        "[GENERATE_SUMMARY] No SOAP note found, will use entity extraction only",
      );
    }

    console.log("[GENERATE_SUMMARY] Entity extraction data", {
      hasEntityExtraction: !!entityExtraction,
      entityKeys: entityExtraction ? Object.keys(entityExtraction) : [],
    });

    // Validate we have either SOAP notes or entity extraction
    if (!soapNote?.content && !entityExtraction) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error:
              "Cannot generate discharge summary: no data source available",
            details:
              "Case must have either SOAP notes or entity extraction. " +
              "Call POST /api/normalize first to extract entities from clinical text.",
            caseId: validated.caseId,
          },
          { status: 400 },
        ),
      );
    }

    // Generate discharge summary using AI
    let summaryContent: string;
    try {
      summaryContent = await generateDischargeSummaryWithRetry({
        soapContent: soapNote?.content ?? null,
        entityExtraction: entityExtraction ?? null,
        patientData: {
          name: patient?.name ?? undefined,
          species: patient?.species ?? undefined,
          breed: patient?.breed ?? undefined,
          owner_name: patient?.owner_name ?? undefined,
        },
        template: undefined,
      });
    } catch (aiError) {
      console.error("[GENERATE_SUMMARY] AI generation error", {
        error: aiError instanceof Error ? aiError.message : String(aiError),
      });
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Failed to generate discharge summary",
            details:
              aiError instanceof Error
                ? aiError.message
                : "AI generation failed",
          },
          { status: 500 },
        ),
      );
    }

    // Save discharge summary to database
    const { data: dischargeSummary, error: dbError } = await supabase
      .from("discharge_summaries")
      .insert({
        case_id: validated.caseId,
        user_id: user.id,
        content: summaryContent,
        soap_note_id: soapNote?.id ?? null,
        template_id: validated.templateId ?? null,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("[GENERATE_SUMMARY] Database error", { error: dbError });
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Failed to save discharge summary",
            details: dbError.message,
          },
          { status: 500 },
        ),
      );
    }

    const discharge_summary_id = dischargeSummary.id;

    // Only schedule VAPI call if phone number is provided
    let vapiCallId: string | null = null;
    let vapiScheduledFor: string | null = null;

    const normalizedPhone = validated.ownerPhone
      ? normalizePhoneNumber(validated.ownerPhone)
      : null;

    if (normalizedPhone && validated.vapiScheduledFor) {
      try {
        const scheduledCall = await CasesService.scheduleDischargeCall(
          supabase,
          user.id,
          validated.caseId,
          {
            scheduledAt: validated.vapiScheduledFor,
            notes: "Scheduled via Discharge Summary Generator",
            summaryContent: summaryContent,
            // Pass overrides from request
            ...(validated.vapiVariables ?? {}),
          },
        );

        vapiCallId = scheduledCall.id;
        vapiScheduledFor = scheduledCall.scheduled_for;

        console.log("[GENERATE_SUMMARY] VAPI call scheduled successfully", {
          vapiCallId,
          summaryId: discharge_summary_id,
        });
      } catch (scheduleError) {
        console.error(
          "[GENERATE_SUMMARY] Failed to schedule VAPI call",
          scheduleError,
        );
        // Continue without VAPI call
      }
    } else {
      if (validated.ownerPhone && !normalizedPhone) {
        console.warn(
          "[GENERATE_SUMMARY] Invalid phone format, skipping VAPI call",
        );
      }
    }

    return withCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        data: {
          summaryId: discharge_summary_id,
          vapiCallId,
          content: summaryContent,
          caseId: validated.caseId,
          soapNoteId: soapNote?.id ?? null,
          vapiScheduledFor,
        },
      }),
    );
  } catch (error) {
    console.error("[GENERATE_SUMMARY] Error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Internal server error",
        },
        { status: 500 },
      ),
    );
  }
}

/**
 * Health check endpoint
 */
export function GET(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json({
      status: "ok",
      message: "Generate discharge summary endpoint is active",
    }),
  );
}

/**
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
