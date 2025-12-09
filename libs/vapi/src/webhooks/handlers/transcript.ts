/**
 * Transcript Handler
 *
 * Handles real-time transcript webhook events with partial and final transcriptions.
 *
 * @module vapi/webhooks/handlers/transcript
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis/logger";
import type { TranscriptMessage, WebhookHandlerContext } from "../types";
import { getCallTableName } from "../utils";

const logger = loggers.webhook.child("transcript");

/**
 * Handle transcript webhook
 *
 * Receives partial and final transcripts as they are generated.
 * Can be used for:
 * - Real-time transcript display
 * - Live monitoring of calls
 * - Threat/keyword detection
 * - Custom analytics
 *
 * @param message - Transcript message from VAPI
 * @param context - Handler context with isInbound flag
 * @param supabase - Supabase client for database operations
 */
export async function handleTranscript(
  message: TranscriptMessage,
  context: WebhookHandlerContext,
  supabase: SupabaseClient,
): Promise<void> {
  const callId = message.call?.id;
  const { isInbound } = context;

  // Log transcript for monitoring
  logger.debug("Transcript received", {
    callId,
    role: message.role,
    transcriptType: message.transcriptType,
    transcriptLength: message.transcript?.length,
    isFiltered: message.isFiltered,
    hasThreats: (message.detectedThreats?.length ?? 0) > 0,
  });

  // For final transcripts, we could update the database
  // However, end-of-call-report provides the complete transcript,
  // so we typically only use this for real-time monitoring
  if (message.transcriptType === "final" && callId) {
    // Log final transcript segments if needed for debugging
    logger.debug("Final transcript segment", {
      callId,
      role: message.role,
      transcript: message.transcript,
    });
  }

  // Handle detected threats if any
  if (message.detectedThreats && message.detectedThreats.length > 0) {
    logger.warn("Threats detected in transcript", {
      callId,
      threats: message.detectedThreats,
      role: message.role,
    });

    // Could trigger alerts, update call metadata, etc.
    if (callId) {
      const tableName = getCallTableName(isInbound);

      // First fetch current metadata to merge with
      const { data: current, error: fetchError } = await supabase
        .from(tableName)
        .select("metadata")
        .eq("vapi_call_id", callId)
        .single();

      if (fetchError) {
        logger.error("Failed to fetch current metadata", {
          callId,
          error: fetchError.message,
        });
        return;
      }

      // Merge detected threats into existing metadata
      const existingMetadata =
        (current?.metadata as Record<string, unknown>) ?? {};
      const updatedMetadata = {
        ...existingMetadata,
        detected_threats: message.detectedThreats,
      };

      // Update call with merged metadata
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ metadata: updatedMetadata })
        .eq("vapi_call_id", callId);

      if (updateError) {
        logger.error("Failed to update threat metadata", {
          callId,
          error: updateError.message,
        });
      }
    }
  }
}
