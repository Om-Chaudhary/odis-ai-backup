/**
 * Retry Failed Delivery Procedure
 *
 * Retries failed call and/or email for a case.
 */

import { TRPCError } from "@trpc/server";
import { getClinicUserIds } from "@odis-ai/domain/clinics";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { retryFailedDeliveryInput } from "../schemas";

export const retryRouter = createTRPCRouter({
  retryFailedDelivery: protectedProcedure
    .input(retryFailedDeliveryInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (!input.retryCall && !input.retryEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must specify at least one channel to retry",
        });
      }

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);

      const results: {
        callRetried: boolean;
        emailRetried: boolean;
      } = {
        callRetried: false,
        emailRetried: false,
      };

      // Retry call if requested
      if (input.retryCall) {
        // Find the failed call (clinic-scoped)
        const { data: failedCall, error: callFetchError } = await ctx.supabase
          .from("scheduled_discharge_calls")
          .select("*")
          .eq("case_id", input.caseId)
          .in("user_id", clinicUserIds)
          .eq("status", "failed")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (callFetchError || !failedCall) {
          console.warn("[Retry] No failed call found for case:", input.caseId);
        } else {
          // Get current retry count
          const metadata =
            (failedCall.metadata as Record<string, unknown>) ?? {};
          const retryCount = (metadata.retry_count as number) ?? 0;
          const maxRetries = (metadata.max_retries as number) ?? 3;

          if (retryCount >= maxRetries) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Maximum retry attempts (${maxRetries}) reached for this call`,
            });
          }

          // Update call to queued status with incremented retry count
          const { error: updateError } = await ctx.supabase
            .from("scheduled_discharge_calls")
            .update({
              status: "queued",
              scheduled_for: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
              metadata: {
                ...metadata,
                retry_count: retryCount + 1,
                last_retry_at: new Date().toISOString(),
              },
            })
            .eq("id", failedCall.id);

          if (updateError) {
            console.error("[Retry] Failed to update call:", updateError);
          } else {
            results.callRetried = true;
          }
        }
      }

      // Retry email if requested
      if (input.retryEmail) {
        // Find the failed email (clinic-scoped)
        const { data: failedEmail, error: emailFetchError } = await ctx.supabase
          .from("scheduled_discharge_emails")
          .select("*")
          .eq("case_id", input.caseId)
          .in("user_id", clinicUserIds)
          .eq("status", "failed")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (emailFetchError || !failedEmail) {
          console.warn("[Retry] No failed email found for case:", input.caseId);
        } else {
          // Update email to queued status
          const { error: updateError } = await ctx.supabase
            .from("scheduled_discharge_emails")
            .update({
              status: "queued",
              scheduled_for: new Date().toISOString(),
            })
            .eq("id", failedEmail.id);

          if (updateError) {
            console.error("[Retry] Failed to update email:", updateError);
          } else {
            results.emailRetried = true;
          }
        }
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
