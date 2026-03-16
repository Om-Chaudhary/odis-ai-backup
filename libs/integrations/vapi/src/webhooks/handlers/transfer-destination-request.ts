/**
 * Transfer Destination Request Handler
 *
 * Handles transfer-destination-request webhook events when the assistant
 * needs to know where to transfer a call.
 *
 * @module vapi/webhooks/handlers/transfer-destination-request
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { normalizeToE164 } from "@odis-ai/shared/util";
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
    // Dynamic imports to satisfy nx module boundary rules (lazy-loaded libraries)
    const { getClinicByInboundAssistantId, getClinicByOutboundAssistantId } =
      await import("@odis-ai/domain/clinics/vapi-config");
    const { getClinicByUserId } =
      await import("@odis-ai/domain/clinics/clinic-lookup");

    let clinic: { name: string; phone: string | null } | null = null;
    let lookupMethod = "none";

    if (call.assistantId) {
      // Tier 1: Try inbound assistant ID (handles inbound call transfers)
      clinic = await getClinicByInboundAssistantId(call.assistantId, supabase);
      if (clinic) {
        lookupMethod = "inbound_assistant_id";
      } else {
        // Tier 2: Try outbound assistant ID (handles outbound call transfers)
        clinic = await getClinicByOutboundAssistantId(
          call.assistantId,
          supabase,
        );
        if (clinic) {
          lookupMethod = "outbound_assistant_id";
        }
      }
    }

    // Tier 3: Look up via scheduled_discharge_calls → user → clinic
    if (!clinic && call.id) {
      const { data: scheduledCall } = await supabase
        .from("scheduled_discharge_calls")
        .select("user_id")
        .eq("vapi_call_id", call.id)
        .maybeSingle();

      if (scheduledCall?.user_id) {
        clinic = await getClinicByUserId(scheduledCall.user_id, supabase);
        if (clinic) {
          lookupMethod = "scheduled_discharge_call";
        }
      }
    }

    if (clinic?.phone) {
      const transferNumber = normalizeToE164(clinic.phone) ?? clinic.phone;

      logger.info("Found clinic for transfer", {
        callId: call.id,
        clinicName: clinic.name,
        transferNumber,
        lookupMethod,
      });

      return {
        destination: {
          type: "number",
          number: transferNumber,
          message: `Transferring you to ${clinic.name}. Please hold.`,
        },
        message: {
          type: "request-start",
          message: "I'm transferring you now. One moment please.",
        },
      };
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
      assistantId: call.assistantId,
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
