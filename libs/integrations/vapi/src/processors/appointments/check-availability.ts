/**
 * Check Availability Processor
 *
 * Pure business logic for checking appointment slot availability.
 */

import { toZonedTime } from "date-fns-tz";
import type { ToolContext, ToolResult } from "../../core/types";
import type {
  CheckAvailabilityInput,
  AvailableSlot,
} from "../../schemas/appointments";
import { applyRoomFilterToSlots } from "./room-availability-filter";
import { applyClinicHoursFilter } from "./clinic-hours-filter";

const DEFAULT_TIMEZONE = "America/Los_Angeles";

/**
 * Extract local time strings from a V2 timestamptz slot_start
 */
function slotToLocalTime(
  timestamp: string,
  timezone: string,
): { time24h: string; time12h: string } {
  const date = new Date(timestamp);
  const zonedDate = toZonedTime(date, timezone);
  const hours = zonedDate.getHours();
  const minutes = zonedDate.getMinutes();

  const time24h = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const time12h = `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;

  return { time24h, time12h };
}

/**
 * Process check availability request
 *
 * @param input - Validated input from schema
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Tool result with availability data
 */
export async function processCheckAvailability(
  input: CheckAvailabilityInput,
  ctx: ToolContext,
): Promise<ToolResult> {
  const { clinic, supabase, logger } = ctx;

  if (!clinic) {
    return {
      success: false,
      error: "clinic_not_found",
      message:
        "I'm having trouble accessing the clinic schedule. Please try again later.",
    };
  }

  // Timezone safety: prevent "Today" becoming "Tomorrow" due to UTC shift
  const clinicTimezone = clinic.timezone ?? DEFAULT_TIMEZONE;
  const nowInClinic = new Date().toLocaleString("en-US", {
    timeZone: clinicTimezone,
  });

  const todayClinic = new Date(nowInClinic);
  todayClinic.setHours(0, 0, 0, 0);

  // Parse requested date (YYYY-MM-DD -> Local Midnight)
  const parts = input.date.split("-").map(Number);
  const requestedDate = new Date(
    parts[0] ?? 0,
    (parts[1] ?? 1) - 1,
    parts[2] ?? 1,
  );

  if (requestedDate < todayClinic) {
    return {
      success: false,
      error: "past_date",
      message: "I can only check availability for today or future dates.",
      data: { available: false },
    };
  }

  // Use pims_clinic_id for availability lookup if set (e.g., Happy Tails → Alum Rock)
  const availabilityClinicId = clinic.pims_clinic_id ?? clinic.id;

  // Call the V2 database function (time range-based)
  const { data: slots, error } = await supabase.rpc("get_available_slots", {
    p_clinic_id: availabilityClinicId,
    p_date: input.date,
  });

  if (error) {
    logger.error("Failed to get available slots", {
      error,
      clinicId: clinic.id,
    });
    return {
      success: false,
      error: "database_error",
      message: "I'm having trouble seeing the calendar right now.",
      data: { available: false },
    };
  }

  // Apply room filter: for clinics like Masson that only use specific rooms,
  // re-query pims_appointments with provider_name filter and recalculate counts.
  const rawSlots = (slots as AvailableSlot[]) ?? [];
  const roomFilteredSlots = await applyRoomFilterToSlots(
    rawSlots,
    availabilityClinicId,
    input.date,
    supabase,
  );
  const availableSlots = applyClinicHoursFilter(
    roomFilteredSlots,
    availabilityClinicId,
    clinicTimezone,
  );
  const openSlots = availableSlots.filter(
    (slot) => !slot.is_blocked && slot.available_count > 0,
  );

  // Format date for voice response
  const dateForVoice = requestedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // No slots available
  if (openSlots.length === 0) {
    return {
      success: true,
      message: `I don't have any appointments available on ${dateForVoice}. Would you like me to check the next day?`,
      data: {
        available: false,
        date: input.date,
        formatted_date: dateForVoice,
        times: [],
      },
    };
  }

  // Format slots for response (V2 returns timestamptz, convert to clinic local time)
  const times = openSlots.map((slot) => {
    const { time24h, time12h } = slotToLocalTime(
      slot.slot_start,
      clinicTimezone,
    );
    return {
      time_12h: time12h,
      time_24h: time24h,
      value: time24h,
      slots_remaining: slot.available_count,
    };
  });

  const timeList = times
    .slice(0, 4)
    .map((t) => t.time_12h)
    .join(", ");

  return {
    success: true,
    message: `I have availability on ${dateForVoice}. Times include ${timeList}. Which works best?`,
    data: {
      available: true,
      date: input.date,
      formatted_date: dateForVoice,
      count: times.length,
      times,
    },
  };
}
