import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { getUser } from "~/server/actions/auth";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { handleCorsPreflightRequest, withCorsHeaders } from "~/lib/api/cors";
import {
  type AppointmentInput,
  ScheduleSyncRequestSchema,
} from "~/lib/schedule/validators";
import { getClinicByUserId, getOrCreateProvider } from "~/lib/clinics/utils";
import type { Database } from "~/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseClientType = SupabaseClient<Database>;

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
 * Check if appointment already exists
 */
async function findExistingAppointment(
  supabase: SupabaseClientType,
  appointment: AppointmentInput,
  clinicId: string,
): Promise<string | null> {
  // First try: by neo_appointment_id + clinic_id + date
  if (appointment.neo_appointment_id) {
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("neo_appointment_id", appointment.neo_appointment_id)
      .eq("date", appointment.date)
      .single();

    if (existing) {
      return existing.id;
    }
  }

  // Second try: by date + start_time + patient_name + clinic_id
  if (appointment.patient_name && appointment.start_time) {
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("date", appointment.date)
      .eq("start_time", appointment.start_time)
      .eq("patient_name", appointment.patient_name)
      .single();

    if (existing) {
      return existing.id;
    }
  }

  return null;
}

/**
 * Process single appointment (insert or update)
 */
async function processAppointment(
  supabase: SupabaseClientType,
  appointment: AppointmentInput,
  clinicId: string,
  syncId: string,
  appointmentIndex: number,
): Promise<{
  success: boolean;
  appointmentId: string | null;
  created: boolean;
  error?: string;
}> {
  try {
    // Find or create provider if provider info provided
    let providerId: string | null = null;
    if (appointment.provider_id && appointment.provider_name) {
      providerId = await getOrCreateProvider(
        clinicId,
        appointment.provider_id,
        appointment.provider_name,
        supabase,
      );
    }

    // Check if appointment already exists
    const existingAppointmentId = await findExistingAppointment(
      supabase,
      appointment,
      clinicId,
    );

    const appointmentData: Database["public"]["Tables"]["appointments"]["Insert"] =
      {
        clinic_id: clinicId,
        sync_id: syncId,
        neo_appointment_id: appointment.neo_appointment_id ?? null,
        date: appointment.date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        patient_name: appointment.patient_name ?? null,
        client_name: appointment.client_name ?? null,
        client_phone: appointment.client_phone ?? null,
        appointment_type: appointment.appointment_type ?? null,
        status: appointment.status ?? "scheduled",
        notes: appointment.notes ?? null,
        provider_id: providerId,
        source: "neo", // IDEXX Neo
        metadata: appointment.metadata ?? {},
      };

    if (existingAppointmentId) {
      // Update existing appointment
      const { data: updated, error: updateError } = await supabase
        .from("appointments")
        .update(appointmentData)
        .eq("id", existingAppointmentId)
        .select("id")
        .single();

      if (updateError || !updated) {
        return {
          success: false,
          appointmentId: null,
          created: false,
          error: `Failed to update appointment: ${
            updateError?.message ?? "Unknown error"
          }`,
        };
      }

      return {
        success: true,
        appointmentId: updated.id,
        created: false,
      };
    } else {
      // Insert new appointment
      const { data: inserted, error: insertError } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select("id")
        .single();

      if (insertError || !inserted) {
        return {
          success: false,
          appointmentId: null,
          created: false,
          error: `Failed to create appointment: ${
            insertError?.message ?? "Unknown error"
          }`,
        };
      }

      return {
        success: true,
        appointmentId: inserted.id,
        created: true,
      };
    }
  } catch (error) {
    return {
      success: false,
      appointmentId: null,
      created: false,
      error:
        error instanceof Error
          ? error.message
          : `Unexpected error processing appointment at index ${appointmentIndex}`,
    };
  }
}

/**
 * Schedule Sync API Route
 *
 * POST /api/schedule/sync
 *
 * Syncs appointment schedule data from IDEXX Neo extension.
 * Creates/updates appointments in the database and tracks sync operations.
 *
 * This endpoint is designed to accept requests from:
 * - Browser extension (IDEXX Neo integration) - uses Bearer token
 * - Admin dashboard - uses cookies
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
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 },
        ),
      );
    }

    const validated = ScheduleSyncRequestSchema.safeParse(body);

    if (!validated.success) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error: "Validation failed",
            details: validated.error.errors,
          },
          { status: 400 },
        ),
      );
    }

    const { syncDate, appointments, metadata } = validated.data;

    console.log("[SCHEDULE_SYNC] Received request", {
      userId: user.id,
      syncDate,
      appointmentCount: appointments.length,
    });

    // Get user's clinic
    const clinic = await getClinicByUserId(user.id, supabase);

    if (!clinic) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            error:
              "Clinic not found. Please ensure your clinic_name is set in your user profile.",
          },
          { status: 400 },
        ),
      );
    }

    // Create schedule_syncs record with status "in_progress"
    const { data: syncRecord, error: syncError } = await supabase
      .from("schedule_syncs")
      .insert({
        clinic_id: clinic.id,
        sync_date: syncDate,
        status: "in_progress",
        appointment_count: null,
        metadata: metadata ?? {},
      })
      .select("id")
      .single();

    if (syncError || !syncRecord) {
      console.error("[SCHEDULE_SYNC] Failed to create sync record", {
        error: syncError,
      });
      return withCorsHeaders(
        request,
        NextResponse.json(
          { error: "Failed to create sync record" },
          { status: 500 },
        ),
      );
    }

    const syncId = syncRecord.id;

    // Process appointments
    let createdCount = 0;
    let updatedCount = 0;
    const errors: Array<{ appointmentIndex: number; error: string }> = [];

    for (let i = 0; i < appointments.length; i++) {
      const appointment = appointments[i];
      const result = await processAppointment(
        supabase,
        appointment,
        clinic.id,
        syncId,
        i,
      );

      if (result.success) {
        if (result.created) {
          createdCount++;
        } else {
          updatedCount++;
        }
      } else {
        errors.push({
          appointmentIndex: i,
          error: result.error ?? "Unknown error",
        });
      }
    }

    const totalProcessed = createdCount + updatedCount;
    const hasErrors = errors.length > 0;
    const finalStatus =
      hasErrors && totalProcessed === 0 ? "failed" : "completed";

    // Update schedule_syncs record
    const errorMessage =
      errors.length > 0
        ? `Failed to process ${errors.length} appointment(s): ${errors
            .map((e) => e.error)
            .join("; ")}`
        : null;

    const { error: updateError } = await supabase
      .from("schedule_syncs")
      .update({
        status: finalStatus,
        appointment_count: totalProcessed,
        error_message: errorMessage,
      })
      .eq("id", syncId);

    if (updateError) {
      console.error("[SCHEDULE_SYNC] Failed to update sync record", {
        error: updateError,
      });
    }

    console.log("[SCHEDULE_SYNC] Sync completed", {
      syncId,
      syncDate,
      totalProcessed,
      created: createdCount,
      updated: updatedCount,
      errors: errors.length,
      status: finalStatus,
    });

    // Return response
    return withCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        data: {
          syncId,
          syncDate,
          status: finalStatus,
          appointmentCount: totalProcessed,
          created: createdCount,
          updated: updatedCount,
          ...(errors.length > 0 && { errors }),
        },
      }),
    );
  } catch (error) {
    console.error("[SCHEDULE_SYNC] Error", {
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
      message: "Schedule sync endpoint is active",
    }),
  );
}

/**
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}
