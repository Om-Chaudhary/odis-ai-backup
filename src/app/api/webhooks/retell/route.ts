import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import type { RetellCallResponse } from "~/lib/retell/client";

/**
 * Retell AI Webhook Handler
 *
 * Receives real-time notifications from Retell AI when call events occur.
 * Events: call_started, call_ended
 *
 * Documentation: https://docs.retellai.com/features/webhook-overview
 */

interface RetellWebhookPayload {
  event: "call_started" | "call_ended";
  call: RetellCallResponse;
}

/**
 * Verify webhook signature from Retell AI
 */
function verifySignature(request: NextRequest): boolean {
  const signature = request.headers.get("x-retell-signature");
  const apiKey = process.env.RETELL_API_KEY;

  if (!signature || !apiKey) {
    return false;
  }

  // Retell sends the API key as the signature
  return signature === apiKey;
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
 * Handle incoming webhook from Retell AI
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable signature verification after setting RETELL_API_KEY in Vercel
    // if (!verifySignature(request)) {
    //   console.error("Invalid webhook signature");
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // Parse webhook payload
    const payload = (await request.json()) as RetellWebhookPayload;
    const { event, call } = payload;

    console.log(`Received Retell webhook: ${event} for call ${call.call_id}`);

    // Get Supabase client
    const supabase = await createClient();

    // Find the call in our database by Retell call ID
    const { data: existingCall, error: findError } = await supabase
      .from("retell_calls")
      .select("id")
      .eq("retell_call_id", call.call_id)
      .single();

    if (findError || !existingCall) {
      console.error(`Call not found in database: ${call.call_id}`, findError);
      // Still return 200 to prevent retries
      return NextResponse.json({
        success: false,
        message: "Call not found in database",
      });
    }

    // Calculate duration if timestamps are available
    const durationSeconds =
      call.end_timestamp && call.start_timestamp
        ? call.end_timestamp - call.start_timestamp
        : null;

    // Map status
    const mappedStatus = mapRetellStatus(call.call_status);

    // Prepare update data based on event type
    const updateData: Record<string, unknown> = {
      status: mappedStatus,
      retell_response: call as unknown,
    };

    if (event === "call_started") {
      // Update with start timestamp and ongoing status
      updateData.start_timestamp = call.start_timestamp
        ? new Date(call.start_timestamp * 1000).toISOString()
        : null;
      updateData.status = "in_progress";
    }

    if (event === "call_ended") {
      // Update with complete call data
      updateData.end_timestamp = call.end_timestamp
        ? new Date(call.end_timestamp * 1000).toISOString()
        : null;
      updateData.duration_seconds = durationSeconds;
      updateData.recording_url = call.recording_url ?? null;
      updateData.transcript = call.transcript ?? null;
      updateData.transcript_object = call.transcript_object
        ? (call.transcript_object as unknown)
        : null;
      updateData.call_analysis = call.call_analysis
        ? (call.call_analysis as unknown)
        : null;
      updateData.disconnection_reason = call.disconnection_reason ?? null;
      updateData.public_log_url = call.public_log_url ?? null;

      // Map final status based on disconnection reason
      if (call.disconnection_reason === "user_hangup") {
        updateData.status = "completed";
      } else if (
        [
          "dial_failed",
          "dial_no_answer",
          "dial_busy",
          "error_inbound_webhook",
        ].includes(call.disconnection_reason ?? "")
      ) {
        updateData.status = "failed";
      }
    }

    // Update the call in database
    const { error: updateError } = await supabase
      .from("retell_calls")
      .update(updateData)
      .eq("id", existingCall.id);

    if (updateError) {
      console.error("Error updating call in database:", updateError);
      return NextResponse.json(
        { error: "Failed to update call" },
        { status: 500 },
      );
    }

    console.log(
      `Successfully processed ${event} for call ${call.call_id} - Status: ${String(updateData.status)}`,
    );

    // Return success response
    return NextResponse.json({
      success: true,
      event,
      call_id: call.call_id,
      status: updateData.status,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    message: "Retell webhook endpoint is active",
  });
}
