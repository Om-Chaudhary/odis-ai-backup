/**
 * Email Scheduling Step
 *
 * Handles email preparation and scheduling for discharge workflows.
 */

import type { StepResult } from "@odis-ai/shared/types/orchestration";
import type { Database, Json } from "@odis-ai/shared/types";
// eslint-disable-next-line @nx/enforce-module-boundaries -- Shared types are a core dependency
import { createClinicBranding } from "@odis-ai/shared/types/clinic-branding";
import { isValidEmail } from "@odis-ai/integrations/resend/utils";
import { getClinicByUserId } from "@odis-ai/domain/clinics/utils";

import type { StepContext } from "./types";
import { generateEmailContent } from "../email-generator";
import {
  normalizePatient,
  getDischargeSummaryWithStructured,
  getCaseIdFromResults,
} from "../discharge-helpers";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

interface EmailScheduleOptions {
  recipientEmail?: string;
  scheduledFor?: Date;
}

/**
 * Execute email preparation step
 */
export async function executeEmailPreparation(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const input = ctx.request.input;
  if ("existingCase" in input && input.existingCase.emailContent) {
    return {
      step: "prepareEmail",
      status: "completed",
      duration: Date.now() - startTime,
      data: input.existingCase.emailContent,
    };
  }

  const stepConfig = ctx.plan.getStepConfig("prepareEmail");
  if (!stepConfig?.enabled) {
    return { step: "prepareEmail", status: "skipped", duration: 0 };
  }

  const caseId = getCaseIdFromResults(ctx.results, ctx.request.input);
  if (!caseId) {
    throw new Error("Case ID required for email preparation");
  }

  const caseInfo = await ctx.casesService.getCaseWithEntities(
    ctx.supabase,
    caseId,
  );
  if (!caseInfo) {
    throw new Error("Case not found");
  }

  const patient = normalizePatient(caseInfo.patient as PatientRow | null);
  const patientName = patient?.name ?? "your pet";
  const species = patient?.species;
  const breed = patient?.breed;
  const visitDate =
    caseInfo.case.scheduled_at ?? caseInfo.case.created_at ?? null;

  const { data: userData } = await ctx.supabase
    .from("users")
    .select("clinic_name, clinic_phone, clinic_email")
    .eq("id", ctx.user.id)
    .single();

  const clinic = await getClinicByUserId(ctx.user.id, ctx.supabase);

  const branding = createClinicBranding({
    clinicName: clinic?.name ?? userData?.clinic_name ?? undefined,
    clinicPhone: clinic?.phone ?? userData?.clinic_phone ?? undefined,
    clinicEmail: clinic?.email ?? userData?.clinic_email ?? undefined,
    primaryColor: clinic?.primary_color ?? undefined,
    logoUrl: clinic?.logo_url ?? undefined,
    emailHeaderText: clinic?.email_header_text ?? undefined,
    emailFooterText: clinic?.email_footer_text ?? undefined,
  });

  const dischargeSummaryData = await getDischargeSummaryWithStructured(
    ctx.supabase,
    caseId,
    ctx.results,
  );

  const emailContent = await generateEmailContent(
    dischargeSummaryData.content,
    patientName,
    species,
    breed,
    branding,
    dischargeSummaryData.structuredContent,
    visitDate,
  );

  return {
    step: "prepareEmail",
    status: "completed",
    duration: Date.now() - startTime,
    data: emailContent,
  };
}

/**
 * Execute email scheduling step
 */
export async function executeEmailScheduling(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const stepConfig = ctx.plan.getStepConfig("scheduleEmail");
  if (!stepConfig?.enabled) {
    return { step: "scheduleEmail", status: "skipped", duration: 0 };
  }

  const emailResult = ctx.results.get("prepareEmail");
  if (!emailResult?.data || typeof emailResult.data !== "object") {
    throw new Error("Email content required for scheduling");
  }

  const emailContent = emailResult.data as EmailContent;

  const options =
    typeof stepConfig.options === "object" && stepConfig.options !== null
      ? (stepConfig.options as EmailScheduleOptions)
      : {};
  const recipientEmail = options.recipientEmail;
  if (!recipientEmail) {
    throw new Error("Recipient email is required");
  }

  if (!isValidEmail(recipientEmail)) {
    throw new Error(`Invalid email address format: ${recipientEmail}`);
  }

  const caseId = getCaseIdFromResults(ctx.results, ctx.request.input);
  const caseInfo = caseId
    ? await ctx.casesService.getCaseWithEntities(ctx.supabase, caseId)
    : null;
  const patient = caseInfo
    ? normalizePatient(caseInfo.patient as PatientRow | null)
    : null;
  const recipientName = patient?.owner_name ?? undefined;

  const { data: userSettings } = await ctx.supabase
    .from("users")
    .select(
      "default_schedule_delay_minutes, test_mode_enabled, test_contact_email, test_contact_name",
    )
    .eq("id", ctx.user.id)
    .single();

  const testModeEnabled = userSettings?.test_mode_enabled ?? false;
  let finalRecipientEmail = recipientEmail;
  let finalRecipientName = recipientName;

  if (testModeEnabled) {
    if (!userSettings?.test_contact_email) {
      throw new Error(
        "Test mode is enabled but test contact email is not configured",
      );
    }
    finalRecipientEmail = userSettings.test_contact_email;
    finalRecipientName = userSettings.test_contact_name ?? recipientName;
  }

  const serverNow = new Date();
  let scheduledFor: Date;

  if (options.scheduledFor) {
    if (options.scheduledFor <= serverNow) {
      throw new Error(`Scheduled time must be in the future`);
    }
    scheduledFor = options.scheduledFor;
  } else {
    const delayMinutes = userSettings?.default_schedule_delay_minutes ?? 5;
    const delayMs = Math.max(delayMinutes * 60 * 1000, 10 * 1000);
    scheduledFor = new Date(serverNow.getTime() + delayMs);
  }

  const { data: scheduledEmail, error: dbError } = await ctx.supabase
    .from("scheduled_discharge_emails")
    .insert({
      user_id: ctx.user.id,
      case_id: caseId ?? null,
      recipient_email: finalRecipientEmail,
      recipient_name: finalRecipientName ?? null,
      subject: emailContent.subject,
      html_content: emailContent.html,
      text_content: emailContent.text,
      scheduled_for: scheduledFor.toISOString(),
      status: "queued",
      metadata: testModeEnabled
        ? {
            test_mode: true,
            original_recipient_email: recipientEmail,
            original_recipient_name: recipientName,
          }
        : ({} as Json),
    })
    .select()
    .single();

  if (dbError || !scheduledEmail) {
    throw new Error(`Failed to create scheduled email: ${dbError?.message}`);
  }

  let qstashMessageId: string | undefined;
  if (testModeEnabled) {
    const { executeScheduledEmail } = await import("../email-executor");
    const result = await executeScheduledEmail(scheduledEmail.id, ctx.supabase);
    if (!result.success) {
      throw new Error(result.error ?? "Immediate email execution failed");
    }
  } else {
    const { scheduleEmailExecution } = await import(
      "@odis-ai/integrations/qstash/client"
    );
    qstashMessageId = await scheduleEmailExecution(
      scheduledEmail.id,
      scheduledFor,
    );

    await ctx.supabase
      .from("scheduled_discharge_emails")
      .update({ qstash_message_id: qstashMessageId })
      .eq("id", scheduledEmail.id);
  }

  return {
    step: "scheduleEmail",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      emailId: scheduledEmail.id,
      scheduledFor: scheduledEmail.scheduled_for,
      qstashMessageId,
      immediateExecution: testModeEnabled,
    },
  };
}
