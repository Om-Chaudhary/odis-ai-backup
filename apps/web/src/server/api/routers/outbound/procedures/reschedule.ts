/**
 * Reschedule Delivery Procedure
 *
 * Reschedules failed or cancelled call and/or email for a case.
 * Creates new scheduled records with a new schedule time.
 */

import { TRPCError } from "@trpc/server";
import {
  getClinicUserIds,
  getClinicByUserId,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import { normalizeToE164, normalizeEmail } from "@odis-ai/shared/util/phone";
import { calculateScheduleTime } from "@odis-ai/shared/util/timezone";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { rescheduleDeliveryInput } from "../schemas";

// Dynamic imports for lazy-loaded libraries
const getCasesService = () =>
  import("@odis-ai/domain/cases").then((m) => m.CasesService);
const getQStash = () => import("@odis-ai/integrations/qstash");

export const rescheduleRouter = createTRPCRouter({
  rescheduleDelivery: protectedProcedure
    .input(rescheduleDeliveryInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      if (!input.rescheduleCall && !input.rescheduleEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must specify at least one channel to reschedule",
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
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // Fetch case with patient data and existing scheduled records
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
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
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

      // Verify failed/cancelled records exist for requested channels
      const callCanBeRescheduled =
        existingCall && ["failed", "cancelled"].includes(existingCall.status);
      const emailCanBeRescheduled =
        existingEmail && ["failed", "cancelled"].includes(existingEmail.status);

      if (input.rescheduleCall && !callCanBeRescheduled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No failed or cancelled call to reschedule",
        });
      }

      if (input.rescheduleEmail && !emailCanBeRescheduled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No failed or cancelled email to reschedule",
        });
      }

      // Normalize contact info
      let normalizedPhone = normalizeToE164(patient?.owner_phone);
      let normalizedEmail = normalizeEmail(patient?.owner_email);
      let recipientName = patient?.owner_name ?? null;

      // Test mode: Override with test contacts
      if (testModeEnabled) {
        console.log("[Reschedule] Test mode enabled - using test contacts", {
          caseId: input.caseId,
          testContactEmail,
          testContactPhone,
        });

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
        callRescheduled: boolean;
        emailRescheduled: boolean;
        callId?: string;
        emailId?: string;
        callScheduledFor?: string;
        emailScheduledFor?: string;
      } = {
        callRescheduled: false,
        emailRescheduled: false,
      };

      // Reschedule email if requested
      if (input.rescheduleEmail && normalizedEmail) {
        // Calculate schedule time: immediate = 1 min from now, delayed = use delay days
        const emailScheduledFor = input.immediate
          ? new Date(now.getTime() + 60 * 1000)
          : calculateScheduleTime(now, input.delayDays, preferredEmailTime);

        // Generate formatted email content using DischargeEmailTemplate
        const structuredContent = dischargeSummary?.structured_content;

        // Get clinic branding for email template
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
          structuredContent as never,
          null,
        );

        console.log("[Reschedule] Generated formatted email content", {
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
          console.error("[Reschedule] Failed to schedule email:", emailError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to reschedule email",
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

          console.log("[Reschedule] Email rescheduled via QStash", {
            emailId: emailData.id,
            qstashMessageId,
            scheduledFor: emailScheduledFor.toISOString(),
          });
        } catch (qstashError) {
          console.error(
            "[Reschedule] Failed to schedule email via QStash:",
            qstashError,
          );

          // Rollback
          await ctx.supabase
            .from("scheduled_discharge_emails")
            .delete()
            .eq("id", emailData.id);

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to reschedule email delivery",
          });
        }

        results.emailRescheduled = true;
        results.emailId = emailData.id;
        results.emailScheduledFor = emailScheduledFor.toISOString();
      }

      // Reschedule call if requested
      if (input.rescheduleCall && normalizedPhone) {
        // Calculate schedule time: immediate = 2 min from now (slightly after email), delayed = use delay days
        const callScheduledFor = input.immediate
          ? new Date(now.getTime() + 2 * 60 * 1000)
          : calculateScheduleTime(now, input.delayDays, preferredCallTime);

        // Get clinic data for call variables
        const CasesService = await getCasesService();

        try {
          const clinicName =
            clinic?.name ?? userSettings?.clinic_name ?? "Your Clinic";
          const clinicPhone = clinic?.phone ?? userSettings?.clinic_phone ?? "";
          const agentName = userSettings?.first_name ?? "Sarah";

          console.log("[Reschedule] Rescheduling call via CasesService", {
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

          console.log("[Reschedule] Call rescheduled via CasesService", {
            callId: scheduledCall.id,
            scheduledFor: scheduledCall.scheduled_for,
          });

          results.callRescheduled = true;
          results.callId = scheduledCall.id;
          results.callScheduledFor = scheduledCall.scheduled_for;
        } catch (scheduleError) {
          console.error(
            "[Reschedule] Failed to reschedule call:",
            scheduleError,
          );

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to reschedule call delivery",
          });
        }
      }

      // Validate that at least one channel was rescheduled
      if (!results.callRescheduled && !results.emailRescheduled) {
        const issues: string[] = [];

        if (input.rescheduleCall) {
          if (!patient?.owner_phone) {
            issues.push("No phone number on file");
          } else if (!normalizedPhone) {
            issues.push(`Invalid phone format: "${patient.owner_phone}"`);
          }
        }

        if (input.rescheduleEmail) {
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
              ? `Cannot reschedule delivery: ${issues.join(", ")}`
              : "No valid contact information available",
        });
      }

      return results;
    }),
});
