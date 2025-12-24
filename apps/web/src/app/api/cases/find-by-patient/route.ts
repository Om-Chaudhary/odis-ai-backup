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
 * Find Case by Patient API Route
 *
 * GET /api/cases/find-by-patient?patientName=Milu&ownerName=John
 *
 * Finds existing cases for a patient by name and owner name.
 * Used by extension to avoid creating duplicate cases.
 *
 * Query Parameters:
 * - patientName: string (required) - Patient name
 * - ownerName: string (optional) - Owner name for better matching
 * - species: string (optional) - Species for better matching
 *
 * Response:
 * {
 *   found: boolean
 *   cases: Array<{
 *     id: string
 *     type: string
 *     status: string
 *     created_at: string
 *     patient: { id, name, species, owner_name }
 *     hasEntityExtraction: boolean
 *   }>
 * }
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const ownerName = searchParams.get("ownerName");
    const species = searchParams.get("species");

    if (!patientName) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "patientName query parameter is required" },
          { status: 400 },
        ),
      );
    }

    console.log("[FIND_CASE] Searching for cases", {
      userId: user.id,
      patientName,
      ownerName,
      species,
    });

    // Search for patients matching the criteria
    let patientQuery = supabase
      .from("patients")
      .select("id, name, species, owner_name, case_id")
      .eq("user_id", user.id)
      .ilike("name", patientName); // Case-insensitive match

    // Add optional filters
    if (ownerName) {
      patientQuery = patientQuery.ilike("owner_name", ownerName);
    }
    // Note: We intentionally DON'T filter by species because:
    // - "unknown" and null both mean "species unknown"
    // - We want to find existing patients even if species data is incomplete
    // This prevents duplicate patients when species info is missing

    const { data: patients, error: patientError } = await patientQuery;

    if (patientError) {
      console.error("[FIND_CASE] Patient query error", patientError);
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Failed to search for patients" },
          { status: 500 },
        ),
      );
    }

    if (!patients || patients.length === 0) {
      console.log("[FIND_CASE] No patients found");
      return withCorsHeaders(
        request,
        NextResponse.json({
          found: false,
          cases: [],
        }),
      );
    }

    // Get all case IDs from matching patients
    const caseIds = patients
      .map((p) => p.case_id)
      .filter((id): id is string => id !== null);

    if (caseIds.length === 0) {
      console.log("[FIND_CASE] Patients found but no cases");
      return withCorsHeaders(
        request,
        NextResponse.json({
          found: false,
          cases: [],
        }),
      );
    }

    // Fetch cases with metadata and SOAP note count
    const { data: cases, error: casesError } = await supabase
      .from("cases")
      .select(
        `
        id,
        type,
        status,
        metadata,
        created_at,
        patients (
          id,
          name,
          species,
          owner_name
        )
      `,
      )
      .in("id", caseIds)
      .eq("user_id", user.id);

    if (casesError) {
      console.error("[FIND_CASE] Cases query error", casesError);
      return withCorsHeaders(
        request,
        NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 }),
      );
    }

    // Get SOAP note counts for each case
    const soapNoteCounts = new Map<string, number>();
    for (const caseData of cases) {
      const { count } = await supabase
        .from("soap_notes")
        .select("*", { count: "exact", head: true })
        .eq("case_id", caseData.id);

      soapNoteCounts.set(caseData.id, count ?? 0);
    }

    // Format response with content flags
    const formattedCases = cases.map((c) => {
      const metadata = c.metadata as Record<string, unknown> | null;
      const hasEntityExtraction = !!metadata?.entities;
      const hasSoapNotes = (soapNoteCounts.get(c.id) ?? 0) > 0;

      return {
        id: c.id,
        type: c.type,
        status: c.status,
        created_at: c.created_at,
        patient: c.patients,
        hasEntityExtraction,
        hasSoapNotes,
        soapNoteCount: soapNoteCounts.get(c.id) ?? 0,
      };
    });

    // Sort by content priority:
    // 1. Cases with BOTH entity extraction AND SOAP notes (most complete)
    // 2. Cases with SOAP notes only (has clinical data)
    // 3. Cases with entity extraction only (structured data)
    // 4. Newest case (fallback)
    formattedCases.sort((a, b) => {
      // Priority score: higher is better
      const scoreA = (a.hasEntityExtraction ? 2 : 0) + (a.hasSoapNotes ? 4 : 0);
      const scoreB = (b.hasEntityExtraction ? 2 : 0) + (b.hasSoapNotes ? 4 : 0);

      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher score first
      }

      // If same priority, prefer newer
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    console.log("[FIND_CASE] Found cases", {
      count: formattedCases.length,
      caseIds: formattedCases.map((c) => c.id),
    });

    return withCorsHeaders(
      request,
      NextResponse.json({
        found: formattedCases.length > 0,
        cases: formattedCases,
      }),
    );
  } catch (error) {
    console.error("[FIND_CASE] Error", {
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
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
