/**
 * Assistant Request Handler
 *
 * Handles assistant-request webhook events for dynamic assistant selection
 * on inbound calls.
 *
 * @module vapi/webhooks/handlers/assistant-request
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/logger";
import type {
  AssistantRequestMessage,
  AssistantRequestResponse,
  AssistantRequestTransferResponse,
} from "../types";

const logger = loggers.webhook.child("assistant-request");

/**
 * Handle assistant-request webhook
 *
 * When VAPI needs to dynamically select an assistant for an inbound call,
 * it sends this message. Your server must respond with:
 * - An assistant configuration (inline or by ID)
 * - A transfer destination to route the call elsewhere
 * - An error if the call cannot be handled
 *
 * IMPORTANT: You must respond within 7.5 seconds.
 *
 * @param message - Assistant request message from VAPI
 * @param supabase - Supabase client for database operations
 * @returns Assistant configuration or transfer destination
 */
export async function handleAssistantRequest(
  message: AssistantRequestMessage,
  supabase: SupabaseClient,
): Promise<AssistantRequestResponse | AssistantRequestTransferResponse> {
  const { call, phoneNumber } = message;

  logger.info("Assistant request received", {
    callId: call.id,
    phoneNumberId: phoneNumber?.id,
    phoneNumber: phoneNumber?.number,
    customerNumber: call.customer?.number,
  });

  try {
    // Look up clinic by inbound phone number
    if (phoneNumber?.id) {
      const clinic = await getClinicByInboundPhoneNumber(
        phoneNumber.id,
        supabase,
      );

      if (clinic?.inbound_assistant_id) {
        logger.info("Found clinic assistant for inbound call", {
          callId: call.id,
          clinicName: clinic.name,
          assistantId: clinic.inbound_assistant_id,
        });

        return {
          assistantId: clinic.inbound_assistant_id,
        };
      }
    }

    // Fallback: Use default assistant from environment
    const defaultAssistantId = process.env.VAPI_DEFAULT_INBOUND_ASSISTANT_ID;

    if (defaultAssistantId) {
      logger.info("Using default inbound assistant", {
        callId: call.id,
        assistantId: defaultAssistantId,
      });

      return {
        assistantId: defaultAssistantId,
      };
    }

    // No assistant available - return error
    logger.warn("No assistant available for inbound call", {
      callId: call.id,
      phoneNumberId: phoneNumber?.id,
    });

    return {
      error: "No assistant configured for this phone number",
    };
  } catch (error) {
    logger.error("Error handling assistant request", {
      callId: call.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      error: "Failed to determine assistant for call",
    };
  }
}

/**
 * Get clinic by inbound phone number ID
 * Helper to look up clinic configuration by phone number
 */
async function getClinicByInboundPhoneNumber(
  phoneNumberId: string,
  supabase: SupabaseClient,
): Promise<{ name: string; inbound_assistant_id: string | null } | null> {
  const { data, error } = await supabase
    .from("clinics")
    .select("name, inbound_assistant_id")
    .eq("inbound_phone_number_id", phoneNumberId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
