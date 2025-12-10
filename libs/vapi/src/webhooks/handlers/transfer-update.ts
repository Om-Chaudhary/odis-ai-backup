/**
 * Transfer Update Handler
 *
 * Handles transfer-update webhook events when a call transfer occurs.
 *
 * @module vapi/webhooks/handlers/transfer-update
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/logger";
import type { TransferUpdateMessage, WebhookHandlerContext } from "../types";
import { getCallTableName } from "../utils";

const logger = loggers.webhook.child("transfer-update");

/**
 * Handle transfer-update webhook
 *
 * Receives notifications when a call transfer occurs.
 * Can be used for:
 * - Logging transfer events
 * - Tracking call routing
 * - Updating call metadata
 *
 * @param message - Transfer update message from VAPI
 * @param context - Handler context with isInbound flag
 * @param supabase - Supabase client for database operations
 */
export async function handleTransferUpdate(
  message: TransferUpdateMessage,
  context: WebhookHandlerContext,
  supabase: SupabaseClient,
): Promise<void> {
  const callId = message.call?.id;
  const { isInbound } = context;
  const { destination } = message;

  logger.info("Transfer update received", {
    callId,
    destinationType: destination.type,
    isInbound,
  });

  // Log transfer details based on type
  switch (destination.type) {
    case "number":
      logger.info("Call transferred to number", {
        callId,
        number: destination.number,
        extension: destination.extension,
      });
      break;

    case "sip":
      logger.info("Call transferred to SIP", {
        callId,
        sipUri: destination.sipUri,
      });
      break;

    case "assistant":
      logger.info("Call transferred to assistant", {
        callId,
        assistantId: destination.assistantId,
      });
      break;
  }

  // Update call record with transfer information
  if (callId) {
    const tableName = getCallTableName(isInbound);

    // First fetch current metadata to merge with
    const { data: current, error: fetchError } = await supabase
      .from(tableName)
      .select("metadata")
      .eq("vapi_call_id", callId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      logger.error("Failed to fetch current metadata for transfer", {
        callId,
        error: fetchError.message,
      });
      return;
    }

    // Merge transfer info into existing metadata
    const existingMetadata =
      (current?.metadata as Record<string, unknown>) ?? {};
    const updatedMetadata = {
      ...existingMetadata,
      transferred: true,
      transfer_destination: destination,
      transfer_timestamp: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from(tableName)
      .update({ metadata: updatedMetadata })
      .eq("vapi_call_id", callId);

    if (updateError) {
      logger.error("Failed to update transfer metadata", {
        callId,
        error: updateError.message,
      });
    }
  }
}
