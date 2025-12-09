import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "@odis-ai/db/server";
import { sendDischargeEmail } from "@odis-ai/resend/client";

/**
 * Execute Discharge Email Webhook
 *
 * POST /api/webhooks/execute-discharge-email
 *
 * This webhook is triggered by QStash at the scheduled time.
 * It sends the discharge email via Resend.
 *
 * Security: QStash signature verification is critical
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

    console.log("[EXECUTE_EMAIL] Processing email", { emailId });

    // Get Supabase service client (bypass RLS)
    const supabase = await createServiceClient();

    // Fetch scheduled email from database
    const { data: email, error } = await supabase
      .from("scheduled_discharge_emails")
      .select("*")
      .eq("id", emailId)
      .single();

    if (error || !email) {
      console.error("[EXECUTE_EMAIL] Email not found", {
        emailId,
        error,
      });
      return NextResponse.json(
        { error: "Scheduled email not found" },
        { status: 404 },
      );
    }

    // Check if email is still in queued status (prevent double execution)
    if (email.status !== "queued") {
      console.warn("[EXECUTE_EMAIL] Email already processed", {
        emailId,
        status: email.status,
      });
      return NextResponse.json({
        success: true,
        message: "Email already processed",
        status: email.status,
      });
    }

    console.log("[EXECUTE_EMAIL] Sending email via Resend", {
      emailId,
      recipientEmail: email.recipient_email,
      subject: email.subject,
    });

    // Send email via Resend
    const { data: resendData, error: resendError } = await sendDischargeEmail({
      to: email.recipient_email,
      subject: email.subject,
      html: email.html_content,
      text: email.text_content ?? undefined,
    });

    if (resendError || !resendData) {
      const errorMessage = resendError?.message ?? "Unknown error";

      console.error("[EXECUTE_EMAIL] Resend error", {
        emailId,
        error: resendError,
      });

      // Update database with failure status
      await supabase
        .from("scheduled_discharge_emails")
        .update({
          status: "failed",
          metadata: {
            ...(email.metadata as Record<string, unknown>),
            error: errorMessage,
            failed_at: new Date().toISOString(),
          },
        })
        .eq("id", emailId);

      // Return 200 to prevent QStash from retrying - we've handled this failure
      // Email failures (invalid address, API issues) would likely fail again on retry
      return NextResponse.json({
        success: false,
        message: "Failed to send email",
        error: errorMessage,
        emailId,
      });
    }

    console.log("[EXECUTE_EMAIL] Email sent successfully", {
      emailId,
      resendEmailId: resendData.id,
    });

    // Update database with success status
    await supabase
      .from("scheduled_discharge_emails")
      .update({
        status: "sent",
        sent_at: new Date(),
        resend_email_id: resendData.id ?? null,
        metadata: {
          ...(email.metadata as Record<string, unknown>),
          sent_at: new Date().toISOString(),
        },
      })
      .eq("id", emailId);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      resendEmailId: resendData.id,
    });
  } catch (error) {
    console.error("[EXECUTE_EMAIL] Error", {
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
