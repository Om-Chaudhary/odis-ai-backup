/**
 * Create Refill Request Processor
 *
 * Pure business logic for creating prescription refill requests.
 */

import type { ToolContext, ToolResult } from "../../core/types";
import type { CreateRefillRequestInput } from "../../schemas/clinical";

/**
 * Generate a human-friendly reference ID
 */
function generateReferenceId(): string {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RX-${datePart}-${randomPart}`;
}

/**
 * Process create refill request
 *
 * @param input - Validated input from schema
 * @param ctx - Tool context with clinic, supabase, logger
 * @returns Tool result with refill request data
 */
export async function processCreateRefillRequest(
  input: CreateRefillRequestInput,
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

  const referenceId = generateReferenceId();

  // Insert into refill_requests table
  const { data: refillRequest, error } = await supabase
    .from("refill_requests")
    .insert({
      clinic_id: clinic.id,
      client_name: input.client_name,
      client_phone: input.client_phone,
      pet_name: input.pet_name,
      species: input.species ?? null,
      medication_name: input.medication_name,
      pharmacy_preference:
        input.pharmacy_preference === "external_pharmacy"
          ? "external"
          : "pickup",
      pharmacy_name: input.pharmacy_name ?? null,
      status: "pending",
      vapi_call_id: input.vapi_call_id ?? null,
      metadata: {
        source: "vapi_tool",
        reference_id: referenceId,
        medication_strength: input.medication_strength ?? null,
        last_refill_date: input.last_refill_date ?? null,
        notes: input.notes ?? null,
      },
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to create refill request", {
      error,
      clinicId: clinic.id,
    });
    return {
      success: false,
      error: "database_error",
      message:
        "I'm having trouble submitting your refill request. Please try again.",
    };
  }

  logger.info("Refill request created successfully", {
    requestId: refillRequest.id,
    referenceId,
    clinicId: clinic.id,
    clinicName: clinic.name,
    medication: input.medication_name,
    pharmacyPreference: input.pharmacy_preference,
  });

  // Build response message
  let responseMessage: string;
  if (
    input.pharmacy_preference === "external_pharmacy" &&
    input.pharmacy_name
  ) {
    responseMessage = `I've submitted your refill request for ${input.medication_name} for ${input.pet_name}. Your reference number is ${referenceId}. Once approved, the prescription will be sent to ${input.pharmacy_name}. Staff will call you if they have any questions.`;
  } else {
    responseMessage = `I've submitted your refill request for ${input.medication_name} for ${input.pet_name}. Your reference number is ${referenceId}. Once approved, you can pick it up at the clinic. Staff will call you when it's ready.`;
  }

  return {
    success: true,
    message: responseMessage,
    data: {
      request_id: refillRequest.id,
      reference_id: referenceId,
      medication: input.medication_name,
      pet_name: input.pet_name,
      status: "pending",
      pharmacy_preference: input.pharmacy_preference,
    },
  };
}
