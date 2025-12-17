/**
 * Cancel Scheduled Delivery Procedure
 *
 * Cancels a scheduled email or call for a case.
 */

import { TRPCError } from "@trpc/server";
import { getClinicUserIds } from "@odis-ai/clinics/utils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cancelScheduledDeliveryInput } from "../schemas";

export const cancelScheduledRouter = createTRPCRouter({
  cancelScheduledDelivery: protectedProcedure
    .input(cancelScheduledDeliveryInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (!input.cancelCall && !input.cancelEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must specify at least one channel to cancel",
        });
      }

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);

      const results: {
        callCancelled: boolean;
        emailCancelled: boolean;
      } = {
        callCancelled: false,
        emailCancelled: false,
      };

      // Cancel call if requested
      if (input.cancelCall) {
        // Find the scheduled call (clinic-scoped)
        const { data: scheduledCall, error: callFetchError } =
          await ctx.supabase
            .from("scheduled_discharge_calls")
            .select("*")
            .eq("case_id", input.caseId)
            .in("user_id", clinicUserIds)
            .eq("status", "queued")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (callFetchError || !scheduledCall) {
          console.warn(
            "[Cancel] No scheduled call found for case:",
            input.caseId,
          );
        } else {
          // Update call to cancelled status
          const { error: updateError } = await ctx.supabase
            .from("scheduled_discharge_calls")
            .update({
              status: "cancelled",
            })
            .eq("id", scheduledCall.id);

          if (updateError) {
            console.error("[Cancel] Failed to cancel call:", updateError);
          } else {
            results.callCancelled = true;
          }
        }
      }

      // Cancel email if requested
      if (input.cancelEmail) {
        // Find the scheduled email (clinic-scoped)
        const { data: scheduledEmail, error: emailFetchError } =
          await ctx.supabase
            .from("scheduled_discharge_emails")
            .select("*")
            .eq("case_id", input.caseId)
            .in("user_id", clinicUserIds)
            .eq("status", "queued")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (emailFetchError || !scheduledEmail) {
          console.warn(
            "[Cancel] No scheduled email found for case:",
            input.caseId,
          );
        } else {
          // Update email to cancelled status
          const { error: updateError } = await ctx.supabase
            .from("scheduled_discharge_emails")
            .update({
              status: "cancelled",
            })
            .eq("id", scheduledEmail.id);

          if (updateError) {
            console.error("[Cancel] Failed to cancel email:", updateError);
          } else {
            results.emailCancelled = true;
          }
        }
      }

      if (!results.callCancelled && !results.emailCancelled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No scheduled deliveries found to cancel",
        });
      }

      return results;
    }),
});
