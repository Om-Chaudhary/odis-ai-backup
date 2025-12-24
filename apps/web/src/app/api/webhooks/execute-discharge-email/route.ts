import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "@odis-ai/data-access/db/server";

// Dynamic import to avoid bundling issues during static generation
async function getEmailExecutor() {
  const { executeScheduledEmail } =
    await import("@odis-ai/domain/discharge/email-executor");
  return executeScheduledEmail;
}

/**
 * Execute Discharge Email Webhook
 *
 * POST /api/webhooks/execute-discharge-email
 *
 * This webhook is triggered by QStash at the scheduled time.
 * It delegates to the email executor service for actual execution.
 *
 * Security: QStash signature verification ensures only QStash can trigger this
 */

interface ExecuteEmailPayload {
  emailId: string;
}

/**
 * Handle execution of scheduled email
 */
async function handler(req: NextRequest) {
  try {
    console.log("[EXECUTE_EMAIL] Webhook triggered");

    // Parse request body
    const payload = (await req.json()) as ExecuteEmailPayload;
    const { emailId } = payload;

    if (!emailId) {
      console.error("[EXECUTE_EMAIL] Missing emailId in payload");
      return NextResponse.json(
        { error: "Missing emailId in payload" },
        { status: 400 },
      );
    }

    // Get Supabase service client and executor
    const supabase = await createServiceClient();
    const executeScheduledEmail = await getEmailExecutor();

    // Execute the email using the modular executor
    const result = await executeScheduledEmail(emailId, supabase);

    // Return 200 even on failure to prevent QStash retries
    // (email failures would likely fail again on retry)
    return NextResponse.json(result);
  } catch (error) {
    console.error("[EXECUTE_EMAIL] Unexpected error", {
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
    message: "Execute discharge email webhook is active",
  });
}
