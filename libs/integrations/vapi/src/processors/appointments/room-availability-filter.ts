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
import type { AvailableSlot } from "../../schemas/appointments";

/**
 * Capacity overrides per clinic.
 * When set, overrides capacity AND recounts bookings from the database.
 */
const CLINIC_CAPACITY_OVERRIDES: Record<string, number> = {
  // Masson: single exam room = capacity 1
  "efcc1733-7a7b-4eab-8104-a6f49defd7a6": 1,
};

/**
 * A booking that occupies a time range.
 */
interface Booking {
  start: Date;
  end: Date;
}

/**
 * Parse a Postgres tstzrange string like:
 *   ["2026-02-23 17:00:00+00","2026-02-23 17:30:00+00")
 * Returns start/end Date objects, or null if unparseable.
 */
function parseTstzRange(range: unknown): { start: Date; end: Date } | null {
  if (typeof range !== "string" || range.length < 5) return null;

  // Remove brackets: [" or (" at start, ") or "] at end
  const inner = range.slice(1, -1);
  const parts = inner.split(",");
  if (parts.length !== 2) return null;

  const startStr = parts[0]!.trim().replace(/^"/, "").replace(/"$/, "");
  const endStr = parts[1]!.trim().replace(/^"/, "").replace(/"$/, "");

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return { start, end };
}

/**
 * Check if two time ranges overlap.
 * Uses half-open intervals: [start, end)
 */
function rangesOverlap(a: Booking, b: Booking): boolean {
  return a.start < b.end && b.start < a.end;
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

  // Fetch actual bookings from the database (2 queries total)
  const bookings = await fetchBookingsForDate(
    supabase as SupabaseClient<Database>,
    clinicId,
    date,
  );

  return slots.map((slot) => {
    // Don't modify blocked slots
    if (slot.is_blocked) return slot;

    const slotRange: Booking = {
      start: new Date(slot.slot_start),
      end: new Date(slot.slot_end),
    };

    // Count bookings that overlap this slot
    const bookedCount = bookings.filter((b) =>
      rangesOverlap(slotRange, b),
    ).length;

    const availableCount = Math.max(capacityOverride - bookedCount, 0);

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
): Promise<Booking[]> {
  const bookings: Booking[] = [];

  // 1. PIMS appointments (synced from IDEXX, already room-filtered by pims-sync)
  const { data: pimsData } = await supabase
    .from("pims_appointments")
    .select("time_range")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .is("deleted_at", null)
    .not("status", "in", '("cancelled","no_show")');

  if (pimsData) {
    for (const row of pimsData) {
      const parsed = parseTstzRange(row.time_range);
      if (parsed) bookings.push(parsed);
    }
  }

  // 2. Active appointment bookings (VAPI holds + confirmed bookings)
  const { data: holdData } = await supabase
    .from("appointment_bookings")
    .select("time_range, status, hold_expires_at")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .or("status.eq.confirmed,and(status.eq.pending,hold_expires_at.gt.now())");

  if (holdData) {
    for (const row of holdData) {
      const parsed = parseTstzRange(row.time_range);
      if (parsed) bookings.push(parsed);
    }
  }

  return bookings;
}
