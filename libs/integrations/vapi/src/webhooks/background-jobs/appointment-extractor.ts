/**
 * Appointment Date Extractor Background Job
 *
 * Extracts appointment dates from call transcripts using AI
 * and updates VAPI bookings when structured output didn't capture
 * the date information.
 *
 * @module vapi/webhooks/background-jobs/appointment-extractor
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import {
  extractAppointmentDate,
  timeOfDayToTime,
} from "@odis-ai/integrations/ai";

const logger = loggers.webhook.child("appointment-extractor");

/**
 * Options for appointment extraction
 */
export interface AppointmentExtractorOptions {
  /** VAPI call ID */
  vapiCallId: string;
  /** Call transcript */
  transcript: string | null;
  /** Supabase client */
  supabase: SupabaseClient;
}

/**
 * Extract appointment date from transcript and update booking
 *
 * When a caller schedules an appointment but VAPI doesn't capture
 * the date in structured output, we can extract it from the transcript
 * and update the booking record.
 *
 * This is a fire-and-forget operation that runs in the background.
 *
 * @param options - Extraction options
 */
export function extractAndUpdateAppointmentDate(
  options: AppointmentExtractorOptions,
): void {
  const { vapiCallId, transcript, supabase } = options;

  if (!transcript || transcript.trim().length === 0) {
    return;
  }

  // Fire and forget - don't await
  void (async () => {
    try {
      // Check if there's an associated VAPI booking that we can enrich with date
      const { data: vapiBooking, error: fetchError } = await supabase
        .from("appointment_bookings")
        .select("id, date, start_time")
        .eq("vapi_call_id", vapiCallId)
        .limit(1)
        .single();

      if (fetchError) {
        // No VAPI booking found - this is fine, not all calls have appointments
        if (fetchError.code !== "PGRST116") {
          logger.debug("No VAPI booking found for call", {
            vapiCallId,
            error: fetchError.message,
          });
        }
        return;
      }

      // If booking already has a valid date (not a placeholder), no need to extract
      // Bookings created with placeholder date will have today's date
      const today = new Date().toISOString().split("T")[0];
      if (vapiBooking.date && vapiBooking.date !== today) {
        logger.debug("VAPI booking already has date", {
          vapiCallId,
          bookingId: vapiBooking.id,
          existingDate: vapiBooking.date,
        });
        return;
      }

      logger.info("Extracting appointment date from transcript", {
        vapiCallId,
        bookingId: vapiBooking.id,
        transcriptLength: transcript.length,
      });

      // Extract date from transcript using AI
      const extracted = await extractAppointmentDate(transcript);

      if (!extracted.hasPreference) {
        logger.debug("No appointment date preference found in transcript", {
          vapiCallId,
          bookingId: vapiBooking.id,
        });
        return;
      }

      // Prepare update data for vapi_bookings
      const updateData: Record<string, unknown> = {};

      if (extracted.date) {
        updateData.date = extracted.date;
      }

      // Use extracted time, or convert timeOfDay to time
      if (extracted.time) {
        updateData.start_time = extracted.time + ":00"; // Add seconds
      } else if (
        extracted.timeOfDay &&
        vapiBooking.start_time === "09:00:00" // Only update if using default placeholder time
      ) {
        const defaultTime = timeOfDayToTime(extracted.timeOfDay);
        if (defaultTime) {
          updateData.start_time = defaultTime + ":00";
        }
      }

      // Only update if we have something to update
      if (Object.keys(updateData).length === 0) {
        return;
      }

      // Update VAPI booking
      const { error: updateError } = await supabase
        .from("appointment_bookings")
        .update(updateData)
        .eq("id", vapiBooking.id);

      if (updateError) {
        logger.error("Failed to update vapi booking with extracted date", {
          vapiCallId,
          bookingId: vapiBooking.id,
          error: updateError.message,
        });
        return;
      }

      logger.info("Updated vapi booking with extracted date", {
        vapiCallId,
        bookingId: vapiBooking.id,
        extractedDate: extracted.date,
        extractedTime: extracted.time,
        timeOfDay: extracted.timeOfDay,
        rawMention: extracted.rawMention,
      });
    } catch (error) {
      logger.error("Failed to extract/update appointment date", {
        vapiCallId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Silent failure - don't break the webhook
    }
  })();
}

/**
 * Convenience function for simpler API
 *
 * @param vapiCallId - VAPI call ID
 * @param transcript - Call transcript
 * @param supabase - Supabase client
 */
export function extractAppointmentDateFromTranscript(
  vapiCallId: string,
  transcript: string | null,
  supabase: SupabaseClient,
): void {
  extractAndUpdateAppointmentDate({
    vapiCallId,
    transcript,
    supabase,
  });
}
