/**
 * VAPI Schedule Appointment Tool Endpoint
 *
 * POST /api/vapi/schedule-appointment
 *
 * Unauthenticated endpoint for VAPI tool calls to submit appointment requests.
 * Stores requests in the `appointment_requests` table for clinic staff review.
 *
 * Clinic is identified via the VAPI assistant_id → clinics.inbound_assistant_id lookup.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@odis-ai/db/server";
import { loggers } from "@odis-ai/logger";
import { handleCorsPreflightRequest, withCorsHeaders } from "@odis-ai/api/cors";

const logger = loggers.api.child("vapi-schedule-appointment");

// Default VAPI assistant ID for clinic lookup
const DEFAULT_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

// --- Request Schema ---
const ScheduleAppointmentSchema = z.object({
  // VAPI context (for clinic lookup) - defaults to standard inbound assistant
  assistant_id: z.string().optional().default(DEFAULT_ASSISTANT_ID),

  // Client info
  client_first_name: z.string().min(1, "client_first_name is required"),
  client_last_name: z.string().min(1, "client_last_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Patient info
  patient_name: z.string().min(1, "patient_name is required"),
  species: z.string().min(1, "species is required"),
  breed: z.string().optional(),

  // Appointment details
  reason_for_visit: z.string().min(1, "reason_for_visit is required"),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional(),
  is_new_client: z.boolean(),
  is_outlier: z.boolean(),
  notes: z.string().optional(),

  // Tracking
  vapi_call_id: z.string().optional(),
});

type ScheduleAppointmentInput = z.infer<typeof ScheduleAppointmentSchema>;

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
 * Parse date string to Date object
 * Handles various formats: "tomorrow", "next monday", "2024-01-15", etc.
 */
function parsePreferredDate(dateStr?: string): Date | null {
  if (!dateStr) return null;

  const normalized = dateStr.toLowerCase().trim();

  // Handle relative dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (normalized === "today") {
    return today;
  }

  if (normalized === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Try parsing as ISO date or common formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

/**
 * Parse time string to time format (HH:MM:SS)
 * Handles: "9am", "2:30pm", "14:00", etc.
 */
function parsePreferredTime(timeStr?: string): string | null {
  if (!timeStr) return null;

  const normalized = timeStr.toLowerCase().trim();

  // Handle "9am", "2pm" format
  const simpleMatch = /^(\d{1,2})\s*(am|pm)$/i.exec(normalized);
  if (simpleMatch?.[1] && simpleMatch[2]) {
    let hour = parseInt(simpleMatch[1], 10);
    const isPM = simpleMatch[2].toLowerCase() === "pm";
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:00:00`;
  }

  // Handle "9:30am", "2:30pm" format
  const colonMatch = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(normalized);
  if (colonMatch?.[1] && colonMatch[2]) {
    let hour = parseInt(colonMatch[1], 10);
    const minute = parseInt(colonMatch[2], 10);
    const meridiem = colonMatch[3]?.toLowerCase();

    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
  }

  return null;
}

/**
 * Extract tool arguments from VAPI request payload
 * VAPI can send tool calls in multiple formats:
 * 1. Direct: { client_first_name: "...", ... }
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
          function?: {
            name?: string;
            arguments?: string | Record<string, unknown>;
          };
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

      // Try function.arguments (could be JSON string or already parsed object)
      if (firstTool?.function?.arguments) {
        const args = firstTool.function.arguments;

        // Handle already parsed object (VAPI format)
        if (typeof args === "object" && args !== null) {
          return {
            arguments: args,
            toolCallId: firstTool?.id,
            callId,
            assistantId,
          };
        }

        // Handle JSON string (OpenAI format)
        if (typeof args === "string") {
          try {
            const parsedArgs = JSON.parse(args) as Record<string, unknown>;
            return {
              arguments: parsedArgs,
              toolCallId: firstTool?.id,
              callId,
              assistantId,
            };
          } catch (e) {
            // If parsing fails, log and continue to fallback
            logger.warn("Failed to parse function.arguments", {
              arguments: args,
              error: e instanceof Error ? e.message : String(e),
            });
          }
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
            function?: {
              name?: string;
              arguments?: string | Record<string, unknown>;
            };
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

      // Try function.arguments (could be JSON string or already parsed object)
      if (firstTool?.function?.arguments) {
        const args = firstTool.function.arguments;

        // Handle already parsed object (VAPI format)
        if (typeof args === "object" && args !== null) {
          return {
            arguments: args,
            toolCallId: firstTool?.id,
            callId,
            assistantId,
          };
        }

        // Handle JSON string (OpenAI format)
        if (typeof args === "string") {
          try {
            const parsedArgs = JSON.parse(args) as Record<string, unknown>;
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
                arguments: args,
                error: e instanceof Error ? e.message : String(e),
              },
            );
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
 * Handle POST request - submit appointment request
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
    const validation = ScheduleAppointmentSchema.safeParse(body);
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

    const input: ScheduleAppointmentInput = validation.data;

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

    // Parse date and time
    const requestedDate = parsePreferredDate(input.preferred_date);
    const requestedTime = parsePreferredTime(input.preferred_time);

    // Build appointment request record (simplified - uses proper columns instead of metadata)
    const appointmentRequest = {
      clinic_id: clinic.id,
      client_name: `${input.client_first_name} ${input.client_last_name}`,
      client_phone: input.client_phone,
      patient_name: input.patient_name,
      reason: input.reason_for_visit,
      // Time fields are now nullable - only set if provided
      requested_date: requestedDate?.toISOString().split("T")[0] ?? null,
      requested_start_time: requestedTime ?? null,
      requested_end_time: requestedTime
        ? // Add 30 minutes for end time
          (() => {
            const [hourStr, minuteStr] = requestedTime.split(":");
            const hour = parseInt(hourStr ?? "9", 10);
            const minute = parseInt(minuteStr ?? "0", 10);
            const endHour = hour + (minute >= 30 ? 1 : 0);
            const endMinute = (minute + 30) % 60;
            return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}:00`;
          })()
        : null,
      status: "pending",
      vapi_call_id: input.vapi_call_id ?? null,
      // These are now proper columns instead of metadata
      species: input.species,
      breed: input.breed ?? null,
      is_new_client: input.is_new_client,
      is_outlier: input.is_outlier,
      notes: input.notes ?? null,
      // Keep metadata for any additional context
      metadata: {
        source: "vapi",
        preferred_date_raw: input.preferred_date ?? null,
        preferred_time_raw: input.preferred_time ?? null,
      },
    };

    // Insert into appointment_requests
    const { data: inserted, error: insertError } = await supabase
      .from("appointment_requests")
      .insert(appointmentRequest)
      .select("id")
      .single();

    if (insertError) {
      logger.error("Failed to insert appointment request", {
        error: insertError,
        clinicId: clinic.id,
      });
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Failed to save appointment request",
          message:
            "We couldn't save your appointment request. Please try again or call the clinic directly.",
        },
        toolCallId,
        500,
      );
    }

    logger.info("Appointment request created", {
      requestId: inserted.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      patientName: input.patient_name,
      isNewClient: input.is_new_client,
      toolCallId,
    });

    // Return success response for VAPI
    return buildVapiResponse(
      request,
      {
        success: true,
        message: `Your appointment request has been submitted to ${clinic.name}. The clinic will contact you to confirm the appointment.`,
        appointment_request_id: inserted.id,
        clinic_name: clinic.name,
      },
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in schedule-appointment", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // For catch block, we may not have toolCallId available
    // Return standard error response
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
    message: "VAPI schedule-appointment endpoint is active",
    endpoint: "/api/vapi/schedule-appointment",
    method: "POST",
    required_fields: [
      "client_first_name",
      "client_last_name",
      "client_phone",
      "patient_name",
      "species",
      "reason_for_visit",
      "is_new_client",
      "is_outlier",
    ],
    optional_fields: [
      "assistant_id",
      "breed",
      "preferred_date",
      "preferred_time",
      "notes",
      "vapi_call_id",
    ],
    default_assistant_id: DEFAULT_ASSISTANT_ID,
  });
}
