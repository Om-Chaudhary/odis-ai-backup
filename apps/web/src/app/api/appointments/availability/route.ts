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
});

// Day name mapping for business hours lookup
const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

type BusinessHours = Partial<Record<(typeof DAY_NAMES)[number], DayHours>>;

/**
 * Get the business hours for a specific day from clinic config
 */
function getHoursForDay(
  businessHours: BusinessHours | null,
  date: string,
): { startTime: string; endTime: string } | null {
  if (!businessHours) {
    return null;
  }

  const dateObj = new Date(date + "T12:00:00"); // Use noon to avoid timezone issues
  const dayIndex = dateObj.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const dayName = DAY_NAMES[dayIndex];
  const dayHours = businessHours[dayName];

  if (!dayHours || dayHours.closed) {
    return null; // Clinic is closed on this day
  }

  return {
    startTime: dayHours.open + ":00", // "08:00" -> "08:00:00"
    endTime: dayHours.close + ":00", // "19:00" -> "19:00:00"
  };
}

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
    };

    const validated = availabilityQuerySchema.parse(params);
    const supabase = await createServiceClient();

    // Fetch clinic business hours to determine day-specific open/close times
    let startTime = validated.start_time
      ? `${validated.start_time}:00`
      : "08:00:00";
    let endTime = validated.end_time ? `${validated.end_time}:00` : "17:30:00";

    // If no explicit times provided, use clinic's business hours for the requested day
    if (!validated.start_time || !validated.end_time) {
      const { data: clinic } = await supabase
        .from("clinics")
        .select("business_hours")
        .eq("id", validated.clinic_id)
        .single();

      if (clinic?.business_hours) {
        const dayHours = getHoursForDay(
          clinic.business_hours as BusinessHours,
          validated.date,
        );

        if (dayHours) {
          // Only override if not explicitly provided in request
          if (!validated.start_time) {
            startTime = dayHours.startTime;
          }
          if (!validated.end_time) {
            endTime = dayHours.endTime;
          }

          logger.debug("Using clinic business hours for day", {
            date: validated.date,
            startTime,
            endTime,
          });
        } else {
          // Clinic is closed on this day - return empty slots
          logger.info("Clinic is closed on requested day", {
            clinic_id: validated.clinic_id,
            date: validated.date,
          });

          return withCorsHeaders(
            request,
            NextResponse.json({
              date: validated.date,
              available_slots: [],
              total_slots: 0,
              sync_freshness: null,
              clinic_closed: true,
              message: "The clinic is closed on this day.",
            }),
          );
        }
      }
    }

    // Call get_available_slots() function
    const { data: slots, error } = await supabase.rpc("get_available_slots", {
      p_clinic_id: validated.clinic_id,
      p_date: validated.date,
      p_provider_id: validated.provider_id ?? null,
      p_slot_duration_minutes: validated.slot_duration_minutes,
      p_start_time: startTime,
      p_end_time: endTime,
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
