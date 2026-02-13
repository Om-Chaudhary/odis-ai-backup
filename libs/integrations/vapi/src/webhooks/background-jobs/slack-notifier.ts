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
 * Alum Rock assistant configuration
 * TODO: Move to database-based clinic configuration
 */
const ALUM_ROCK_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

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
 * Format appointment booking message for Slack
 *
 * @param booking - VAPI booking record
 * @returns Formatted message string
 */
function formatBookingMessage(booking: VapiBooking): string {
  const lines = [
    `:tada: *New Appointment Booked*`,
    ``,
    `*Client Name:* ${booking.client_name}`,
    `*Pet Name:* ${booking.patient_name}`,
    `*Date:* ${booking.date}`,
    `*Time:* ${booking.start_time}`,
    `*Phone:* ${booking.client_phone}`,
    `*Reason:* ${booking.reason ?? "Not specified"}`,
  ];

  if (booking.species) {
    lines.push(`*Species:* ${booking.species}`);
  }

  if (booking.breed) {
    lines.push(`*Breed:* ${booking.breed}`);
  }

  if (booking.is_new_client) {
    lines.push(`*New Client* :sparkles:`);
  }

  lines.push(``);
  lines.push(`_Booking ID: ${booking.id}_`);

  return lines.join("\n");
}

/**
 * Send Slack notification for Alum Rock appointment booking
 *
 * This is a fire-and-forget operation that runs in the background.
 * Only sends notifications for Alum Rock assistant bookings.
 *
 * @param options - Notification options
 */
export function notifyAlumRockAppointmentBooked(
  options: AppointmentNotificationOptions,
): void {
  const { vapiCallId, assistantId, supabase } = options;

  // Fire and forget - don't await
  void (async () => {
    try {
      // Only send notifications for Alum Rock assistant
      if (assistantId !== ALUM_ROCK_ASSISTANT_ID) {
        return;
      }

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

      logger.info("Appointment booked - sending Slack notification", {
        vapiCallId,
        bookingId: booking.id,
        clientName: booking.client_name,
        petName: booking.patient_name,
        date: booking.date,
        time: booking.start_time,
      });

      // Dynamic import to avoid circular dependencies
      const { slackClient } =
        await import("@odis-ai/integrations/slack/client");

      // Get Slack workspace info for Alum Rock
      // TODO: This should be fetched from database based on clinic configuration
      const ALUM_ROCK_SLACK_TEAM_ID = process.env.ALUM_ROCK_SLACK_TEAM_ID;
      const ALUM_ROCK_SLACK_CHANNEL =
        process.env.ALUM_ROCK_SLACK_CHANNEL ?? "alum-rock";

      if (!ALUM_ROCK_SLACK_TEAM_ID) {
        logger.warn("Alum Rock Slack team ID not configured", {
          vapiCallId,
          bookingId: booking.id,
        });
        return;
      }

      // Format the notification message
      const message = formatBookingMessage(booking as VapiBooking);

      // Send the Slack notification
      const result = await slackClient.postMessage(ALUM_ROCK_SLACK_TEAM_ID, {
        channel: ALUM_ROCK_SLACK_CHANNEL,
        text: "New appointment booked",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: message,
            },
          },
        ],
      });

      if (result.ok) {
        logger.info("Slack notification sent successfully", {
          vapiCallId,
          bookingId: booking.id,
          channel: ALUM_ROCK_SLACK_CHANNEL,
          messageTs: result.ts,
        });
      } else {
        logger.error("Failed to send Slack notification", {
          vapiCallId,
          bookingId: booking.id,
          error: result.error,
        });
      }
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
  notifyAlumRockAppointmentBooked({
    vapiCallId,
    assistantId,
    supabase,
  });
}
