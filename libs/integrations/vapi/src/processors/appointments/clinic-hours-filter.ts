/**
 * Clinic Business Hours Filter
 *
 * Enforces per-clinic business hours, lunch breaks, slot alignment, and
 * closed days in TypeScript. This bypasses broken/incomplete SQL scheduling
 * configuration that we cannot modify (no Supabase access).
 *
 * Applied AFTER room-availability-filter.ts in the pipeline:
 *   SQL get_available_slots → applyRoomFilterToSlots → applyClinicHoursFilter
 */

import { toZonedTime } from "date-fns-tz";
import type { AvailableSlot } from "../../schemas/appointments";

const LOG_PREFIX = "[clinic-hours-filter]";

interface DayHours {
  open: string; // "HH:MM" 24h
  close: string; // "HH:MM" 24h
}

interface ClinicHoursConfig {
  /** Only allow slots on these minute marks (e.g. 30 → :00 and :30 only) */
  slotIntervalMinutes?: number;
  /** Default open/close for days without overrides */
  defaultHours: DayHours;
  /** Per-day overrides. Key = JS day (0=Sun, 6=Sat). null = CLOSED */
  dayOverrides?: Record<number, DayHours | null>;
  /** Lunch break — slots during this window are blocked */
  lunchBreak?: { start: string; end: string };
}

/**
 * Per-clinic business hours configuration.
 * Keyed by clinic UUID (the availabilityClinicId used in slot queries).
 */
const CLINIC_HOURS_CONFIG: Record<string, ClinicHoursConfig> = {
  // Masson Veterinary Hospital
  "efcc1733-7a7b-4eab-8104-a6f49defd7a6": {
    slotIntervalMinutes: 30, // Only :00 and :30 slots
    defaultHours: { open: "08:00", close: "18:00" }, // Mon-Fri
    dayOverrides: {
      0: null, // Sunday: CLOSED
      6: { open: "08:00", close: "17:00" }, // Saturday: 8am-5pm
    },
    lunchBreak: { start: "12:00", end: "14:00" },
  },

  // Alum Rock Animal Hospital
  "33f3bbb8-6613-45bc-a1f2-d55e30c243ae": {
    defaultHours: { open: "09:00", close: "17:30" }, // Mon-Fri: 9am-5:30pm (SQL blocks before 9am and after 5:30pm)
    dayOverrides: {
      0: { open: "09:00", close: "17:00" }, // Sunday: 9am-5pm
      6: { open: "09:00", close: "17:30" }, // Saturday: 9am-5:30pm
    },
    lunchBreak: { start: "13:00", end: "14:00" }, // 1pm-2pm lunch block
  },
};

/**
 * Parse "HH:MM" string into total minutes since midnight.
 */
function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Apply clinic business hours filter to availability slots.
 *
 * For clinics with a config entry: marks out-of-hours slots as blocked.
 * For clinics without config: returns slots unchanged (no-op).
 *
 * @param slots - Slots from SQL + room filter
 * @param clinicId - The availabilityClinicId (may differ from the VAPI clinic)
 * @param timezone - Clinic IANA timezone
 * @returns Filtered slots with is_blocked set on out-of-hours slots
 */
export function applyClinicHoursFilter(
  slots: AvailableSlot[],
  clinicId: string,
  timezone: string,
): AvailableSlot[] {
  const config = CLINIC_HOURS_CONFIG[clinicId];
  if (!config || slots.length === 0) return slots;

  console.log(
    `${LOG_PREFIX} Applying hours filter for clinic=${clinicId}, timezone=${timezone}, slots=${slots.length}`,
  );

  let filteredCount = 0;

  const result = slots.map((slot) => {
    // Already blocked by SQL or room filter — leave as-is
    if (slot.is_blocked) return slot;

    const reason = getFilterReason(slot.slot_start, timezone, config);
    if (reason) {
      filteredCount++;
      console.log(
        `${LOG_PREFIX} Slot ${slot.slot_start} BLOCKED: ${reason}`,
      );
      return {
        ...slot,
        is_blocked: true,
        available_count: 0,
      };
    }

    return slot;
  });

  console.log(
    `${LOG_PREFIX} Hours filter complete: ${filteredCount} slots blocked, ${result.filter((s) => !s.is_blocked && s.available_count > 0).length} open slots remain`,
  );

  return result;
}

/**
 * Check if a slot should be filtered out. Returns reason string or null if OK.
 */
function getFilterReason(
  slotStart: string,
  timezone: string,
  config: ClinicHoursConfig,
): string | null {
  const date = new Date(slotStart);
  const zonedDate = toZonedTime(date, timezone);

  const dayOfWeek = zonedDate.getDay(); // 0=Sun, 6=Sat
  const hours = zonedDate.getHours();
  const minutes = zonedDate.getMinutes();
  const slotMinutes = hours * 60 + minutes;

  // 1. Check if day is closed
  if (config.dayOverrides && dayOfWeek in config.dayOverrides) {
    const override = config.dayOverrides[dayOfWeek];
    if (override === null) {
      return `closed day (day=${dayOfWeek})`;
    }
  }

  // 2. Check slot interval alignment
  if (config.slotIntervalMinutes) {
    if (minutes % config.slotIntervalMinutes !== 0) {
      return `slot not aligned to ${config.slotIntervalMinutes}-min interval (minutes=${minutes})`;
    }
  }

  // 3. Get effective hours for this day
  const dayHours = getDayHours(dayOfWeek, config);
  if (!dayHours) {
    return `no hours configured (day=${dayOfWeek})`;
  }

  const openMinutes = parseTimeToMinutes(dayHours.open);
  const closeMinutes = parseTimeToMinutes(dayHours.close);

  // 4. Check open/close bounds
  if (slotMinutes < openMinutes) {
    return `before open (${formatMinutes(slotMinutes)} < ${dayHours.open})`;
  }
  if (slotMinutes >= closeMinutes) {
    return `at or after close (${formatMinutes(slotMinutes)} >= ${dayHours.close})`;
  }

  // 5. Check lunch break
  if (config.lunchBreak) {
    const lunchStart = parseTimeToMinutes(config.lunchBreak.start);
    const lunchEnd = parseTimeToMinutes(config.lunchBreak.end);
    if (slotMinutes >= lunchStart && slotMinutes < lunchEnd) {
      return `during lunch (${config.lunchBreak.start}-${config.lunchBreak.end})`;
    }
  }

  return null;
}

/**
 * Get effective hours for a day, considering overrides.
 */
function getDayHours(
  dayOfWeek: number,
  config: ClinicHoursConfig,
): DayHours | null {
  if (config.dayOverrides && dayOfWeek in config.dayOverrides) {
    return config.dayOverrides[dayOfWeek] ?? null;
  }
  return config.defaultHours;
}

/**
 * Format minutes-since-midnight as "HH:MM".
 */
function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
