/**
 * Check Availability Range Processor
 *
 * Pure business logic for checking appointment availability across a date range.
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type {
  CheckAvailabilityRangeInput,
  AvailableSlot,
} from "../../schemas/appointments";

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
 * Format date for display
 */
function formatDateForDisplay(dateStr: string): {
  formatted: string;
  dayOfWeek: string;
} {
  const date = new Date(dateStr + "T12:00:00"); // Avoid timezone issues
  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
  return { formatted, dayOfWeek };
}

/**
 * Day availability summary
 */
interface DayAvailability {
  date: string;
  formatted_date: string;
  day_of_week: string;
  total_slots: number;
  available_slots: number;
  earliest_time: string | null;
  latest_time: string | null;
  is_stale: boolean;
}

/**
 * Process check availability range request
 *
 * @param input - Validated input from schema
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Tool result with availability range data
 */
export async function processCheckAvailabilityRange(
  input: CheckAvailabilityRangeInput,
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

  // Calculate date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = input.start_date
    ? new Date(input.start_date + "T00:00:00")
    : new Date(today);

  if (startDate < today) {
    startDate.setTime(today.getTime());
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + input.days_ahead - 1);

  // Use pims_clinic_id for availability lookup if set (e.g., Happy Tails → Alum Rock)
  const availabilityClinicId = clinic.pims_clinic_id ?? clinic.id;

  // Query availability for each date in range
  const availability: DayAvailability[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0]!;

    const { data: slots, error } = await supabase.rpc("get_available_slots", {
      p_clinic_id: availabilityClinicId,
      p_date: dateStr,
    });

    if (!error && slots) {
      const typedSlots = slots as AvailableSlot[];
      const openSlots = typedSlots.filter(
        (slot) => !slot.is_blocked && slot.available_count > 0,
      );

      const { formatted, dayOfWeek } = formatDateForDisplay(dateStr);

      availability.push({
        date: dateStr,
        formatted_date: formatted,
        day_of_week: dayOfWeek,
        total_slots: typedSlots.length,
        available_slots: openSlots.length,
        earliest_time: openSlots.length > 0 ? openSlots[0]!.slot_start : null,
        latest_time:
          openSlots.length > 0
            ? openSlots[openSlots.length - 1]!.slot_start
            : null,
        is_stale: false,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Find first available date
  const firstAvailable = availability.find((d) => d.available_slots > 0);

  // Get detailed slots for first available date
  let firstAvailableTimes: Array<{
    time: string;
    time_24h: string;
    slots_remaining: number;
  }> = [];

  if (firstAvailable) {
    const { data: detailedSlots } = await supabase.rpc("get_available_slots", {
      p_clinic_id: availabilityClinicId,
      p_date: firstAvailable.date,
    });

    if (detailedSlots) {
      const openSlots = (detailedSlots as AvailableSlot[]).filter(
        (slot) => !slot.is_blocked && slot.available_count > 0,
      );
      firstAvailableTimes = openSlots.map((slot) => ({
        time: formatTime12Hour(slot.slot_start),
        time_24h: slot.slot_start,
        slots_remaining: slot.available_count,
      }));
    }
  }

  // Build summary
  const daysWithAvailability = availability.filter(
    (d) => d.available_slots > 0,
  );
  const totalAvailableSlots = availability.reduce(
    (sum, d) => sum + d.available_slots,
    0,
  );

  // Build human-readable message for VAPI
  let message: string;

  if (daysWithAvailability.length === 0) {
    message = `I'm sorry, there are no available appointments in the next ${input.days_ahead} days. Would you like me to take your information for a callback?`;
  } else if (firstAvailable) {
    const timeList = firstAvailableTimes
      .slice(0, 3)
      .map((t) => t.time)
      .join(", ");
    const moreCount =
      firstAvailableTimes.length > 3 ? firstAvailableTimes.length - 3 : 0;
    const moreText = moreCount > 0 ? ` and ${moreCount} more times` : "";

    message = `I have availability on ${firstAvailable.day_of_week}, ${firstAvailable.formatted_date}. Times include: ${timeList}${moreText}. We have ${daysWithAvailability.length} days with availability in the next ${input.days_ahead} days. Would you like to book one of these times?`;
  } else {
    message = `We have availability on ${daysWithAvailability.length} days over the next ${input.days_ahead} days. What day works best for you?`;
  }

  logger.info("Availability range check completed", {
    clinicId: clinic.id,
    daysChecked: input.days_ahead,
    daysWithAvailability: daysWithAvailability.length,
    totalSlots: totalAvailableSlots,
  });

  return {
    success: true,
    message,
    data: {
      available: daysWithAvailability.length > 0,
      date_range: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
        days_checked: input.days_ahead,
      },
      summary: {
        days_with_availability: daysWithAvailability.length,
        total_available_slots: totalAvailableSlots,
      },
      first_available: firstAvailable
        ? {
            date: firstAvailable.date,
            formatted_date: firstAvailable.formatted_date,
            day_of_week: firstAvailable.day_of_week,
            times: firstAvailableTimes.slice(0, 8),
            total_times: firstAvailableTimes.length,
          }
        : null,
      availability: availability.map((d) => ({
        date: d.date,
        formatted_date: d.formatted_date,
        day_of_week: d.day_of_week,
        available_slots: d.available_slots,
        earliest_time: d.earliest_time
          ? formatTime12Hour(d.earliest_time)
          : null,
        latest_time: d.latest_time ? formatTime12Hour(d.latest_time) : null,
      })),
    },
  };
}
