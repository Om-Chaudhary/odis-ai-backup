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

const logger = loggers.api.child("vapi-leave-message");

// --- Request Schema ---
const LeaveMessageSchema = z.object({
  // VAPI context (for clinic lookup)
  assistant_id: z.string().min(1, "assistant_id is required"),

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
 * Handle POST request - leave a message
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = LeaveMessageSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Validation failed", {
        errors: validation.error.format(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const input: LeaveMessageInput = validation.data;

    // Get service client (bypasses RLS)
    const supabase = await createServiceClient();

    // Look up clinic by assistant_id
    const clinic = await findClinicByAssistantId(supabase, input.assistant_id);
    if (!clinic) {
      return NextResponse.json(
        {
          success: false,
          error: "Clinic not found",
          message:
            "Unable to identify clinic from assistant_id. Please contact support.",
        },
        { status: 404 },
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
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save message",
          message:
            "We couldn't save your message. Please try again or call the clinic directly.",
        },
        { status: 500 },
      );
    }

    logger.info("Clinic message created", {
      messageId: inserted.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      isUrgent: input.is_urgent,
      hasPetName: !!input.pet_name,
    });

    // Return success response for VAPI
    const urgentNote = input.is_urgent
      ? " This has been marked as urgent and will be prioritized."
      : "";

    return NextResponse.json({
      success: true,
      message: `Your message has been recorded and ${clinic.name} will call you back as soon as possible.${urgentNote}`,
      message_id: inserted.id,
      clinic_name: clinic.name,
      priority: input.is_urgent ? "urgent" : "normal",
    });
  } catch (error) {
    logger.error("Unexpected error in leave-message", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          "Something went wrong. Please try again or call the clinic directly.",
      },
      { status: 500 },
    );
  }
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
    required_fields: [
      "assistant_id",
      "client_name",
      "client_phone",
      "message",
      "is_urgent",
    ],
    optional_fields: ["pet_name", "vapi_call_id"],
  });
}
