/**
 * Check Availability Processor
 *
 * Pure business logic for checking appointment slot availability.
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type {
  CheckAvailabilityInput,
  AvailableSlot,
} from "../../schemas/appointments";

const DEFAULT_TIMEZONE = "America/Los_Angeles";

/**
 * Format time from HH:MM:SS to 12-hour format
 */
function formatTime12Hour(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr ?? "0", 10);
  const minute = minuteStr ?? "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
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

  // Call the database function
  const { data: slots, error } = await supabase.rpc("get_available_slots", {
    p_clinic_id: clinic.id,
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

  const availableSlots = (slots as AvailableSlot[]) ?? [];
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

  // Format slots for response
  const times = openSlots.map((slot) => ({
    time_12h: formatTime12Hour(slot.slot_start),
    time_24h: slot.slot_start,
    value: slot.slot_start,
    slots_remaining: slot.available_count,
  }));

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
