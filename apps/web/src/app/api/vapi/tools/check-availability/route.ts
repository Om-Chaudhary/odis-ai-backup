/**
 * VAPI Check Availability Tool Endpoint
 *
 * POST /api/vapi/tools/check-availability
 *
 * Returns available time slots for a specific date.
 * Uses the get_available_slots PostgreSQL function.
 *
 * Response includes:
 * - Available times with remaining capacity
 * - Staleness indicator (if data is older than threshold)
 * - Alternative dates if requested date has no availability
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

const logger = loggers.api.child("vapi-check-availability");

// Default VAPI assistant ID for clinic lookup
const DEFAULT_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

// --- Request Schema ---
const CheckAvailabilitySchema = z.object({
  // VAPI context (for clinic lookup)
  assistant_id: z.string().optional().default(DEFAULT_ASSISTANT_ID),

  // Date to check (YYYY-MM-DD or natural language)
  date: z.string().min(1, "date is required"),

  // Optional: include blocked times in response
  include_blocked: z.boolean().optional().default(false),

  // Tracking
  vapi_call_id: z.string().optional(),
});

type CheckAvailabilityInput = z.infer<typeof CheckAvailabilitySchema>;

/**
 * Available slot from database function
 */
interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  capacity: number;
  booked_count: number;
  available_count: number;
  is_blocked: boolean;
  block_reason: string | null;
  last_synced_at: string | null;
  is_stale: boolean;
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
 * Handles: "tomorrow", "next monday", "2024-01-15", "January 15", etc.
 */
function parseDateToISO(dateStr: string): string | null {
  const normalized = dateStr.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Handle relative dates
  if (normalized === "today") {
    return today.toISOString().split("T")[0] ?? null;
  }

  if (normalized === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0] ?? null;
  }

  // Handle "next monday", "next tuesday", etc.
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

  // Try parsing as ISO date or common formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    // Validate year - correct if too far in the past
    const currentYear = today.getFullYear();
    if (parsed.getFullYear() < currentYear - 1) {
      parsed.setFullYear(currentYear);
    }
    return parsed.toISOString().split("T")[0] ?? null;
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

    // Check for toolWithToolCallList format
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
 * Handle POST request - check availability
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    logger.info("Check availability request received", { body: rawBody });

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
    const validation = CheckAvailabilitySchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Validation failed", {
        errors: validation.error.format(),
        receivedBody: body,
      });
      return buildVapiResponse(
        request,
        {
          available: false,
          error: "Invalid request",
          message: "Please provide a valid date to check availability.",
        },
        toolCallId,
        400,
      );
    }

    const input: CheckAvailabilityInput = validation.data;

    // Parse date
    const parsedDate = parseDateToISO(input.date);
    if (!parsedDate) {
      return buildVapiResponse(
        request,
        {
          available: false,
          error: "Invalid date",
          message: `I couldn't understand the date "${input.date}". Please try again with a date like "tomorrow" or "January 15th".`,
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
          available: false,
          error: "Past date",
          message: "I can only check availability for today or future dates.",
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
          available: false,
          error: "Clinic not found",
          message: "I couldn't identify the clinic. Please try again later.",
        },
        toolCallId,
        404,
      );
    }

    // Call the get_available_slots function
    const { data: slots, error } = await supabase.rpc("get_available_slots", {
      p_clinic_id: clinic.id,
      p_date: parsedDate,
    });

    if (error) {
      logger.error("Failed to get available slots", {
        error,
        clinicId: clinic.id,
      });
      return buildVapiResponse(
        request,
        {
          available: false,
          error: "Database error",
          message:
            "I'm having trouble checking availability right now. Please try again in a moment.",
        },
        toolCallId,
        500,
      );
    }

    const availableSlots = (slots as AvailableSlot[]) ?? [];

    // Filter to only available (non-blocked, has capacity) slots
    const openSlots = availableSlots.filter(
      (slot) => !slot.is_blocked && slot.available_count > 0,
    );

    // Check staleness
    const isStale = availableSlots.some((slot) => slot.is_stale);
    const lastSynced = availableSlots.find(
      (s) => s.last_synced_at,
    )?.last_synced_at;

    // Format response for VAPI
    if (openSlots.length === 0) {
      // No availability - suggest alternative dates
      const formattedDate = new Date(parsedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      return buildVapiResponse(
        request,
        {
          available: false,
          date: parsedDate,
          formatted_date: formattedDate,
          times: [],
          message: `I'm sorry, there are no available appointments on ${formattedDate}. Would you like me to check another day?`,
          staleness: {
            last_synced: lastSynced,
            is_stale: isStale,
          },
        },
        toolCallId,
      );
    }

    // Format available times
    const times = openSlots.map((slot) => ({
      time: formatTime12Hour(slot.slot_start),
      time_24h: slot.slot_start,
      slots_remaining: slot.available_count,
    }));

    const formattedDate = new Date(parsedDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    // Build human-readable time list for VAPI
    const timeList = times
      .slice(0, 5)
      .map((t) => t.time)
      .join(", ");
    const moreCount = times.length > 5 ? times.length - 5 : 0;
    const moreText = moreCount > 0 ? ` and ${moreCount} more times` : "";

    logger.info("Availability check completed", {
      clinicId: clinic.id,
      date: parsedDate,
      availableSlots: times.length,
      toolCallId,
    });

    return buildVapiResponse(
      request,
      {
        available: true,
        date: parsedDate,
        formatted_date: formattedDate,
        times,
        message: `I have availability on ${formattedDate}. Available times include: ${timeList}${moreText}. Which time works best for you?`,
        staleness: {
          last_synced: lastSynced,
          is_stale: isStale,
          warning: isStale
            ? "Schedule data may be slightly outdated. Please confirm your appointment."
            : undefined,
        },
      },
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in check-availability", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          available: false,
          error: "Internal server error",
          message:
            "Something went wrong while checking availability. Please try again.",
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
    message: "VAPI check-availability endpoint is active",
    endpoint: "/api/vapi/tools/check-availability",
    method: "POST",
    required_fields: ["date"],
    optional_fields: ["assistant_id", "include_blocked", "vapi_call_id"],
    example_dates: ["today", "tomorrow", "next monday", "2025-01-15"],
    default_assistant_id: DEFAULT_ASSISTANT_ID,
  });
}
