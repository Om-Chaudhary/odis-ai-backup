/**
 * VAPI Check Availability Range Tool Endpoint
 *
 * POST /api/vapi/tools/check-availability-range
 *
 * Returns available time slots for a date range (up to 14 days).
 * Optimized for VAPI tool calls to check multiple days at once.
 *
 * Response includes:
 * - Available dates with slot counts
 * - Next available date with times
 * - Summary for voice response
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

const logger = loggers.api.child("vapi-check-availability-range");

// Default VAPI assistant ID for clinic lookup
const DEFAULT_ASSISTANT_ID = "ae3e6a54-17a3-4915-9c3e-48779b5dbf09";

// --- Request Schema ---
const CheckAvailabilityRangeSchema = z.object({
  // VAPI context (for clinic lookup)
  assistant_id: z.string().optional().default(DEFAULT_ASSISTANT_ID),

  // Number of days to check (default: 14, max: 30)
  days_ahead: z.coerce.number().min(1).max(30).optional().default(14),

  // Optional: specific start date (YYYY-MM-DD, defaults to today)
  start_date: z.string().optional(),

  // Tracking
  vapi_call_id: z.string().optional(),
});

type CheckAvailabilityRangeInput = z.infer<typeof CheckAvailabilityRangeSchema>;

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
 * Day availability summary
 */
interface DayAvailability {
  date: string;
  formatted_date: string;
  day_of_week: string;
  total_slots: number;
  available_slots: number;
  earliest_time: string | null;
  latest_time: string | null;
  is_stale: boolean;
}

/**
 * Look up clinic by inbound or outbound assistant ID
 */
async function findClinicByAssistantId(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  assistantId: string,
) {
  // Try inbound first
  const { data: clinic } = await supabase
    .from("clinics")
    .select("id, name")
    .or(
      `inbound_assistant_id.eq.${assistantId},outbound_assistant_id.eq.${assistantId}`,
    )
    .single();

  if (!clinic) {
    logger.warn("Clinic not found for assistant_id", { assistantId });
    return null;
  }

  return clinic;
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
 * Format date for display
 */
function formatDateForDisplay(dateStr: string): {
  formatted: string;
  dayOfWeek: string;
} {
  const date = new Date(dateStr + "T12:00:00"); // Avoid timezone issues
  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
  return { formatted, dayOfWeek };
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
 * Handle POST request - check availability range
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    logger.info("Check availability range request received", {
      body: rawBody,
    });

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
    const validation = CheckAvailabilityRangeSchema.safeParse(body);
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
          message: "I couldn't understand the request. Please try again.",
        },
        toolCallId,
        400,
      );
    }

    const input: CheckAvailabilityRangeInput = validation.data;

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

    // Calculate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = input.start_date
      ? new Date(input.start_date + "T00:00:00")
      : new Date(today);

    if (startDate < today) {
      startDate.setTime(today.getTime());
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + input.days_ahead - 1);

    // Query availability for each date in range
    const availability: DayAvailability[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0]!;

      const { data: slots, error } = await supabase.rpc("get_available_slots", {
        p_clinic_id: clinic.id,
        p_date: dateStr,
      });

      if (!error && slots) {
        const typedSlots = slots as AvailableSlot[];
        const openSlots = typedSlots.filter(
          (slot) => !slot.is_blocked && slot.available_count > 0,
        );

        const { formatted, dayOfWeek } = formatDateForDisplay(dateStr);

        availability.push({
          date: dateStr,
          formatted_date: formatted,
          day_of_week: dayOfWeek,
          total_slots: typedSlots.length,
          available_slots: openSlots.length,
          earliest_time: openSlots.length > 0 ? openSlots[0]!.slot_start : null,
          latest_time:
            openSlots.length > 0
              ? openSlots[openSlots.length - 1]!.slot_start
              : null,
          is_stale: typedSlots.some((s) => s.is_stale),
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Find first available date
    const firstAvailable = availability.find((d) => d.available_slots > 0);

    // Get detailed slots for first available date
    let firstAvailableTimes: Array<{
      time: string;
      time_24h: string;
      slots_remaining: number;
    }> = [];

    if (firstAvailable) {
      const { data: detailedSlots } = await supabase.rpc(
        "get_available_slots",
        {
          p_clinic_id: clinic.id,
          p_date: firstAvailable.date,
        },
      );

      if (detailedSlots) {
        const openSlots = (detailedSlots as AvailableSlot[]).filter(
          (slot) => !slot.is_blocked && slot.available_count > 0,
        );
        firstAvailableTimes = openSlots.map((slot) => ({
          time: formatTime12Hour(slot.slot_start),
          time_24h: slot.slot_start,
          slots_remaining: slot.available_count,
        }));
      }
    }

    // Build summary
    const daysWithAvailability = availability.filter(
      (d) => d.available_slots > 0,
    );
    const totalAvailableSlots = availability.reduce(
      (sum, d) => sum + d.available_slots,
      0,
    );

    // Build human-readable message for VAPI
    let message: string;

    if (daysWithAvailability.length === 0) {
      message = `I'm sorry, there are no available appointments in the next ${input.days_ahead} days. Would you like me to take your information for a callback?`;
    } else if (firstAvailable) {
      const timeList = firstAvailableTimes
        .slice(0, 3)
        .map((t) => t.time)
        .join(", ");
      const moreCount =
        firstAvailableTimes.length > 3 ? firstAvailableTimes.length - 3 : 0;
      const moreText = moreCount > 0 ? ` and ${moreCount} more times` : "";

      message = `I have availability on ${firstAvailable.day_of_week}, ${firstAvailable.formatted_date}. Times include: ${timeList}${moreText}. We have ${daysWithAvailability.length} days with availability in the next ${input.days_ahead} days. Would you like to book one of these times?`;
    } else {
      message = `We have availability on ${daysWithAvailability.length} days over the next ${input.days_ahead} days. What day works best for you?`;
    }

    // Check overall data freshness
    const anyStale = availability.some((d) => d.is_stale);

    // Get most recent sync timestamp
    const { data: latestSync } = await supabase
      .from("schedule_syncs")
      .select("completed_at")
      .eq("clinic_id", clinic.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastSyncedAt = latestSync?.completed_at ?? null;
    const syncFreshnessMessage = anyStale
      ? "Note: Some schedule data may be slightly outdated. Please confirm final appointment details."
      : undefined;

    logger.info("Availability range check completed", {
      clinicId: clinic.id,
      daysChecked: input.days_ahead,
      daysWithAvailability: daysWithAvailability.length,
      totalSlots: totalAvailableSlots,
      isStale: anyStale,
      lastSyncedAt,
      toolCallId,
    });

    return buildVapiResponse(
      request,
      {
        available: daysWithAvailability.length > 0,
        date_range: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
          days_checked: input.days_ahead,
        },
        summary: {
          days_with_availability: daysWithAvailability.length,
          total_available_slots: totalAvailableSlots,
        },
        first_available: firstAvailable
          ? {
              date: firstAvailable.date,
              formatted_date: firstAvailable.formatted_date,
              day_of_week: firstAvailable.day_of_week,
              times: firstAvailableTimes.slice(0, 8), // Limit for response size
              total_times: firstAvailableTimes.length,
            }
          : null,
        availability: availability.map((d) => ({
          date: d.date,
          formatted_date: d.formatted_date,
          day_of_week: d.day_of_week,
          available_slots: d.available_slots,
          earliest_time: d.earliest_time
            ? formatTime12Hour(d.earliest_time)
            : null,
          latest_time: d.latest_time ? formatTime12Hour(d.latest_time) : null,
        })),
        data_freshness: {
          last_synced_at: lastSyncedAt,
          is_stale: anyStale,
          warning: syncFreshnessMessage,
        },
        message,
      },
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in check-availability-range", {
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
    message: "VAPI check-availability-range endpoint is active",
    endpoint: "/api/vapi/tools/check-availability-range",
    method: "POST",
    description:
      "Checks appointment availability for a date range (up to 14 days)",
    optional_fields: [
      "assistant_id",
      "days_ahead",
      "start_date",
      "vapi_call_id",
    ],
    defaults: {
      days_ahead: 14,
      start_date: "today",
    },
  });
}
