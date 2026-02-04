/**
 * Inbound Call Helpers
 *
 * Helper functions for creating and managing inbound call records.
 *
 * @module vapi/webhooks/handlers/inbound-call-helpers
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import type { VapiWebhookCall } from "../types";
import type { VapiCallResponse } from "../../client";
import {
  formatInboundCallData,
  mapInboundCallToUser,
} from "../../inbound-calls";

const logger = loggers.webhook.child("inbound-helpers");

/**
 * Create or update inbound call record
 *
 * Uses upsert to handle duplicate webhook calls gracefully (VAPI may retry webhooks).
 *
 * @param call - VAPI call object
 * @param supabase - Supabase client
 * @returns Created/updated call ID or null if failed
 */
export async function createInboundCallRecord(
  call: VapiWebhookCall,
  supabase: SupabaseClient,
): Promise<string | null> {
  // Cast to VapiCallResponse for compatibility with existing functions
  const callResponse = call as unknown as VapiCallResponse;

  // Map assistant to clinic/user
  const { clinicName, userId } = await mapInboundCallToUser(callResponse);

  // Format call data
  const callData = formatInboundCallData(callResponse, clinicName, userId);

  // Use upsert to handle duplicate webhook calls (VAPI may retry or send multiple events)
  const { data: upsertedCall, error: upsertError } = await supabase
    .from("inbound_vapi_calls")
    .upsert(callData, {
      onConflict: "vapi_call_id",
      ignoreDuplicates: false, // Update on conflict
    })
    .select("id")
    .single();

  if (upsertError || !upsertedCall) {
    logger.error("Failed to create/update inbound call record", {
      callId: call.id,
      error: upsertError?.message,
      errorCode: upsertError?.code,
    });
    return null;
  }

  logger.info("Upserted inbound call record", {
    callId: call.id,
    dbId: upsertedCall.id,
    clinicName,
    userId,
  });

  return upsertedCall.id;
}

/**
 * Existing call record with optional case_id for outbound calls
 * and structured_data for preserving tool-stored appointment data
 */
export interface ExistingCallRecord {
  id: string;
  metadata: unknown;
  case_id?: string | null;
  /** Existing structured_data from tool calls (e.g., book_appointment stores correct dates here) */
  structured_data?: Record<string, unknown> | null;
}

/**
 * Fetch existing call record
 *
 * @param vapiCallId - VAPI call ID
 * @param tableName - Database table name
 * @param supabase - Supabase client
 * @returns Call record or null
 */
export async function fetchExistingCall(
  vapiCallId: string,
  tableName: string,
  supabase: SupabaseClient,
): Promise<ExistingCallRecord | null> {
  // Only select case_id for outbound calls (scheduled_discharge_calls has it, inbound_vapi_calls doesn't)
  const isOutbound = tableName === "scheduled_discharge_calls";

  if (isOutbound) {
    const { data, error } = await supabase
      .from(tableName)
      .select("id, metadata, case_id")
      .eq("vapi_call_id", vapiCallId)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        logger.warn("Error fetching call", {
          callId: vapiCallId,
          table: tableName,
          error: error.message,
        });
      }
      return null;
    }

    return data as ExistingCallRecord;
  }

  // Inbound calls - include structured_data to preserve tool-stored appointment data
  const { data, error } = await supabase
    .from(tableName)
    .select("id, metadata, structured_data")
    .eq("vapi_call_id", vapiCallId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      logger.warn("Error fetching call", {
        callId: vapiCallId,
        table: tableName,
        error: error.message,
      });
    }
    return null;
  }

  return data as ExistingCallRecord;
}
