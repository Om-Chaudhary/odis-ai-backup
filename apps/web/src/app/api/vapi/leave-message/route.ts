/**
 * VAPI Leave Message Tool Endpoint
 *
 * POST /api/vapi/leave-message
 *
 * Unauthenticated endpoint for VAPI tool calls to record messages/callback requests.
 * Stores messages in the `clinic_messages` table for clinic staff to follow up.
 *
 * Clinic is identified via the VAPI assistant_id → clinics.inbound_assistant_id lookup.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@odis-ai/db/server";
import { loggers } from "@odis-ai/logger";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/api/cors";

const logger = loggers.api.child("vapi-leave-message");

// Default VAPI assistant ID for clinic lookup
const DEFAULT_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

// --- Request Schema ---
const LeaveMessageSchema = z.object({
  // VAPI context (for clinic lookup) - defaults to standard inbound assistant
  assistant_id: z.string().optional().default(DEFAULT_ASSISTANT_ID),

  // Caller info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),
  pet_name: z.string().optional(),

  // Message details
  message: z.string().min(1, "message is required"),
  is_urgent: z.boolean(),

  // Tracking
  vapi_call_id: z.string().optional(),
});

type LeaveMessageInput = z.infer<typeof LeaveMessageSchema>;

/**
 * Look up clinic by inbound assistant ID
 */
async function findClinicByAssistantId(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  assistantId: string,
) {
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
 * VAPI can send tool calls in multiple formats:
 * 1. Direct: { client_name: "...", ... }
 * 2. Tool-calls message with parameters: { message: { toolCallList: [{ parameters: {...} }] } }
 * 3. Tool-calls message with function.arguments (OpenAI format): { message: { toolCallList: [{ function: { arguments: "{...}" } }] } }
 * 4. toolWithToolCallList format: { message: { toolWithToolCallList: [{ toolCall: { ... } }] } }
 */
function extractToolArguments(body: Record<string, unknown>): {
  arguments: Record<string, unknown>;
  toolCallId?: string;
  callId?: string;
  assistantId?: string;
} {
  // Check if this is a VAPI webhook format with message wrapper
  const message = body.message as Record<string, unknown> | undefined;

  if (message) {
    // Extract call info for context
    const call = message.call as Record<string, unknown> | undefined;
    const callId = call?.id as string | undefined;
    const assistantId = call?.assistantId as string | undefined;

    // Check for toolCallList format
    const toolCallList = message.toolCallList as
      | Array<{
          id?: string;
          parameters?: Record<string, unknown>;
          function?: { name?: string; arguments?: string };
        }>
      | undefined;

    if (toolCallList && toolCallList.length > 0) {
      const firstTool = toolCallList[0];

      // Try parameters first (VAPI native format)
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

      // Try function.arguments (OpenAI format - arguments is a JSON string)
      if (firstTool?.function?.arguments) {
        try {
          const parsedArgs = JSON.parse(firstTool.function.arguments) as Record<
            string,
            unknown
          >;
          return {
            arguments: parsedArgs,
            toolCallId: firstTool?.id,
            callId,
            assistantId,
          };
        } catch (e) {
          // If parsing fails, log and continue to fallback
          logger.warn("Failed to parse function.arguments", {
            arguments: firstTool.function.arguments,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      // Return empty if neither format has data
      return {
        arguments: firstTool?.parameters ?? {},
        toolCallId: firstTool?.id,
        callId,
        assistantId,
      };
    }

    // Check for toolWithToolCallList format
    const toolWithToolCallList = message.toolWithToolCallList as
      | Array<{
          toolCall?: {
            id?: string;
            parameters?: Record<string, unknown>;
            function?: { name?: string; arguments?: string };
          };
        }>
      | undefined;

    if (toolWithToolCallList && toolWithToolCallList.length > 0) {
      const firstTool = toolWithToolCallList[0]?.toolCall;

      // Try parameters first
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

      // Try function.arguments (OpenAI format)
      if (firstTool?.function?.arguments) {
        try {
          const parsedArgs = JSON.parse(firstTool.function.arguments) as Record<
            string,
            unknown
          >;
          return {
            arguments: parsedArgs,
            toolCallId: firstTool?.id,
            callId,
            assistantId,
          };
        } catch (e) {
          logger.warn(
            "Failed to parse function.arguments in toolWithToolCallList",
            {
              arguments: firstTool.function.arguments,
              error: e instanceof Error ? e.message : String(e),
            },
          );
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

  // Fallback: assume direct format (arguments at top level)
  return { arguments: body };
}

/**
 * Build response in VAPI tool call format if toolCallId is present
 * Otherwise return a standard JSON response
 */
function buildVapiResponse(
  request: NextRequest,
  result: Record<string, unknown>,
  toolCallId?: string,
  status = 200,
) {
  // If this is a VAPI tool call, return in VAPI's expected format
  if (toolCallId) {
    return withCorsHeaders(
      request,
      NextResponse.json({
        results: [
          {
            toolCallId,
            result: JSON.stringify(result),
          },
        ],
      }),
    );
  }

  // Standard JSON response for direct API calls
  return withCorsHeaders(request, NextResponse.json(result, { status }));
}

/**
 * Handle POST request - leave a message
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const rawBody = await request.json();

    // Log raw request for debugging (info level to show in Vercel)
    logger.info("Raw request body received", { body: rawBody });

    // Extract arguments from VAPI payload format
    const {
      arguments: toolArgs,
      toolCallId,
      callId,
      assistantId,
    } = extractToolArguments(rawBody as Record<string, unknown>);

    logger.info("Extracted tool arguments", {
      toolArgs,
      toolCallId,
      callId,
      assistantId,
    });

    // Build the body for validation, adding assistant_id and vapi_call_id if available
    const body = {
      ...toolArgs,
      // Use assistant_id from call if not in args
      assistant_id:
        (toolArgs.assistant_id as string) ??
        assistantId ??
        DEFAULT_ASSISTANT_ID,
      // Use call_id as vapi_call_id if not in args
      vapi_call_id: (toolArgs.vapi_call_id as string) ?? callId,
    };

    // Validate input
    const validation = LeaveMessageSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Validation failed", {
        errors: validation.error.format(),
        receivedBody: body,
      });
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format(),
        },
        toolCallId,
        400,
      );
    }

    const input: LeaveMessageInput = validation.data;

    // Get service client (bypasses RLS)
    const supabase = await createServiceClient();

    // Look up clinic by assistant_id
    const clinic = await findClinicByAssistantId(supabase, input.assistant_id);
    if (!clinic) {
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Clinic not found",
          message:
            "Unable to identify clinic from assistant_id. Please contact support.",
        },
        toolCallId,
        404,
      );
    }

    // Build clinic message record
    const clinicMessage = {
      clinic_id: clinic.id,
      caller_name: input.client_name,
      caller_phone: input.client_phone,
      message_content: input.message,
      message_type: "callback_request",
      priority: input.is_urgent ? "urgent" : "normal",
      status: "new",
      vapi_call_id: input.vapi_call_id ?? null,
      metadata: {
        source: "vapi",
        pet_name: input.pet_name ?? null,
        is_urgent: input.is_urgent,
      },
    };

    // Insert into clinic_messages
    const { data: inserted, error: insertError } = await supabase
      .from("clinic_messages")
      .insert(clinicMessage)
      .select("id")
      .single();

    if (insertError) {
      logger.error("Failed to insert clinic message", {
        error: insertError,
        clinicId: clinic.id,
      });
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Failed to save message",
          message:
            "We couldn't save your message. Please try again or call the clinic directly.",
        },
        toolCallId,
        500,
      );
    }

    logger.info("Clinic message created", {
      messageId: inserted.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      isUrgent: input.is_urgent,
      hasPetName: !!input.pet_name,
      toolCallId,
    });

    // Return success response for VAPI
    const urgentNote = input.is_urgent
      ? " This has been marked as urgent and will be prioritized."
      : "";

    return buildVapiResponse(
      request,
      {
        success: true,
        message: `Your message has been recorded and ${clinic.name} will call you back as soon as possible.${urgentNote}`,
        message_id: inserted.id,
        clinic_name: clinic.name,
        priority: input.is_urgent ? "urgent" : "normal",
      },
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in leave-message", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          success: false,
          error: "Internal server error",
          message:
            "Something went wrong. Please try again or call the clinic directly.",
        },
        { status: 500 },
      ),
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
    message: "VAPI leave-message endpoint is active",
    endpoint: "/api/vapi/leave-message",
    method: "POST",
    required_fields: ["client_name", "client_phone", "message", "is_urgent"],
    optional_fields: ["assistant_id", "pet_name", "vapi_call_id"],
    default_assistant_id: DEFAULT_ASSISTANT_ID,
  });
}
