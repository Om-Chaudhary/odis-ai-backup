import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "~/lib/supabase/server";
import { createPhoneCall } from "~/lib/retell/client";
import {
  isWithinBusinessHours,
  getNextBusinessHourSlot,
} from "~/lib/utils/business-hours";
import { scheduleCallExecution } from "~/lib/qstash/client";

/**
 * Execute Call Webhook
 *
 * POST /api/webhooks/execute-call
 *
 * This webhook is triggered by QStash at the scheduled time.
 * It executes the scheduled call via Retell AI.
 *
 * Security: QStash signature verification is critical
 */

interface ExecuteCallPayload {
  callId: string;
}

/**
 * Map Retell API status to our database status
 */
function mapRetellStatus(retellStatus: string | undefined): string {
  if (!retellStatus) return "initiated";

  const statusMap: Record<string, string> = {
    registered: "initiated",
    ongoing: "in_progress",
    active: "in_progress",
    ended: "completed",
    error: "failed",
  };

  const lowerStatus = retellStatus.toLowerCase();
  return statusMap[lowerStatus] ?? lowerStatus;
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
      .from("retell_calls")
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

    // Check if call is still in scheduled status (prevent double execution)
    if (call.status !== "scheduled") {
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
    const scheduledTime = new Date(
      (metadata?.scheduled_for as string) ?? new Date(),
    );
    const timezone = (metadata?.timezone as string) ?? "America/Los_Angeles";

    console.log("[EXECUTE_CALL] Checking business hours", {
      callId,
      scheduledTime: scheduledTime.toISOString(),
      timezone,
    });

    // Check if current time is within business hours
    const now = new Date();
    if (!isWithinBusinessHours(now, timezone)) {
      console.log("[EXECUTE_CALL] Outside business hours, rescheduling", {
        callId,
        currentTime: now.toISOString(),
      });

      // Reschedule to next available slot
      const nextSlot = getNextBusinessHourSlot(now, timezone);

      // Update database
      await supabase
        .from("retell_calls")
        .update({
          metadata: {
            ...metadata,
            scheduled_for: nextSlot.toISOString(),
            rescheduled_reason: "outside_business_hours",
            rescheduled_count:
              ((metadata?.rescheduled_count as number) ?? 0) + 1,
          },
        })
        .eq("id", callId);

      // Re-enqueue in QStash
      const messageId = await scheduleCallExecution(callId, nextSlot);

      console.log("[EXECUTE_CALL] Rescheduled successfully", {
        callId,
        nextScheduledFor: nextSlot.toISOString(),
        qstashMessageId: messageId,
      });

      return NextResponse.json({
        success: true,
        message: "Rescheduled to next business hour",
        nextScheduledFor: nextSlot.toISOString(),
        qstashMessageId: messageId,
      });
    }

    // Execute call via Retell API
    const fromNumber = process.env.RETELL_FROM_NUMBER;
    const agentId = call.agent_id ?? process.env.RETELL_AGENT_ID;

    if (!fromNumber) {
      console.error("[EXECUTE_CALL] Missing RETELL_FROM_NUMBER");
      return NextResponse.json(
        { error: "Missing from_number configuration" },
        { status: 500 },
      );
    }

    if (!agentId) {
      console.error("[EXECUTE_CALL] Missing agent_id");
      return NextResponse.json(
        { error: "Missing agent_id configuration" },
        { status: 500 },
      );
    }

    console.log("[EXECUTE_CALL] Calling Retell API", {
      callId,
      phoneNumber: call.phone_number,
      agentId,
    });

    const response = await createPhoneCall({
      from_number: fromNumber,
      to_number: call.phone_number,
      override_agent_id: agentId,
      retell_llm_dynamic_variables: call.call_variables,
      metadata: call.metadata,
      retries_on_no_answer: 2,
    });

    console.log("[EXECUTE_CALL] Retell API success", {
      callId,
      retellCallId: response.call_id,
      status: response.call_status,
    });

    // Update database with Retell response
    await supabase
      .from("retell_calls")
      .update({
        retell_call_id: response.call_id,
        agent_id: response.agent_id,
        status: mapRetellStatus(response.call_status),
        start_timestamp: response.start_timestamp
          ? new Date(response.start_timestamp * 1000).toISOString()
          : null,
        retell_response: response as unknown,
        metadata: {
          ...metadata,
          executed_at: new Date().toISOString(),
        },
      })
      .eq("id", callId);

    return NextResponse.json({
      success: true,
      message: "Call executed successfully",
      retellCallId: response.call_id,
      status: response.call_status,
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
