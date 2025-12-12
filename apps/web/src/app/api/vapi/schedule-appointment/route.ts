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

// --- Request Schema ---
const ScheduleAppointmentSchema = z.object({
  // VAPI context (for clinic lookup)
  assistant_id: z.string().min(1, "assistant_id is required"),

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
 * Handle POST request - submit appointment request
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = ScheduleAppointmentSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Validation failed", {
        errors: validation.error.format(),
      });
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: validation.error.format(),
          },
          { status: 400 },
        ),
      );
    }

    const input: ScheduleAppointmentInput = validation.data;

    // Get service client (bypasses RLS)
    const supabase = await createServiceClient();

    // Look up clinic by assistant_id
    const clinic = await findClinicByAssistantId(supabase, input.assistant_id);
    if (!clinic) {
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            success: false,
            error: "Clinic not found",
            message:
              "Unable to identify clinic from assistant_id. Please contact support.",
          },
          { status: 404 },
        ),
      );
    }

    // Parse date and time
    const requestedDate = parsePreferredDate(input.preferred_date);
    const requestedTime = parsePreferredTime(input.preferred_time);

    // Build appointment request record
    const appointmentRequest = {
      clinic_id: clinic.id,
      client_name: `${input.client_first_name} ${input.client_last_name}`,
      client_phone: input.client_phone,
      patient_name: input.patient_name,
      reason: input.reason_for_visit,
      requested_date: requestedDate?.toISOString().split("T")[0] ?? null,
      requested_start_time: requestedTime ?? "09:00:00", // Default to 9am if not specified
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
        : "09:30:00",
      status: "pending",
      vapi_call_id: input.vapi_call_id ?? null,
      metadata: {
        source: "vapi",
        species: input.species,
        breed: input.breed ?? null,
        is_new_client: input.is_new_client,
        is_outlier: input.is_outlier,
        notes: input.notes ?? null,
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
      return withCorsHeaders(
        request,
        NextResponse.json(
          {
            success: false,
            error: "Failed to save appointment request",
            message:
              "We couldn't save your appointment request. Please try again or call the clinic directly.",
          },
          { status: 500 },
        ),
      );
    }

    logger.info("Appointment request created", {
      requestId: inserted.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      patientName: input.patient_name,
      isNewClient: input.is_new_client,
    });

    // Return success response for VAPI
    return withCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        message: `Your appointment request has been submitted to ${clinic.name}. The clinic will contact you to confirm the appointment.`,
        appointment_request_id: inserted.id,
        clinic_name: clinic.name,
      }),
    );
  } catch (error) {
    logger.error("Unexpected error in schedule-appointment", {
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
    message: "VAPI schedule-appointment endpoint is active",
    endpoint: "/api/vapi/schedule-appointment",
    method: "POST",
    required_fields: [
      "assistant_id",
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
      "breed",
      "preferred_date",
      "preferred_time",
      "notes",
      "vapi_call_id",
    ],
  });
}
