import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "@odis-ai/db/server";

// Dynamic import to avoid bundling issues during static generation
async function getCallExecutor() {
  const { executeScheduledCall } =
    await import("@odis-ai/services-discharge/call-executor");
  return executeScheduledCall;
}

/**
 * Execute Call Webhook
 *
 * POST /api/webhooks/execute-call
 *
 * This webhook is triggered by QStash at the scheduled time.
 * It delegates to the call executor service for actual execution.
 *
 * Security: QStash signature verification ensures only QStash can trigger this
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

    // Get Supabase service client and executor
    const supabase = await createServiceClient();
    const executeScheduledCall = await getCallExecutor();

    // Execute the call using the modular executor
    const result = await executeScheduledCall(callId, supabase);

    // Return 200 even on failure to prevent QStash retries
    // (VAPI failures would likely fail again on retry)
    return NextResponse.json(result);
  } catch (error) {
    console.error("[EXECUTE_CALL] Unexpected error", {
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
