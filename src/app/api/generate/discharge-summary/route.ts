import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { generateSummarySchema } from "~/lib/validators/discharge";
import { getUser } from "~/server/actions/auth";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { handleCorsPreflightRequest, withCorsHeaders } from "~/lib/api/cors";
import { generateDischargeSummaryWithRetry } from "~/lib/ai/generate-discharge";
import type { NormalizedEntities } from "~/lib/validators/scribe";
import { normalizePhoneNumber } from "~/lib/utils/phone";

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
 *
 * Request body:
 * {
 *   caseId: string (uuid)
 *   soapNoteId?: string (uuid) - optional, will use latest if not provided
 *   templateId?: string (uuid) - optional discharge summary template
 *   ownerPhone: string - phone number for VAPI call
 *   vapiScheduledFor: Date - when to schedule the VAPI call
 *   vapiVariables?: Record<string, any> - additional VAPI variables
 * }
 *
 * Response:
 * {
 *   success: true
 *   data: {
 *     summaryId: string
 *     vapiCallId: string
 *     content: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate from either cookies or Authorization header
    const { user, supabase, token } = await authenticateRequest(request);

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

    // Fetch case data with metadata (entity extraction)
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select(
        `
        id,
        metadata,
        patients (
          id,
          name,
          species,
          breed,
          owner_name,
          date_of_birth
        )
      `,
      )
      .eq("id", validated.caseId)
      .single();

    if (caseError || !caseData) {
      console.error("[GENERATE_SUMMARY] Case not found", {
        caseId: validated.caseId,
        error: caseError,
      });
      return withCorsHeaders(
        request,
        NextResponse.json({ error: "Case not found" }, { status: 404 }),
      );
    }

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
      console.log("[GENERATE_SUMMARY] No SOAP note found, will use entity extraction only");
    }

    const patient = caseData.patients as unknown as {
      name?: string;
      species?: string;
      breed?: string;
      owner_name?: string;
      date_of_birth?: string;
    } | null;

    const metadata = caseData.metadata as Record<string, unknown> | null;
    const entityExtraction = metadata?.entities as
      | Record<string, unknown>
      | undefined;

    console.log("[GENERATE_SUMMARY] Entity extraction data", {
      hasEntityExtraction: !!entityExtraction,
      entityKeys: entityExtraction ? Object.keys(entityExtraction) : [],
    });

    // Validate we have either SOAP notes or entity extraction
    if (!soapNote?.content && !entityExtraction) {
      console.error("[GENERATE_SUMMARY] No data source available", {
        hasSoapNote: !!soapNote,
        hasEntityExtraction: !!entityExtraction,
      });
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Cannot generate discharge summary: no data source available",
            details:
              "Case must have either SOAP notes or entity extraction. " +
              "Call POST /api/normalize first to extract entities from clinical text.",
            caseId: validated.caseId,
          },
          { status: 400 },
        ),
      );
    }

    console.log("[GENERATE_SUMMARY] Generating discharge summary", {
      caseId: validated.caseId,
      soapNoteId: soapNote?.id ?? null,
      templateId: validated.templateId,
      hasEntityExtraction: !!entityExtraction,
      hasSoapContent: !!soapNote?.content,
    });

    // Generate discharge summary using AI
    // Can work with either SOAP note OR entity extraction data
    let summaryContent: string;
    try {
      summaryContent = await generateDischargeSummaryWithRetry({
        soapContent: soapNote?.content ?? null,
        entityExtraction: (entityExtraction as NormalizedEntities) ?? null,
        patientData: {
          name: patient?.name,
          species: patient?.species,
          breed: patient?.breed,
          owner_name: patient?.owner_name,
        },
        // TODO: Fetch template from database if templateId provided
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
            details: aiError instanceof Error ? aiError.message : "AI generation failed",
          },
          { status: 500 },
        ),
      );
    }

    console.log("[GENERATE_SUMMARY] AI generation successful", {
      contentLength: summaryContent.length,
    });

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
      console.error("[GENERATE_SUMMARY] Database error", {
        error: dbError,
      });
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

    console.log("[GENERATE_SUMMARY] Summary saved to database", {
      summaryId: discharge_summary_id,
      contentLength: summaryContent.length,
    });

    // Only schedule VAPI call if phone number is provided
    let vapiCallId: string | null = null;
    let vapiScheduledFor: string | null = null;

    // Normalize phone number to E.164 format (required by VAPI)
    const normalizedPhone = validated.ownerPhone
      ? normalizePhoneNumber(validated.ownerPhone)
      : null;

    if (normalizedPhone && validated.vapiScheduledFor) {
      // Prepare VAPI call variables
      const vapiVariables = {
        // Core identification
        pet_name: patient?.name ?? "the patient",
        owner_name: patient?.owner_name ?? "",

        // Clinical content
        discharge_summary_content: summaryContent,
        soap_note_content: soapNote?.content ?? "",

        // Entity extraction data (if available)
        ...(entityExtraction && {
          extracted_data: entityExtraction,
        }),

        // Additional variables from request
        ...(validated.vapiVariables ?? {}),
      };

      // Schedule VAPI call using existing endpoint
      const callScheduleUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/calls/schedule`;

      console.log("[GENERATE_SUMMARY] Scheduling VAPI call", {
        url: callScheduleUrl,
        ownerPhone: normalizedPhone,
        originalPhone: validated.ownerPhone,
        scheduledFor: validated.vapiScheduledFor!.toISOString(),
      });

      const callScheduleResponse = await fetch(callScheduleUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          petName: patient?.name ?? "your pet",
          ownerName: patient?.owner_name ?? "Pet Owner",
          callType: "discharge",
          scheduledFor: validated.vapiScheduledFor,
          dischargeSummary: summaryContent,
          clinicName: (vapiVariables as Record<string, unknown>).clinic_name as string | undefined ?? "your veterinary clinic",
          clinicPhone: (vapiVariables as Record<string, unknown>).clinic_phone as string | undefined ?? "",
          emergencyPhone: (vapiVariables as Record<string, unknown>).emergency_phone as string | undefined ?? "",
          appointmentDate: new Date().toLocaleDateString(),
          // Include entity extraction in metadata
          metadata: {
            case_id: validated.caseId,
            soap_note_id: soapNote?.id ?? null,
            discharge_summary_id: discharge_summary_id,
            entity_extraction: entityExtraction,
            ...validated.vapiVariables,
          },
        }),
      });

      if (!callScheduleResponse.ok) {
        const errorData = await callScheduleResponse.json();
        console.error("[GENERATE_SUMMARY] Failed to schedule VAPI call", {
          status: callScheduleResponse.status,
          error: errorData,
        });
        // Don't fail the whole request - just log and continue
        console.warn("[GENERATE_SUMMARY] Continuing without VAPI call");
      } else {
        const callScheduleData = (await callScheduleResponse.json()) as {
          success: boolean;
          data: {
            callId: string;
            scheduledFor: string;
          };
        };

        vapiCallId = callScheduleData.data.callId;
        vapiScheduledFor = callScheduleData.data.scheduledFor;

        console.log("[GENERATE_SUMMARY] VAPI call scheduled successfully", {
          vapiCallId,
          summaryId: discharge_summary_id,
        });
      }
    } else {
      if (validated.ownerPhone && !normalizedPhone) {
        console.warn("[GENERATE_SUMMARY] Invalid phone format, skipping VAPI call", {
          originalPhone: validated.ownerPhone,
        });
      } else {
        console.log("[GENERATE_SUMMARY] Skipping VAPI call - no phone number provided");
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
      stack: error instanceof Error ? error.stack : undefined,
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
