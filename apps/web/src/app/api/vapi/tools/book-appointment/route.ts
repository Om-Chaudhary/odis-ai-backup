/**
 * VAPI Book Appointment Tool Endpoint
 *
 * POST /api/vapi/tools/book-appointment
 *
 * Books an appointment with a 5-minute hold.
 * Uses the book_slot_with_hold PostgreSQL function for atomic booking.
 *
 * Response includes:
 * - Confirmation number on success
 * - Alternative times if requested slot is full
 * - Staleness warning if schedule data is outdated
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

const logger = loggers.api.child("vapi-book-appointment");

// Default VAPI assistant ID for clinic lookup
const DEFAULT_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

// --- Request Schema ---
const BookAppointmentSchema = z.object({
  // VAPI context
  assistant_id: z.string().optional().default(DEFAULT_ASSISTANT_ID),

  // Appointment details
  date: z.string().min(1, "date is required"),
  time: z.string().min(1, "time is required"),

  // Client info
  client_name: z.string().min(1, "client_name is required"),
  client_phone: z.string().min(1, "client_phone is required"),

  // Patient info
  patient_name: z.string().min(1, "patient_name is required"),
  species: z.string().optional(),
  breed: z.string().optional(),

  // Visit details
  reason: z.string().optional(),
  is_new_client: z.boolean().optional().default(false),

  // Tracking
  vapi_call_id: z.string().optional(),
});

type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;

/**
 * Result from book_slot_with_hold function
 */
interface BookingResult {
  success: boolean;
  booking_id?: string;
  confirmation_number?: string;
  slot_id?: string;
  error?: string;
  alternative_times?: Array<{
    time: string;
    available: number;
  }>;
}

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
 * Parse date string to YYYY-MM-DD format
 */
function parseDateToISO(dateStr: string): string | null {
  const normalized = dateStr.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (normalized === "today") {
    return today.toISOString().split("T")[0] ?? null;
  }

  if (normalized === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0] ?? null;
  }

  // Handle "next monday", etc.
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const nextDayMatch =
    /^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(
      normalized,
    );
  if (nextDayMatch?.[1]) {
    const targetDay = dayNames.indexOf(nextDayMatch[1].toLowerCase());
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    return targetDate.toISOString().split("T")[0] ?? null;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const currentYear = today.getFullYear();
    if (parsed.getFullYear() < currentYear - 1) {
      parsed.setFullYear(currentYear);
    }
    return parsed.toISOString().split("T")[0] ?? null;
  }

  return null;
}

/**
 * Parse time string to HH:MM:SS format
 */
function parseTimeToISO(timeStr: string): string | null {
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

  // Already in 24-hour format
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  }

  return null;
}

/**
 * Format time from HH:MM:SS to 12-hour format
 */
function formatTime12Hour(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr ?? "0", 10);
  const minute = minuteStr ?? "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
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
          function?: {
            arguments?: string | Record<string, unknown>;
          };
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
            const parsedArgs = JSON.parse(args) as Record<string, unknown>;
            return {
              arguments: parsedArgs,
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
            function?: {
              arguments?: string | Record<string, unknown>;
            };
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
            const parsedArgs = JSON.parse(args) as Record<string, unknown>;
            return {
              arguments: parsedArgs,
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
        results: [
          {
            toolCallId,
            result: JSON.stringify(result),
          },
        ],
      }),
    );
  }

  return withCorsHeaders(request, NextResponse.json(result, { status }));
}

/**
 * Handle POST request - book appointment
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    logger.info("Book appointment request received", { body: rawBody });

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

    // Validate input
    const validation = BookAppointmentSchema.safeParse(body);
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
            "I need more information to book your appointment. Please provide the date, time, your name, phone number, and your pet's name.",
        },
        toolCallId,
        400,
      );
    }

    const input: BookAppointmentInput = validation.data;

    // Parse date and time
    const parsedDate = parseDateToISO(input.date);
    if (!parsedDate) {
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Invalid date",
          message: `I couldn't understand the date "${input.date}". Could you please say it again?`,
        },
        toolCallId,
        400,
      );
    }

    const parsedTime = parseTimeToISO(input.time);
    if (!parsedTime) {
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Invalid time",
          message: `I couldn't understand the time "${input.time}". Could you please say it again, like "9 AM" or "2:30 PM"?`,
        },
        toolCallId,
        400,
      );
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(parsedDate);
    if (requestedDate < today) {
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Past date",
          message: "I can only book appointments for today or future dates.",
        },
        toolCallId,
        400,
      );
    }

    // Get service client
    const supabase = await createServiceClient();

    // Look up clinic
    const clinic = await findClinicByAssistantId(supabase, input.assistant_id);
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

    // Call the book_slot_with_hold function
    const { data, error } = await supabase.rpc("book_slot_with_hold", {
      p_clinic_id: clinic.id,
      p_date: parsedDate,
      p_time: parsedTime,
      p_client_name: input.client_name,
      p_client_phone: input.client_phone,
      p_patient_name: input.patient_name,
      p_species: input.species ?? null,
      p_reason: input.reason ?? null,
      p_is_new_client: input.is_new_client,
      p_vapi_call_id: input.vapi_call_id ?? null,
    });

    if (error) {
      logger.error("Failed to book slot", { error, clinicId: clinic.id });
      return buildVapiResponse(
        request,
        {
          success: false,
          error: "Database error",
          message:
            "I'm having trouble booking your appointment right now. Please try again in a moment.",
        },
        toolCallId,
        500,
      );
    }

    const result = data as BookingResult;

    // Format date and time for human-readable response
    const formattedDate = new Date(parsedDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const formattedTime = formatTime12Hour(parsedTime);

    if (!result.success) {
      // Booking failed - slot not available
      const alternatives = result.alternative_times ?? [];
      const alternativeText =
        alternatives.length > 0
          ? ` I have availability at ${alternatives
              .slice(0, 3)
              .map((a) => a.time)
              .join(", ")}. Would any of those work for you?`
          : " Would you like me to check another day?";

      logger.info("Booking failed - slot unavailable", {
        clinicId: clinic.id,
        date: parsedDate,
        time: parsedTime,
        alternatives: alternatives.length,
        toolCallId,
      });

      return buildVapiResponse(
        request,
        {
          success: false,
          error: result.error ?? "Slot unavailable",
          message: `I'm sorry, ${formattedTime} on ${formattedDate} is no longer available.${alternativeText}`,
          alternative_times: alternatives,
        },
        toolCallId,
      );
    }

    // Booking successful
    logger.info("Appointment booked successfully", {
      bookingId: result.booking_id,
      confirmationNumber: result.confirmation_number,
      clinicId: clinic.id,
      clinicName: clinic.name,
      date: parsedDate,
      time: parsedTime,
      patientName: input.patient_name,
      toolCallId,
    });

    return buildVapiResponse(
      request,
      {
        success: true,
        confirmation_number: result.confirmation_number,
        booking_id: result.booking_id,
        appointment: {
          date: parsedDate,
          formatted_date: formattedDate,
          time: parsedTime,
          formatted_time: formattedTime,
          patient_name: input.patient_name,
          client_name: input.client_name,
          reason: input.reason,
        },
        clinic_name: clinic.name,
        message: `Great! I've booked your appointment for ${input.patient_name} on ${formattedDate} at ${formattedTime}. Your confirmation number is ${result.confirmation_number}. Is there anything else I can help you with?`,
        hold_info: {
          expires_in_minutes: 5,
          note: "This appointment is being held for 5 minutes while we complete your booking.",
        },
      },
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in book-appointment", {
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
            "Something went wrong while booking your appointment. Please try again.",
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
    message: "VAPI book-appointment endpoint is active",
    endpoint: "/api/vapi/tools/book-appointment",
    method: "POST",
    required_fields: [
      "date",
      "time",
      "client_name",
      "client_phone",
      "patient_name",
    ],
    optional_fields: [
      "assistant_id",
      "species",
      "breed",
      "reason",
      "is_new_client",
      "vapi_call_id",
    ],
    features: [
      "5-minute hold on booking",
      "Alternative times if slot unavailable",
      "Confirmation number generation",
    ],
    default_assistant_id: DEFAULT_ASSISTANT_ID,
  });
}
