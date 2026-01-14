/**
 * Log Emergency Triage Processor
 *
 * Pure business logic for logging emergency triage outcomes.
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type { LogEmergencyTriageInput } from "../../schemas/triage";

/**
 * Process log emergency triage request
 *
 * @param input - Validated input from schema
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Tool result with triage confirmation
 */
export async function processLogEmergencyTriage(
  input: LogEmergencyTriageInput,
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

  // Build triage data JSONB
  const triageData = {
    urgency: input.urgency,
    symptoms: input.symptoms,
    action_taken: input.action_taken,
    er_referred: input.er_referred,
    species: input.species,
  };

  // Insert into clinic_messages
  const { data: message, error } = await supabase
    .from("clinic_messages")
    .insert({
      clinic_id: clinic.id,
      caller_name: input.caller_name,
      caller_phone: input.caller_phone,
      message_content:
        `Emergency triage: ${input.symptoms}. Action: ${input.action_taken}. ${input.notes ?? ""}`.trim(),
      message_type: "emergency_triage",
      priority: input.urgency === "critical" ? "urgent" : "normal",
      status: "unread",
      vapi_call_id: ctx.callId ?? null,
      metadata: {
        source: "vapi_inbound_squad",
        agent: "emergency",
        pet_name: input.pet_name,
        triage_data: triageData,
      },
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to insert emergency triage", {
      error,
      clinicId: clinic.id,
    });
    return {
      success: false,
      error: "database_error",
      message: "I'm having trouble logging this emergency. Please try again.",
    };
  }

  logger.info("Emergency triage logged successfully", {
    messageId: message.id,
    clinicId: clinic.id,
    clinicName: clinic.name,
    urgency: input.urgency,
    actionTaken: input.action_taken,
    erReferred: input.er_referred,
  });

  // Build response message based on action taken
  let responseMessage: string;
  if (input.action_taken === "sent_to_er") {
    responseMessage = `I've logged this emergency for ${input.pet_name}. The staff will be notified that you're heading to the emergency clinic. Please drive safely.`;
  } else if (input.action_taken === "scheduled_appointment") {
    responseMessage = `I've logged this for ${input.pet_name}. The staff will follow up about scheduling an urgent appointment.`;
  } else {
    responseMessage = `I've logged the information about ${input.pet_name}. The staff will review this and may follow up if needed.`;
  }

  return {
    success: true,
    message: responseMessage,
    data: {
      reference_id: message.id,
      urgency: input.urgency,
      action_taken: input.action_taken,
      er_referred: input.er_referred,
    },
  };
}
