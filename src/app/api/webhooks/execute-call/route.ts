import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "~/lib/supabase/server";
import { createPhoneCall } from "~/lib/vapi/client";
import { mapVapiStatus } from "~/lib/vapi/client";

/**
 * Execute Call Webhook
 *
 * POST /api/webhooks/execute-call
 *
 * This webhook is triggered by QStash at the scheduled time.
 * It executes the scheduled call via VAPI.
 *
 * Security: QStash signature verification is critical
 */

interface ExecuteCallPayload {
  callId: string;
}

/**
 * Handle execution of scheduled call
 */
async function handler(req: NextRequest) {
  try {
    console.log("[EXECUTE_CALL] Webhook triggered");

    // Parse request body
    const payload = (await req.json()) as ExecuteCallPayload;
    const { callId } = payload;

    if (!callId) {
      console.error("[EXECUTE_CALL] Missing callId in payload");
      return NextResponse.json(
        { error: "Missing callId in payload" },
        { status: 400 },
      );
    }

    console.log("[EXECUTE_CALL] Processing call", { callId });

    // Get Supabase service client (bypass RLS)
    const supabase = await createServiceClient();

    // Fetch scheduled call from database
    const { data: call, error } = await supabase
      .from("vapi_calls")
      .select("*")
      .eq("id", callId)
      .single();

    if (error || !call) {
      console.error("[EXECUTE_CALL] Call not found", {
        callId,
        error,
      });
      return NextResponse.json(
        { error: "Scheduled call not found" },
        { status: 404 },
      );
    }

    // Check if call is still in queued status (prevent double execution)
    if (call.status !== "queued") {
      console.warn("[EXECUTE_CALL] Call already processed", {
        callId,
        status: call.status,
      });
      return NextResponse.json({
        success: true,
        message: "Call already processed",
        status: call.status,
      });
    }

    // Get metadata
    const metadata = call.metadata as Record<string, unknown> | null;

    // Get VAPI configuration
    const assistantId = call.assistant_id;
    const phoneNumberId = call.phone_number_id;

    if (!assistantId) {
      console.error("[EXECUTE_CALL] Missing assistant_id");
      return NextResponse.json(
        { error: "Missing assistant_id configuration" },
        { status: 500 },
      );
    }

    if (!phoneNumberId) {
      console.error("[EXECUTE_CALL] Missing phone_number_id");
      return NextResponse.json(
        { error: "Missing phone_number_id configuration" },
        { status: 500 },
      );
    }

    console.log("[EXECUTE_CALL] Calling VAPI API", {
      callId,
      phoneNumber: call.customer_phone,
      assistantId,
      phoneNumberId,
    });

    // Execute call via VAPI
    const response = await createPhoneCall({
      phoneNumber: call.customer_phone,
      assistantId,
      phoneNumberId,
      assistantOverrides: {
        variableValues: call.dynamic_variables as Record<string, unknown>,
      },
    });

    console.log("[EXECUTE_CALL] VAPI API success", {
      callId,
      vapiCallId: response.id,
      status: response.status,
    });

    // Update database with VAPI response
    await supabase
      .from("vapi_calls")
      .update({
        vapi_call_id: response.id,
        status: mapVapiStatus(response.status),
        started_at: response.startedAt ? response.startedAt : null,
        metadata: {
          ...metadata,
          executed_at: new Date().toISOString(),
        },
      })
      .eq("id", callId);

    return NextResponse.json({
      success: true,
      message: "Call executed successfully",
      vapiCallId: response.id,
      status: response.status,
    });
  } catch (error) {
    console.error("[EXECUTE_CALL] Error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Wrap handler with QStash signature verification
export const POST = verifySignatureAppRouter(handler);

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Execute call webhook is active",
  });
}
