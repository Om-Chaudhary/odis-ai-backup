/**
 * VAPI Check Availability Tool Endpoint
 *
 * POST /api/vapi/tools/check-availability
 *
 * STABILITY UPDATE:
 * - Inputs must be strictly ISO 8601 (YYYY-MM-DD).
 * - Natural language parsing has been removed to force LLM temporal reasoning.
 * - Timezone logic is now clinic-relative, not server-relative.
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
const DEFAULT_TIMEZONE = "America/Los_Angeles";

// --- Request Schema ---
const CheckAvailabilitySchema = z.object({
  // VAPI context (for clinic lookup)
  assistant_id: z.string().optional().default(DEFAULT_ASSISTANT_ID),

  // Direct clinic ID (for dev/testing - bypasses assistant lookup)
  clinic_id: z.string().uuid().optional(),

  // STRICT Date: YYYY-MM-DD only. No "tomorrow", "next tuesday", etc.
  date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date must be in YYYY-MM-DD format (e.g. 2024-05-21)",
    ),

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
 * Look up clinic by assistant ID using the mappings table
 */
async function findClinicByAssistantId(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  assistantId: string,
) {
  // First, try the new mappings table
  const { data: mapping, error: mappingError } = await supabase
    .from("vapi_assistant_mappings")
    .select("clinic_id, assistant_name, environment")
    .eq("assistant_id", assistantId)
    .eq("is_active", true)
    .single();

  if (mapping && !mappingError) {
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name, timezone") // Added timezone selection
      .eq("id", mapping.clinic_id)
      .single();

    if (clinic && !clinicError) {
      logger.info("Clinic found via assistant mapping", {
        assistantId,
        clinicId: clinic.id,
      });
      return clinic;
    }
  }

  // Fallback: check legacy inbound_assistant_id column
  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("id, name, timezone")
    .eq("inbound_assistant_id", assistantId)
    .single();

  if (error || !clinic) {
    logger.warn("Clinic not found for assistant_id", { assistantId, error });
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
      | Array<Record<string, unknown>>
      | undefined;
    if (toolCallList && toolCallList.length > 0) {
      const firstTool = toolCallList[0];
      return {
        arguments: firstTool?.function?.arguments
          ? typeof firstTool.function.arguments === "string"
            ? JSON.parse(firstTool.function.arguments)
            : firstTool.function.arguments
          : (firstTool?.parameters ?? {}),
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

      // Return a natural language error so the bot can self-correct immediately
      return buildVapiResponse(
        request,
        {
          available: false,
          error: "Invalid Date Format",
          message:
            "I need the date in YYYY-MM-DD format to check the calendar. For example, 2024-05-21.",
        },
        toolCallId,
        200, // Return 200 so Vapi speaks the message instead of crashing
      );
    }

    const input: CheckAvailabilityInput = validation.data;
    const supabase = await createServiceClient();

    // Look up clinic
    let clinic: { id: string; name: string; timezone?: string } | null = null;

    if (input.clinic_id) {
      const { data, error } = await supabase
        .from("clinics")
        .select("id, name, timezone")
        .eq("id", input.clinic_id)
        .single();
      if (!error && data) clinic = data;
    }

    clinic ??= await findClinicByAssistantId(supabase, input.assistant_id);

    if (!clinic) {
      return buildVapiResponse(
        request,
        {
          available: false,
          error: "Clinic not found",
          message:
            "I'm having trouble accessing the clinic schedule. Please try again later.",
        },
        toolCallId,
        404,
      );
    }

    // --- TIMEZONE SAFETY FIX ---
    // Prevent "Today" becoming "Tomorrow" due to UTC shift.
    // 1. Get 'now' in the clinic's timezone.
    const clinicTimezone = clinic.timezone ?? DEFAULT_TIMEZONE;
    const nowInClinic = new Date().toLocaleString("en-US", {
      timeZone: clinicTimezone,
    });

    // 2. Create 'today' object at 00:00:00 clinic time
    const todayClinic = new Date(nowInClinic);
    todayClinic.setHours(0, 0, 0, 0);

    // 3. Parse requested date as local time (YYYY-MM-DD -> Local Midnight)
    const [y, m, d] = input.date.split("-").map(Number);
    const requestedDate = new Date(y!, m! - 1, d); // Month is 0-indexed

    // 4. Compare
    if (requestedDate < todayClinic) {
      return buildVapiResponse(
        request,
        {
          available: false,
          error: "Past date",
          message: "I can only check availability for today or future dates.",
        },
        toolCallId,
      );
    }

    // Call the database function
    const { data: slots, error } = await supabase.rpc("get_available_slots", {
      p_clinic_id: clinic.id,
      p_date: input.date, // Pass strict ISO string directly
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
          message: "I'm having trouble seeing the calendar right now.",
        },
        toolCallId,
        500,
      );
    }

    const availableSlots = (slots as AvailableSlot[]) ?? [];
    const openSlots = availableSlots.filter(
      (slot) => !slot.is_blocked && slot.available_count > 0,
    );

    // Format Date for Voice Response
    const dateForVoice = requestedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    // Case 1: No slots found
    if (openSlots.length === 0) {
      return buildVapiResponse(
        request,
        {
          available: false,
          date: input.date,
          formatted_date: dateForVoice,
          times: [],
          message: `I don't have any appointments available on ${dateForVoice}. Would you like me to check the next day?`,
        },
        toolCallId,
      );
    }

    // Case 2: Slots found
    // Structure response for both "Booking Tool" (ISO) and "Voice" (Natural)
    const times = openSlots.map((slot) => ({
      time_12h: formatTime12Hour(slot.slot_start), // "2:00 PM"
      time_24h: slot.slot_start, // "14:00:00"
      value: slot.slot_start, // Strict value for next tool call
      slots_remaining: slot.available_count,
    }));

    const timeList = times
      .slice(0, 4)
      .map((t) => t.time_12h)
      .join(", ");

    return buildVapiResponse(
      request,
      {
        available: true,
        date: input.date,
        formatted_date: dateForVoice,
        count: times.length,
        times, // Pass full array so LLM can choose
        // Pre-calculated message reduces latency/hallucination
        message: `I have availability on ${dateForVoice}. Times include ${timeList}. Which works best?`,
      },
      toolCallId,
    );
  } catch (error) {
    logger.error("Unexpected error in check-availability", {
      error: error instanceof Error ? error.message : String(error),
    });

    return withCorsHeaders(
      request,
      NextResponse.json(
        {
          available: false,
          error: "Internal server error",
          message: "Something went wrong. Please try again.",
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
    status: "active",
    tool: "check-availability",
    schema: "strict-iso-8601",
    example: {
      date: "2024-12-25",
    },
  });
}
