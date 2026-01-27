/**
 * Cancel Appointment Processor
 *
 * Cancels an existing appointment with explicit verbal consent.
 *
 * Two-step process:
 * 1. First call: Verifies appointment exists, returns details for confirmation
 * 2. Second call (confirmed=true): Updates local DB, queues IDEXX cancellation
 *
 * Architecture: Sync-first, Background Operations
 * - During call: Updates local database (fast)
 * - After call: QStash job cancels in IDEXX (reliable)
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type { CancelAppointmentInput } from "../../schemas/appointments";
import { processVerifyAppointment } from "./verify-appointment";
import { parseDateToISO, formatTime12Hour } from "./book-appointment";

/**
 * Process cancel appointment request
 *
 * @param input - Validated input with client/patient info and confirmed flag
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Cancellation result or confirmation request
 */
export async function processCancelAppointment(
  input: CancelAppointmentInput,
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

  // Parse date for logging
  const parsedDate = parseDateToISO(input.appointment_date);
  if (!parsedDate) {
    return {
      success: false,
      error: "invalid_date",
      message: `I couldn't understand the date "${input.appointment_date}". Could you please say it again?`,
    };
  }

  logger.info("Processing cancel appointment request", {
    clinicId: clinic.id,
    clientName: input.client_name,
    petName: input.pet_name,
    date: parsedDate,
    confirmed: input.confirmed,
  });

  // Step 1: Verify appointment exists
  const verificationResult = await processVerifyAppointment(
    {
      assistant_id: input.assistant_id,
      clinic_id: input.clinic_id,
      vapi_call_id: input.vapi_call_id,
      owner_name: input.client_name,
      patient_name: input.pet_name,
      appointment_date: input.appointment_date,
    },
    ctx,
  );

  // Check if appointment was found
  const verificationData = verificationResult.data as {
    status: string;
    appointment_id?: string;
    idexx_appointment_id?: string;
    formatted_time?: string;
    formatted_date?: string;
    patient_name?: string;
    source?: string;
  } | undefined;

  if (!verificationData || verificationData.status !== "FOUND") {
    return {
      success: false,
      error: "appointment_not_found",
      message: `I don't see an appointment for ${input.pet_name} on that date. Would you like me to check a different date?`,
    };
  }

  // Step 2: If not confirmed, return details and ask for confirmation
  if (!input.confirmed) {
    logger.info("Requesting cancellation confirmation", {
      appointmentId: verificationData.appointment_id,
      clinicId: clinic.id,
    });

    return {
      success: false,
      error: "requires_confirmation",
      message: `I found ${verificationData.patient_name}'s appointment scheduled for ${verificationData.formatted_time} on ${verificationData.formatted_date}. Are you sure you want to cancel this appointment?`,
      data: {
        requires_confirmation: true,
        appointment: verificationData,
        instructions: "Call again with confirmed=true to execute cancellation",
      },
    };
  }

  // Step 3: User confirmed - Execute cancellation

  // 3a. Update local database IMMEDIATELY (fast, no external calls)
  const source = verificationData.source;

  // Type guard: Ensure appointmentId exists
  if (!verificationData.appointment_id) {
    logger.error("Missing appointment_id in verification data", {
      verificationData,
    });
    return {
      success: false,
      error: "invalid_state",
      message: "I apologize, but I'm having some trouble right now. Please call the office directly.",
    };
  }

  // Now TypeScript knows appointment_id is a string
  const appointmentId: string = verificationData.appointment_id;

  if (source === "schedule_appointments") {
    const { error: updateError } = await supabase
      .from("schedule_appointments")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_reason: input.reason ?? "Cancelled via phone",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (updateError) {
      logger.error("Failed to update schedule_appointments", {
        error: updateError,
        appointmentId,
      });
      return {
        success: false,
        error: "database_error",
        message: "I apologize, but I'm having some trouble right now. Your appointment is still scheduled. Please call the office directly.",
      };
    }
  } else if (source === "vapi_bookings") {
    const { error: updateError } = await supabase
      .from("vapi_bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_reason: input.reason ?? "Cancelled via phone",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (updateError) {
      logger.error("Failed to update vapi_bookings", {
        error: updateError,
        appointmentId,
      });
      return {
        success: false,
        error: "database_error",
        message: "I apologize, but I'm having some trouble right now. Your appointment is still scheduled. Please call the office directly.",
      };
    }
  }

  // 3b. Log to audit table
  await supabase.from("appointment_audit_log").insert({
    clinic_id: clinic.id,
    action: "cancel",
    appointment_id: appointmentId,
    idexx_appointment_id: verificationData.idexx_appointment_id,
    reason: input.reason ?? "Cancelled via phone",
    vapi_call_id: callId,
    performed_by: "vapi",
  });

  // 3c. Queue background job to sync cancellation to IDEXX (if IDEXX clinic)
  if (clinic.pims_type === "idexx" && verificationData.idexx_appointment_id) {
    try {
      // Queue job via API route (QStash will handle retry/delivery)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "";

      await fetch(`${baseUrl}/api/jobs/idexx-cancel-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinic.id,
          neo_appointment_id: verificationData.idexx_appointment_id,
          reason: input.reason ?? "Cancelled via phone",
          vapi_call_id: callId,
        }),
      });

      logger.info("Queued IDEXX cancellation job", {
        appointmentId,
        neoId: verificationData.idexx_appointment_id,
        clinicId: clinic.id,
      });
    } catch (queueError) {
      // Non-fatal: Log but don't fail the cancellation
      // The nightly sync will reconcile any discrepancies
      logger.warn("Failed to queue IDEXX cancellation job", {
        error: queueError,
        appointmentId,
      });
    }
  }

  // 3d. Update inbound call record with outcome
  // Note: Actions are already logged in appointment_audit_log
  if (callId) {
    await supabase
      .from("inbound_vapi_calls")
      .update({
        outcome: "Cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("vapi_call_id", callId);
  }

  logger.info("Appointment cancelled successfully", {
    appointmentId,
    neoId: verificationData.idexx_appointment_id,
    clinicId: clinic.id,
    source,
  });

  return {
    success: true,
    message: `Done! I've successfully cancelled ${verificationData.patient_name}'s appointment. Is there anything else I can help you with?`,
    data: {
      cancelled: true,
      appointment_id: appointmentId,
      idexx_appointment_id: verificationData.idexx_appointment_id,
      cancelled_at: new Date().toISOString(),
    },
  };
}
