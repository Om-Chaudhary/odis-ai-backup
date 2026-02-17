/**
 * Slack Notifier Background Job
 *
 * Sends Slack notifications for appointment bookings and other
 * events that require staff attention.
 *
 * @module vapi/webhooks/background-jobs/slack-notifier
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.webhook.child("slack-notifier");

/**
 * VAPI booking record structure
 */
interface VapiBooking {
  id: string;
  client_name: string;
  patient_name: string;
  date: string;
  start_time: string;
  client_phone: string;
  reason: string | null;
  species: string | null;
  breed: string | null;
  is_new_client: boolean | null;
}

/**
 * Options for appointment notification
 */
export interface AppointmentNotificationOptions {
  /** VAPI call ID */
  vapiCallId: string;
  /** Assistant ID (used to determine which clinic) */
  assistantId: string | undefined;
  /** Supabase client */
  supabase: SupabaseClient;
}

/**
 * Get clinic name from assistant ID
 * Checks both inbound and outbound assistant ID fields
 */
async function getClinicNameFromAssistant(
  assistantId: string | undefined,
  supabase: SupabaseClient,
): Promise<string> {
  if (!assistantId) {
    return "Unknown Clinic";
  }

  // Dynamic import to avoid circular dependencies
  const { getClinicByInboundAssistantId, getClinicByOutboundAssistantId } =
    await import("@odis-ai/domain/clinics");

  // Try inbound first, then outbound
  let clinic = await getClinicByInboundAssistantId(assistantId, supabase);
  clinic ??= await getClinicByOutboundAssistantId(assistantId, supabase);

  return clinic?.name ?? "Unknown Clinic";
}

/**
 * Send Slack notification for appointment booking
 *
 * This is a fire-and-forget operation that runs in the background.
 * Sends notifications for all clinics to the ODIS team Slack.
 *
 * @param options - Notification options
 */
export function notifyAppointmentBookedBackground(
  options: AppointmentNotificationOptions,
): void {
  const { vapiCallId, assistantId, supabase } = options;

  // Fire and forget - don't await
  void (async () => {
    try {
      // Check if there's a vapi_booking for this call
      const { data: booking, error: fetchError } = await supabase
        .from("appointment_bookings")
        .select("*")
        .eq("vapi_call_id", vapiCallId)
        .limit(1)
        .single();

      if (fetchError) {
        // No booking found - this is fine, not all calls result in appointments
        if (fetchError.code !== "PGRST116") {
          logger.debug("No vapi booking found for call", {
            vapiCallId,
            error: fetchError.message,
          });
        }
        return;
      }

      if (!booking) {
        return;
      }

      // Get clinic name from assistant ID
      const clinicName = await getClinicNameFromAssistant(
        assistantId,
        supabase,
      );

      logger.info("Appointment booked - sending Slack notification", {
        vapiCallId,
        bookingId: booking.id,
        clinicName,
        clientName: booking.client_name,
        petName: booking.patient_name,
        date: booking.date,
        time: booking.start_time,
      });

      // Dynamic import to avoid circular dependencies
      const { notifySlack, isEnvSlackConfigured } =
        await import("@odis-ai/integrations/slack");

      // Check if Slack is configured
      if (!isEnvSlackConfigured()) {
        logger.debug("Slack not configured, skipping notification", {
          vapiCallId,
          bookingId: booking.id,
        });
        return;
      }

      const vapiBooking = booking as VapiBooking;

      // Send notification using generic service
      notifySlack("appointment_booked", {
        clinicName,
        clientName: vapiBooking.client_name,
        petName: vapiBooking.patient_name,
        date: vapiBooking.date,
        time: vapiBooking.start_time,
        phone: vapiBooking.client_phone,
        reason: vapiBooking.reason ?? undefined,
        species: vapiBooking.species ?? undefined,
        breed: vapiBooking.breed ?? undefined,
        isNewClient: vapiBooking.is_new_client ?? undefined,
        bookingId: vapiBooking.id,
      });

      logger.info("Slack notification queued", {
        vapiCallId,
        bookingId: booking.id,
        clinicName,
      });
    } catch (error) {
      logger.error("Failed to send appointment booking notification", {
        vapiCallId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Silent failure - don't break the webhook
    }
  })();
}

/**
 * Convenience function with simpler API
 *
 * @param vapiCallId - VAPI call ID
 * @param assistantId - VAPI assistant ID
 * @param supabase - Supabase client
 */
export function notifyAppointmentBooked(
  vapiCallId: string,
  assistantId: string | undefined,
  supabase: SupabaseClient,
): void {
  notifyAppointmentBookedBackground({
    vapiCallId,
    assistantId,
    supabase,
  });
}

/**
 * @deprecated Use notifyAppointmentBookedBackground instead
 * Kept for backward compatibility
 */
export const notifyAlumRockAppointmentBooked =
  notifyAppointmentBookedBackground;
