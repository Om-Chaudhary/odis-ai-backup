import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { scheduleCallSchema } from "~/lib/retell/validators";
import { isFutureTime } from "~/lib/utils/business-hours";
import { scheduleCallExecution } from "~/lib/qstash/client";
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
 * Schedule Call API Route
 *
 * POST /api/calls/schedule
 *
 * Creates a scheduled call in the database and enqueues it in QStash
 * for delayed execution at the specified time.
 *
 * This endpoint is designed to accept requests from:
 * - Browser extension (IDEXX Neo integration) - uses Bearer token
 * - Admin dashboard - uses cookies
 * - External integrations - uses Bearer token
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate from either cookies or Authorization header
    const { user, supabase } = await authenticateRequest(request);

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
    const validated = scheduleCallSchema.parse(body);

    console.log("[SCHEDULE_CALL] Received request", {
      phoneNumber: validated.phoneNumber,
      petName: validated.petName,
      scheduledFor: validated.scheduledFor?.toISOString(),
    });

    // Determine scheduled time (default to immediate if not provided)
    const scheduledFor = validated.scheduledFor ?? new Date();

    // Validate scheduled time is in the future
    if (!isFutureTime(scheduledFor)) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 },
      );
    }

    // Get timezone from metadata or use default
    const timezone =
      (body.metadata?.timezone as string) ?? "America/Los_Angeles";

    // Use the scheduled time as-is (no business hours enforcement)
    const finalScheduledTime = scheduledFor;

    // Prepare call variables from input data
    const callVariables = {
      pet_name: validated.petName,
      owner_name: validated.ownerName,
      vet_name: validated.vetName ?? "",
      clinic_name: validated.clinicName ?? "",
      clinic_phone: validated.clinicPhone ?? "",
      discharge_summary_content: validated.dischargeSummary ?? "",
    };

    // Store scheduled call in database
    const { data: scheduledCall, error: dbError } = await supabase
      .from("retell_calls")
      .insert({
        retell_call_id: `scheduled_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Temporary ID
        agent_id: process.env.RETELL_AGENT_ID ?? "",
        phone_number: validated.phoneNumber,
        phone_number_pretty: formatPhoneNumber(validated.phoneNumber),
        call_variables: callVariables,
        metadata: {
          notes: validated.notes,
          scheduled_for: finalScheduledTime.toISOString(),
          timezone,
          retry_count: 0,
          max_retries: 3,
          ...(body.metadata ?? {}),
        },
        status: "scheduled",
        created_by: user.id,
        patient_id: null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[SCHEDULE_CALL] Database error", {
        error: dbError,
      });
      return NextResponse.json(
        { error: "Failed to create scheduled call" },
        { status: 500 },
      );
    }

    // Enqueue job in QStash
    let qstashMessageId: string;
    try {
      qstashMessageId = await scheduleCallExecution(
        scheduledCall.id,
        finalScheduledTime,
      );
    } catch (qstashError) {
      console.error("[SCHEDULE_CALL] QStash error", {
        error: qstashError,
      });

      // Rollback database insert
      await supabase.from("retell_calls").delete().eq("id", scheduledCall.id);

      return NextResponse.json(
        { error: "Failed to schedule call execution" },
        { status: 500 },
      );
    }

    // Update database with QStash message ID
    await supabase
      .from("retell_calls")
      .update({
        metadata: {
          ...scheduledCall.metadata,
          qstash_message_id: qstashMessageId,
        },
      })
      .eq("id", scheduledCall.id);

    console.log("[SCHEDULE_CALL] Call scheduled successfully", {
      callId: scheduledCall.id,
      scheduledFor: finalScheduledTime.toISOString(),
      qstashMessageId,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        callId: scheduledCall.id,
        scheduledFor: finalScheduledTime.toISOString(),
        qstashMessageId,
        petName: validated.petName,
        ownerName: validated.ownerName,
        phoneNumber: validated.phoneNumber,
      },
    });
  } catch (error) {
    console.error("[SCHEDULE_CALL] Error", {
      error: error instanceof Error ? error.message : String(error),
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
    message: "Schedule call endpoint is active",
  });
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove + and non-digits
  const cleaned = phoneNumber.replace(/\D/g, "");

  // US/Canada format
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // International format
  return `+${cleaned}`;
}
