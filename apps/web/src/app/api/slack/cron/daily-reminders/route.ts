import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "@odis-ai/db/server";
import { sendDailyReminders } from "@odis-ai/slack/scheduler";
import { ensureSlackClientInitialized } from "@odis-ai/slack";

/**
 * Daily Reminders Cron Endpoint
 *
 * POST /api/slack/cron/daily-reminders
 *
 * This endpoint is triggered by QStash cron every 15 minutes.
 * It sends reminder messages for Slack tasks scheduled in the current time window.
 *
 * Security: QStash signature verification ensures only QStash can trigger this
 *
 * QStash Schedule: "0 /15  *" (every 15 minutes)
 * Configure at: https://console.upstash.com/qstash
 */

/**
 * Handle daily reminder trigger
 */
async function handler(_req: NextRequest) {
  try {
    console.log("[SLACK_CRON] Daily reminders triggered");

    // Initialize Slack client (idempotent - needed for posting messages)
    ensureSlackClientInitialized();

    // Get Supabase service client (bypasses RLS)
    const supabase = await createServiceClient();

    // Send reminders for tasks due now
    const result = await sendDailyReminders(supabase);

    // Log summary
    console.log("[SLACK_CRON] Daily reminders complete", {
      success: result.success,
      channelsProcessed: result.channelsProcessed,
      tasksProcessed: result.tasksProcessed,
      messagesSent: result.messagesSent,
      errorCount: result.errors.length,
    });

    // Return 200 even on partial failures to prevent QStash retries
    // Individual errors are logged for debugging
    return NextResponse.json({
      success: result.success,
      channelsProcessed: result.channelsProcessed,
      tasksProcessed: result.tasksProcessed,
      messagesSent: result.messagesSent,
      errors: result.errors,
    });
  } catch (error) {
    console.error("[SLACK_CRON] Unexpected error in daily reminders", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
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
    message: "Slack daily reminders cron endpoint is active",
    schedule: "Every 15 minutes",
  });
}
