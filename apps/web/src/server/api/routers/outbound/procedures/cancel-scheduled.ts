/**
 * Cancel Scheduled Delivery Procedure
 *
 * Cancels a scheduled email or call for a case.
 * Also cancels the associated QStash job to prevent execution.
 */

import { TRPCError } from "@trpc/server";
import { getClinicUserIds } from "@odis-ai/domain/clinics";
import { cancelScheduledExecution } from "@odis-ai/integrations/qstash";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cancelScheduledDeliveryInput } from "../schemas";

// Type for call metadata that may contain qstash_message_id
interface ScheduledCallMetadata {
  qstash_message_id?: string;
  [key: string]: unknown;
}

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
        qstashCallCancelled: boolean;
        qstashEmailCancelled: boolean;
      } = {
        callCancelled: false,
        emailCancelled: false,
        qstashCallCancelled: false,
        qstashEmailCancelled: false,
      };

      // Cancel call if requested
      if (input.cancelCall) {
        // Find the scheduled call (clinic-scoped)
        const { data: scheduledCall, error: callFetchError } =
          await ctx.supabase
            .from("scheduled_discharge_calls")
            .select("id, metadata, qstash_message_id")
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
          // First, cancel the QStash job to prevent execution
          const metadata =
            scheduledCall.metadata as ScheduledCallMetadata | null;
          const qstashMessageId =
            scheduledCall.qstash_message_id ?? metadata?.qstash_message_id;

          if (qstashMessageId) {
            const qstashCancelled =
              await cancelScheduledExecution(qstashMessageId);
            results.qstashCallCancelled = qstashCancelled;

            if (!qstashCancelled) {
              console.warn(
                "[Cancel] Failed to cancel QStash job for call, proceeding with DB update",
                { callId: scheduledCall.id, qstashMessageId },
              );
            } else {
              console.log(
                "[Cancel] Successfully cancelled QStash job for call",
                {
                  callId: scheduledCall.id,
                  qstashMessageId,
                },
              );
            }
          } else {
            console.warn(
              "[Cancel] No QStash message ID found for call:",
              scheduledCall.id,
            );
          }

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
            console.log("[Cancel] Successfully cancelled call in database", {
              callId: scheduledCall.id,
            });
          }
        }
      }

      // Cancel email if requested
      if (input.cancelEmail) {
        // Find the scheduled email (clinic-scoped)
        const { data: scheduledEmail, error: emailFetchError } =
          await ctx.supabase
            .from("scheduled_discharge_emails")
            .select("id, qstash_message_id")
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
          // First, cancel the QStash job to prevent execution
          if (scheduledEmail.qstash_message_id) {
            const qstashCancelled = await cancelScheduledExecution(
              scheduledEmail.qstash_message_id,
            );
            results.qstashEmailCancelled = qstashCancelled;

            if (!qstashCancelled) {
              console.warn(
                "[Cancel] Failed to cancel QStash job for email, proceeding with DB update",
                {
                  emailId: scheduledEmail.id,
                  qstashMessageId: scheduledEmail.qstash_message_id,
                },
              );
            } else {
              console.log(
                "[Cancel] Successfully cancelled QStash job for email",
                {
                  emailId: scheduledEmail.id,
                  qstashMessageId: scheduledEmail.qstash_message_id,
                },
              );
            }
          } else {
            console.warn(
              "[Cancel] No QStash message ID found for email:",
              scheduledEmail.id,
            );
          }

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
            console.log("[Cancel] Successfully cancelled email in database", {
              emailId: scheduledEmail.id,
            });
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
