/**
 * Approve and Schedule Procedure
 *
 * Schedules discharge call and/or email for a case.
 * Uses user-configured delay settings:
 * - email_delay_days (default 1): Days after approval to send email
 * - call_delay_days (default 2): Days after approval to make call
 * - preferred_email_start_time (default 09:00): Time of day for email
 * - preferred_call_start_time (default 14:00): Time of day for call
 */

import { TRPCError } from "@trpc/server";
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { approveAndScheduleInput } from "../schemas";

/**
 * Calculate scheduled time based on delay days and preferred time
 */
function calculateScheduleTime(
  baseDate: Date,
  delayDays: number,
  preferredTime: string, // HH:MM or HH:MM:SS format
): Date {
  // Add delay days
  let scheduled = addDays(baseDate, delayDays);

  // Parse preferred time
  const [hours, minutes] = preferredTime.split(":").map(Number);

  // Set the preferred time
  scheduled = setHours(scheduled, hours ?? 9);
  scheduled = setMinutes(scheduled, minutes ?? 0);
  scheduled = setSeconds(scheduled, 0);

  return scheduled;
}

export const approveRouter = createTRPCRouter({
  approveAndSchedule: protectedProcedure
    .input(approveAndScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Fetch user discharge settings
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select(
          "email_delay_days, call_delay_days, preferred_email_start_time, preferred_call_start_time",
        )
        .eq("id", userId)
        .single();

      const emailDelayDays = userSettings?.email_delay_days ?? 1;
      const callDelayDays = userSettings?.call_delay_days ?? 2;
      const preferredEmailTime =
        userSettings?.preferred_email_start_time ?? "09:00";
      const preferredCallTime =
        userSettings?.preferred_call_start_time ?? "14:00";

      // Fetch case with patient and discharge summary
      const { data: caseData, error: caseError } = await ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          patients (
            id,
            name,
            species,
            breed,
            owner_name,
            owner_phone,
            owner_email
          ),
          discharge_summaries (
            id,
            content,
            structured_content
          )
        `,
        )
        .eq("id", input.caseId)
        .eq("user_id", userId)
        .single();

      if (caseError || !caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      const patient = Array.isArray(caseData.patients)
        ? caseData.patients[0]
        : caseData.patients;
      const dischargeSummary = Array.isArray(caseData.discharge_summaries)
        ? caseData.discharge_summaries[0]
        : caseData.discharge_summaries;

      if (!dischargeSummary) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Case does not have a discharge summary",
        });
      }

      const now = new Date();
      const results: {
        callScheduled: boolean;
        emailScheduled: boolean;
        callId?: string;
        emailId?: string;
        emailScheduledFor?: string;
        callScheduledFor?: string;
      } = {
        callScheduled: false,
        emailScheduled: false,
      };

      // Schedule email if enabled and email available
      // Email goes out first (typically 1 day after approval)
      if (input.emailEnabled && patient?.owner_email) {
        const emailScheduledFor = calculateScheduleTime(
          now,
          emailDelayDays,
          preferredEmailTime,
        );

        const { data: emailData, error: emailError } = await ctx.supabase
          .from("scheduled_discharge_emails")
          .insert({
            user_id: userId,
            case_id: input.caseId,
            recipient_email: patient.owner_email,
            recipient_name: patient.owner_name,
            subject: `Discharge Instructions for ${patient.name}`,
            html_content: dischargeSummary.content, // TODO: Use proper email template
            scheduled_for: emailScheduledFor.toISOString(),
            status: "queued",
          })
          .select("id")
          .single();

        if (emailError) {
          console.error("[Approve] Failed to schedule email:", emailError);
        } else {
          results.emailScheduled = true;
          results.emailId = emailData.id;
          results.emailScheduledFor = emailScheduledFor.toISOString();
        }
      }

      // Schedule call if enabled and phone available
      // Call goes out after email (typically 2 days after approval)
      if (input.phoneEnabled && patient?.owner_phone) {
        const callScheduledFor = calculateScheduleTime(
          now,
          callDelayDays,
          preferredCallTime,
        );

        const { data: callData, error: callError } = await ctx.supabase
          .from("scheduled_discharge_calls")
          .insert({
            user_id: userId,
            case_id: input.caseId,
            customer_phone: patient.owner_phone,
            scheduled_for: callScheduledFor.toISOString(),
            status: "queued",
            dynamic_variables: {
              pet_name: patient.name,
              owner_name: patient.owner_name,
              species: patient.species,
              breed: patient.breed,
              discharge_summary: dischargeSummary.content,
            },
          })
          .select("id")
          .single();

        if (callError) {
          console.error("[Approve] Failed to schedule call:", callError);
        } else {
          results.callScheduled = true;
          results.callId = callData.id;
          results.callScheduledFor = callScheduledFor.toISOString();
        }
      }

      if (!results.callScheduled && !results.emailScheduled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No contact information available or both channels disabled",
        });
      }

      return results;
    }),
});
