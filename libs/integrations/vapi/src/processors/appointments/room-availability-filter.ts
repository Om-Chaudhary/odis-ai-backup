/**
 * Room-level Availability Filter
 *
 * Overrides slot availability counts for clinics that only use specific rooms
 * for scheduling (e.g., Masson uses only "Exam Room One").
 *
 * The SQL get_available_slots() function counts ALL rooms. This module
 * re-queries pims_appointments with a room filter and recalculates
 * the booked/available counts per slot.
 *
 * IMPORTANT: Uses only safe PostgREST operators (.eq, .is, .not, .in).
 * Complex filtering (room matching, block inclusion) is done in TypeScript
 * to avoid PostgREST parsing issues with spaces in values.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import type { AvailableSlot } from "../../schemas/appointments";

/**
 * Room filter configuration per clinic.
 * When set, only appointments in these rooms count toward capacity.
 * Clinics not listed use all rooms (default behavior).
 */
const CLINIC_SCHEDULING_ROOMS: Record<string, string[]> = {
  // Masson Veterinary Hospital: only Exam Room One for scheduling
  "efcc1733-7a7b-4eab-8104-a6f49defd7a6": ["Exam Room One"],
};

/**
 * Capacity overrides per clinic.
 * When set, overrides the capacity from clinic_schedule_config.
 * Masson has 1 scheduling room so capacity should be 1.
 */
const CLINIC_CAPACITY_OVERRIDES: Record<string, number> = {
  // Masson: single exam room = capacity 1
  "efcc1733-7a7b-4eab-8104-a6f49defd7a6": 1,
};

/**
 * Check if a clinic has a room filter configured.
 */
export function getClinicRoomFilter(clinicId: string): string[] | null {
  return CLINIC_SCHEDULING_ROOMS[clinicId] ?? null;
}

/**
 * Parse a PostgreSQL tstzrange string into start/end Date objects.
 * Handles formats like:
 *   ["2026-02-24 17:00:00+00","2026-02-24 17:30:00+00")
 *   [2026-02-24T17:00:00.000Z,2026-02-24T17:30:00.000Z)
 */
function parseTimeRange(
  rangeStr: unknown,
): { start: Date; end: Date } | null {
  if (!rangeStr || typeof rangeStr !== "string") return null;

  // Remove bracket characters and split on comma
  const cleaned = rangeStr.replace(/^[\[\(]/, "").replace(/[\]\)]$/, "");
  const commaIdx = cleaned.indexOf(",");
  if (commaIdx === -1) return null;

  const startStr = cleaned.slice(0, commaIdx).replace(/^"|"$/g, "").trim();
  const endStr = cleaned.slice(commaIdx + 1).replace(/^"|"$/g, "").trim();

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  return { start, end };
}

/**
 * Check if two time ranges overlap using half-open interval semantics [start, end).
 */
function rangesOverlap(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Apply room filter to availability slots.
 *
 * Re-queries pims_appointments for the given date and filters in TypeScript
 * to include only appointments in the configured rooms OR block appointments.
 * appointment_bookings (our own VAPI bookings) always count regardless of room.
 *
 * If the clinic has no room filter, returns slots unchanged.
 * On query errors, falls back to the original (unfiltered) slots.
 */
export async function applyRoomFilterToSlots(
  slots: AvailableSlot[],
  clinicId: string,
  date: string,
  supabase: SupabaseClient<Database>,
): Promise<AvailableSlot[]> {
  const roomFilter = CLINIC_SCHEDULING_ROOMS[clinicId];
  if (!roomFilter || slots.length === 0) return slots;

  const capacityOverride = CLINIC_CAPACITY_OVERRIDES[clinicId];

  // SAFE query: only .eq(), .is(), .not() — no .or(), no .filter() on tstzrange.
  // Fetch ALL appointments for this clinic+date, then filter in TypeScript.
  const { data: allAppts, error: apptError } = await supabase
    .from("pims_appointments")
    .select("time_range, provider_name, appointment_type")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .is("deleted_at", null)
    .not("status", "in", "(cancelled,no_show)");

  // Query active appointment_bookings (VAPI bookings — no room filter, always count).
  // Use date filter instead of tstzrange overlap for safety.
  const { data: bookings, error: bookingError } = await supabase
    .from("appointment_bookings")
    .select("time_range, status, hold_expires_at")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .in("status", ["pending", "confirmed"]);

  // On error, fall back to unfiltered slots (safer than returning wrong data)
  if (apptError || bookingError) return slots;

  // Filter appointments in TypeScript: include if room matches OR it's a block.
  // Block appointments have NULL provider_name but still occupy the time slot.
  const roomLower = roomFilter.map((r) => r.trim().toLowerCase());
  const roomAppts = (allAppts ?? []).filter(
    (a) =>
      a.appointment_type === "block" ||
      roomLower.includes((a.provider_name ?? "").trim().toLowerCase()),
  );

  // Parse appointment time ranges
  const apptRanges = roomAppts
    .map((a) => parseTimeRange(a.time_range))
    .filter((r): r is { start: Date; end: Date } => r !== null);

  // Filter bookings to only active ones (pending with valid hold, or confirmed)
  const now = new Date();
  const activeBookingRanges = (bookings ?? [])
    .filter(
      (b) =>
        b.status === "confirmed" ||
        (b.status === "pending" &&
          (!b.hold_expires_at || new Date(b.hold_expires_at) > now)),
    )
    .map((b) => parseTimeRange(b.time_range))
    .filter((r): r is { start: Date; end: Date } => r !== null);

  // Recalculate counts for each slot
  return slots.map((slot) => {
    // Don't modify blocked slots
    if (slot.is_blocked) return slot;

    const slotRange = {
      start: new Date(slot.slot_start),
      end: new Date(slot.slot_end),
    };

    const overlappingAppts = apptRanges.filter((r) =>
      rangesOverlap(slotRange, r),
    ).length;
    const overlappingBookings = activeBookingRanges.filter((r) =>
      rangesOverlap(slotRange, r),
    ).length;

    // Sanity check: never report FEWER booked than the SQL function already found.
    // If our app-level filter somehow misses appointments, fall back to SQL count.
    const bookedCount = Math.max(
      overlappingAppts + overlappingBookings,
      slot.booked_count,
    );

    const effectiveCapacity = capacityOverride ?? slot.capacity;
    const availableCount = Math.max(effectiveCapacity - bookedCount, 0);

    return {
      ...slot,
      capacity: effectiveCapacity,
      booked_count: bookedCount,
      available_count: availableCount,
    };
  });
}
