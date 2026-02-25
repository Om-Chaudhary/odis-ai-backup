/**
 * Email Executor
 *
 * Core execution logic for scheduled discharge emails.
 * Decoupled from HTTP handling to enable direct invocation in test mode
 * or via webhook in normal mode.
 *
 * @module @odis-ai/domain/discharge/email-executor
 */

import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { EmailExecutionResult } from "../types";
import { sendDischargeEmail } from "@odis-ai/integrations/resend/client";
import { isBlockedExtremeCase } from "@odis-ai/shared/util/discharge-readiness";

/* ========================================
   Main Executor Function
   ======================================== */

/**
 * Execute a scheduled discharge email
 *
 * This is the core execution logic, decoupled from HTTP handling.
 * Can be called directly (test mode) or via webhook (normal mode).
 *
 * @param emailId - The scheduled email ID from the database
 * @param supabase - Supabase client instance
 * @returns Execution result with success status and email details
 */
export async function executeScheduledEmail(
  emailId: string,
  supabase: SupabaseClientType,
): Promise<EmailExecutionResult> {
  console.log("[EMAIL_EXECUTOR] Starting execution", { emailId });

  // 1. Fetch scheduled email from database
  const { data: email, error } = await supabase
    .from("scheduled_discharge_emails")
    .select("*")
    .eq("id", emailId)
    .single();

  if (error || !email) {
    console.error("[EMAIL_EXECUTOR] Email not found", { emailId, error });
    return { success: false, emailId, error: "Scheduled email not found" };
  }

  // 2. Check status (prevent double execution)
  if (email.status !== "queued") {
    console.warn("[EMAIL_EXECUTOR] Email already processed", {
      emailId,
      status: email.status,
    });
    return {
      success: true,
      emailId,
      alreadyProcessed: true,
    };
  }

  // 2b. CRITICAL: Last-resort check for blocked extreme cases (euthanasia, deceased)
  // This catches cases where clinical notes were updated AFTER email was scheduled
  if (email.case_id) {
    try {
      const { data: caseData } = await supabase
        .from("cases")
        .select("metadata")
        .eq("id", email.case_id)
        .single();

      if (caseData?.metadata) {
        const metadata = caseData.metadata as Record<string, unknown>;
        const blockedCheck = isBlockedExtremeCase({
          caseType: (metadata.entities as Record<string, unknown>)?.caseType as
            | string
            | undefined,
          dischargeSummary: null,
          consultationNotes: null,
          metadata,
        });

        if (blockedCheck.blocked) {
          console.warn(
            "[EMAIL_EXECUTOR] Blocked extreme case detected at execution time",
            { emailId, caseId: email.case_id, reason: blockedCheck.reason },
          );
          await supabase
            .from("scheduled_discharge_emails")
            .update({
              status: "cancelled",
              metadata: {
                ...(email.metadata as Record<string, unknown>),
                blocked_reason: blockedCheck.reason,
                cancelled_at: new Date().toISOString(),
              },
            })
            .eq("id", emailId);
          return {
            success: false,
            emailId,
            error: `Blocked: ${blockedCheck.reason}`,
          };
        }
      }
    } catch (blockCheckError) {
      console.warn("[EMAIL_EXECUTOR] Failed to check blocked status", {
        emailId,
        error:
          blockCheckError instanceof Error
            ? blockCheckError.message
            : String(blockCheckError),
      });
      // Continue with sending - don't block on check failure
    }
  }

  console.log("[EMAIL_EXECUTOR] Sending email via Resend", {
    emailId,
    recipientEmail: email.recipient_email,
    subject: email.subject,
  });

  // 3. Send via Resend
  const { data: resendData, error: resendError } = await sendDischargeEmail({
    to: email.recipient_email,
    subject: email.subject,
    html: email.html_content,
    text: email.text_content ?? undefined,
  });

  if (resendError || !resendData) {
    const errorMessage = resendError?.message ?? "Unknown error";

    console.error("[EMAIL_EXECUTOR] Resend error", {
      emailId,
      error: errorMessage,
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

    // Update auto-scheduled item status if applicable
    try {
      // eslint-disable-next-line @nx/enforce-module-boundaries -- Dynamic import avoids build-time circular dependency
      const { updateAutoScheduledItemStatus } = await import(
        "@odis-ai/domain/auto-scheduling"
      );
      await updateAutoScheduledItemStatus(supabase, {
        scheduledEmailId: emailId,
        status: "failed",
      });
    } catch (autoScheduleError) {
      // Log but don't fail - auto-scheduling tracking is optional
      console.warn("[EMAIL_EXECUTOR] Failed to update auto-scheduled item status", {
        emailId,
        error:
          autoScheduleError instanceof Error
            ? autoScheduleError.message
            : String(autoScheduleError),
      });
    }

    return { success: false, emailId, error: errorMessage };
  }

  console.log("[EMAIL_EXECUTOR] Email sent successfully", {
    emailId,
    resendEmailId: resendData.id,
  });

  // 4. Update database with success status
  await supabase
    .from("scheduled_discharge_emails")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      resend_email_id: resendData.id ?? null,
      metadata: {
        ...(email.metadata as Record<string, unknown>),
        sent_at: new Date().toISOString(),
      },
    })
    .eq("id", emailId);

  // 5. Update auto-scheduled item status if applicable
  try {
    // eslint-disable-next-line @nx/enforce-module-boundaries -- Dynamic import avoids build-time circular dependency
    const { updateAutoScheduledItemStatus } = await import(
      "@odis-ai/domain/auto-scheduling"
    );
    await updateAutoScheduledItemStatus(supabase, {
      scheduledEmailId: emailId,
      status: "completed",
    });
  } catch (autoScheduleError) {
    // Log but don't fail - auto-scheduling tracking is optional
    console.warn("[EMAIL_EXECUTOR] Failed to update auto-scheduled item status", {
      emailId,
      error:
        autoScheduleError instanceof Error
          ? autoScheduleError.message
          : String(autoScheduleError),
    });
  }

  return {
    success: true,
    emailId,
    resendEmailId: resendData.id,
  };
}
