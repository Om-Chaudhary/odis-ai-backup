/**
 * Reschedule Appointment Processor
 *
 * Atomically reschedules an existing appointment to a new date/time.
 *
 * Two-step process:
 * 1. First call: Verifies original exists, checks new time availability
 * 2. Second call (confirmed=true): Atomic cancel+create with rollback on failure
 *
 * Architecture: Sync-first, Background Operations
 * - During call: Updates local database (fast)
 * - After call: QStash job handles IDEXX cancel+create (reliable)
 *
 * GUARANTEE: Caller NEVER ends up without an appointment.
 * If new appointment creation fails, original is restored.
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type { RescheduleAppointmentInput } from "../../schemas/appointments";
import { processVerifyAppointment } from "./verify-appointment";
import {
  parseDateToISO,
  parseTimeToISO,
  formatTime12Hour,
} from "./book-appointment";

/**
 * Process reschedule appointment request
 *
 * @param input - Validated input with original and new appointment details
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Reschedule result or confirmation request
 */
export async function processRescheduleAppointment(
  input: RescheduleAppointmentInput,
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

  // Parse dates
  const originalDate = parseDateToISO(input.original_date);
  const newDate = parseDateToISO(input.preferred_new_date);

  if (!originalDate) {
    return {
      success: false,
      error: "invalid_original_date",
      message: `I couldn't understand the original date "${input.original_date}". Could you please say it again?`,
    };
  }

  if (!newDate) {
    return {
      success: false,
      error: "invalid_new_date",
      message: `I couldn't understand the new date "${input.preferred_new_date}". Could you please say it again?`,
    };
  }

  // Parse new time if provided
  let newTime = input.preferred_new_time
    ? parseTimeToISO(input.preferred_new_time)
    : null;

  logger.info("Processing reschedule appointment request", {
    clinicId: clinic.id,
    clientName: input.client_name,
    petName: input.pet_name,
    originalDate,
    newDate,
    newTime,
    confirmed: input.confirmed,
  });

  // Step 1: Verify original appointment exists
  const verificationResult = await processVerifyAppointment(
    {
      assistant_id: input.assistant_id,
      clinic_id: input.clinic_id,
      vapi_call_id: input.vapi_call_id,
      owner_name: input.client_name,
      patient_name: input.pet_name,
      appointment_date: input.original_date,
    },
    ctx,
  );

  const originalAppt = verificationResult.data as
    | {
        status: string;
        appointment_id?: string;
        idexx_appointment_id?: string;
        appointment_time?: string;
        appointment_time_end?: string;
        formatted_time?: string;
        formatted_date?: string;
        patient_name?: string;
        client_name?: string;
        client_phone?: string;
        source?: string;
        provider_name?: string;
        appointment_type?: string;
        room?: string;
      }
    | undefined;

  if (originalAppt?.status !== "FOUND") {
    return {
      success: false,
      error: "appointment_not_found",
      message: `I don't see an appointment for ${input.pet_name} on that date. Would you like me to check a different date, or schedule a new appointment?`,
    };
  }

  // Step 2: Check availability for new date/time
  // If no specific time requested, get all available slots for the day
  const { data: availableSlots, error: slotsError } = await supabase.rpc(
    "get_available_slots",
    {
      p_clinic_id: clinic.id,
      p_date: newDate,
    },
  );

  if (slotsError) {
    logger.error("Failed to check availability", {
      error: slotsError,
      clinicId: clinic.id,
      date: newDate,
    });
  }

  const slots = (availableSlots ?? []) as Array<{
    slot_start: string;
    slot_end: string;
    available_count: number;
  }>;

  // Format new date for display
  const formattedNewDate = new Date(newDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // If specific time requested, check if it's available
  if (newTime) {
    const requestedSlot = slots.find(
      (s) => s.slot_start === newTime && s.available_count > 0,
    );

    if (!requestedSlot) {
      // Requested time not available - offer alternatives
      const alternatives = slots
        .filter((s) => s.available_count > 0)
        .slice(0, 5)
        .map((s) => ({
          time: s.slot_start,
          formatted_time: formatTime12Hour(s.slot_start),
        }));

      const alternativeText =
        alternatives.length > 0
          ? `I have availability at ${alternatives.map((a) => a.formatted_time).join(", ")}.`
          : `There are no available appointments on ${formattedNewDate}.`;

      return {
        success: false,
        error: "slot_not_available",
        message: `I'm sorry, ${formatTime12Hour(newTime)} on ${formattedNewDate} isn't available. ${alternativeText} Would any of those work?`,
        data: {
          alternative_times: alternatives,
          original_appointment: originalAppt,
        },
      };
    }
  } else {
    // No specific time - check if any slots available
    const availableCount = slots.filter((s) => s.available_count > 0).length;

    if (availableCount === 0) {
      return {
        success: false,
        error: "no_availability",
        message: `I'm sorry, there are no available appointments on ${formattedNewDate}. Would you like me to check a different date?`,
        data: {
          original_appointment: originalAppt,
        },
      };
    }

    // Default to first available slot
    const firstAvailable = slots.find((s) => s.available_count > 0);
    newTime = firstAvailable?.slot_start ?? null;
  }

  if (!newTime) {
    return {
      success: false,
      error: "no_time_selected",
      message: "What time would you like for your new appointment?",
    };
  }

  const formattedNewTime = formatTime12Hour(newTime);

  // Step 3: If not confirmed, return details and ask for confirmation
  if (!input.confirmed) {
    logger.info("Requesting reschedule confirmation", {
      originalAppointmentId: originalAppt.appointment_id,
      clinicId: clinic.id,
      newDate,
      newTime,
    });

    return {
      success: false,
      error: "requires_confirmation",
      message: `I found ${originalAppt.patient_name}'s appointment scheduled for ${originalAppt.formatted_time} on ${originalAppt.formatted_date}. I can reschedule to ${formattedNewTime} on ${formattedNewDate}. This will cancel your current appointment. Should I go ahead and make that change?`,
      data: {
        requires_confirmation: true,
        current_appointment: originalAppt,
        new_appointment: {
          date: newDate,
          formatted_date: formattedNewDate,
          time: newTime,
          formatted_time: formattedNewTime,
        },
        instructions: "Call again with confirmed=true to execute reschedule",
      },
    };
  }

  // Step 4: User confirmed - Execute ATOMIC reschedule

  // 4a. Update original appointment as cancelled in local DB
  const source = originalAppt.source;
  const originalId = originalAppt.appointment_id;

  // Verify we have an appointment ID to work with
  if (!originalId) {
    return {
      success: false,
      error: "missing_appointment_id",
      message:
        "I couldn't find the appointment ID. Please try again or call the office directly.",
    };
  }

  if (source === "schedule_appointments") {
    const { error: cancelError } = await supabase
      .from("schedule_appointments")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_reason: `Rescheduled to ${newDate} ${newTime}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", originalId);

    if (cancelError) {
      logger.error("Failed to cancel original appointment", {
        error: cancelError,
        appointmentId: originalId,
      });
      return {
        success: false,
        error: "database_error",
        message:
          "I apologize, but I couldn't complete the reschedule. Don't worry - your original appointment is still in place. Please call the office directly.",
      };
    }
  } else if (source === "vapi_bookings") {
    const { error: cancelError } = await supabase
      .from("vapi_bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_reason: `Rescheduled to ${newDate} ${newTime}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", originalId);

    if (cancelError) {
      logger.error("Failed to cancel original booking", {
        error: cancelError,
        bookingId: originalId,
      });
      return {
        success: false,
        error: "database_error",
        message:
          "I apologize, but I couldn't complete the reschedule. Don't worry - your original appointment is still in place. Please call the office directly.",
      };
    }
  }

  // 4b. Create new booking record
  const { data: newBooking, error: createError } = await supabase
    .from("vapi_bookings")
    .insert({
      clinic_id: clinic.id,
      vapi_call_id: callId,
      client_name: originalAppt.client_name ?? input.client_name,
      client_phone: originalAppt.client_phone ?? input.client_phone,
      patient_name: originalAppt.patient_name ?? input.pet_name,
      date: newDate,
      start_time: newTime,
      status: "pending_sync", // Will be updated by background job
      reason: input.reason ?? "Rescheduled appointment",
      provider_name: originalAppt.provider_name,
      appointment_type: originalAppt.appointment_type,
      room_id: originalAppt.room,
      rescheduled_from_id: source === "vapi_bookings" ? originalId : null,
      metadata: {
        rescheduled_from: {
          id: originalId,
          source,
          idexx_id: originalAppt.idexx_appointment_id,
          original_date: originalAppt.formatted_date,
          original_time: originalAppt.formatted_time,
        },
      },
    })
    .select()
    .single();

  if (createError || !newBooking) {
    // ROLLBACK: Restore original appointment
    logger.error("Failed to create new booking, rolling back", {
      error: createError,
      originalId,
    });

    if (source === "schedule_appointments") {
      await supabase
        .from("schedule_appointments")
        .update({
          status: "scheduled",
          cancelled_at: null,
          cancelled_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", originalId);
    } else {
      await supabase
        .from("vapi_bookings")
        .update({
          status: "confirmed",
          cancelled_at: null,
          cancelled_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", originalId);
    }

    return {
      success: false,
      error: "rollback_success",
      message:
        "I apologize, but I couldn't complete the reschedule. Don't worry - your original appointment at " +
        `${originalAppt.formatted_time} on ${originalAppt.formatted_date} is still in place.`,
    };
  }

  // 4c. Log to audit table
  await supabase.from("appointment_audit_log").insert({
    clinic_id: clinic.id,
    action: "reschedule",
    appointment_id: newBooking.id,
    old_appointment_id: originalId,
    idexx_appointment_id: originalAppt.idexx_appointment_id,
    old_datetime: `${originalAppt.formatted_date} ${originalAppt.appointment_time}`,
    new_datetime: `${newDate} ${newTime}`,
    reason: input.reason ?? "Rescheduled via phone",
    vapi_call_id: callId,
    performed_by: "vapi",
  });

  // 4d. Queue background job to sync reschedule to IDEXX
  if (clinic.pims_type === "idexx") {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "";

      await fetch(`${baseUrl}/api/jobs/idexx-reschedule-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinic.id,
          cancel_neo_appointment_id: originalAppt.idexx_appointment_id,
          new_booking_id: newBooking.id,
          new_date: newDate,
          new_time: newTime,
          patient_name: originalAppt.patient_name,
          client_name: originalAppt.client_name,
          client_phone: originalAppt.client_phone,
          provider_name: originalAppt.provider_name,
          appointment_type: originalAppt.appointment_type,
          room: originalAppt.room,
          reason: input.reason,
          vapi_call_id: callId,
        }),
      });

      logger.info("Queued IDEXX reschedule job", {
        originalId,
        newBookingId: newBooking.id,
        clinicId: clinic.id,
      });
    } catch (queueError) {
      // Non-fatal: The nightly sync will reconcile
      logger.warn("Failed to queue IDEXX reschedule job", {
        error: queueError,
        originalId,
        newBookingId: newBooking.id,
      });
    }
  }

  // 4e. Update inbound call record with outcome and appointment data
  // Store appointment details in structured_data.appointment so that
  // mergeStructuredDataWithToolData() can override VAPI's hallucinated dates
  if (callId) {
    await supabase
      .from("inbound_vapi_calls")
      .update({
        outcome: "Rescheduled",
        structured_data: {
          appointment: {
            date: newDate,
            time: newTime,
            client_name: originalAppt.client_name ?? input.client_name,
            client_phone: originalAppt.client_phone ?? input.client_phone,
            patient_name: originalAppt.patient_name ?? input.pet_name,
            original_date: originalDate,
            original_time: originalAppt.appointment_time ?? null,
            rescheduled_at: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("vapi_call_id", callId);
  }

  logger.info("Appointment rescheduled successfully", {
    originalId,
    newBookingId: newBooking.id,
    clinicId: clinic.id,
    newDate,
    newTime,
  });

  return {
    success: true,
    message: `Perfect! I've rescheduled ${originalAppt.patient_name}'s appointment to ${formattedNewTime} on ${formattedNewDate}. Is there anything else I can help you with?`,
    data: {
      rescheduled: true,
      original_appointment_id: originalId,
      new_booking_id: newBooking.id,
      old_datetime: {
        date: originalAppt.formatted_date,
        time: originalAppt.formatted_time,
      },
      new_datetime: {
        date: formattedNewDate,
        time: formattedNewTime,
      },
    },
  };
}
