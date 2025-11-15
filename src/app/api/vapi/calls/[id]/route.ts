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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Get call status
    const callStatus = await getVapiCallStatus(id, user.id);

    if (!callStatus) {
      return NextResponse.json(
        { error: "Call not found or you do not have permission to view it" },
        { status: 404 },
      );
    }

    // Step 3: Return response
    return NextResponse.json({
      success: true,
      data: callStatus,
    });
  } catch (error) {
    console.error("Error getting VAPI call status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
