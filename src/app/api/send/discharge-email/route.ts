import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { sendEmailSchema } from "~/lib/validators/discharge";
import { isFutureTime } from "~/lib/utils/business-hours";
import { scheduleEmailExecution } from "~/lib/qstash/client";
import { getUser } from "~/server/actions/auth";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { normalizeEmail } from "~/lib/utils/phone";

/**
 * Apply test mode override for email if TEST_MODE is enabled
 * When test mode is active, all emails go to test email instead of real customer email
 */
function applyTestModeEmailOverride(
  recipientEmail: string | null | undefined
): string | null {
  // Check if test mode is enabled
  if (!env.TEST_MODE) {
    return recipientEmail ?? null;
  }

  console.log("[TEST_MODE] Enabled - Overriding email address", {
    originalEmail: recipientEmail,
    testEmail: env.TEST_EMAIL,
  });

  return env.TEST_EMAIL ?? recipientEmail ?? null;
}

/**
 * Authenticate user from either cookies (web app) or Authorization header (extension)
 */
async function authenticateRequest(request: NextRequest) {
  // Check for Authorization header (browser extension)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    // Create a Supabase client with the token
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No-op for token-based auth
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, supabase: null };
    }

    return { user, supabase };
  }

  // Fall back to cookie-based auth (web app)
  const user = await getUser();
  if (!user) {
    return { user: null, supabase: null };
  }

  const supabase = await createClient();
  return { user, supabase };
}

/**
 * Send Discharge Email API Route
 *
 * POST /api/send/discharge-email
 *
 * Schedules a discharge email for delivery via QStash.
 * The email content should be pre-generated using /api/generate/discharge-email.
 *
 * Request body:
 * {
 *   caseId?: string (uuid) - optional case reference
 *   recipientEmail: string - recipient email address
 *   recipientName?: string - recipient name
 *   subject: string - email subject line
 *   htmlContent: string - HTML email content
 *   textContent?: string - plain text version (optional)
 *   scheduledFor: Date - when to send the email
 *   metadata?: Record<string, any> - optional metadata
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     emailId: string
 *     scheduledFor: string
 *     qstashMessageId: string
 *     recipientEmail: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate from either cookies or Authorization header
    const { user, supabase } = await authenticateRequest(request);

    if (!user || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = sendEmailSchema.parse(body);

    // Apply test mode override if enabled (redirects to test email)
    const emailToUse = applyTestModeEmailOverride(validated.recipientEmail);

    // Normalize email address (lowercase, trim)
    const normalizedEmail = emailToUse
      ? normalizeEmail(emailToUse)
      : null;

    if (emailToUse && !normalizedEmail) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 },
      );
    }

    console.log("[SEND_EMAIL] Received request", {
      recipientEmail: normalizedEmail,
      originalEmail: validated.recipientEmail,
      recipientName: validated.recipientName,
      subject: validated.subject,
      scheduledFor: validated.scheduledFor.toISOString(),
      testModeEnabled: env.TEST_MODE,
    });

    // Validate scheduled time is in the future
    if (!isFutureTime(validated.scheduledFor)) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 },
      );
    }

    // Store scheduled email in database
    const { data: scheduledEmail, error: dbError } = await supabase
      .from("scheduled_discharge_emails")
      .insert({
        user_id: user.id,
        case_id: validated.caseId ?? null,
        recipient_email: normalizedEmail,
        recipient_name: validated.recipientName ?? null,
        subject: validated.subject,
        html_content: validated.htmlContent,
        text_content: validated.textContent ?? null,
        scheduled_for: validated.scheduledFor,
        status: "queued",
        metadata: validated.metadata ?? {},
      })
      .select()
      .single();

    if (dbError) {
      console.error("[SEND_EMAIL] Database error", {
        error: dbError,
      });
      return NextResponse.json(
        { error: "Failed to create scheduled email" },
        { status: 500 },
      );
    }

    // Enqueue job in QStash
    let qstashMessageId: string;
    try {
      qstashMessageId = await scheduleEmailExecution(
        scheduledEmail.id,
        validated.scheduledFor,
      );
    } catch (qstashError) {
      console.error("[SEND_EMAIL] QStash error", {
        error: qstashError,
      });

      // Rollback database insert
      await supabase
        .from("scheduled_discharge_emails")
        .delete()
        .eq("id", scheduledEmail.id);

      return NextResponse.json(
        { error: "Failed to schedule email delivery" },
        { status: 500 },
      );
    }

    // Update database with QStash message ID
    await supabase
      .from("scheduled_discharge_emails")
      .update({
        qstash_message_id: qstashMessageId,
      })
      .eq("id", scheduledEmail.id);

    console.log("[SEND_EMAIL] Email scheduled successfully", {
      emailId: scheduledEmail.id,
      scheduledFor: validated.scheduledFor.toISOString(),
      qstashMessageId,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        emailId: scheduledEmail.id,
        scheduledFor: validated.scheduledFor.toISOString(),
        qstashMessageId,
        recipientEmail: normalizedEmail,
        recipientName: validated.recipientName,
        subject: validated.subject,
      },
    });
  } catch (error) {
    console.error("[SEND_EMAIL] Error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
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
    message: "Send discharge email endpoint is active",
  });
}
