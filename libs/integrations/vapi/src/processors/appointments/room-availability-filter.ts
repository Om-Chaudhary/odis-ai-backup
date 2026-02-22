/**
 * Room-level Availability Filter
 *
 * Applies capacity overrides for clinics that only use specific rooms
 * for scheduling (e.g., Masson uses only Exam Room One → capacity 1).
 *
 * The sync service (pims-sync) already filters appointments by IDEXX resource ID
 * so only the correct room's appointments are in pims_appointments.
 * The SQL get_available_slots() function counts those pre-filtered appointments.
 *
 * This module just:
 * 1. Overrides capacity for clinics with fewer scheduling rooms
 * 2. Recalculates available_count based on the overridden capacity
 */

import type { AvailableSlot } from "../../schemas/appointments";

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
 * Apply capacity override to availability slots.
 *
 * Since the sync service already filters pims_appointments to the correct room,
 * and SQL counts those pre-filtered appointments, we only need to override
 * the capacity for clinics that use fewer rooms than the default.
 *
 * If the clinic has no capacity override, returns slots unchanged.
 */
export async function applyRoomFilterToSlots(
  slots: AvailableSlot[],
  clinicId: string,
  _date: string,
  _supabase: unknown,
): Promise<AvailableSlot[]> {
  const capacityOverride = CLINIC_CAPACITY_OVERRIDES[clinicId];
  if (capacityOverride == null || slots.length === 0) return slots;

  return slots.map((slot) => {
    // Don't modify blocked slots
    if (slot.is_blocked) return slot;

    const effectiveCapacity = capacityOverride;
    const availableCount = Math.max(effectiveCapacity - slot.booked_count, 0);

    return {
      ...slot,
      capacity: effectiveCapacity,
      available_count: availableCount,
    };
  });
}
