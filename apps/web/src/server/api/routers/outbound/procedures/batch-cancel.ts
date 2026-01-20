/**
 * Batch Cancel Procedure
 *
 * Cancels scheduled deliveries for multiple cases at once.
 * Also cancels the associated QStash jobs to prevent execution.
 */

import { TRPCError } from "@trpc/server";
import {
  getClinicUserIds,
  getClinicByUserId,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { batchCancelInput } from "../schemas";

// Dynamic import for lazy-loaded qstash
const getQStash = () => import("@odis-ai/integrations/qstash");

// Type for call metadata that may contain qstash_message_id
interface ScheduledCallMetadata {
  qstash_message_id?: string;
  [key: string]: unknown;
}

export const batchCancelRouter = createTRPCRouter({
  batchCancel: protectedProcedure
    .input(batchCancelInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (!input.cancelCalls && !input.cancelEmails) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must specify at least one channel to cancel",
        });
      }

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      const results: {
        totalCases: number;
        callsCancelled: number;
        emailsCancelled: number;
        qstashJobsCancelled: number;
        errors: Array<{ caseId: string; error: string }>;
      } = {
        totalCases: input.caseIds.length,
        callsCancelled: 0,
        emailsCancelled: 0,
        qstashJobsCancelled: 0,
        errors: [],
      };

      // Process each case in parallel
      await Promise.all(
        input.caseIds.map(async (caseId) => {
          try {
            // Cancel calls if requested
            if (input.cancelCalls) {
              const { data: scheduledCall } = await ctx.supabase
                .from("scheduled_discharge_calls")
                .select("id, metadata, qstash_message_id")
                .eq("case_id", caseId)
                .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
                .eq("status", "queued")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

              if (scheduledCall) {
                // Cancel QStash job first
                const metadata =
                  scheduledCall.metadata as ScheduledCallMetadata | null;
                const qstashMessageId =
                  scheduledCall.qstash_message_id ??
                  metadata?.qstash_message_id;

                if (qstashMessageId) {
                  const { cancelScheduledExecution } = await getQStash();
                  const qstashCancelled =
                    await cancelScheduledExecution(qstashMessageId);
                  if (qstashCancelled) {
                    results.qstashJobsCancelled++;
                  }
                }

                // Update DB status
                const { error } = await ctx.supabase
                  .from("scheduled_discharge_calls")
                  .update({ status: "cancelled" })
                  .eq("id", scheduledCall.id);

                if (!error) {
                  results.callsCancelled++;
                }
              }
            }

            // Cancel emails if requested
            if (input.cancelEmails) {
              const { data: scheduledEmail } = await ctx.supabase
                .from("scheduled_discharge_emails")
                .select("id, qstash_message_id")
                .eq("case_id", caseId)
                .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
                .eq("status", "queued")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

              if (scheduledEmail) {
                // Cancel QStash job first
                if (scheduledEmail.qstash_message_id) {
                  const { cancelScheduledExecution } = await getQStash();
                  const qstashCancelled = await cancelScheduledExecution(
                    scheduledEmail.qstash_message_id,
                  );
                  if (qstashCancelled) {
                    results.qstashJobsCancelled++;
                  }
                }

                // Update DB status
                const { error } = await ctx.supabase
                  .from("scheduled_discharge_emails")
                  .update({ status: "cancelled" })
                  .eq("id", scheduledEmail.id);

                if (!error) {
                  results.emailsCancelled++;
                }
              }
            }
          } catch (error) {
            results.errors.push({
              caseId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }),
      );

      console.log("[BatchCancel] Completed batch cancellation", {
        totalCases: results.totalCases,
        callsCancelled: results.callsCancelled,
        emailsCancelled: results.emailsCancelled,
        qstashJobsCancelled: results.qstashJobsCancelled,
        errors: results.errors.length,
      });

      return results;
    }),
});
