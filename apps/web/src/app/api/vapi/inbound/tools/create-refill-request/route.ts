/**
 * VAPI Create Refill Request Tool Endpoint
 *
 * POST /api/vapi/inbound/tools/create-refill-request
 *
 * Creates a prescription refill request for veterinarian approval.
 * Used by Clinical Agent to log refill requests.
 *
 * Stores data in refill_requests table with status='pending'.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { loggers } from "@odis-ai/shared/logger";
import {
  handleCorsPreflightRequest,
  withCorsHeaders,
} from "@odis-ai/data-access/api/cors";

const logger = loggers.api.child("vapi-create-refill-request");

// Default assistant ID for clinic lookup
const DEFAULT_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

// --- Request Schema ---
const CreateRefillRequestSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional().default(DEFAULT_ASSISTANT_ID),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info
  pet_name: z.string().min(1, "pet_name is required"),
  species: z.string().optional(),

  // Medication info
  medication_name: z.string().min(1, "medication_name is required"),
  medication_strength: z.string().optional(),

  // Pharmacy preference
  pharmacy_preference: z
    .enum(["pickup", "external_pharmacy"])
    .optional()
    .default("pickup"),
  pharmacy_name: z.string().optional(),

  // Additional context
  last_refill_date: z.string().optional(),
  notes: z.string().optional(),
});

type CreateRefillRequestInput = z.infer<typeof CreateRefillRequestSchema>;

/**
 * Look up clinic by assistant ID
 */
async function findClinicByAssistantId(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  assistantId: string,
) {
  const { data: mapping, error: mappingError } = await supabase
    .from("vapi_assistant_mappings")
    .select("clinic_id, assistant_name, environment")
    .eq("assistant_id", assistantId)
    .eq("is_active", true)
    .single();

  if (mapping && !mappingError) {
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name")
      .eq("id", mapping.clinic_id)
      .single();

    if (clinic && !clinicError) {
      logger.info("Clinic found via assistant mapping", {
        assistantId,
        assistantName: mapping.assistant_name,
        clinicId: clinic.id,
      });
      return clinic;
    }
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("id, name")
    .eq("inbound_assistant_id", assistantId)
    .single();

  if (error || !clinic) {
    logger.warn("Clinic not found for assistant_id", { assistantId, error });
    return null;
  }

  return clinic;
}

/**
 * Extract tool arguments from VAPI request payload
 */
function extractToolArguments(body: Record<string, unknown>): {
  arguments: Record<string, unknown>;
  toolCallId?: string;
  callId?: string;
  assistantId?: string;
} {
  const message = body.message as Record<string, unknown> | undefined;

  if (message) {
    const call = message.call as Record<string, unknown> | undefined;
    const callId = call?.id as string | undefined;
    const assistantId = call?.assistantId as string | undefined;

    const toolCallList = message.toolCallList as
      | Array<{
          id?: string;
          parameters?: Record<string, unknown>;
          function?: { arguments?: string | Record<string, unknown> };
        }>
      | undefined;

    if (toolCallList && toolCallList.length > 0) {
      const firstTool = toolCallList[0];
      if (
        firstTool?.parameters &&
        Object.keys(firstTool.parameters).length > 0
      ) {
        return {
          arguments: firstTool.parameters,
          toolCallId: firstTool?.id,
          callId,
          assistantId,
        };
      }
      if (firstTool?.function?.arguments) {
        const args = firstTool.function.arguments;
        if (typeof args === "object" && args !== null) {
          return {
            arguments: args,
            toolCallId: firstTool?.id,
            callId,
            assistantId,
          };
        }
        if (typeof args === "string") {
          try {
            return {
              arguments: JSON.parse(args) as Record<string, unknown>,
              toolCallId: firstTool?.id,
              callId,
              assistantId,
            };
          } catch {
            // Continue
          }
        }
      }
      return {
        arguments: firstTool?.parameters ?? {},
        toolCallId: firstTool?.id,
        callId,
        assistantId,
      };
    }

    const toolWithToolCallList = message.toolWithToolCallList as
      | Array<{
          toolCall?: {
            id?: string;
            parameters?: Record<string, unknown>;
            function?: { arguments?: string | Record<string, unknown> };
          };
        }>
      | undefined;

    if (toolWithToolCallList && toolWithToolCallList.length > 0) {
      const firstTool = toolWithToolCallList[0]?.toolCall;
      if (
        firstTool?.parameters &&
        Object.keys(firstTool.parameters).length > 0
      ) {
        return {
          arguments: firstTool.parameters,
          toolCallId: firstTool?.id,
          callId,
          assistantId,
        };
      }
      if (firstTool?.function?.arguments) {
        const args = firstTool.function.arguments;
        if (typeof args === "object" && args !== null) {
          return {
            arguments: args,
            toolCallId: firstTool?.id,
            callId,
            assistantId,
          };
        }
        if (typeof args === "string") {
          try {
            return {
              arguments: JSON.parse(args) as Record<string, unknown>,
              toolCallId: firstTool?.id,
              callId,
              assistantId,
            };
          } catch {
            // Continue
          }
        }
      }
      return {
        arguments: firstTool?.parameters ?? {},
        toolCallId: firstTool?.id,
        callId,
        assistantId,
      };
    }
  }

  return { arguments: body };
}

/**
 * Build response in VAPI tool call format
 */
function buildVapiResponse(
  request: NextRequest,
  result: Record<string, unknown>,
  toolCallId?: string,
  status = 200,
) {
  if (toolCallId) {
    return withCorsHeaders(
      request,
      NextResponse.json({
        results: [{ toolCallId, result: JSON.stringify(result) }],
      }),
    );
  }
  return withCorsHeaders(request, NextResponse.json(result, { status }));
}

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
 * Handle POST request - create refill request
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    logger.info("Create refill request received", { body: rawBody });

    const {
      arguments: toolArgs,
      toolCallId,
      callId,
      assistantId,
    } = extractToolArguments(rawBody as Record<string, unknown>);

    const body = {
      ...toolArgs,
      assistant_id:
        (toolArgs.assistant_id as string) ??
        assistantId ??
        DEFAULT_ASSISTANT_ID,
      vapi_call_id: (toolArgs.vapi_call_id as string) ?? callId,
    };

    const validation = CreateRefillRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Validation failed", {
        errors: validation.error.format(),
        receivedBody: body,
      });
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Invalid request",
          message:
            "I need more information for the refill request. Please provide your name, phone number, pet's name, and the medication name.",
        },
        toolCallId,
        400,
      );
    }

    const input: CreateRefillRequestInput = validation.data;
    const supabase = await createServiceClient();

    // Look up clinic
    let clinic: { id: string; name: string } | null = null;

    if (input.clinic_id) {
      const { data, error } = await supabase
        .from("clinics")
        .select("id, name")
        .eq("id", input.clinic_id)
        .single();
      if (!error && data) {
        clinic = data;
        logger.info("Using direct clinic_id lookup", {
          clinicId: input.clinic_id,
          clinicName: data.name,
        });
      }
    }

    clinic ??= await findClinicByAssistantId(supabase, input.assistant_id);

    if (!clinic) {
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Clinic not found",
          message: "I couldn't identify the clinic. Please try again later.",
        },
        toolCallId,
        404,
      );
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
          source: "vapi_inbound_squad",
          agent: "clinical",
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
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Database error",
          message:
            "I'm having trouble submitting your refill request. Please try again.",
        },
        toolCallId,
        500,
      );
    }

    logger.info("Refill request created successfully", {
      requestId: refillRequest.id,
      referenceId,
      clinicId: clinic.id,
      clinicName: clinic.name,
      medication: input.medication_name,
      pharmacyPreference: input.pharmacy_preference,
      toolCallId,
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

    return buildVapiResponse(
      request,
      {
        success: true,
        request_id: refillRequest.id,
        reference_id: referenceId,
        medication: input.medication_name,
        pet_name: input.pet_name,
        status: "pending",
        pharmacy_preference: input.pharmacy_preference,
        message: responseMessage,
      },
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in create-refill-request", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}

/**
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "VAPI create-refill-request endpoint is active",
    endpoint: "/api/vapi/inbound/tools/create-refill-request",
    method: "POST",
    required_fields: [
      "client_name",
      "client_phone",
      "pet_name",
      "medication_name",
    ],
    optional_fields: [
      "assistant_id",
      "clinic_id",
      "species",
      "medication_strength",
      "pharmacy_preference",
      "pharmacy_name",
      "last_refill_date",
      "notes",
      "vapi_call_id",
    ],
    pharmacy_preferences: ["pickup", "external_pharmacy"],
    statuses: ["pending", "approved", "denied", "dispensed"],
  });
}
