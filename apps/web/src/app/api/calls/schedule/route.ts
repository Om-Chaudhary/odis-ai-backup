import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@odis-ai/data-access/db/server";
import { scheduleCallSchema } from "@odis-ai/integrations/retell/validators";
import { isFutureTime } from "@odis-ai/shared/util/business-hours";
import { scheduleCallExecution } from "@odis-ai/integrations/qstash/client";
import { getUser } from "~/server/actions/auth";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/data-access/api/cors";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { getClinicVapiConfigByUserId } from "@odis-ai/domain/clinics";

// Dynamic import for lazy-loaded vapi library
async function getVapiUtils() {
  const { extractFirstName } = await import("@odis-ai/integrations/vapi/utils");
  return { extractFirstName };
}

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
    const validated = scheduleCallSchema.parse(body);

    console.log("[SCHEDULE_CALL] Received request", {
      phoneNumber: validated.phoneNumber,
      petName: validated.petName,
      callType: validated.callType,
      scheduledFor: validated.scheduledFor?.toISOString(),
    });

    // Fetch user settings (always needed for test mode check)
    let clinicName = validated.clinicName;
    let clinicPhone = validated.clinicPhone;
    let emergencyPhone = validated.emergencyPhone;
    const agentName = "Sarah"; // Always use Sarah
    let testModeEnabled = false;

    // Fetch user settings to check test mode and fill in missing clinic settings
    const { data: userSettings, error: userError } = await supabase
      .from("users")
      .select(
        "clinic_name, clinic_phone, test_mode_enabled, test_contact_phone",
      )
      .eq("id", user.id)
      .single();

    // Get clinic data from clinic table (preferred) with fallback to user table
    const clinic = await getClinicByUserId(user.id, supabase);

    if (!userError && userSettings) {
      // Fill in missing clinic settings
      // Prefer clinic table data, fallback to user table for backward compatibility
      if (!clinicName || !clinicPhone || !emergencyPhone) {
        clinicName =
          clinicName ??
          clinic?.name ??
          userSettings.clinic_name ??
          "Your Clinic";
        clinicPhone =
          clinicPhone ?? clinic?.phone ?? userSettings.clinic_phone ?? "";
        emergencyPhone =
          emergencyPhone ??
          clinic?.phone ??
          userSettings.clinic_phone ??
          clinicPhone ??
          "";
      }

      // Handle test mode (always check, even if clinic settings are provided)
      testModeEnabled = userSettings.test_mode_enabled ?? false;
      if (testModeEnabled && userSettings.test_contact_phone) {
        console.log("[SCHEDULE_CALL] Test mode enabled - overriding phone", {
          originalPhone: validated.phoneNumber,
          testPhone: userSettings.test_contact_phone,
        });
        validated.phoneNumber = userSettings.test_contact_phone;
      }
    }

    // Determine scheduled time
    // In test mode, schedule for 1 minute from now
    // Otherwise, use provided time or default to immediate
    let scheduledFor: Date;
    if (testModeEnabled) {
      scheduledFor = new Date(Date.now() + 60 * 1000); // 1 minute from now
      console.log(
        "[SCHEDULE_CALL] Test mode enabled - scheduling for 1 minute from now",
        {
          scheduledFor: scheduledFor.toISOString(),
        },
      );
    } else {
      scheduledFor = validated.scheduledFor ?? new Date();
    }

    // Validate scheduled time is in the future
    if (!isFutureTime(scheduledFor)) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 },
        ),
      );
    }

    // Get timezone from metadata or use default
    const timezone =
      (body.metadata?.timezone as string) ?? "America/Los_Angeles";

    // Use the scheduled time as-is (no business hours enforcement)
    const finalScheduledTime = scheduledFor;

    // Prepare call variables from input data (snake_case for VAPI)
    // Use extractFirstName to get only the first word of the pet name
    // (many vet systems store "FirstName LastName" but we only want first name for calls)
    const { extractFirstName } = await getVapiUtils();
    const callVariables = {
      // Core identification
      pet_name: extractFirstName(validated.petName),
      owner_name: validated.ownerName,
      appointment_date: validated.appointmentDate,

      // Call configuration
      call_type: validated.callType,

      // Agent/clinic information
      agent_name: agentName,
      vet_name: validated.vetName ?? "",
      clinic_name: clinicName,
      clinic_phone: clinicPhone,
      emergency_phone: emergencyPhone,

      // Clinical details
      discharge_summary_content: validated.dischargeSummary,

      // Conditional fields based on call_type
      ...(validated.callType === "discharge" &&
        validated.subType && {
          sub_type: validated.subType,
        }),

      ...(validated.callType === "follow-up" &&
        validated.condition && {
          condition: validated.condition,
        }),

      // Follow-up instructions
      ...(validated.nextSteps && { next_steps: validated.nextSteps }),

      // Optional fields
      ...(validated.medications && { medications: validated.medications }),
      ...(validated.recheckDate && { recheck_date: validated.recheckDate }),
    };

    console.log("[SCHEDULE_CALL] Dynamic variables prepared", {
      callVariables,
      variableCount: Object.keys(callVariables).length,
      callType: validated.callType,
      testModeActive: body.metadata?.test_mode_enabled === true,
    });

    // Get clinic-specific VAPI configuration (assistant ID and phone number ID)
    // Falls back to environment variables if clinic has no specific config
    const vapiConfig = await getClinicVapiConfigByUserId(user.id, supabase);

    console.log("[SCHEDULE_CALL] Using VAPI config", {
      clinicName: vapiConfig.clinicName,
      source: vapiConfig.source,
      hasOutboundAssistant: !!vapiConfig.outboundAssistantId,
      hasPhoneNumber: !!vapiConfig.phoneNumberId,
    });

    // Store scheduled call in database with clinic-specific VAPI configuration
    const { data: scheduledCall, error: dbError } = await supabase
      .from("scheduled_discharge_calls")
      .insert({
        user_id: user.id,
        assistant_id: vapiConfig.outboundAssistantId ?? "",
        phone_number_id: vapiConfig.phoneNumberId ?? "",
        customer_phone: validated.phoneNumber,
        scheduled_for: finalScheduledTime,
        status: "queued",
        dynamic_variables: callVariables,
        metadata: {
          notes: validated.notes,
          timezone,
          retry_count: 0,
          max_retries: 3,
          vapi_config_source: vapiConfig.source,
          clinic_name: vapiConfig.clinicName,
          ...(body.metadata ?? {}),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error("[SCHEDULE_CALL] Database error", {
        error: dbError,
      });
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Failed to create scheduled call" },
          { status: 500 },
        ),
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
      await supabase
        .from("scheduled_discharge_calls")
        .delete()
        .eq("id", scheduledCall.id);

      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Failed to schedule call execution" },
          { status: 500 },
        ),
      );
    }

    // Update database with QStash message ID
    await supabase
      .from("scheduled_discharge_calls")
      .update({
        metadata: {
          ...(scheduledCall.metadata as Record<string, unknown>),
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
    return withCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        data: {
          callId: scheduledCall.id,
          scheduledFor: finalScheduledTime.toISOString(),
          qstashMessageId,
          petName: validated.petName,
          ownerName: validated.ownerName,
          phoneNumber: validated.phoneNumber,
        },
      }),
    );
  } catch (error) {
    console.error("[SCHEDULE_CALL] Error", {
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
export async function GET(request: NextRequest) {
  return withCorsHeaders(
    request,
    NextResponse.json({
      status: "ok",
      message: "Schedule call endpoint is active",
    }),
  );
}

/**
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
