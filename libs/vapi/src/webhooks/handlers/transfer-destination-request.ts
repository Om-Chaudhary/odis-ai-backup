/**
 * Transfer Destination Request Handler
 *
 * Handles transfer-destination-request webhook events when the assistant
 * needs to know where to transfer a call.
 *
 * @module vapi/webhooks/handlers/transfer-destination-request
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis/logger";
import type {
  TransferDestinationRequestMessage,
  TransferDestinationResponse,
} from "../types";

const logger = loggers.webhook.child("transfer-destination-request");

/**
 * Handle transfer-destination-request webhook
 *
 * When the assistant needs to transfer a call but the destination is not known,
 * VAPI sends this message. Your server must respond with a transfer destination.
 *
 * IMPORTANT: You must respond quickly as the caller is waiting.
 *
 * @param message - Transfer destination request message from VAPI
 * @param supabase - Supabase client for database operations
 * @returns Transfer destination configuration
 */
export async function handleTransferDestinationRequest(
  message: TransferDestinationRequestMessage,
  supabase: SupabaseClient,
): Promise<TransferDestinationResponse> {
  const { call } = message;

  logger.info("Transfer destination request received", {
    callId: call.id,
    assistantId: call.assistantId,
    customerNumber: call.customer?.number,
  });

  try {
    // Look up transfer destination based on call context
    // This could be based on:
    // - The assistant ID (different departments)
    // - The phone number called
    // - Call metadata or variables
    // - Time of day routing
    // - etc.

    // Example: Look up clinic's transfer number
    if (call.assistantId) {
      const { data: clinic, error } = await supabase
        .from("clinics")
        .select("name, phone, emergency_phone")
        .eq("inbound_assistant_id", call.assistantId)
        .single();

      if (!error && clinic) {
        logger.info("Found clinic for transfer", {
          callId: call.id,
          clinicName: clinic.name,
          transferNumber: clinic.phone,
        });

        return {
          destination: {
            type: "number",
            number: clinic.phone,
            message: `Transferring you to ${clinic.name}. Please hold.`,
          },
          message: {
            type: "request-start",
            message: "I'm transferring you now. One moment please.",
          },
        };
      }
    }

    // Fallback: Use default transfer number from environment
    const defaultTransferNumber = process.env.VAPI_DEFAULT_TRANSFER_NUMBER;

    if (defaultTransferNumber) {
      logger.info("Using default transfer number", {
        callId: call.id,
        number: defaultTransferNumber,
      });

      return {
        destination: {
          type: "number",
          number: defaultTransferNumber,
          message: "Transferring you now.",
        },
        message: {
          type: "request-start",
          message: "Please hold while I transfer your call.",
        },
      };
    }

    // No transfer destination available
    logger.warn("No transfer destination available", {
      callId: call.id,
    });

    return {
      destination: {
        type: "number",
        number: "",
        message: "I'm sorry, I'm unable to transfer your call at this time.",
      },
      message: {
        type: "request-failed",
        message:
          "I apologize, but I'm unable to complete the transfer. Please call back during business hours.",
      },
    };
  } catch (error) {
    logger.error("Error handling transfer destination request", {
      callId: call.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      destination: {
        type: "number",
        number: "",
        message: "I'm sorry, there was an error processing your request.",
      },
      message: {
        type: "request-failed",
        message: "I apologize, but I encountered an error. Please try again.",
      },
    };
  }
}
