/**
 * Retry Failed Delivery Procedure
 *
 * Retries failed call and/or email for a case.
 */

import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import {
  getClinicUserIds,
  getClinicByUserId,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { retryFailedDeliveryInput } from "../schemas";

const CALL_RETRY_DELAY_MS = 2 * 60 * 1000;
const EMAIL_RETRY_DELAY_MS = 3 * 1000; // 3 seconds for email rate limiting
const DEFAULT_MAX_RETRIES = 3;

// Dynamic import for lazy-loaded qstash
const getQStash = () => import("@odis-ai/integrations/qstash");

interface RetryResult {
  callRetried: boolean;
  emailRetried: boolean;
}

interface ClinicScope {
  clinicId: string | undefined;
  userIds: string[];
}

async function findFailedCall(
  supabase: SupabaseClient<Database>,
  caseId: string,
  scope: ClinicScope,
): Promise<
  Database["public"]["Tables"]["scheduled_discharge_calls"]["Row"] | null
> {
  const { data, error } = await supabase
    .from("scheduled_discharge_calls")
    .select("*")
    .eq("case_id", caseId)
    .or(buildClinicScopeFilter(scope.clinicId, scope.userIds))
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.warn("[Retry] No failed call found for case:", caseId);
    return null;
  }

  return data;
}

async function findFailedEmail(
  supabase: SupabaseClient<Database>,
  caseId: string,
  scope: ClinicScope,
): Promise<
  Database["public"]["Tables"]["scheduled_discharge_emails"]["Row"] | null
> {
  const { data, error } = await supabase
    .from("scheduled_discharge_emails")
    .select("*")
    .eq("case_id", caseId)
    .or(buildClinicScopeFilter(scope.clinicId, scope.userIds))
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.warn("[Retry] No failed email found for case:", caseId);
    return null;
  }

  return data;
}

async function retryCall(
  supabase: SupabaseClient<Database>,
  caseId: string,
  scope: ClinicScope,
): Promise<boolean> {
  const failedCall = await findFailedCall(supabase, caseId, scope);
  if (!failedCall) {
    return false;
  }

  const metadata = (failedCall.metadata as Record<string, unknown>) ?? {};
  const retryCount = (metadata.retry_count as number) ?? 0;
  const maxRetries = (metadata.max_retries as number) ?? DEFAULT_MAX_RETRIES;

  if (retryCount >= maxRetries) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Maximum retry attempts (${maxRetries}) reached for this call`,
    });
  }

  // Query latest queued call to respect global queue staggering
  const { data: latestQueuedCall } = await supabase
    .from("scheduled_discharge_calls")
    .select("scheduled_for")
    .eq("status", "queued")
    .or(buildClinicScopeFilter(scope.clinicId, scope.userIds))
    .order("scheduled_for", { ascending: false })
    .limit(1)
    .single();

  // Calculate scheduled time: 2 min after latest queued OR 2 min from now (whichever is later)
  const minScheduleTime = new Date(Date.now() + CALL_RETRY_DELAY_MS);
  const afterLatestQueued = latestQueuedCall?.scheduled_for
    ? new Date(
        new Date(latestQueuedCall.scheduled_for).getTime() +
          CALL_RETRY_DELAY_MS,
      )
    : minScheduleTime;
  const newScheduledFor =
    afterLatestQueued > minScheduleTime ? afterLatestQueued : minScheduleTime;

  // Update database with new scheduled time
  const { error: updateError } = await supabase
    .from("scheduled_discharge_calls")
    .update({
      status: "queued",
      scheduled_for: newScheduledFor.toISOString(),
      metadata: {
        ...metadata,
        retry_count: retryCount + 1,
        last_retry_at: new Date().toISOString(),
      },
    })
    .eq("id", failedCall.id);

  if (updateError) {
    console.error("[Retry] Failed to update call:", updateError);
    return false;
  }

  // Schedule via QStash
  try {
    const { scheduleCallExecution } = await getQStash();
    const qstashMessageId = await scheduleCallExecution(
      failedCall.id,
      newScheduledFor,
    );

    // Update with new QStash message ID
    const { error: qstashUpdateError } = await supabase
      .from("scheduled_discharge_calls")
      .update({ qstash_message_id: qstashMessageId })
      .eq("id", failedCall.id);

    if (qstashUpdateError) {
      console.error(
        "[Retry] Failed to update QStash message ID:",
        qstashUpdateError,
      );
      // Don't fail the entire operation if just the message ID update fails
    }

    console.log("[Retry] Call successfully scheduled for retry", {
      callId: failedCall.id,
      scheduledFor: newScheduledFor.toISOString(),
      qstashMessageId,
    });

    return true;
  } catch (qstashError) {
    console.error("[Retry] Failed to schedule call via QStash:", qstashError);

    // Rollback: set status back to failed since QStash scheduling failed
    await supabase
      .from("scheduled_discharge_calls")
      .update({
        status: "failed",
        metadata: {
          ...metadata,
          retry_count: retryCount, // Reset retry count
        },
      })
      .eq("id", failedCall.id);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to schedule call retry. Please try again.",
    });
  }
}

async function retryEmail(
  supabase: SupabaseClient<Database>,
  caseId: string,
  scope: ClinicScope,
): Promise<boolean> {
  const failedEmail = await findFailedEmail(supabase, caseId, scope);
  if (!failedEmail) {
    return false;
  }

  // Query latest queued email to respect global queue staggering
  const { data: latestQueuedEmail } = await supabase
    .from("scheduled_discharge_emails")
    .select("scheduled_for")
    .eq("status", "queued")
    .or(buildClinicScopeFilter(scope.clinicId, scope.userIds))
    .order("scheduled_for", { ascending: false })
    .limit(1)
    .single();

  // Calculate scheduled time: 3 seconds after latest queued OR 3 seconds from now (whichever is later)
  const minScheduleTime = new Date(Date.now() + EMAIL_RETRY_DELAY_MS);
  const afterLatestQueued = latestQueuedEmail?.scheduled_for
    ? new Date(
        new Date(latestQueuedEmail.scheduled_for).getTime() +
          EMAIL_RETRY_DELAY_MS,
      )
    : minScheduleTime;
  const newScheduledFor =
    afterLatestQueued > minScheduleTime ? afterLatestQueued : minScheduleTime;

  // Update database with new scheduled time
  const { error: updateError } = await supabase
    .from("scheduled_discharge_emails")
    .update({
      status: "queued",
      scheduled_for: newScheduledFor.toISOString(),
    })
    .eq("id", failedEmail.id);

  if (updateError) {
    console.error("[Retry] Failed to update email:", updateError);
    return false;
  }

  // Schedule via QStash
  try {
    const { scheduleEmailExecution } = await getQStash();
    const qstashMessageId = await scheduleEmailExecution(
      failedEmail.id,
      newScheduledFor,
    );

    // Update with new QStash message ID
    const { error: qstashUpdateError } = await supabase
      .from("scheduled_discharge_emails")
      .update({ qstash_message_id: qstashMessageId })
      .eq("id", failedEmail.id);

    if (qstashUpdateError) {
      console.error(
        "[Retry] Failed to update QStash message ID:",
        qstashUpdateError,
      );
      // Don't fail the entire operation if just the message ID update fails
    }

    console.log("[Retry] Email successfully scheduled for retry", {
      emailId: failedEmail.id,
      scheduledFor: newScheduledFor.toISOString(),
      qstashMessageId,
    });

    return true;
  } catch (qstashError) {
    console.error("[Retry] Failed to schedule email via QStash:", qstashError);

    // Rollback: set status back to failed since QStash scheduling failed
    await supabase
      .from("scheduled_discharge_emails")
      .update({ status: "failed" })
      .eq("id", failedEmail.id);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to schedule email retry. Please try again.",
    });
  }
}

export const retryRouter = createTRPCRouter({
  retryFailedDelivery: protectedProcedure
    .input(retryFailedDeliveryInput)
    .mutation(async ({ ctx, input }): Promise<RetryResult> => {
      if (!input.retryCall && !input.retryEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must specify at least one channel to retry",
        });
      }

      const userId = ctx.user.id;
      const [clinicUserIds, clinic] = await Promise.all([
        getClinicUserIds(userId, ctx.supabase),
        getClinicByUserId(userId, ctx.supabase),
      ]);

      const scope: ClinicScope = {
        clinicId: clinic?.id,
        userIds: clinicUserIds,
      };

      const results: RetryResult = {
        callRetried: false,
        emailRetried: false,
      };

      if (input.retryCall) {
        results.callRetried = await retryCall(
          ctx.supabase,
          input.caseId,
          scope,
        );
      }

      if (input.retryEmail) {
        results.emailRetried = await retryEmail(
          ctx.supabase,
          input.caseId,
          scope,
        );
      }

      if (!results.callRetried && !results.emailRetried) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No failed deliveries found to retry",
        });
      }

      return results;
    }),
});
