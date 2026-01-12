/**
 * Discharge Step Handlers
 *
 * Individual step execution functions for the discharge orchestrator.
 */

import type { ExecutionPlan } from "@odis-ai/domain/shared";
import type { ICasesService } from "@odis-ai/domain/shared";
import type { OrchestrationRequest } from "@odis-ai/shared/validators/orchestration";
import type { NormalizedEntities } from "@odis-ai/shared/validators";
import type {
  ExtractEntitiesResult,
  StepResult,
  StepName,
} from "@odis-ai/shared/types/orchestration";
import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { User } from "@supabase/supabase-js";
import type { IngestPayload } from "@odis-ai/shared/types/services";
import type { Database, Json } from "@odis-ai/shared/types";
import { createClinicBranding } from "@odis-ai/shared/types/clinic-branding";

import { CallExecutor } from "./call-executor";
import { generateEmailContent } from "./email-generator";
import { isValidEmail } from "@odis-ai/integrations/resend/utils";
import { getClinicByUserId } from "@odis-ai/domain/clinics/utils";
import {
  normalizePatient,
  getDischargeSummaryWithStructured,
  getCaseIdFromResults,
} from "./discharge-helpers";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

/**
 * Context passed to each step handler
 */
export interface StepContext {
  supabase: SupabaseClientType;
  user: User;
  casesService: ICasesService;
  plan: ExecutionPlan;
  results: Map<StepName, StepResult>;
  request: OrchestrationRequest;
}

/**
 * Execute ingestion step
 */
export async function executeIngestion(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const input = ctx.request.input;
  if ("existingCase" in input) {
    return {
      step: "ingest",
      status: "completed",
      duration: Date.now() - startTime,
      data: { caseId: input.existingCase.caseId },
    };
  }

  const stepConfig = ctx.plan.getStepConfig("ingest");
  if (!stepConfig?.enabled) {
    return { step: "ingest", status: "skipped", duration: 0 };
  }

  const payload: IngestPayload =
    input.rawData.mode === "text"
      ? {
          mode: "text",
          source: input.rawData.source,
          text: input.rawData.text ?? "",
          options:
            typeof stepConfig.options === "object" &&
            stepConfig.options !== null
              ? (stepConfig.options as {
                  autoSchedule?: boolean;
                  inputType?: string;
                })
              : undefined,
        }
      : {
          mode: "structured",
          source: input.rawData.source,
          data: input.rawData.data ?? {},
          options:
            typeof stepConfig.options === "object" &&
            stepConfig.options !== null
              ? (stepConfig.options as {
                  autoSchedule?: boolean;
                })
              : undefined,
        };

  const result = await ctx.casesService.ingest(
    ctx.supabase,
    ctx.user.id,
    payload,
  );

  return {
    step: "ingest",
    status: "completed",
    duration: Date.now() - startTime,
    data: result,
  };
}

/**
 * Execute entity extraction step
 */
export async function executeEntityExtraction(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const stepConfig = ctx.plan.getStepConfig("extractEntities");
  if (!stepConfig?.enabled) {
    return { step: "extractEntities", status: "skipped", duration: 0 };
  }

  const caseId = getCaseIdFromResults(ctx.results, ctx.request.input);
  if (!caseId) {
    throw new Error("Case ID required for entity extraction");
  }

  console.log("[DischargeSteps] Starting entity extraction", { caseId });

  const { data: caseData, error: caseError } = await ctx.supabase
    .from("cases")
    .select(
      `
      id,
      source,
      metadata,
      entity_extraction,
      transcriptions (id, transcript, created_at)
    `,
    )
    .eq("id", caseId)
    .single();

  if (caseError || !caseData) {
    throw new Error(
      `Failed to fetch case: ${caseError?.message ?? "Case not found"}`,
    );
  }

  // Check for pre-extracted entities
  if (caseData.entity_extraction) {
    const preExtractedEntities =
      caseData.entity_extraction as unknown as NormalizedEntities;

    if (
      preExtractedEntities.patient?.name &&
      preExtractedEntities.confidence?.overall
    ) {
      console.log("[DischargeSteps] Using pre-extracted entities from ingest", {
        caseId,
        patientName: preExtractedEntities.patient.name,
        confidence: preExtractedEntities.confidence.overall,
      });

      return {
        step: "extractEntities",
        status: "completed",
        duration: Date.now() - startTime,
        data: {
          caseId,
          entities: preExtractedEntities,
          source: "existing",
        } as ExtractEntitiesResult,
      };
    }
  }

  // Determine text source
  let textToExtract: string | null = null;
  let extractionSource: "transcription" | "idexx_consultation_notes" =
    "transcription";

  const transcriptions = caseData.transcriptions as Array<{
    id: string;
    transcript: string | null;
    created_at: string;
  }> | null;

  const latestTranscription = transcriptions?.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )?.[0];

  if (latestTranscription?.transcript) {
    textToExtract = latestTranscription.transcript;
    extractionSource = "transcription";
  } else if (
    caseData.source === "idexx_neo" ||
    caseData.source === "idexx_extension"
  ) {
    const metadata = caseData.metadata as {
      idexx?: { consultation_notes?: string };
    } | null;

    const consultationNotes = metadata?.idexx?.consultation_notes;
    if (consultationNotes) {
      textToExtract = consultationNotes
        .replace(/<[^>]*>/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      extractionSource = "idexx_consultation_notes";
    }
  }

  // Check for euthanasia
  const metadata = caseData.metadata as {
    idexx?: { appointment_type?: string };
    entities?: { caseType?: string };
  } | null;

  const isEuthanasia =
    metadata?.entities?.caseType === "euthanasia" ||
    (textToExtract?.toLowerCase().includes("euthanasia") ?? false) ||
    (textToExtract?.toLowerCase().includes("euthanize") ?? false) ||
    (metadata?.idexx?.appointment_type?.toLowerCase().includes("euthanasia") ??
      false);

  if (isEuthanasia) {
    console.warn("[DischargeSteps] Euthanasia case detected - blocking", {
      caseId,
    });
    throw new Error(
      "Euthanasia case detected. Discharge workflow is not applicable.",
    );
  }

  if (!textToExtract || textToExtract.length < 50) {
    return {
      step: "extractEntities",
      status: "completed",
      duration: Date.now() - startTime,
      data: {
        caseId,
        entities: null,
        source: extractionSource,
        skipped: true,
        reason: "Minimal text - using database patient data",
      } as ExtractEntitiesResult,
    };
  }

  const { extractEntitiesWithRetry } =
    await import("@odis-ai/integrations/ai/normalize-scribe");
  const entities = await extractEntitiesWithRetry(
    textToExtract,
    extractionSource,
  );

  // Enrich with patient data
  const { data: patientData } = await ctx.supabase
    .from("cases")
    .select(`patients (*)`)
    .eq("id", caseId)
    .single();

  if (patientData?.patients) {
    const patient = Array.isArray(patientData.patients)
      ? patientData.patients[0]
      : patientData.patients;

    if (patient) {
      ctx.casesService.enrichEntitiesWithPatient(
        entities,
        patient as PatientRow,
      );
    }
  }

  // Save entities
  const { error: updateError } = await ctx.supabase
    .from("cases")
    .update({ entity_extraction: entities as unknown as Json })
    .eq("id", caseId);

  if (updateError) {
    throw new Error(
      `Failed to save extracted entities: ${updateError.message}`,
    );
  }

  return {
    step: "extractEntities",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      caseId,
      entities,
      source: extractionSource,
    } as ExtractEntitiesResult,
  };
}

/**
 * Execute summary generation step
 */
export async function executeSummaryGeneration(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const stepConfig = ctx.plan.getStepConfig("generateSummary");
  if (!stepConfig?.enabled) {
    return { step: "generateSummary", status: "skipped", duration: 0 };
  }

  const caseId = getCaseIdFromResults(ctx.results, ctx.request.input);
  if (!caseId) {
    throw new Error("Case ID required for summary generation");
  }

  const caseInfo = await ctx.casesService.getCaseWithEntities(
    ctx.supabase,
    caseId,
  );
  if (!caseInfo) {
    throw new Error("Case not found");
  }

  const patient = normalizePatient(caseInfo.patient as PatientRow | null);

  // Get entities from extractEntities step or case
  const extractEntitiesResult = ctx.results.get("extractEntities");
  let freshEntities: NormalizedEntities | null = null;
  if (
    extractEntitiesResult?.status === "completed" &&
    extractEntitiesResult.data
  ) {
    const data = extractEntitiesResult.data as ExtractEntitiesResult;
    freshEntities = data.entities;
  }

  // Extract SOAP content
  let soapContent: string | null = null;
  if (caseInfo.soapNotes && caseInfo.soapNotes.length > 0) {
    const latestSoapNote = caseInfo.soapNotes[0];
    if (latestSoapNote?.client_instructions) {
      soapContent = latestSoapNote.client_instructions;
    } else {
      const sections: string[] = [];
      if (latestSoapNote?.subjective)
        sections.push(`Subjective:\n${latestSoapNote.subjective}`);
      if (latestSoapNote?.objective)
        sections.push(`Objective:\n${latestSoapNote.objective}`);
      if (latestSoapNote?.assessment)
        sections.push(`Assessment:\n${latestSoapNote.assessment}`);
      if (latestSoapNote?.plan) sections.push(`Plan:\n${latestSoapNote.plan}`);
      if (sections.length > 0) soapContent = sections.join("\n\n");
    }
  }

  const entitiesToUse = freshEntities ?? caseInfo.entities ?? null;

  const { generateStructuredDischargeSummaryWithRetry } =
    await import("@odis-ai/integrations/ai/generate-structured-discharge");
  const { structured: structuredContent, plainText: summaryContent } =
    await generateStructuredDischargeSummaryWithRetry({
      soapContent,
      entityExtraction: entitiesToUse,
      patientData: {
        name: patient?.name ?? undefined,
        species: patient?.species ?? undefined,
        breed: patient?.breed ?? undefined,
        owner_name: patient?.owner_name ?? undefined,
      },
    });

  const { data: summary, error } = await ctx.supabase
    .from("discharge_summaries")
    .insert({
      case_id: caseId,
      user_id: ctx.user.id,
      content: summaryContent,
      structured_content: structuredContent as unknown as Json,
    })
    .select("id")
    .single();

  if (error || !summary) {
    throw new Error(`Failed to save summary: ${error?.message}`);
  }

  return {
    step: "generateSummary",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      summaryId: summary.id,
      content: summaryContent,
      structuredContent,
    },
  };
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

  const emailContent = emailResult.data as {
    subject: string;
    html: string;
    text: string;
  };

  const options =
    typeof stepConfig.options === "object" && stepConfig.options !== null
      ? (stepConfig.options as { recipientEmail?: string; scheduledFor?: Date })
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
    const { executeScheduledEmail } = await import("./email-executor");
    const result = await executeScheduledEmail(scheduledEmail.id, ctx.supabase);
    if (!result.success) {
      throw new Error(result.error ?? "Immediate email execution failed");
    }
  } else {
    // Dynamic import to avoid lazy-load constraint
    const { scheduleEmailExecution } =
      await import("@odis-ai/integrations/qstash/client");
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

/**
 * Execute call scheduling step
 */
export async function executeCallScheduling(
  ctx: StepContext,
  startTime: number,
): Promise<StepResult> {
  const stepConfig = ctx.plan.getStepConfig("scheduleCall");
  if (!stepConfig?.enabled) {
    return { step: "scheduleCall", status: "skipped", duration: 0 };
  }

  const caseId = getCaseIdFromResults(ctx.results, ctx.request.input);
  if (!caseId) {
    throw new Error("Case ID required for call scheduling");
  }

  const options =
    typeof stepConfig.options === "object" && stepConfig.options !== null
      ? (stepConfig.options as { scheduledFor?: Date; phoneNumber?: string })
      : {};

  const summaryResult = ctx.results.get("generateSummary");
  const summaryContent =
    summaryResult?.data && typeof summaryResult.data === "object"
      ? (summaryResult.data as { content?: string }).content
      : undefined;

  const { data: userSettings } = await ctx.supabase
    .from("users")
    .select(
      "clinic_name, clinic_phone, first_name, test_mode_enabled, test_contact_phone",
    )
    .eq("id", ctx.user.id)
    .single();

  const clinic = await getClinicByUserId(ctx.user.id, ctx.supabase);
  const clinicName = clinic?.name ?? userSettings?.clinic_name ?? "Your Clinic";
  const clinicPhone = clinic?.phone ?? userSettings?.clinic_phone ?? "";
  const agentName = userSettings?.first_name ?? "Sarah";

  const testModeEnabled = userSettings?.test_mode_enabled ?? false;
  if (testModeEnabled && !userSettings?.test_contact_phone) {
    throw new Error(
      "Test mode is enabled but test contact phone is not configured",
    );
  }

  const serverNow = new Date();
  let scheduledAt: Date | undefined;

  if (options.scheduledFor) {
    if (options.scheduledFor <= serverNow) {
      throw new Error(`Scheduled time must be in the future`);
    }
    scheduledAt = options.scheduledFor;
  }

  const scheduledCall = await ctx.casesService.scheduleDischargeCall(
    ctx.supabase,
    ctx.user.id,
    caseId,
    {
      scheduledAt,
      summaryContent,
      clinicName,
      clinicPhone,
      emergencyPhone: clinicPhone,
      agentName,
    },
    CallExecutor,
  );

  return {
    step: "scheduleCall",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      callId: scheduledCall.id,
      scheduledFor: scheduledCall.scheduled_for,
    },
  };
}
