/**
 * Status Update Handler
 *
 * Handles status-update webhook events when call status changes
 * (queued, ringing, in-progress, ended).
 *
 * @module vapi/webhooks/handlers/status-update
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import type { StatusUpdateMessage, WebhookHandlerContext } from "../types";
import { getCallTableName, mapVapiStatus } from "../utils";
import { createInboundCallRecord } from "./inbound-call-helpers";

const logger = loggers.webhook.child("status-update");

/**
 * Handle status-update webhook
 *
 * @param message - Status update message from VAPI
 * @param context - Handler context with isInbound flag
 * @param supabase - Supabase client for database operations
 */
export async function handleStatusUpdate(
  message: StatusUpdateMessage,
  context: WebhookHandlerContext,
  supabase: SupabaseClient,
): Promise<void> {
  const { call } = message;
  const { isInbound } = context;

  if (!call?.id) {
    logger.warn("Status update missing call data", {
      messageType: message.type,
      isInbound,
    });
    return;
  }

  const tableName = getCallTableName(isInbound);

  // Find existing call record
  const { data: existingCall, error: findError } = await supabase
    .from(tableName)
    .select("id, metadata")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    // For inbound calls, create the record if it doesn't exist
    if (isInbound && findError?.code === "PGRST116") {
      await createInboundCallRecord(call, supabase);
      return;
    }

    logger.warn("Call not found in database", {
      callId: call.id,
      table: tableName,
      error: findError?.message,
      errorCode: findError?.code,
    });
    return;
  }

  // Map status and prepare update
  const mappedStatus = mapVapiStatus(call.status);
  const updateData: Record<string, unknown> = {
    status: mappedStatus,
  };

  // Add started_at if available
  if (call.startedAt) {
    updateData.started_at = call.startedAt;
  }

  // Update the call record
  const { error: updateError } = await supabase
    .from(tableName)
    .update(updateData)
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update call status", {
      callId: call.id,
      table: tableName,
      error: updateError.message,
      errorCode: updateError.code,
    });
  } else {
    logger.info("Call status updated", {
      callId: call.id,
      table: tableName,
      status: mappedStatus,
    });
  }
}
