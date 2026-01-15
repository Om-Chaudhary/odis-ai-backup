/**
 * Book Appointment Processor
 *
 * Pure business logic for booking appointments with natural language parsing.
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type {
  BookAppointmentInput,
  BookingResult,
} from "../../schemas/appointments";

/* ========================================
   Date/Time Parsing Utilities
   ======================================== */

/**
 * Parse date string to YYYY-MM-DD format
 * Handles natural language dates like:
 * - "today", "tomorrow"
 * - "next monday", "this friday", "monday"
 * - "January 3rd", "Jan 3", "March 15th"
 * - "3rd of January", "15 March"
 * - "the 3rd", "the 15th"
 * - "1/3", "01/03", "1/3/2025"
 * - "2025-01-03" (ISO format)
 */
export function parseDateToISO(dateStr: string): string | null {
  const normalized = dateStr.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  // Handle "today"
  if (normalized === "today") {
    return today.toISOString().split("T")[0] ?? null;
  }

  // Handle "tomorrow"
  if (normalized === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0] ?? null;
  }

  // Day name handling
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  // Handle "next monday", "this friday", etc.
  const nextDayMatch =
    /^(?:next|this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(
      normalized,
    );
  if (nextDayMatch?.[1]) {
    const targetDay = dayNames.indexOf(nextDayMatch[1].toLowerCase());
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    return targetDate.toISOString().split("T")[0] ?? null;
  }

  // Handle just day name like "monday", "tuesday"
  const justDayMatch =
    /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(
      normalized,
    );
  if (justDayMatch?.[1]) {
    const targetDay = dayNames.indexOf(justDayMatch[1].toLowerCase());
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    return targetDate.toISOString().split("T")[0] ?? null;
  }

  // Month name mapping
  const monthNames: Record<string, number> = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sep: 8,
    sept: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
  };

  // Handle "January 3rd", "Jan 3", "March 15th", "December 25"
  const monthDayMatch =
    /^(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i.exec(
      normalized,
    );
  if (monthDayMatch?.[1] && monthDayMatch[2]) {
    const month = monthNames[monthDayMatch[1].toLowerCase()];
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3]
      ? parseInt(monthDayMatch[3], 10)
      : currentYear;

    if (month !== undefined && day >= 1 && day <= 31) {
      const targetDate = new Date(year, month, day);
      if (!monthDayMatch[3] && targetDate < today) {
        targetDate.setFullYear(currentYear + 1);
      }
      return targetDate.toISOString().split("T")[0] ?? null;
    }
  }

  // Handle "3rd of January", "15th of March", "15 March"
  const dayOfMonthMatch =
    /^(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)(?:,?\s*(\d{4}))?$/i.exec(
      normalized,
    );
  if (dayOfMonthMatch?.[1] && dayOfMonthMatch[2]) {
    const day = parseInt(dayOfMonthMatch[1], 10);
    const month = monthNames[dayOfMonthMatch[2].toLowerCase()];
    const year = dayOfMonthMatch[3]
      ? parseInt(dayOfMonthMatch[3], 10)
      : currentYear;

    if (month !== undefined && day >= 1 && day <= 31) {
      const targetDate = new Date(year, month, day);
      if (!dayOfMonthMatch[3] && targetDate < today) {
        targetDate.setFullYear(currentYear + 1);
      }
      return targetDate.toISOString().split("T")[0] ?? null;
    }
  }

  // Handle "the 3rd", "the 15th" (assumes current or next month)
  const theDayMatch = /^the\s+(\d{1,2})(?:st|nd|rd|th)?$/i.exec(normalized);
  if (theDayMatch?.[1]) {
    const day = parseInt(theDayMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const targetDate = new Date(today);
      targetDate.setDate(day);
      if (targetDate < today) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
      return targetDate.toISOString().split("T")[0] ?? null;
    }
  }

  // Handle MM/DD or M/D format (US format)
  const slashMatch = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(normalized);
  if (slashMatch?.[1] && slashMatch[2]) {
    const month = parseInt(slashMatch[1], 10) - 1;
    const day = parseInt(slashMatch[2], 10);
    let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : currentYear;
    if (year < 100) year += 2000;

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const targetDate = new Date(year, month, day);
      if (!slashMatch[3] && targetDate < today) {
        targetDate.setFullYear(currentYear + 1);
      }
      return targetDate.toISOString().split("T")[0] ?? null;
    }
  }

  // Fallback: try native Date parsing
  const cleanedDateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/gi, "$1");
  const parsed = new Date(cleanedDateStr);

  if (!isNaN(parsed.getTime())) {
    if (parsed.getFullYear() < currentYear - 1) {
      parsed.setFullYear(currentYear);
    }
    const hadExplicitYear = /\d{4}/.test(dateStr);
    if (!hadExplicitYear) {
      const parsedNoTime = new Date(parsed);
      parsedNoTime.setHours(0, 0, 0, 0);
      if (parsedNoTime < today) {
        parsed.setFullYear(currentYear + 1);
      }
    }
    return parsed.toISOString().split("T")[0] ?? null;
  }

  return null;
}

/**
 * Parse time string to HH:MM:SS format
 */
export function parseTimeToISO(timeStr: string): string | null {
  const normalized = timeStr.toLowerCase().trim();

  // Handle "9am", "2pm" format
  const simpleMatch = /^(\d{1,2})\s*(am|pm)$/i.exec(normalized);
  if (simpleMatch?.[1] && simpleMatch[2]) {
    let hour = parseInt(simpleMatch[1], 10);
    const isPM = simpleMatch[2].toLowerCase() === "pm";
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:00:00`;
  }

  // Handle "9:30am", "2:30pm" format
  const colonMatch = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(normalized);
  if (colonMatch?.[1] && colonMatch[2]) {
    let hour = parseInt(colonMatch[1], 10);
    const minute = parseInt(colonMatch[2], 10);
    const meridiem = colonMatch[3]?.toLowerCase();

    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
  }

  // Already in 24-hour format
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  }

  return null;
}

/**
 * Format time from HH:MM:SS to 12-hour format
 */
export function formatTime12Hour(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr ?? "0", 10);
  const minute = minuteStr ?? "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

/* ========================================
   Business Logic Processor
   ======================================== */

// Del Valle Pet Hospital clinic ID (uses Avimark - no API, hardcoded availability)
const DEL_VALLE_CLINIC_ID = "cf9d40fc-8bd3-415a-b4ab-57d99870e139";

/**
 * Process book appointment request
 *
 * @param input - Validated input from schema
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Tool result with booking confirmation
 */
export async function processBookAppointment(
  input: BookAppointmentInput,
  ctx: ToolContext,
): Promise<ToolResult> {
  const { clinic, supabase, logger, callId } = ctx;

  if (!clinic) {
    return {
      success: false,
      error: "clinic_not_found",
      message: "I couldn't identify the clinic. Please try again later.",
    };
  }

  // Parse date and time
  const parsedDate = parseDateToISO(input.date);
  if (!parsedDate) {
    return {
      success: false,
      error: "invalid_date",
      message: `I couldn't understand the date "${input.date}". Could you please say it again?`,
    };
  }

  const parsedTime = parseTimeToISO(input.time);
  if (!parsedTime) {
    return {
      success: false,
      error: "invalid_time",
      message: `I couldn't understand the time "${input.time}". Could you please say it again, like "9 AM" or "2:30 PM"?`,
    };
  }

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestedDate = new Date(parsedDate);
  if (requestedDate < today) {
    return {
      success: false,
      error: "past_date",
      message: "I can only book appointments for today or future dates.",
    };
  }

  // Format date and time for human-readable response
  const formattedDate = new Date(parsedDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const formattedTime = formatTime12Hour(parsedTime);

  // === Del Valle Pet Hospital: Store booking in inbound call record ===
  // Del Valle uses Avimark (cloud PIMS, no API), so we store the booking
  // in the inbound_vapi_calls table for staff to manually enter into Avimark
  if (clinic.id === DEL_VALLE_CLINIC_ID) {
    if (!callId) {
      logger.error("Del Valle booking requires callId", {
        clinicId: clinic.id,
      });
      return {
        success: false,
        error: "missing_call_id",
        message:
          "I'm having trouble booking your appointment right now. Please try again.",
      };
    }

    // Store booking details in the inbound call record
    const { error } = await supabase
      .from("inbound_vapi_calls")
      .update({
        structured_data: {
          appointment: {
            date: parsedDate,
            time: parsedTime,
            client_name: input.client_name,
            client_phone: input.client_phone,
            patient_name: input.patient_name,
            reason: input.reason ?? null,
            species: input.species ?? null,
            breed: input.breed ?? null,
            is_new_client: input.is_new_client ?? false,
            booked_at: new Date().toISOString(),
          },
        },
        call_analysis: {
          outcome: "scheduled",
          appointment_booked: true,
        },
        // Set outcome field directly for dashboard filtering
        // This will be overridden by end-of-call-report webhook if VAPI sends call_outcome_data
        outcome: "Scheduled",
      })
      .eq("vapi_call_id", callId);

    if (error) {
      logger.error("Failed to store Del Valle booking", {
        error,
        callId,
        clinicId: clinic.id,
      });
      return {
        success: false,
        error: "database_error",
        message:
          "I'm having trouble booking your appointment right now. Please try again in a moment.",
      };
    }

    logger.info("Del Valle appointment stored in inbound call", {
      callId,
      clinicId: clinic.id,
      clinicName: clinic.name,
      date: parsedDate,
      time: parsedTime,
      patientName: input.patient_name,
    });

    return {
      success: true,
      message: `Perfect! I've scheduled ${input.patient_name} for ${formattedDate} at ${formattedTime}. Is there anything else I can help you with?`,
      data: {
        appointment: {
          date: parsedDate,
          formatted_date: formattedDate,
          time: parsedTime,
          formatted_time: formattedTime,
          patient_name: input.patient_name,
          client_name: input.client_name,
          reason: input.reason,
        },
        clinic_name: clinic.name,
        note: "Appointment will be manually entered into Avimark by clinic staff",
      },
    };
  }

  // === All other clinics: Use schedule_slots booking ===
  // Call the book_slot_with_hold function
  const rpcParams = {
    p_clinic_id: clinic.id,
    p_date: parsedDate,
    p_time: parsedTime,
    p_client_name: input.client_name,
    p_client_phone: input.client_phone,
    p_patient_name: input.patient_name,
    p_species: input.species ?? null,
    p_reason: input.reason ?? null,
    p_is_new_client: input.is_new_client,
    p_vapi_call_id: ctx.callId ?? null,
  };
  const { data, error } = await supabase.rpc(
    "book_slot_with_hold",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rpcParams as any,
  );

  if (error) {
    logger.error("Failed to book slot", { error, clinicId: clinic.id });
    return {
      success: false,
      error: "database_error",
      message:
        "I'm having trouble booking your appointment right now. Please try again in a moment.",
    };
  }

  const result = data as unknown as BookingResult;

  if (!result.success) {
    // Booking failed - slot not available
    const alternatives = result.alternative_times ?? [];
    const alternativeText =
      alternatives.length > 0
        ? ` I have availability at ${alternatives
            .slice(0, 3)
            .map((a) => a.time)
            .join(", ")}. Would any of those work for you?`
        : " Would you like me to check another day?";

    logger.info("Booking failed - slot unavailable", {
      clinicId: clinic.id,
      date: parsedDate,
      time: parsedTime,
      alternatives: alternatives.length,
    });

    return {
      success: false,
      error: result.error ?? "slot_unavailable",
      message: `I'm sorry, ${formattedTime} on ${formattedDate} is no longer available.${alternativeText}`,
      data: {
        alternative_times: alternatives,
      },
    };
  }

  // Booking successful
  logger.info("Appointment booked successfully", {
    bookingId: result.booking_id,
    confirmationNumber: result.confirmation_number,
    clinicId: clinic.id,
    clinicName: clinic.name,
    date: parsedDate,
    time: parsedTime,
    patientName: input.patient_name,
  });

  return {
    success: true,
    message: `Great! I've booked your appointment for ${input.patient_name} on ${formattedDate} at ${formattedTime}. Your confirmation number is ${result.confirmation_number}. Is there anything else I can help you with?`,
    data: {
      confirmation_number: result.confirmation_number,
      booking_id: result.booking_id,
      appointment: {
        date: parsedDate,
        formatted_date: formattedDate,
        time: parsedTime,
        formatted_time: formattedTime,
        patient_name: input.patient_name,
        client_name: input.client_name,
        reason: input.reason,
      },
      clinic_name: clinic.name,
      hold_info: {
        expires_in_minutes: 5,
        note: "This appointment is being held for 5 minutes while we complete your booking.",
      },
    },
  };
}
