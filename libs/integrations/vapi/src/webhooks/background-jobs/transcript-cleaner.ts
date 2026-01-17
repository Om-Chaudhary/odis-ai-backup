/**
 * Transcript Cleaner Background Job
 *
 * Cleans call transcripts using AI in the background without
 * blocking webhook responses. Updates the database with cleaned
 * transcripts for improved readability.
 *
 * @module vapi/webhooks/background-jobs/transcript-cleaner
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { cleanTranscript } from "@odis-ai/integrations/ai";

const logger = loggers.webhook.child("transcript-cleaner");

/**
 * Options for transcript cleaning
 */
export interface TranscriptCleanerOptions {
  /** Raw transcript text */
  transcript: string | null | undefined;
  /** Clinic name for context */
  clinicName: string | null | undefined;
  /** VAPI call ID */
  callId: string;
  /** Database table name (inbound_vapi_calls or scheduled_discharge_calls) */
  tableName: string;
  /** Supabase client */
  supabase: SupabaseClient;
}

/**
 * Clean transcript using AI and update the database
 *
 * This is a fire-and-forget operation that runs in the background
 * so it doesn't block the webhook response. Failures are logged
 * but don't affect the main call processing.
 *
 * @param options - Cleaning options
 */
export function cleanTranscriptInBackground(
  options: TranscriptCleanerOptions,
): void {
  const { transcript, clinicName, callId, tableName, supabase } = options;

  if (!transcript || transcript.trim().length === 0) {
    return;
  }

  // Fire and forget - don't await
  void (async () => {
    try {
      const result = await cleanTranscript({
        transcript,
        clinicName,
      });

      if (result.wasModified) {
        logger.debug("Transcript cleaned successfully", {
          callId,
          originalLength: transcript.length,
          cleanedLength: result.cleanedTranscript.length,
        });

        // Update database with cleaned transcript
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ cleaned_transcript: result.cleanedTranscript })
          .eq("vapi_call_id", callId);

        if (updateError) {
          logger.error("Failed to update cleaned transcript", {
            callId,
            error: updateError.message,
          });
        } else {
          logger.debug("Cleaned transcript saved to database", { callId });
        }
      }
    } catch (error) {
      logger.error("Failed to clean transcript in background", {
        callId,
        error: error instanceof Error ? error.message : String(error),
        transcriptLength: transcript.length,
      });
      // Silent failure - UI will fall back to raw transcript
    }
  })();
}

/**
 * Clean transcript for outbound calls
 *
 * Convenience wrapper that uses the outbound calls table.
 *
 * @param transcript - Raw transcript
 * @param clinicName - Clinic name for context
 * @param callId - VAPI call ID
 * @param supabase - Supabase client
 */
export function cleanOutboundTranscript(
  transcript: string | null | undefined,
  clinicName: string | null | undefined,
  callId: string,
  supabase: SupabaseClient,
): void {
  cleanTranscriptInBackground({
    transcript,
    clinicName,
    callId,
    tableName: "scheduled_discharge_calls",
    supabase,
  });
}

/**
 * Clean transcript for inbound calls
 *
 * Convenience wrapper that uses the inbound calls table.
 *
 * @param transcript - Raw transcript
 * @param clinicName - Clinic name for context
 * @param callId - VAPI call ID
 * @param supabase - Supabase client
 */
export function cleanInboundTranscript(
  transcript: string | null | undefined,
  clinicName: string | null | undefined,
  callId: string,
  supabase: SupabaseClient,
): void {
  cleanTranscriptInBackground({
    transcript,
    clinicName,
    callId,
    tableName: "inbound_vapi_calls",
    supabase,
  });
}
