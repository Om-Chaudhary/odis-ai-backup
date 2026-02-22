/**
 * Room-level Availability Filter
 *
 * Overrides slot availability counts for clinics that only use specific rooms
 * for scheduling (e.g., Masson uses only "Exam Room One").
 *
 * The SQL get_available_slots() function counts ALL rooms. This module
 * re-queries pims_appointments with a provider_name filter and recalculates
 * the booked/available counts per slot.
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
 * Re-queries pims_appointments with provider_name filter and recalculates
 * booked/available counts. appointment_bookings (our own VAPI bookings)
 * always count regardless of room.
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

  // Build a day-wide time range for the query using first/last slot bounds
  const firstSlotStart = slots[0]!.slot_start;
  const lastSlotEnd = slots[slots.length - 1]!.slot_end;

  // Query pims_appointments filtered by room name
  const { data: filteredAppts, error: apptError } = await supabase
    .from("pims_appointments")
    .select("time_range")
    .eq("clinic_id", clinicId)
    .is("deleted_at", null)
    .not("status", "in", "(cancelled,no_show)")
    .in("provider_name", roomFilter)
    .filter("time_range", "ov", `[${firstSlotStart},${lastSlotEnd})`);

  // Query active appointment_bookings (VAPI bookings — no room filter, always count)
  const { data: bookings, error: bookingError } = await supabase
    .from("appointment_bookings")
    .select("time_range, status, hold_expires_at")
    .eq("clinic_id", clinicId)
    .in("status", ["pending", "confirmed"])
    .filter("time_range", "ov", `[${firstSlotStart},${lastSlotEnd})`);

  // On error, fall back to unfiltered slots (safer than returning wrong data)
  if (apptError || bookingError) return slots;

  // Parse appointment time ranges
  const apptRanges = (filteredAppts ?? [])
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
    const bookedCount = overlappingAppts + overlappingBookings;
    const availableCount = Math.max(slot.capacity - bookedCount, 0);

    return {
      ...slot,
      booked_count: bookedCount,
      available_count: availableCount,
    };
  });
}
