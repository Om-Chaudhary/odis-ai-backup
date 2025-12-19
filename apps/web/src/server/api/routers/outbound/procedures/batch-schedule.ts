/**
 * Batch Schedule Procedure
 *
 * Schedules multiple discharge cases at once with parallel generation and staggered timing.
 * Supports two timing modes:
 * - 'scheduled': Uses user's delay settings (email_delay_days, call_delay_days)
 * - 'immediate': Staggers emails/calls with configurable interval between cases
 *
 * Process:
 * 1. Validate all case IDs belong to the user's clinic
 * 2. Generate summaries/entities in parallel for cases that need them
 * 3. Schedule emails/calls with staggered timing in immediate mode
 * 4. Return progress for each case
 */

import { TRPCError } from "@trpc/server";
import { getClinicUserIds, getClinicByUserId } from "@odis-ai/clinics/utils";
import { normalizeToE164, normalizeEmail } from "@odis-ai/utils/phone";
import { calculateScheduleTime } from "@odis-ai/utils/timezone";
import type { NormalizedEntities } from "@odis-ai/validators/scribe";
import type { Json } from "@odis-ai/types";
import { scheduleEmailExecution } from "@odis-ai/qstash";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { batchScheduleInput } from "../schemas";

// Dynamic imports for lazy-loaded libraries
const getCasesService = () =>
  import("@odis-ai/services-cases").then((m) => m.CasesService);
const getGenerateStructuredDischargeSummaryWithRetry = () =>
  import("@odis-ai/ai/generate-structured-discharge").then(
    (m) => m.generateStructuredDischargeSummaryWithRetry,
  );

interface BatchScheduleResult {
  caseId: string;
  success: boolean;
  error?: string;
  callScheduled?: boolean;
  emailScheduled?: boolean;
  callScheduledFor?: string;
  emailScheduledFor?: string;
  summaryGenerated?: boolean;
}

/**
 * IDEXX metadata structure for entity extraction
 */
interface IdexxMetadata {
  pet_name?: string;
  patient_name?: string;
  patient_species?: string;
  patient_breed?: string;
  species?: string;
  breed?: string;
  client_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  owner_name?: string;
  client_phone?: string;
  client_email?: string;
  appointment_reason?: string;
  appointment_type?: string;
  products_services?: string;
  consultation_notes?: string;
  notes?: string;
  provider_name?: string;
}

/**
 * Builds NormalizedEntities from IDEXX metadata when AI extraction isn't possible
 */
function buildEntitiesFromIdexxMetadata(
  idexx: IdexxMetadata,
  patient: {
    name?: string | null;
    species?: string | null;
    breed?: string | null;
    owner_name?: string | null;
    owner_phone?: string | null;
    owner_email?: string | null;
  } | null,
): NormalizedEntities {
  let ownerName =
    idexx.client_name ?? idexx.owner_name ?? patient?.owner_name ?? "unknown";
  if (
    ownerName === "unknown" &&
    idexx.client_first_name &&
    idexx.client_last_name
  ) {
    ownerName = `${idexx.client_first_name} ${idexx.client_last_name}`.trim();
  }

  const speciesRaw =
    idexx.patient_species ?? idexx.species ?? patient?.species ?? "unknown";
  const speciesLower = speciesRaw.toLowerCase();
  const validSpecies = [
    "dog",
    "cat",
    "bird",
    "rabbit",
    "other",
    "unknown",
  ] as const;
  type ValidSpecies = (typeof validSpecies)[number];
  const species: ValidSpecies = validSpecies.includes(
    speciesLower as ValidSpecies,
  )
    ? (speciesLower as ValidSpecies)
    : "unknown";

  const procedures: string[] = [];
  if (idexx.products_services) {
    procedures.push(
      ...idexx.products_services
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  let caseType: NormalizedEntities["caseType"] = "exam";
  if (idexx.appointment_type) {
    const appointmentTypeLower = idexx.appointment_type.toLowerCase();
    if (appointmentTypeLower.includes("follow")) caseType = "follow_up";
    else if (appointmentTypeLower.includes("surgery")) caseType = "surgery";
    else if (appointmentTypeLower.includes("dental")) caseType = "dental";
    else if (
      appointmentTypeLower.includes("vaccine") ||
      appointmentTypeLower.includes("vaccination")
    )
      caseType = "vaccination";
    else if (appointmentTypeLower.includes("emergency")) caseType = "emergency";
    else if (
      appointmentTypeLower.includes("checkup") ||
      appointmentTypeLower.includes("wellness")
    )
      caseType = "checkup";
  }

  let followUpInstructions: string | undefined;
  if (idexx.consultation_notes) {
    followUpInstructions = idexx.consultation_notes
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  } else if (idexx.notes) {
    followUpInstructions = idexx.notes;
  }

  return {
    patient: {
      name: idexx.pet_name ?? idexx.patient_name ?? patient?.name ?? "unknown",
      species,
      breed: idexx.patient_breed ?? idexx.breed ?? patient?.breed ?? undefined,
      owner: {
        name: ownerName,
        phone: idexx.client_phone ?? patient?.owner_phone ?? undefined,
        email: idexx.client_email ?? patient?.owner_email ?? undefined,
      },
    },
    clinical: {
      visitReason: idexx.appointment_reason ?? undefined,
      chiefComplaint: idexx.appointment_reason ?? undefined,
      procedures: procedures.length > 0 ? procedures : undefined,
      followUpInstructions,
      productsServicesProvided: procedures.length > 0 ? procedures : undefined,
    },
    caseType,
    confidence: { overall: 0.7, patient: 0.7, clinical: 0.6 },
  };
}

export const batchScheduleRouter = createTRPCRouter({
  batchSchedule: protectedProcedure
    .input(batchScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const results: BatchScheduleResult[] = [];

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

      // Get clinic info
      const clinic = await getClinicByUserId(userId, ctx.supabase);
      const clinicName =
        clinic?.name ?? userSettings?.clinic_name ?? "Your Clinic";
      const clinicPhone = clinic?.phone ?? userSettings?.clinic_phone ?? "";
      const agentName = userSettings?.first_name ?? "Sarah";

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);

      // Verify all cases belong to clinic
      const { data: validCases, error: caseCheckError } = await ctx.supabase
        .from("cases")
        .select("id")
        .in("id", input.caseIds)
        .in("user_id", clinicUserIds);

      if (caseCheckError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate cases",
        });
      }

      const validCaseIds = new Set(validCases?.map((c) => c.id) ?? []);
      const invalidCaseIds = input.caseIds.filter((id) => !validCaseIds.has(id));

      // Mark invalid cases as errors
      for (const caseId of invalidCaseIds) {
        results.push({
          caseId,
          success: false,
          error: "Case not found or not accessible",
        });
      }

      // Filter to only valid cases
      const caseIdsToProcess = input.caseIds.filter((id) =>
        validCaseIds.has(id),
      );

      if (caseIdsToProcess.length === 0) {
        return { results, totalProcessed: 0, totalSuccess: 0, totalFailed: results.length };
      }

      // Load CasesService once
      const CasesService = await getCasesService();

      // Process cases - fetch all case data in parallel for efficiency
      const caseInfoPromises = caseIdsToProcess.map((caseId) =>
        CasesService.getCaseWithEntities(ctx.supabase, caseId),
      );
      const caseInfoResults = await Promise.allSettled(caseInfoPromises);

      const now = new Date();
      const staggerMs = input.staggerIntervalSeconds * 1000;
      let emailOffset = 0;
      let callOffset = 0;

      console.log("[BatchSchedule] Starting batch scheduling", {
        totalCases: caseIdsToProcess.length,
        timingMode: input.timingMode,
        phoneEnabled: input.phoneEnabled,
        emailEnabled: input.emailEnabled,
        testModeEnabled,
        staggerIntervalSeconds: input.staggerIntervalSeconds,
      });

      // Process each case
      for (let i = 0; i < caseIdsToProcess.length; i++) {
        const caseId = caseIdsToProcess[i]!;
        const caseInfoResult = caseInfoResults[i];

        if (!caseInfoResult || caseInfoResult.status === "rejected") {
          results.push({
            caseId,
            success: false,
            error:
              caseInfoResult?.status === "rejected"
                ? (caseInfoResult.reason as Error).message
                : "Failed to fetch case data",
          });
          continue;
        }

        const caseInfo = caseInfoResult.value;
        if (!caseInfo) {
          results.push({
            caseId,
            success: false,
            error: "Case not found",
          });
          continue;
        }

        try {
          // Check for blocked case types
          const BLOCKED_CASE_TYPES = ["euthanasia", "doa", "deceased"];
          const caseType = caseInfo.entities?.caseType?.toLowerCase();
          if (caseType && BLOCKED_CASE_TYPES.includes(caseType)) {
            results.push({
              caseId,
              success: false,
              error: "Discharge calls cannot be scheduled for euthanasia or deceased cases",
            });
            continue;
          }

          const patient = Array.isArray(caseInfo.patient)
            ? caseInfo.patient[0]
            : caseInfo.patient;

          // Normalize contacts (with test mode override)
          let normalizedPhone = normalizeToE164(patient?.owner_phone);
          let normalizedEmail = normalizeEmail(patient?.owner_email);
          let recipientName = patient?.owner_name ?? null;

          if (testModeEnabled) {
            if (testContactPhone) {
              const normalizedTestPhone = normalizeToE164(testContactPhone);
              if (normalizedTestPhone) normalizedPhone = normalizedTestPhone;
            }
            if (testContactEmail) {
              const normalizedTestEmail = normalizeEmail(testContactEmail);
              if (normalizedTestEmail) normalizedEmail = normalizedTestEmail;
            }
            if (testContactName) {
              recipientName = testContactName;
            }
          }

          // Check if case can be scheduled
          const canSchedulePhone = input.phoneEnabled && !!normalizedPhone;
          const canScheduleEmail = input.emailEnabled && !!normalizedEmail;

          if (!canSchedulePhone && !canScheduleEmail) {
            results.push({
              caseId,
              success: false,
              error: "No valid contact information available",
            });
            continue;
          }

          // Check for existing discharge summary, generate if needed
          let summaryContent = caseInfo.dischargeSummaries?.[0]?.content ?? "";
          let summaryId = caseInfo.dischargeSummaries?.[0]?.id;
          let wasGenerated = false;

          if (!caseInfo.dischargeSummaries?.[0]) {
            // Generate discharge summary
            let soapContent: string | null = null;
            if (caseInfo.soapNotes && caseInfo.soapNotes.length > 0) {
              const latestSoapNote = caseInfo.soapNotes[0];
              if (latestSoapNote) {
                if (latestSoapNote.client_instructions) {
                  soapContent = latestSoapNote.client_instructions;
                } else {
                  const sections: string[] = [];
                  if (latestSoapNote.subjective)
                    sections.push(`Subjective:\n${latestSoapNote.subjective}`);
                  if (latestSoapNote.objective)
                    sections.push(`Objective:\n${latestSoapNote.objective}`);
                  if (latestSoapNote.assessment)
                    sections.push(`Assessment:\n${latestSoapNote.assessment}`);
                  if (latestSoapNote.plan)
                    sections.push(`Plan:\n${latestSoapNote.plan}`);
                  if (sections.length > 0) soapContent = sections.join("\n\n");
                }
              }
            }

            const entities = caseInfo.entities;
            const idexxMetadata = caseInfo.metadata as {
              idexx?: IdexxMetadata;
            } | null;

            // Use IDEXX notes as fallback
            if (!soapContent && idexxMetadata?.idexx?.consultation_notes) {
              soapContent = idexxMetadata.idexx.consultation_notes
                .replace(/<[^>]*>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/\s+/g, " ")
                .trim();
            } else if (!soapContent && idexxMetadata?.idexx?.notes) {
              soapContent = idexxMetadata.idexx.notes;
            }

            if (!soapContent && !entities) {
              results.push({
                caseId,
                success: false,
                error: "No clinical notes or entity data available for summary generation",
              });
              continue;
            }

            // Generate summary
            const generateStructuredDischargeSummaryWithRetry =
              await getGenerateStructuredDischargeSummaryWithRetry();
            const { structured, plainText } =
              await generateStructuredDischargeSummaryWithRetry({
                soapContent,
                entityExtraction: entities,
                patientData: {
                  name: patient?.name ?? entities?.patient?.name ?? undefined,
                  species: patient?.species ?? entities?.patient?.species ?? undefined,
                  breed: patient?.breed ?? entities?.patient?.breed ?? undefined,
                  owner_name:
                    patient?.owner_name ?? entities?.patient?.owner?.name ?? undefined,
                },
              });

            // Save summary
            const { data: newSummary, error: summaryError } = await ctx.supabase
              .from("discharge_summaries")
              .insert({
                case_id: caseId,
                user_id: userId,
                content: plainText,
                structured_content: structured as unknown as Json,
              })
              .select("id, content")
              .single();

            if (summaryError || !newSummary) {
              results.push({
                caseId,
                success: false,
                error: "Failed to save generated discharge summary",
              });
              continue;
            }

            summaryContent = newSummary.content;
            summaryId = newSummary.id;
            wasGenerated = true;
          }

          // Calculate schedule times
          let emailScheduledFor: Date | null = null;
          let callScheduledFor: Date | null = null;

          if (input.timingMode === "immediate") {
            // Staggered immediate scheduling
            if (canScheduleEmail) {
              emailScheduledFor = new Date(now.getTime() + emailOffset);
              emailOffset += staggerMs;
            }
            if (canSchedulePhone) {
              // Call goes after email with additional stagger
              callScheduledFor = new Date(
                now.getTime() + (canScheduleEmail ? emailOffset : callOffset) + staggerMs,
              );
              callOffset = canScheduleEmail ? emailOffset : callOffset + staggerMs;
            }
          } else {
            // Scheduled mode - use delay settings
            if (canScheduleEmail) {
              emailScheduledFor = calculateScheduleTime(
                now,
                emailDelayDays,
                preferredEmailTime,
              );
            }
            if (canSchedulePhone) {
              callScheduledFor = calculateScheduleTime(
                now,
                callDelayDays,
                preferredCallTime,
              );
            }
          }

          const result: BatchScheduleResult = {
            caseId,
            success: true,
            summaryGenerated: wasGenerated,
          };

          // Schedule email
          if (canScheduleEmail && emailScheduledFor) {
            const { data: dischargeSummaryData } = await ctx.supabase
              .from("discharge_summaries")
              .select("content, structured_content")
              .eq("id", summaryId!)
              .single();

            const structuredContent = dischargeSummaryData?.structured_content;

            const { createClinicBranding } = await import(
              "@odis-ai/types/clinic-branding"
            );
            const branding = createClinicBranding({
              clinicName: clinic?.name ?? userSettings?.clinic_name ?? undefined,
              clinicPhone: clinic?.phone ?? userSettings?.clinic_phone ?? undefined,
              clinicEmail: clinic?.email ?? undefined,
              primaryColor: clinic?.primary_color ?? undefined,
              logoUrl: clinic?.logo_url ?? undefined,
              emailHeaderText: clinic?.email_header_text ?? undefined,
              emailFooterText: clinic?.email_footer_text ?? undefined,
            });

            const { generateDischargeEmailContent } = await import(
              "@odis-ai/services-discharge"
            );
            const emailContent = await generateDischargeEmailContent(
              summaryContent,
              patient?.name ?? "your pet",
              patient?.species ?? undefined,
              patient?.breed ?? undefined,
              branding,
              structuredContent as never,
              null,
            );

            const { data: emailData, error: emailError } = await ctx.supabase
              .from("scheduled_discharge_emails")
              .insert({
                user_id: userId,
                case_id: caseId,
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

            if (!emailError && emailData) {
              try {
                const qstashMessageId = await scheduleEmailExecution(
                  emailData.id,
                  emailScheduledFor,
                );

                await ctx.supabase
                  .from("scheduled_discharge_emails")
                  .update({ qstash_message_id: qstashMessageId })
                  .eq("id", emailData.id);

                result.emailScheduled = true;
                result.emailScheduledFor = emailScheduledFor.toISOString();
              } catch (qstashError) {
                // Rollback email record
                await ctx.supabase
                  .from("scheduled_discharge_emails")
                  .delete()
                  .eq("id", emailData.id);
                console.error("[BatchSchedule] Failed to schedule email via QStash:", {
                  caseId,
                  error:
                    qstashError instanceof Error
                      ? qstashError.message
                      : String(qstashError),
                });
              }
            }
          }

          // Schedule call
          if (canSchedulePhone && callScheduledFor) {
            // Ensure entities exist
            let entities = caseInfo.entities;
            const idexxMetadata = caseInfo.metadata as {
              idexx?: IdexxMetadata;
            } | null;

            if (!entities && idexxMetadata?.idexx) {
              const aiEntities = await CasesService.extractEntitiesFromIdexx(
                idexxMetadata.idexx as Record<string, unknown>,
              );

              if (aiEntities) {
                entities = aiEntities;
              } else {
                entities = buildEntitiesFromIdexxMetadata(
                  idexxMetadata.idexx,
                  patient ?? null,
                );
              }

              // Save entities
              await ctx.supabase
                .from("cases")
                .update({ entity_extraction: entities as unknown as Json })
                .eq("id", caseId);
            }

            try {
              const scheduledCall = await CasesService.scheduleDischargeCall(
                ctx.supabase,
                userId,
                caseId,
                {
                  scheduledAt: callScheduledFor,
                  summaryContent,
                  clinicName,
                  clinicPhone,
                  emergencyPhone: clinicPhone,
                  agentName,
                },
              );

              result.callScheduled = true;
              result.callScheduledFor = scheduledCall.scheduled_for;
            } catch (scheduleError) {
              console.error("[BatchSchedule] Failed to schedule call:", {
                caseId,
                error:
                  scheduleError instanceof Error
                    ? scheduleError.message
                    : String(scheduleError),
              });
            }
          }

          // Check if at least one delivery was scheduled
          if (!result.emailScheduled && !result.callScheduled) {
            result.success = false;
            result.error = "Failed to schedule any delivery methods";
          }

          results.push(result);
        } catch (error) {
          results.push({
            caseId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          });
        }
      }

      const totalSuccess = results.filter((r) => r.success).length;
      const totalFailed = results.filter((r) => !r.success).length;

      console.log("[BatchSchedule] Completed batch scheduling", {
        totalProcessed: results.length,
        totalSuccess,
        totalFailed,
      });

      return {
        results,
        totalProcessed: results.length,
        totalSuccess,
        totalFailed,
      };
    }),
});
