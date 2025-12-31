/**
 * VAPI Leave Message Tool Endpoint (Enhanced)
 *
 * POST /api/vapi/inbound/tools/leave-message
 *
 * Enhanced version of leave-message for the inbound squad.
 * Adds message categorization, best callback time, and notes.
 * Used by Admin Agent to log callback requests with routing info.
 *
 * Stores messages in clinic_messages with message_type categorization.
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

const logger = loggers.api.child("vapi-leave-message-enhanced");

// Default assistant ID for clinic lookup (production single assistant)
const DEFAULT_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

// --- Schema ---
const MessageTypeEnum = z.enum([
  "general",
  "billing",
  "records",
  "refill",
  "clinical",
  "other",
]);

const LeaveMessageSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional(),
  clinic_id: z.string().uuid().optional(),
  vapi_call_id: z.string().optional(),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Pet info (optional for general messages)
  pet_name: z.string().optional(),

  // Message details
  message: z.string().min(1, "message is required"),
  is_urgent: z.boolean().default(false),
  message_type: MessageTypeEnum.optional().default("general"),
  best_callback_time: z.string().optional(),
  notes: z.string().optional(),
});

type LeaveMessageInput = z.infer<typeof LeaveMessageSchema>;

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
 * Build success response
 */
function buildSuccessResponse(
  request: NextRequest,
  data: Record<string, unknown>,
  message: string,
  toolCallId?: string,
) {
  return buildVapiResponse(
    request,
    {
      success: true,
      ...data,
      message,
    },
    toolCallId,
  );
}

/**
 * Build error response
 */
function buildErrorResponse(
  request: NextRequest,
  error: string,
  message: string,
  toolCallId?: string,
  status = 400,
) {
  return buildVapiResponse(
    request,
    {
      success: false,
      error,
      message,
    },
    toolCallId,
    status,
  );
}

/**
 * Handle POST request - leave a message (enhanced)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    logger.info("Leave message (enhanced) request received", {
      body: rawBody,
    });

    // Extract tool arguments from VAPI payload
    const {
      arguments: toolArgs,
      toolCallId,
      callId,
      assistantId,
    } = extractToolArguments(rawBody as Record<string, unknown>);

    // Merge extracted metadata with tool arguments
    const body = {
      ...toolArgs,
      assistant_id:
        (toolArgs.assistant_id as string) ??
        assistantId ??
        DEFAULT_ASSISTANT_ID,
      vapi_call_id: (toolArgs.vapi_call_id as string) ?? callId,
    };

    // Validate input
    const validation = LeaveMessageSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Validation failed", {
        errors: validation.error.format(),
        receivedBody: body,
      });
      return buildErrorResponse(
        request,
        "Invalid request",
        "I need your name, phone number, and message to leave a callback request.",
        toolCallId,
        400,
      );
    }

    const input: LeaveMessageInput = validation.data;

    // Get service client (bypasses RLS for webhook context)
    const supabase = await createServiceClient();

    // Look up clinic - use clinic_id if provided, otherwise lookup by assistant
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

    // Fallback to assistant lookup
    clinic ??= await findClinicByAssistantId(
      supabase,
      input.assistant_id ?? DEFAULT_ASSISTANT_ID,
    );

    if (!clinic) {
      return buildErrorResponse(
        request,
        "Clinic not found",
        "I couldn't identify the clinic. Please try again later.",
        toolCallId,
        404,
      );
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
        pet_name: input.pet_name ?? null,
        message: fullMessage,
        message_type: input.message_type ?? "general",
        priority: input.is_urgent ? "urgent" : "normal",
        status: "unread",
        vapi_call_id: input.vapi_call_id ?? null,
        metadata: {
          source: "vapi_inbound_squad",
          agent: "admin",
          is_urgent: input.is_urgent,
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
      return buildErrorResponse(
        request,
        "Database error",
        "I'm having trouble saving your message. Please try again.",
        toolCallId,
        500,
      );
    }

    logger.info("Message logged successfully", {
      messageId: message.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      messageType: input.message_type,
      isUrgent: input.is_urgent,
      hasPetName: !!input.pet_name,
      hasBestCallbackTime: !!input.best_callback_time,
      toolCallId,
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

    return buildSuccessResponse(
      request,
      {
        message_id: message.id,
        clinic_name: clinic.name,
        message_type: input.message_type ?? "general",
        priority: input.is_urgent ? "urgent" : "normal",
      },
      responseMessage,
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in leave-message (enhanced)", {
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
    message: "VAPI leave-message (enhanced) endpoint is active",
    endpoint: "/api/vapi/inbound/tools/leave-message",
    method: "POST",
    required_fields: ["client_name", "client_phone", "message", "is_urgent"],
    optional_fields: [
      "assistant_id",
      "clinic_id",
      "pet_name",
      "message_type",
      "best_callback_time",
      "notes",
      "vapi_call_id",
    ],
    message_types: [
      "general",
      "billing",
      "records",
      "refill",
      "clinical",
      "other",
    ],
    notes: {
      enhanced:
        "This is the enhanced version for the inbound squad with message categorization",
      legacy:
        "The original /api/vapi/leave-message endpoint is still available for backward compatibility",
    },
  });
}
