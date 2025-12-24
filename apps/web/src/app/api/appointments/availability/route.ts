import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loggers } from "@odis-ai/logger";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/api/cors";

const logger = loggers.api.child("appointments-availability");

const availabilityQuerySchema = z.object({
  clinic_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  provider_id: z.string().uuid().optional(),
  slot_duration_minutes: z.coerce.number().min(15).max(120).default(30),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { createServiceClient } = await import("@odis-ai/db/server");
    const { searchParams } = new URL(request.url);
    const params = {
      clinic_id: searchParams.get("clinic_id"),
      date: searchParams.get("date"),
      provider_id: searchParams.get("provider_id") ?? undefined,
      slot_duration_minutes: searchParams.get("slot_duration_minutes") ?? "30",
      start_time: searchParams.get("start_time") ?? undefined,
      end_time: searchParams.get("end_time") ?? undefined,
    };

    const validated = availabilityQuerySchema.parse(params);
    const supabase = await createServiceClient();

    // Call get_available_slots() function
    const { data: slots, error } = await supabase.rpc("get_available_slots", {
      p_clinic_id: validated.clinic_id,
      p_date: validated.date,
      p_provider_id: validated.provider_id ?? null,
      p_slot_duration_minutes: validated.slot_duration_minutes,
      p_start_time: validated.start_time
        ? `${validated.start_time}:00`
        : "08:00:00",
      p_end_time: validated.end_time ? `${validated.end_time}:00` : "17:30:00",
    });

    if (error) throw error;

    interface AvailableSlot {
      is_available: boolean;
      slot_start: string;
      slot_end: string;
      provider_id: string | null;
    }

    // Filter to only available slots
    const typedSlots = (slots ?? []) as AvailableSlot[];
    const availableSlots = typedSlots
      .filter((slot) => slot.is_available)
      .map((slot) => ({
        start: slot.slot_start.substring(0, 5), // HH:MM
        end: slot.slot_end.substring(0, 5), // HH:MM
        provider_id: slot.provider_id,
      }));

    // Get sync freshness
    const { data: latestSync } = await supabase
      .from("schedule_syncs")
      .select("synced_at")
      .eq("clinic_id", validated.clinic_id)
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    logger.info("Availability queried", {
      clinic_id: validated.clinic_id,
      date: validated.date,
      available_count: availableSlots.length,
    });

    return withCorsHeaders(
      request,
      NextResponse.json({
        date: validated.date,
        available_slots: availableSlots,
        total_slots: slots?.length ?? 0,
        sync_freshness: latestSync?.synced_at ?? null,
      }),
    );
  } catch (error) {
    logger.error("Availability query failed", { error });
    return withCorsHeaders(
      request,
      NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 400 },
      ),
    );
  }
}

export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET_HEALTH() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/appointments/availability",
    method: "GET",
    required_params: ["clinic_id", "date"],
    optional_params: [
      "provider_id",
      "slot_duration_minutes",
      "start_time",
      "end_time",
    ],
  });
}
