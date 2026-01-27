/**
 * Verify Appointment Processor
 *
 * Internal helper that verifies an appointment exists in local synced data.
 * Used by confirm_appointment, cancel_appointment, and reschedule_appointment.
 *
 * Data Sources (in order):
 * 1. schedule_appointments - Primary source (synced from IDEXX)
 * 2. vapi_bookings - Fallback for same-day bookings not yet synced
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type {
  VerifyAppointmentInput,
  VerifyAppointmentResult,
} from "../../schemas/appointments";
import { parseDateToISO, formatTime12Hour } from "./book-appointment";

/**
 * Process appointment verification request
 *
 * @param input - Validated input with owner_name, patient_name, appointment_date
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Verification result with appointment details or not found
 */
export async function processVerifyAppointment(
  input: VerifyAppointmentInput,
  ctx: ToolContext,
): Promise<ToolResult> {
  const { clinic, supabase, logger } = ctx;

  if (!clinic) {
    return {
      success: false,
      error: "clinic_not_found",
      message: "I couldn't identify the clinic. Please try again later.",
    };
  }

  // Parse date (supports natural language)
  const parsedDate = parseDateToISO(input.appointment_date);
  if (!parsedDate) {
    return {
      success: false,
      error: "invalid_date",
      message: `I couldn't understand the date "${input.appointment_date}". Could you please say it again?`,
    };
  }

  logger.info("Verifying appointment", {
    clinicId: clinic.id,
    ownerName: input.owner_name,
    patientName: input.patient_name,
    date: parsedDate,
  });

  // Format date for human-readable response
  const formattedDate = new Date(parsedDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Step 1: Query schedule_appointments (primary source - synced from IDEXX)
  const { data: scheduleAppts, error: scheduleError } = await supabase
    .from("schedule_appointments")
    .select("*")
    .eq("clinic_id", clinic.id)
    .eq("date", parsedDate)
    .ilike("client_name", `%${input.owner_name}%`)
    .ilike("patient_name", `%${input.patient_name}%`)
    .is("deleted_at", null)
    .not("status", "in", '("cancelled","no_show")');

  if (scheduleError) {
    logger.error("Failed to query schedule_appointments", {
      error: scheduleError,
      clinicId: clinic.id,
    });
  }

  // Check if we found an appointment in schedule_appointments
  if (scheduleAppts && scheduleAppts.length > 0 && scheduleAppts[0]) {
    const appt = scheduleAppts[0];
    const result: VerifyAppointmentResult = {
      status: "FOUND",
      appointment_id: appt.id,
      idexx_appointment_id: appt.neo_appointment_id ?? undefined,
      appointment_time: appt.start_time ?? undefined,
      appointment_time_end: appt.end_time ?? undefined,
      appointment_date: appt.date ?? undefined,
      formatted_date: formattedDate,
      formatted_time: appt.start_time ? formatTime12Hour(appt.start_time) : undefined,
      provider_name: appt.provider_name ?? undefined,
      appointment_type: appt.appointment_type ?? undefined,
      room: appt.room_id ?? undefined,
      patient_name: appt.patient_name ?? undefined,
      client_name: appt.client_name ?? undefined,
      client_phone: appt.client_phone ?? undefined,
      source: "schedule_appointments",
    };

    logger.info("Appointment found in schedule_appointments", {
      appointmentId: appt.id,
      neoId: appt.neo_appointment_id,
      clinicId: clinic.id,
    });

    return {
      success: true,
      message: `Found appointment for ${appt.patient_name ?? "your pet"} on ${formattedDate} at ${result.formatted_time ?? "scheduled time"}.`,
      data: result as unknown as Record<string, unknown>,
    };
  }

  // Step 2: Fallback - Check vapi_bookings for recently booked appointments not yet synced
  const { data: vapiBookings, error: vapiError } = await supabase
    .from("vapi_bookings")
    .select("*")
    .eq("clinic_id", clinic.id)
    .or(`date.eq.${parsedDate}`)
    .ilike("client_name", `%${input.owner_name}%`)
    .ilike("patient_name", `%${input.patient_name}%`)
    .in("status", ["pending", "confirmed"]);

  if (vapiError) {
    logger.error("Failed to query vapi_bookings", {
      error: vapiError,
      clinicId: clinic.id,
    });
  }

  if (vapiBookings && vapiBookings.length > 0 && vapiBookings[0]) {
    const booking = vapiBookings[0];
    const result: VerifyAppointmentResult = {
      status: "FOUND",
      appointment_id: booking.id,
      idexx_appointment_id: booking.idexx_appointment_id ?? undefined,
      appointment_time: booking.start_time ?? undefined,
      appointment_time_end: booking.end_time ?? undefined,
      appointment_date: booking.date ?? undefined,
      formatted_date: formattedDate,
      formatted_time: booking.start_time ? formatTime12Hour(booking.start_time) : undefined,
      provider_name: booking.provider_name ?? undefined,
      appointment_type: booking.appointment_type ?? undefined,
      room: booking.room_id ?? undefined,
      patient_name: booking.patient_name ?? undefined,
      client_name: booking.client_name ?? undefined,
      client_phone: booking.client_phone ?? undefined,
      source: "vapi_bookings",
    };

    logger.info("Appointment found in vapi_bookings", {
      bookingId: booking.id,
      idexxId: booking.idexx_appointment_id,
      clinicId: clinic.id,
    });

    return {
      success: true,
      message: `Found appointment for ${booking.patient_name ?? "your pet"} on ${formattedDate} at ${result.formatted_time ?? "scheduled time"}.`,
      data: result as unknown as Record<string, unknown>,
    };
  }

  // Step 3: Appointment not found
  const notFoundResult: VerifyAppointmentResult = {
    status: "DOES_NOT_EXIST",
    message: `No appointment found for ${input.patient_name} on ${formattedDate}.`,
  };

  logger.info("Appointment not found", {
    ownerName: input.owner_name,
    patientName: input.patient_name,
    date: parsedDate,
    clinicId: clinic.id,
  });

  return {
    success: true,
    message: `I don't see an appointment scheduled for ${input.patient_name} on ${formattedDate}. Would you like me to check a different date?`,
    data: notFoundResult as unknown as Record<string, unknown>,
  };
}
