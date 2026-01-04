/**
 * Schedule Remaining Outreach Procedure
 *
 * Schedules additional call and/or email for cases that have partial outreach.
 * This is used when a case already has one method completed (e.g., email sent)
 * but the user wants to schedule the other method (e.g., phone call).
 */

import { TRPCError } from "@trpc/server";
import { getClinicUserIds, getClinicByUserId } from "@odis-ai/domain/clinics";
import { normalizeToE164, normalizeEmail } from "@odis-ai/shared/util/phone";
import { calculateScheduleTime } from "@odis-ai/shared/util/timezone";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { scheduleRemainingOutreachInput } from "../schemas";

// Dynamic imports for lazy-loaded libraries
const getCasesService = () =>
  import("@odis-ai/domain/cases").then((m) => m.CasesService);
const getQStash = () => import("@odis-ai/integrations/qstash");

export const scheduleRemainingRouter = createTRPCRouter({
  scheduleRemainingOutreach: protectedProcedure
    .input(scheduleRemainingOutreachInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (!input.scheduleCall && !input.scheduleEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must specify at least one channel to schedule",
        });
      }

      // Fetch user discharge settings (including test mode)
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select(
          "email_delay_days, call_delay_days, preferred_email_start_time, preferred_call_start_time, test_mode_enabled, test_contact_email, test_contact_phone, test_contact_name, first_name, clinic_name, clinic_phone",
        )
        .eq("id", userId)
        .single();

      const emailDelayDays = userSettings?.email_delay_days ?? 1;
      const callDelayDays = userSettings?.call_delay_days ?? 2;
      const preferredEmailTime =
        userSettings?.preferred_email_start_time ?? "10:00";
      const preferredCallTime =
        userSettings?.preferred_call_start_time ?? "16:00";
      const testModeEnabled = userSettings?.test_mode_enabled ?? false;
      const testContactEmail = userSettings?.test_contact_email ?? null;
      const testContactPhone = userSettings?.test_contact_phone ?? null;
      const testContactName = userSettings?.test_contact_name ?? null;

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);

      // Fetch case with patient data
      const { data: caseData, error: caseError } = await ctx.supabase
        .from("cases")
        .select(
          `
          id,
          user_id,
          entity_extraction,
          metadata,
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
          ),
          scheduled_discharge_calls (
            id,
            status
          ),
          scheduled_discharge_emails (
            id,
            status
          )
        `,
        )
        .eq("id", input.caseId)
        .in("user_id", clinicUserIds)
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
      const existingCall = Array.isArray(caseData.scheduled_discharge_calls)
        ? caseData.scheduled_discharge_calls[0]
        : caseData.scheduled_discharge_calls;
      const existingEmail = Array.isArray(caseData.scheduled_discharge_emails)
        ? caseData.scheduled_discharge_emails[0]
        : caseData.scheduled_discharge_emails;

      // Check if there's already a scheduled/completed call or email
      const hasExistingCall =
        existingCall &&
        ["queued", "ringing", "in_progress", "completed"].includes(
          existingCall.status,
        );
      const hasExistingEmail =
        existingEmail &&
        ["queued", "sent", "completed"].includes(existingEmail.status);

      if (input.scheduleCall && hasExistingCall) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "A call has already been scheduled or completed for this case",
        });
      }

      if (input.scheduleEmail && hasExistingEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An email has already been scheduled or sent for this case",
        });
      }

      // Normalize contact info
      let normalizedPhone = normalizeToE164(patient?.owner_phone);
      let normalizedEmail = normalizeEmail(patient?.owner_email);
      let recipientName = patient?.owner_name ?? null;

      // Test mode: Override with test contacts
      if (testModeEnabled) {
        console.log(
          "[ScheduleRemaining] Test mode enabled - using test contacts",
          {
            caseId: input.caseId,
            testContactEmail,
            testContactPhone,
          },
        );

        if (testContactPhone) {
          const normalizedTestPhone = normalizeToE164(testContactPhone);
          if (normalizedTestPhone) {
            normalizedPhone = normalizedTestPhone;
          }
        }

        if (testContactEmail) {
          const normalizedTestEmail = normalizeEmail(testContactEmail);
          if (normalizedTestEmail) {
            normalizedEmail = normalizedTestEmail;
          }
        }

        if (testContactName) {
          recipientName = testContactName;
        }
      }

      const summaryContent = dischargeSummary?.content ?? "";
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

      // Schedule email if requested
      if (input.scheduleEmail && normalizedEmail) {
        const emailScheduledFor = input.immediateDelivery
          ? new Date(now.getTime() + 60 * 1000)
          : calculateScheduleTime(now, emailDelayDays, preferredEmailTime);

        // Generate formatted email content using DischargeEmailTemplate
        const structuredContent = dischargeSummary?.structured_content;

        // Get clinic branding for email template
        const clinic = await getClinicByUserId(userId, ctx.supabase);
        const { data: userData } = await ctx.supabase
          .from("users")
          .select("clinic_name, clinic_phone, clinic_email")
          .eq("id", userId)
          .single();

        // Import branding helper
        const { createClinicBranding } =
          await import("@odis-ai/shared/types/clinic-branding");
        const branding = createClinicBranding({
          clinicName: clinic?.name ?? userData?.clinic_name ?? undefined,
          clinicPhone: clinic?.phone ?? userData?.clinic_phone ?? undefined,
          clinicEmail: clinic?.email ?? userData?.clinic_email ?? undefined,
          primaryColor: clinic?.primary_color ?? undefined,
          logoUrl: clinic?.logo_url ?? undefined,
          emailHeaderText: clinic?.email_header_text ?? undefined,
          emailFooterText: clinic?.email_footer_text ?? undefined,
        });

        // Import and use the email content generator
        const { generateDischargeEmailContent } =
          await import("@odis-ai/domain/discharge");
        const emailContent = await generateDischargeEmailContent(
          summaryContent,
          patient?.name ?? "your pet",
          patient?.species ?? undefined,
          patient?.breed ?? undefined,
          branding,
          structuredContent as never, // Type assertion to satisfy StructuredDischargeSummary
          null,
        );

        console.log("[ScheduleRemaining] Generated formatted email content", {
          caseId: input.caseId,
          hasStructuredContent: !!structuredContent,
          htmlLength: emailContent.html.length,
          textLength: emailContent.text.length,
        });

        const { data: emailData, error: emailError } = await ctx.supabase
          .from("scheduled_discharge_emails")
          .insert({
            user_id: userId,
            case_id: input.caseId,
            recipient_email: normalizedEmail,
            recipient_name: recipientName,
            subject: emailContent.subject,
            html_content: emailContent.html,
            text_content: emailContent.text,
            scheduled_for: emailScheduledFor.toISOString(),
            status: "queued",
          })
          .select("id")
          .single();

        if (emailError) {
          console.error(
            "[ScheduleRemaining] Failed to schedule email:",
            emailError,
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to schedule email",
          });
        }

        // Schedule via QStash
        try {
          const { scheduleEmailExecution } = await getQStash();
          const qstashMessageId = await scheduleEmailExecution(
            emailData.id,
            emailScheduledFor,
          );

          await ctx.supabase
            .from("scheduled_discharge_emails")
            .update({ qstash_message_id: qstashMessageId })
            .eq("id", emailData.id);

          console.log("[ScheduleRemaining] Email scheduled via QStash", {
            emailId: emailData.id,
            qstashMessageId,
            scheduledFor: emailScheduledFor.toISOString(),
          });
        } catch (qstashError) {
          console.error(
            "[ScheduleRemaining] Failed to schedule email via QStash:",
            qstashError,
          );

          // Rollback
          await ctx.supabase
            .from("scheduled_discharge_emails")
            .delete()
            .eq("id", emailData.id);

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to schedule email delivery",
          });
        }

        results.emailScheduled = true;
        results.emailId = emailData.id;
        results.emailScheduledFor = emailScheduledFor.toISOString();
      }

      // Schedule call if requested
      if (input.scheduleCall && normalizedPhone) {
        const callScheduledFor = input.immediateDelivery
          ? new Date(now.getTime() + 2 * 60 * 1000)
          : calculateScheduleTime(now, callDelayDays, preferredCallTime);

        // Get clinic data for call variables
        const clinic = await getClinicByUserId(userId, ctx.supabase);
        const CasesService = await getCasesService();

        try {
          const clinicName =
            clinic?.name ?? userSettings?.clinic_name ?? "Your Clinic";
          const clinicPhone = clinic?.phone ?? userSettings?.clinic_phone ?? "";
          const agentName = userSettings?.first_name ?? "Sarah";

          console.log("[ScheduleRemaining] Scheduling call via CasesService", {
            caseId: input.caseId,
            clinicName,
            scheduledFor: callScheduledFor.toISOString(),
          });

          const scheduledCall = await CasesService.scheduleDischargeCall(
            ctx.supabase,
            userId,
            input.caseId,
            {
              scheduledAt: callScheduledFor,
              summaryContent,
              clinicName,
              clinicPhone,
              emergencyPhone: clinicPhone,
              agentName,
            },
          );

          console.log("[ScheduleRemaining] Call scheduled via CasesService", {
            callId: scheduledCall.id,
            scheduledFor: scheduledCall.scheduled_for,
          });

          results.callScheduled = true;
          results.callId = scheduledCall.id;
          results.callScheduledFor = scheduledCall.scheduled_for;
        } catch (scheduleError) {
          console.error(
            "[ScheduleRemaining] Failed to schedule call:",
            scheduleError,
          );

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to schedule call delivery",
          });
        }
      }

      // Validate that at least one channel was scheduled
      if (!results.callScheduled && !results.emailScheduled) {
        const issues: string[] = [];

        if (input.scheduleCall) {
          if (!patient?.owner_phone) {
            issues.push("No phone number on file");
          } else if (!normalizedPhone) {
            issues.push(`Invalid phone format: "${patient.owner_phone}"`);
          }
        }

        if (input.scheduleEmail) {
          if (!patient?.owner_email) {
            issues.push("No email address on file");
          } else if (!normalizedEmail) {
            issues.push(`Invalid email format: "${patient.owner_email}"`);
          }
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            issues.length > 0
              ? `Cannot schedule delivery: ${issues.join(", ")}`
              : "No valid contact information available",
        });
      }

      return results;
    }),
});
