import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loggers } from "@odis-ai/shared/logger";
import {
  handleCorsPreflightRequest,
  withCorsHeaders,
} from "@odis-ai/data-access/api/cors";
import { createServiceClient } from "@odis-ai/data-access/db/server";

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
  use_v2: z.coerce.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      clinic_id: searchParams.get("clinic_id"),
      date: searchParams.get("date"),
      provider_id: searchParams.get("provider_id") ?? undefined,
      slot_duration_minutes: searchParams.get("slot_duration_minutes") ?? "30",
      start_time: searchParams.get("start_time") ?? undefined,
      end_time: searchParams.get("end_time") ?? undefined,
      use_v2: searchParams.get("use_v2") ?? "false",
    };

    const validated = availabilityQuerySchema.parse(params);
    const supabase = await createServiceClient();

    logger.debug("Querying availability", {
      clinic_id: validated.clinic_id,
      date: validated.date,
      duration_minutes: validated.slot_duration_minutes,
      use_v2: validated.use_v2,
    });

    // Use v2 time range-based function if requested
    if (validated.use_v2) {
      const { data: slots, error } = await supabase.rpc(
        "get_available_slots_v2",
        {
          p_clinic_id: validated.clinic_id,
          p_date: validated.date,
          p_duration_minutes: validated.slot_duration_minutes,
        },
      );

      if (error) {
        logger.error("V2 availability query failed", {
          error: error.message,
          clinic_id: validated.clinic_id,
        });
        throw error;
      }

      interface AvailableSlotV2 {
        slot_start: string;
        slot_end: string;
        capacity: number;
        booked_count: number;
        available_count: number;
        is_blocked: boolean;
        block_reason: string | null;
      }

      const typedSlots = (slots ?? []) as AvailableSlotV2[];

      // Transform and filter to available slots only
      const availableSlots = typedSlots
        .filter((slot) => slot.available_count > 0 && !slot.is_blocked)
        .map((slot) => ({
          start: new Date(slot.slot_start).toISOString(),
          end: new Date(slot.slot_end).toISOString(),
          capacity: slot.capacity,
          booked_count: slot.booked_count,
          available_count: slot.available_count,
        }));

      // Get sync freshness
      const { data: latestSync } = await supabase
        .from("schedule_syncs")
        .select("synced_at")
        .eq("clinic_id", validated.clinic_id)
        .order("synced_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      logger.info("V2 availability queried", {
        clinic_id: validated.clinic_id,
        date: validated.date,
        total_slots: typedSlots.length,
        available_count: availableSlots.length,
      });

      return withCorsHeaders(
        request,
        NextResponse.json({
          date: validated.date,
          available_slots: availableSlots,
          total_slots: typedSlots.length,
          sync_freshness: latestSync?.synced_at ?? null,
          version: "v2",
        }),
      );
    }

    // Call the existing get_available_slots function (slot-based)
    const { data: slots, error } = await supabase.rpc("get_available_slots", {
      p_clinic_id: validated.clinic_id,
      p_date: validated.date,
      p_duration_minutes: validated.slot_duration_minutes,
    });

    if (error) {
      logger.error("Availability query failed", {
        error: error.message,
        clinic_id: validated.clinic_id,
      });
      throw error;
    }

    interface AvailableSlot {
      slot_start: string;
      slot_end: string;
      capacity: number;
      booked_count: number;
      available_count: number;
      is_blocked: boolean;
      block_reason: string | null;
    }

    const typedSlots = (slots ?? []) as AvailableSlot[];

    // Transform and filter to available slots only
    const availableSlots = typedSlots
      .filter((slot) => slot.available_count > 0 && !slot.is_blocked)
      .map((slot) => ({
        start: new Date(slot.slot_start).toISOString(),
        end: new Date(slot.slot_end).toISOString(),
        capacity: slot.capacity,
        booked_count: slot.booked_count,
        available_count: slot.available_count,
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
      total_slots: typedSlots.length,
      available_count: availableSlots.length,
    });

    return withCorsHeaders(
      request,
      NextResponse.json({
        date: validated.date,
        available_slots: availableSlots,
        total_slots: typedSlots.length,
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
      "use_v2",
    ],
  });
}
