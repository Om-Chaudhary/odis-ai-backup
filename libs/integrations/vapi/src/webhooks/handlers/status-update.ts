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

  // When call reaches "ended" status, check if we need to backfill outcome data
  // (in case earlier webhooks were incomplete)
  const isTransitioningToEnded = call.status === "ended" && isInbound;

  let shouldBackfill = false;
  if (isTransitioningToEnded) {
    // Check if this record is missing outcome data (incomplete webhook)
    const { data: currentCall, error: checkError } = await supabase
      .from(tableName)
      .select("outcome, call_outcome_data")
      .eq("id", existingCall.id)
      .single();

    if (!checkError && currentCall && !currentCall.outcome) {
      shouldBackfill = true;
      logger.debug("Detected missing outcome on ended call - will backfill", {
        callId: call.id,
        dbId: existingCall.id,
      });
    }
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
      backfillScheduled: shouldBackfill,
    });
  }

  // Schedule backfill if needed (fire-and-forget)
  if (shouldBackfill) {
    void (async () => {
      try {
        // Import dynamically to avoid circular dependency
        const { qstashClient } =
          await import("@odis-ai/integrations/qstash/client");

        // Schedule a task to backfill this call's outcome data
        await qstashClient.publishJSON({
          url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://api.odis.ai"}/api/webhooks/vapi/backfill-outcome`,
          body: {
            callId: call.id,
            dbId: existingCall.id,
            isInbound: true,
          },
          delay: 5, // Delay 5 seconds to ensure VAPI has processed everything
          headers: {
            "Content-Type": "application/json",
          },
        });

        logger.debug("Scheduled outcome backfill", {
          callId: call.id,
          dbId: existingCall.id,
        });
      } catch (error) {
        logger.error("Failed to schedule outcome backfill", {
          callId: call.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  }
}
