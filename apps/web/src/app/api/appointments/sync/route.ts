import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loggers } from "@odis-ai/shared/logger";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/data-access/api/cors";

const logger = loggers.api.child("appointments-sync");

const syncAppointmentsSchema = z
  .object({
    clinic_id: z.string().uuid().optional(),
    clinic_name: z.string().optional(),
    sync_id: z.string().uuid().optional(),
    appointments: z.array(
      z.object({
        neo_appointment_id: z.string(),
        date: z.string(),
        start_time: z.string(),
        end_time: z.string(),
        provider_id: z.string().uuid().optional(),
        patient_name: z.string().optional(),
        client_name: z.string().optional(),
        client_phone: z.string().optional(),
        appointment_type: z.string().optional(),
        status: z.enum(["scheduled", "confirmed"]),
        notes: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    ),
  })
  .refine((data) => data.clinic_id ?? data.clinic_name, {
    message: "Either clinic_id or clinic_name must be provided",
  });

export async function POST(request: NextRequest) {
  try {
    const { createServiceClient } = await import("@odis-ai/data-access/db/server");
    const body = await request.json();
    const validated = syncAppointmentsSchema.parse(body);

    const supabase = await createServiceClient();

    // Resolve clinic_id from clinic_name if needed
    let clinic_id = validated.clinic_id;
    if (!clinic_id && validated.clinic_name) {
      const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .select("id")
        .eq("name", validated.clinic_name)
        .single();

      if (clinicError || !clinic) {
        throw new Error(`Clinic not found: ${validated.clinic_name}`);
      }
      clinic_id = clinic.id;
    }

    if (!clinic_id) {
      throw new Error("Could not resolve clinic_id");
    }

    // Create or get sync record (upsert to handle multiple syncs per day)
    let sync_id = validated.sync_id;
    if (!sync_id) {
      const syncDate = new Date().toISOString().split("T")[0];

      const { data: syncRecord, error: syncError } = await supabase
        .from("schedule_syncs")
        .upsert(
          {
            clinic_id,
            sync_date: syncDate,
            status: "completed",
            appointment_count: validated.appointments.length,
            sync_type: "schedule",
            synced_at: new Date().toISOString(),
          },
          { onConflict: "clinic_id,sync_date" },
        )
        .select("id")
        .single();

      if (syncError) throw syncError;
      sync_id = syncRecord.id;
    }

    // Upsert appointments (conflict on clinic_id + neo_appointment_id)
    const { error } = await supabase
      .from("appointments")
      .upsert(
        validated.appointments.map((apt) => ({
          clinic_id,
          sync_id,
          neo_appointment_id: apt.neo_appointment_id,
          date: apt.date,
          start_time: apt.start_time,
          end_time: apt.end_time,
          provider_id: apt.provider_id,
          patient_name: apt.patient_name,
          client_name: apt.client_name,
          client_phone: apt.client_phone,
          appointment_type: apt.appointment_type,
          status: apt.status,
          notes: apt.notes,
          source: "neo",
          metadata: apt.metadata ?? {},
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "clinic_id,neo_appointment_id" },
      )
      .select();

    if (error) throw error;

    logger.info("Appointments synced", {
      clinic_id,
      count: validated.appointments.length,
    });

    return withCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        count: validated.appointments.length,
      }),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Sync failed", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return withCorsHeaders(
      request,
      NextResponse.json({ error: errorMessage }, { status: 500 }),
    );
  }
}

export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/appointments/sync",
    method: "POST",
    required_fields: ["clinic_id", "sync_id", "appointments"],
  });
}
