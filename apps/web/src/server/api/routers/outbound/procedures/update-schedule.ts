/**
 * Update Schedule Delays Procedure
 *
 * Updates the scheduled time for a case's call and/or email delivery.
 * Recalculates scheduled_for based on new delay days from original approval time.
 * Reschedules QStash jobs accordingly.
 */

import { TRPCError } from "@trpc/server";
import {
  getClinicUserIds,
  getClinicByUserId,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import { calculateScheduleTime } from "@odis-ai/shared/util/timezone";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { updateScheduleDelaysInput } from "../schemas";

// Dynamic import for lazy-loaded qstash
const getQStash = () => import("@odis-ai/integrations/qstash");

// Type for call/email metadata that may contain qstash_message_id
interface ScheduledMetadata {
  qstash_message_id?: string;
  [key: string]: unknown;
}

export const updateScheduleRouter = createTRPCRouter({
  updateScheduleDelays: protectedProcedure
    .input(updateScheduleDelaysInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (!input.callDelayDays && !input.emailDelayDays) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must specify at least one delay to update",
        });
      }

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // Fetch user settings for preferred times
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select("preferred_email_start_time, preferred_call_start_time")
        .eq("id", userId)
        .single();

      const preferredEmailTime =
        userSettings?.preferred_email_start_time ?? "10:00";
      const preferredCallTime =
        userSettings?.preferred_call_start_time ?? "16:00";

      const results: {
        callUpdated: boolean;
        emailUpdated: boolean;
        callScheduledFor?: string;
        emailScheduledFor?: string;
      } = {
        callUpdated: false,
        emailUpdated: false,
      };

      const now = new Date();

      // Update call schedule if requested
      if (input.callDelayDays !== undefined) {
        // Find the scheduled call (clinic-scoped)
        const { data: scheduledCall, error: callFetchError } =
          await ctx.supabase
            .from("scheduled_discharge_calls")
            .select("id, metadata, qstash_message_id, created_at")
            .eq("case_id", input.caseId)
            .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
            .eq("status", "queued")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (callFetchError || !scheduledCall) {
          console.warn(
            "[UpdateSchedule] No scheduled call found for case:",
            input.caseId
          );
        } else {
          // Calculate new scheduled time based on delay from NOW
          // This ensures the delay is always relative to current time
          const newScheduledFor = calculateScheduleTime(
            now,
            input.callDelayDays,
            preferredCallTime
          );

          // First, cancel existing QStash job
          const metadata =
            scheduledCall.metadata as ScheduledMetadata | null;
          const oldQstashMessageId =
            scheduledCall.qstash_message_id ?? metadata?.qstash_message_id;

          if (oldQstashMessageId) {
            const { cancelScheduledExecution } = await getQStash();
            const cancelled = await cancelScheduledExecution(oldQstashMessageId);
            if (!cancelled) {
              console.warn(
                "[UpdateSchedule] Failed to cancel old QStash job for call",
                { callId: scheduledCall.id, qstashMessageId: oldQstashMessageId }
              );
            } else {
              console.log(
                "[UpdateSchedule] Cancelled old QStash job for call",
                { callId: scheduledCall.id }
              );
            }
          }

          // Schedule new QStash job
          const { scheduleCallExecution } = await getQStash();
          let newQstashMessageId: string | null = null;
          try {
            newQstashMessageId = await scheduleCallExecution(
              scheduledCall.id,
              newScheduledFor
            );
            console.log("[UpdateSchedule] Scheduled new QStash job for call", {
              callId: scheduledCall.id,
              scheduledFor: newScheduledFor.toISOString(),
              qstashMessageId: newQstashMessageId,
            });
          } catch (qstashError) {
            console.error(
              "[UpdateSchedule] Failed to schedule new QStash job for call:",
              qstashError
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to reschedule call delivery",
            });
          }

          // Update call record with new schedule
          const { error: updateError } = await ctx.supabase
            .from("scheduled_discharge_calls")
            .update({
              scheduled_for: newScheduledFor.toISOString(),
              qstash_message_id: newQstashMessageId,
            })
            .eq("id", scheduledCall.id);

          if (updateError) {
            console.error(
              "[UpdateSchedule] Failed to update call schedule:",
              updateError
            );
          } else {
            results.callUpdated = true;
            results.callScheduledFor = newScheduledFor.toISOString();
            console.log("[UpdateSchedule] Updated call schedule", {
              callId: scheduledCall.id,
              newScheduledFor: newScheduledFor.toISOString(),
            });
          }
        }
      }

      // Update email schedule if requested
      if (input.emailDelayDays !== undefined) {
        // Find the scheduled email (clinic-scoped)
        const { data: scheduledEmail, error: emailFetchError } =
          await ctx.supabase
            .from("scheduled_discharge_emails")
            .select("id, qstash_message_id, created_at")
            .eq("case_id", input.caseId)
            .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
            .eq("status", "queued")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (emailFetchError || !scheduledEmail) {
          console.warn(
            "[UpdateSchedule] No scheduled email found for case:",
            input.caseId
          );
        } else {
          // Calculate new scheduled time based on delay from NOW
          const newScheduledFor = calculateScheduleTime(
            now,
            input.emailDelayDays,
            preferredEmailTime
          );

          // First, cancel existing QStash job
          if (scheduledEmail.qstash_message_id) {
            const { cancelScheduledExecution } = await getQStash();
            const cancelled = await cancelScheduledExecution(
              scheduledEmail.qstash_message_id
            );
            if (!cancelled) {
              console.warn(
                "[UpdateSchedule] Failed to cancel old QStash job for email",
                {
                  emailId: scheduledEmail.id,
                  qstashMessageId: scheduledEmail.qstash_message_id,
                }
              );
            } else {
              console.log(
                "[UpdateSchedule] Cancelled old QStash job for email",
                { emailId: scheduledEmail.id }
              );
            }
          }

          // Schedule new QStash job
          const { scheduleEmailExecution } = await getQStash();
          let newQstashMessageId: string | null = null;
          try {
            newQstashMessageId = await scheduleEmailExecution(
              scheduledEmail.id,
              newScheduledFor
            );
            console.log("[UpdateSchedule] Scheduled new QStash job for email", {
              emailId: scheduledEmail.id,
              scheduledFor: newScheduledFor.toISOString(),
              qstashMessageId: newQstashMessageId,
            });
          } catch (qstashError) {
            console.error(
              "[UpdateSchedule] Failed to schedule new QStash job for email:",
              qstashError
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to reschedule email delivery",
            });
          }

          // Update email record with new schedule
          const { error: updateError } = await ctx.supabase
            .from("scheduled_discharge_emails")
            .update({
              scheduled_for: newScheduledFor.toISOString(),
              qstash_message_id: newQstashMessageId,
            })
            .eq("id", scheduledEmail.id);

          if (updateError) {
            console.error(
              "[UpdateSchedule] Failed to update email schedule:",
              updateError
            );
          } else {
            results.emailUpdated = true;
            results.emailScheduledFor = newScheduledFor.toISOString();
            console.log("[UpdateSchedule] Updated email schedule", {
              emailId: scheduledEmail.id,
              newScheduledFor: newScheduledFor.toISOString(),
            });
          }
        }
      }

      if (!results.callUpdated && !results.emailUpdated) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No scheduled deliveries found to update",
        });
      }

      return results;
    }),
});
