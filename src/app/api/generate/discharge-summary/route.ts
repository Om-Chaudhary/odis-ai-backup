import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "~/lib/supabase/server";
import { generateSummarySchema } from "~/lib/validators/discharge";
import { getUser } from "~/server/actions/auth";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";

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
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 },
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
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
      vapiScheduledFor: validated.vapiScheduledFor.toISOString(),
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
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Fetch SOAP note
    let soapQuery = supabase
      .from("soap_notes")
      .select("id, content, created_at")
      .eq("case_id", validated.caseId);

    if (validated.soapNoteId) {
      soapQuery = soapQuery.eq("id", validated.soapNoteId);
    }

    const { data: soapNotes, error: soapError } = await soapQuery
      .order("created_at", { ascending: false })
      .limit(1);

    if (soapError || !soapNotes || soapNotes.length === 0) {
      console.error("[GENERATE_SUMMARY] SOAP note not found", {
        caseId: validated.caseId,
        soapNoteId: validated.soapNoteId,
        error: soapError,
      });
      return NextResponse.json(
        { error: "SOAP note not found for this case" },
        { status: 404 },
      );
    }

    const soapNote = soapNotes[0];
    const patient = caseData.patients as unknown as {
      name?: string;
      species?: string;
      breed?: string;
      owner_name?: string;
      date_of_birth?: string;
    } | null;

    const metadata = caseData.metadata as Record<string, unknown> | null;
    const entityExtraction = metadata?.entity_extraction as
      | Record<string, unknown>
      | undefined;

    console.log("[GENERATE_SUMMARY] Entity extraction data", {
      hasEntityExtraction: !!entityExtraction,
      entityKeys: entityExtraction ? Object.keys(entityExtraction) : [],
    });

    // Prepare data for Edge Function
    // Get service client to call Edge Function
    const serviceClient = await createServiceClient();

    console.log("[GENERATE_SUMMARY] Calling Edge Function", {
      caseId: validated.caseId,
      soapNoteId: soapNote.id,
      templateId: validated.templateId,
    });

    // Call Supabase Edge Function to generate discharge summary
    const { data: summaryResponse, error: edgeFunctionError } =
      await serviceClient.functions.invoke("generate-discharge-summary", {
        body: {
          case_id: validated.caseId,
          soap_note_id: soapNote.id,
          soap_content: soapNote.content,
          transcripts: [], // TODO: Fetch transcripts from case if available
          template_id: validated.templateId,
          user_id: user.id,
        },
      });

    if (edgeFunctionError) {
      console.error("[GENERATE_SUMMARY] Edge Function error", {
        error: edgeFunctionError,
      });
      return NextResponse.json(
        {
          error: "Failed to generate discharge summary",
          details: edgeFunctionError.message,
        },
        { status: 500 },
      );
    }

    const { discharge_summary_id, content: summaryContent } =
      summaryResponse as {
        discharge_summary_id: string;
        content: string;
        template_id?: string;
      };

    console.log("[GENERATE_SUMMARY] Summary generated successfully", {
      summaryId: discharge_summary_id,
      contentLength: summaryContent.length,
    });

    // Prepare VAPI call variables
    const vapiVariables = {
      // Core identification
      pet_name: patient?.name ?? "the patient",
      owner_name: patient?.owner_name ?? "",

      // Clinical content
      discharge_summary_content: summaryContent,
      soap_note_content: soapNote.content,

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
      ownerPhone: validated.ownerPhone,
      scheduledFor: validated.vapiScheduledFor.toISOString(),
    });

    const callScheduleResponse = await fetch(callScheduleUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        phoneNumber: validated.ownerPhone,
        petName: patient?.name ?? "your pet",
        ownerName: patient?.owner_name ?? "Pet Owner",
        callType: "discharge",
        scheduledFor: validated.vapiScheduledFor,
        dischargeSummary: summaryContent,
        clinicName: vapiVariables.clinic_name ?? "your veterinary clinic",
        clinicPhone: vapiVariables.clinic_phone ?? "",
        emergencyPhone: vapiVariables.emergency_phone ?? "",
        appointmentDate: new Date().toLocaleDateString(),
        // Include entity extraction in metadata
        metadata: {
          case_id: validated.caseId,
          soap_note_id: soapNote.id,
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
      return NextResponse.json(
        {
          error: "Failed to schedule VAPI call",
          details: errorData.error,
        },
        { status: 500 },
      );
    }

    const callScheduleData = (await callScheduleResponse.json()) as {
      success: boolean;
      data: {
        callId: string;
        scheduledFor: string;
      };
    };

    console.log("[GENERATE_SUMMARY] VAPI call scheduled successfully", {
      vapiCallId: callScheduleData.data.callId,
      summaryId: discharge_summary_id,
    });

    return NextResponse.json({
      success: true,
      data: {
        summaryId: discharge_summary_id,
        vapiCallId: callScheduleData.data.callId,
        content: summaryContent,
        caseId: validated.caseId,
        soapNoteId: soapNote.id,
        vapiScheduledFor: callScheduleData.data.scheduledFor,
      },
    });
  } catch (error) {
    console.error("[GENERATE_SUMMARY] Error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Generate discharge summary endpoint is active",
  });
}
