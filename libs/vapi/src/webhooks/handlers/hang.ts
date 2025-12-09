/**
 * Hang Handler
 *
 * Handles hang webhook events when a call is terminated/hung up.
 *
 * @module vapi/webhooks/handlers/hang
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis/logger";
import type { HangMessage, WebhookHandlerContext } from "../types";
import { getCallTableName } from "../utils";
import { createInboundCallRecord } from "./inbound-call-helpers";

const logger = loggers.webhook.child("hang");

/**
 * Handle hang webhook
 *
 * @param message - Hang message from VAPI
 * @param context - Handler context with isInbound flag
 * @param supabase - Supabase client for database operations
 */
export async function handleHang(
  message: HangMessage,
  context: WebhookHandlerContext,
  supabase: SupabaseClient,
): Promise<void> {
  const { call } = message;
  const { isInbound } = context;

  if (!call?.id) {
    logger.warn("Hangup event missing call data", {
      messageType: message.type,
      isInbound,
    });
    return;
  }

  const tableName = getCallTableName(isInbound);

  // Find existing call record
  const { data: existingCall, error: findError } = await supabase
    .from(tableName)
    .select("id")
    .eq("vapi_call_id", call.id)
    .single();

  if (findError || !existingCall) {
    // For inbound calls, create the record if it doesn't exist
    if (isInbound && findError?.code === "PGRST116") {
      await createInboundCallRecord(call, supabase);
      return;
    }

    logger.warn("Call not found in database for hangup event", {
      callId: call.id,
      table: tableName,
      error: findError?.message,
      errorCode: findError?.code,
    });
    return;
  }

  // Update with hangup information
  const { error: updateError } = await supabase
    .from(tableName)
    .update({
      ended_reason: call.endedReason ?? "user-hangup",
      ended_at: call.endedAt ?? new Date().toISOString(),
    })
    .eq("id", existingCall.id);

  if (updateError) {
    logger.error("Failed to update hangup", {
      callId: call.id,
      table: tableName,
      error: updateError.message,
      errorCode: updateError.code,
    });
  } else {
    logger.info("Hangup processed", {
      callId: call.id,
      table: tableName,
    });
  }
}
