/**
 * Room-level Availability Filter
 *
 * For clinics with capacity overrides (e.g., Masson = 1 exam room),
 * the production SQL function `count_booked_in_range` has a bug where it
 * compares provider_name (doctor name) against room names — so it never
 * counts regular appointments. We can't fix the SQL (no Supabase access).
 *
 * Fix: bypass the SQL booked_count entirely. Fetch pims_appointments and
 * appointment_bookings directly, count overlaps in TypeScript, and override
 * the slot counts. This runs 2 queries per date (not per slot).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import {
  parsePostgresTimeRange,
  rangesOverlap,
  type TimeRange,
} from "@odis-ai/shared/util";
import type { AvailableSlot } from "../../schemas/appointments";

/**
 * Capacity overrides per clinic.
 * When set, overrides capacity AND recounts bookings from the database.
 */
const CLINIC_CAPACITY_OVERRIDES: Record<string, number> = {
  // Masson: single exam room = capacity 1
  "efcc1733-7a7b-4eab-8104-a6f49defd7a6": 1,
};

const LOG_PREFIX = "[room-availability-filter]";

/**
 * Safely parse a time_range value, logging on failure.
 */
function safeParseTimeRange(
  raw: unknown,
  source: string,
): TimeRange | null {
  if (typeof raw !== "string" || raw.length < 5) {
    console.warn(
      `${LOG_PREFIX} Unparseable time_range from ${source}: type=${typeof raw}, value=${JSON.stringify(raw)}`,
    );
    return null;
  }
  try {
    return parsePostgresTimeRange(raw);
  } catch (err) {
    console.error(
      `${LOG_PREFIX} Failed to parse time_range from ${source}: raw=${JSON.stringify(raw)}, error=${err}`,
    );
    return null;
  }
}

/**
 * Apply room-level availability corrections.
 *
 * For clinics with capacity overrides: fetches actual appointments from
 * pims_appointments and appointment_bookings, recounts overlaps per slot,
 * and overrides the (broken) SQL booked_count.
 *
 * For all other clinics: returns slots unchanged.
 */
export async function applyRoomFilterToSlots(
  slots: AvailableSlot[],
  clinicId: string,
  date: string,
  supabase: unknown,
): Promise<AvailableSlot[]> {
  const capacityOverride = CLINIC_CAPACITY_OVERRIDES[clinicId];
  if (capacityOverride == null || slots.length === 0) return slots;

  console.log(
    `${LOG_PREFIX} Starting recount for clinic=${clinicId}, date=${date}, capacity=${capacityOverride}, slots=${slots.length}`,
  );

  // Fetch actual bookings from the database (2 queries total)
  const bookings = await fetchBookingsForDate(
    supabase as SupabaseClient<Database>,
    clinicId,
    date,
  );

  console.log(
    `${LOG_PREFIX} Total bookings found: ${bookings.length}`,
  );

  return slots.map((slot) => {
    // Don't modify blocked slots
    if (slot.is_blocked) {
      console.log(
        `${LOG_PREFIX} Slot ${slot.slot_start} BLOCKED (skipping recount)`,
      );
      return slot;
    }

    const slotRange: TimeRange = {
      start: new Date(slot.slot_start),
      end: new Date(slot.slot_end),
    };

    // Count bookings that overlap this slot
    const bookedCount = bookings.filter((b) =>
      rangesOverlap(slotRange, b),
    ).length;

    const availableCount = Math.max(capacityOverride - bookedCount, 0);

    console.log(
      `${LOG_PREFIX} Slot ${slot.slot_start}: sql_booked=${slot.booked_count}, ts_booked=${bookedCount}, capacity=${capacityOverride}, available=${availableCount}`,
    );

    return {
      ...slot,
      capacity: capacityOverride,
      booked_count: bookedCount,
      available_count: availableCount,
    };
  });
}

/**
 * Fetch all active bookings for a clinic on a given date.
 * Combines pims_appointments + appointment_bookings into a single list.
 */
async function fetchBookingsForDate(
  supabase: SupabaseClient<Database>,
  clinicId: string,
  date: string,
): Promise<TimeRange[]> {
  const bookings: TimeRange[] = [];

  // 1. PIMS appointments (synced from IDEXX, already room-filtered by pims-sync)
  const { data: pimsData, error: pimsError } = await supabase
    .from("pims_appointments")
    .select("time_range, status, deleted_at, provider_name, appointment_type")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .is("deleted_at", null)
    .not("status", "in", '("cancelled","no_show")');

  if (pimsError) {
    console.error(
      `${LOG_PREFIX} pims_appointments query ERROR: ${JSON.stringify(pimsError)}`,
    );
  }

  console.log(
    `${LOG_PREFIX} pims_appointments query: clinic_id=${clinicId}, date=${date} → ${pimsData?.length ?? 0} rows`,
  );

  if (pimsData) {
    for (const row of pimsData) {
      // Skip tech appointments — they don't use the exam room
      const isTech = (row.appointment_type ?? "")
        .toLowerCase()
        .includes("tech");
      console.log(
        `${LOG_PREFIX} pims_appointment: time_range=${JSON.stringify(row.time_range)}, status=${row.status}, provider=${row.provider_name}, type=${row.appointment_type}, isTech=${isTech}`,
      );
      if (isTech) {
        console.log(`${LOG_PREFIX}   → SKIPPED (tech appointment)`);
        continue;
      }
      const parsed = safeParseTimeRange(row.time_range, "pims_appointments");
      if (parsed) {
        console.log(
          `${LOG_PREFIX}   → parsed: start=${parsed.start.toISOString()}, end=${parsed.end.toISOString()}`,
        );
        bookings.push(parsed);
      }
    }
  }

  // 2. Active appointment bookings (VAPI holds + confirmed bookings)
  const { data: holdData, error: holdError } = await supabase
    .from("appointment_bookings")
    .select("time_range, status, hold_expires_at")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .or("status.eq.confirmed,and(status.eq.pending,hold_expires_at.gt.now())");

  if (holdError) {
    console.error(
      `${LOG_PREFIX} appointment_bookings query ERROR: ${JSON.stringify(holdError)}`,
    );
  }

  console.log(
    `${LOG_PREFIX} appointment_bookings query: clinic_id=${clinicId}, date=${date} → ${holdData?.length ?? 0} rows`,
  );

  if (holdData) {
    for (const row of holdData) {
      console.log(
        `${LOG_PREFIX} appointment_booking: time_range=${JSON.stringify(row.time_range)}, status=${row.status}, hold_expires_at=${row.hold_expires_at}`,
      );
      const parsed = safeParseTimeRange(row.time_range, "appointment_bookings");
      if (parsed) {
        console.log(
          `${LOG_PREFIX}   → parsed: start=${parsed.start.toISOString()}, end=${parsed.end.toISOString()}`,
        );
        bookings.push(parsed);
      }
    }
  }

  return bookings;
}
