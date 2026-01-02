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
 * Create inbound call record if it doesn't exist
 *
 * @param call - VAPI call object
 * @param supabase - Supabase client
 * @returns Created call ID or null if failed
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

  const { data: newCall, error: insertError } = await supabase
    .from("inbound_vapi_calls")
    .insert(callData)
    .select("id")
    .single();

  if (insertError || !newCall) {
    logger.error("Failed to create inbound call record", {
      callId: call.id,
      error: insertError?.message,
      errorCode: insertError?.code,
    });
    return null;
  }

  logger.info("Created inbound call record", {
    callId: call.id,
    dbId: newCall.id,
    clinicName,
    userId,
  });

  return newCall.id;
}

/**
 * Existing call record with optional case_id for outbound calls
 */
export interface ExistingCallRecord {
  id: string;
  metadata: unknown;
  case_id?: string | null;
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

  // Inbound calls - no case_id column
  const { data, error } = await supabase
    .from(tableName)
    .select("id, metadata")
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
