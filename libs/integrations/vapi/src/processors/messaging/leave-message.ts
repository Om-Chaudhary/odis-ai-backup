/**
 * Leave Message Processor
 *
 * Pure business logic for logging callback requests.
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type { LeaveMessageInput } from "../../schemas/messaging";

/**
 * Process leave message request
 *
 * @param input - Validated input from schema
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Tool result with message confirmation
 */
export async function processLeaveMessage(
  input: LeaveMessageInput,
  ctx: ToolContext,
): Promise<ToolResult> {
  const { clinic, supabase, logger } = ctx;

  if (!clinic) {
    return {
      success: false,
      error: "clinic_not_found",
      message: "I couldn't identify the clinic. Please try again later.",
    };
  }

  // Build message content with optional notes
  let fullMessage = input.message;
  if (input.notes) {
    fullMessage = `${input.message}\n\nAdditional notes: ${input.notes}`;
  }

  // Insert into clinic_messages with enhanced categorization
  const { data: message, error } = await supabase
    .from("clinic_messages")
    .insert({
      clinic_id: clinic.id,
      caller_name: input.client_name,
      caller_phone: input.client_phone,
      message_content: fullMessage,
      message_type: input.message_type ?? "general",
      priority: input.is_urgent ? "urgent" : "normal",
      status: "unread",
      vapi_call_id: ctx.callId ?? null,
      metadata: {
        source: "vapi_inbound_squad",
        agent: "admin",
        is_urgent: input.is_urgent,
        pet_name: input.pet_name ?? null,
        best_callback_time: input.best_callback_time ?? null,
      },
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to insert message", {
      error,
      clinicId: clinic.id,
    });
    return {
      success: false,
      error: "database_error",
      message: "I'm having trouble saving your message. Please try again.",
    };
  }

  logger.info("Message logged successfully", {
    messageId: message.id,
    clinicId: clinic.id,
    clinicName: clinic.name,
    messageType: input.message_type,
    isUrgent: input.is_urgent,
  });

  // Build response message
  let responseMessage = `Your message has been recorded and ${clinic.name} will call you back as soon as possible.`;

  if (input.is_urgent) {
    responseMessage +=
      " This has been marked as urgent and will be prioritized.";
  }

  if (input.best_callback_time) {
    responseMessage += ` They'll try to reach you ${input.best_callback_time}.`;
  }

  return {
    success: true,
    message: responseMessage,
    data: {
      message_id: message.id,
      clinic_name: clinic.name,
      message_type: input.message_type ?? "general",
      priority: input.is_urgent ? "urgent" : "normal",
    },
  };
}
