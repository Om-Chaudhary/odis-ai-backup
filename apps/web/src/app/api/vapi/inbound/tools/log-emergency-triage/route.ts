/**
 * VAPI Log Emergency Triage Tool Endpoint
 *
 * POST /api/vapi/inbound/tools/log-emergency-triage
 *
 * Logs emergency triage call with outcome classification.
 * Used by Emergency Agent to record triage outcomes for staff review.
 *
 * Stores data in clinic_messages with message_type='emergency_triage'
 * and triage_data JSONB column.
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

const logger = loggers.api.child("vapi-log-emergency-triage");

// Default assistant ID for clinic lookup (production single assistant)
const DEFAULT_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

// --- Request Schema ---
const LogEmergencyTriageSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional().default(DEFAULT_ASSISTANT_ID),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Caller info
  caller_name: z.string().min(1, "caller_name is required"),
  caller_phone: z.string().min(1, "caller_phone is required"),

  // Pet info
  pet_name: z.string().min(1, "pet_name is required"),
  species: z.enum(["dog", "cat", "other"]).optional().default("other"),

  // Triage data
  symptoms: z.string().min(1, "symptoms description is required"),
  urgency: z.enum(["critical", "urgent", "monitor"]),
  action_taken: z.enum([
    "sent_to_er",
    "scheduled_appointment",
    "home_care_advised",
  ]),
  er_referred: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

type LogEmergencyTriageInput = z.infer<typeof LogEmergencyTriageSchema>;

/**
 * Look up clinic by assistant ID using the mappings table
 * Falls back to checking clinics.inbound_assistant_id for legacy support
 */
async function findClinicByAssistantId(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  assistantId: string,
) {
  // First, try the new mappings table (supports squads, dev/prod separation)
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
        environment: mapping.environment,
        clinicId: clinic.id,
        clinicName: clinic.name,
      });
      return clinic;
    }
  }

  // Fallback: check legacy inbound_assistant_id column
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
            // Continue to fallback
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
            // Continue to fallback
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
 * Handle POST request - log emergency triage
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    logger.info("Log emergency triage request received", { body: rawBody });

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

    const validation = LogEmergencyTriageSchema.safeParse(body);
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
            "I need more information to log this emergency. Please provide the caller's name, phone, pet name, symptoms, and urgency level.",
        },
        toolCallId,
        400,
      );
    }

    const input: LogEmergencyTriageInput = validation.data;
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
        pet_name: input.pet_name,
        message:
          `Emergency triage: ${input.symptoms}. Action: ${input.action_taken}. ${input.notes ?? ""}`.trim(),
        message_type: "emergency_triage",
        triage_data: triageData,
        priority: input.urgency === "critical" ? "urgent" : "normal",
        status: "unread",
        vapi_call_id: input.vapi_call_id ?? null,
        metadata: {
          source: "vapi_inbound_squad",
          agent: "emergency",
        },
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Failed to insert emergency triage", {
        error,
        clinicId: clinic.id,
      });
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Database error",
          message:
            "I'm having trouble logging this emergency. Please try again.",
        },
        toolCallId,
        500,
      );
    }

    logger.info("Emergency triage logged successfully", {
      messageId: message.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      urgency: input.urgency,
      actionTaken: input.action_taken,
      erReferred: input.er_referred,
      toolCallId,
    });

    // Build response message
    let responseMessage: string;
    if (input.action_taken === "sent_to_er") {
      responseMessage = `I've logged this emergency for ${input.pet_name}. The staff will be notified that you're heading to the emergency clinic. Please drive safely.`;
    } else if (input.action_taken === "scheduled_appointment") {
      responseMessage = `I've logged this for ${input.pet_name}. The staff will follow up about scheduling an urgent appointment.`;
    } else {
      responseMessage = `I've logged the information about ${input.pet_name}. The staff will review this and may follow up if needed.`;
    }

    return buildVapiResponse(
      request,
      {
        success: true,
        reference_id: message.id,
        urgency: input.urgency,
        action_taken: input.action_taken,
        er_referred: input.er_referred,
        message: responseMessage,
      },
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in log-emergency-triage", {
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
    message: "VAPI log-emergency-triage endpoint is active",
    endpoint: "/api/vapi/inbound/tools/log-emergency-triage",
    method: "POST",
    required_fields: [
      "caller_name",
      "caller_phone",
      "pet_name",
      "symptoms",
      "urgency",
      "action_taken",
    ],
    optional_fields: [
      "assistant_id",
      "clinic_id",
      "species",
      "er_referred",
      "notes",
      "vapi_call_id",
    ],
    urgency_levels: ["critical", "urgent", "monitor"],
    action_types: ["sent_to_er", "scheduled_appointment", "home_care_advised"],
  });
}
