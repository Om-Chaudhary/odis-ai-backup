/**
 * Approve and Schedule Procedure
 *
 * Schedules discharge call and/or email for a case.
 * Auto-generates discharge summary if missing using SOAP notes or entity extraction.
 * Uses user-configured delay settings:
 * - email_delay_days (default 1): Days after approval to send email
 * - call_delay_days (default 2): Days after approval to make call
 * - preferred_email_start_time (default 10:00): Time of day for email (business hours)
 * - preferred_call_start_time (default 16:00): Time of day for call (4-7 PM window)
 */

import { TRPCError } from "@trpc/server";
import { getClinicUserIds, getClinicByUserId } from "@odis-ai/clinics/utils";
import { normalizeToE164, normalizeEmail } from "@odis-ai/utils/phone";
import { calculateScheduleTime } from "@odis-ai/utils/timezone";
import { isBlockedExtremeCase } from "@odis-ai/utils/discharge-readiness";
import type { NormalizedEntities } from "@odis-ai/validators";
import type { Json } from "@odis-ai/types";
import { scheduleEmailExecution } from "@odis-ai/qstash";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { approveAndScheduleInput } from "../schemas";

// Dynamic imports for lazy-loaded libraries
const getCasesService = () =>
  import("@odis-ai/services-cases").then((m) => m.CasesService);
const getGenerateStructuredDischargeSummaryWithRetry = () =>
  import("@odis-ai/ai/generate-structured-discharge").then(
    (m) => m.generateStructuredDischargeSummaryWithRetry,
  );

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
 * (e.g., consultation_notes too short for AI extraction)
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
  // Build owner name from available sources
  let ownerName =
    idexx.client_name ?? idexx.owner_name ?? patient?.owner_name ?? "unknown";
  if (
    ownerName === "unknown" &&
    idexx.client_first_name &&
    idexx.client_last_name
  ) {
    ownerName = `${idexx.client_first_name} ${idexx.client_last_name}`.trim();
  }

  // Determine species
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

  // Parse procedures from products_services
  const procedures: string[] = [];
  if (idexx.products_services) {
    procedures.push(
      ...idexx.products_services
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  // Determine case type from appointment_type
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

  // Build clinical notes from available sources
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
    confidence: { overall: 0.7, patient: 0.7, clinical: 0.6 }, // Lower confidence since not AI-extracted
  };
}

export const approveRouter = createTRPCRouter({
  approveAndSchedule: protectedProcedure
    .input(approveAndScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Fetch user discharge settings (including test mode)
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select(
          "email_delay_days, call_delay_days, preferred_email_start_time, preferred_call_start_time, test_mode_enabled, test_contact_email, test_contact_phone, test_contact_name",
        )
        .eq("id", userId)
        .single();

      const emailDelayDays = userSettings?.email_delay_days ?? 1;
      const callDelayDays = userSettings?.call_delay_days ?? 2;
      const preferredEmailTime =
        userSettings?.preferred_email_start_time ?? "10:00"; // Default: 10 AM (business hours)
      const preferredCallTime =
        userSettings?.preferred_call_start_time ?? "16:00"; // Default: 4 PM (4-7 PM window)
      const testModeEnabled = userSettings?.test_mode_enabled ?? false;
      const testContactEmail = userSettings?.test_contact_email ?? null;
      const testContactPhone = userSettings?.test_contact_phone ?? null;
      const testContactName = userSettings?.test_contact_name ?? null;

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);

      // Verify case belongs to clinic
      const { data: caseCheck, error: caseCheckError } = await ctx.supabase
        .from("cases")
        .select("id, user_id")
        .eq("id", input.caseId)
        .in("user_id", clinicUserIds)
        .single();

      if (caseCheckError || !caseCheck) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      // Fetch case with all related data using CasesService
      const CasesService = await getCasesService();
      const caseInfo = await CasesService.getCaseWithEntities(
        ctx.supabase,
        input.caseId,
      );

      if (!caseInfo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      // Block scheduling for extreme cases (euthanasia, DOA, deceased, humane ending)
      // These cases should never receive follow-up calls
      const blockedCheck = isBlockedExtremeCase({
        caseType: caseInfo.entities?.caseType,
        dischargeSummary: caseInfo.dischargeSummaries?.[0]?.content,
        consultationNotes: (caseInfo.case.metadata as Record<string, unknown>)
          ?.idexx
          ? ((
              (caseInfo.case.metadata as Record<string, unknown>)
                ?.idexx as Record<string, unknown>
            )?.consultation_notes as string | undefined)
          : undefined,
        metadata: caseInfo.case.metadata as Record<string, unknown> | null,
      });
      if (blockedCheck.blocked) {
        console.warn("[Approve] Blocked extreme case", {
          caseId: input.caseId,
          reason: blockedCheck.reason,
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Discharge calls cannot be scheduled for euthanasia or deceased cases",
        });
      }

      const patient = Array.isArray(caseInfo.patient)
        ? caseInfo.patient[0]
        : caseInfo.patient;

      // Normalize phone and email to proper formats
      // Phone: E.164 format (+1XXXXXXXXXX for US numbers)
      // Email: lowercase, trimmed, validated
      let normalizedPhone = normalizeToE164(patient?.owner_phone);
      let normalizedEmail = normalizeEmail(patient?.owner_email);
      let recipientName = patient?.owner_name ?? null;

      // Test mode: Override with test contacts
      if (testModeEnabled) {
        console.log("[Approve] Test mode enabled - using test contacts", {
          caseId: input.caseId,
          testContactEmail,
          testContactPhone,
          originalEmail: patient?.owner_email,
          originalPhone: patient?.owner_phone,
        });

        // Override with test contacts if available
        if (testContactPhone) {
          const normalizedTestPhone = normalizeToE164(testContactPhone);
          if (normalizedTestPhone) {
            normalizedPhone = normalizedTestPhone;
          } else {
            console.warn("[Approve] Test mode: Invalid test phone format", {
              testContactPhone,
            });
          }
        }

        if (testContactEmail) {
          const normalizedTestEmail = normalizeEmail(testContactEmail);
          if (normalizedTestEmail) {
            normalizedEmail = normalizedTestEmail;
          } else {
            console.warn("[Approve] Test mode: Invalid test email format", {
              testContactEmail,
            });
          }
        }

        // Use test contact name if available
        if (testContactName) {
          recipientName = testContactName;
        }
      }

      // Log normalization results for debugging
      if (patient?.owner_phone && !normalizedPhone && !testModeEnabled) {
        console.warn(
          "[Approve] Invalid phone number format, cannot normalize",
          {
            caseId: input.caseId,
            originalPhone: patient.owner_phone,
          },
        );
      }
      if (patient?.owner_email && !normalizedEmail && !testModeEnabled) {
        console.warn("[Approve] Invalid email format, cannot normalize", {
          caseId: input.caseId,
          originalEmail: patient.owner_email,
        });
      }

      // Check for existing discharge summary
      const existingDischargeSummary = caseInfo.dischargeSummaries?.[0];
      let summaryContent = existingDischargeSummary?.content ?? "";
      let summaryId: string | undefined = existingDischargeSummary?.id;
      let wasGenerated = false;

      // Auto-generate discharge summary if missing
      if (!existingDischargeSummary) {
        console.log(
          "[Approve] No discharge summary found, auto-generating...",
          {
            caseId: input.caseId,
            hasSoapNotes: !!caseInfo.soapNotes?.length,
            hasEntities: !!caseInfo.entities,
          },
        );

        // Step 1: Extract SOAP content from soap_notes
        let soapContent: string | null = null;
        if (caseInfo.soapNotes && caseInfo.soapNotes.length > 0) {
          const latestSoapNote = caseInfo.soapNotes[0];
          if (latestSoapNote) {
            // Priority 1: client_instructions
            if (latestSoapNote.client_instructions) {
              soapContent = latestSoapNote.client_instructions;
              console.log(
                "[Approve] Using client_instructions from SOAP notes",
              );
            } else {
              // Priority 2: Combine SOAP sections
              const sections: string[] = [];
              if (latestSoapNote.subjective) {
                sections.push(`Subjective:\n${latestSoapNote.subjective}`);
              }
              if (latestSoapNote.objective) {
                sections.push(`Objective:\n${latestSoapNote.objective}`);
              }
              if (latestSoapNote.assessment) {
                sections.push(`Assessment:\n${latestSoapNote.assessment}`);
              }
              if (latestSoapNote.plan) {
                sections.push(`Plan:\n${latestSoapNote.plan}`);
              }
              if (sections.length > 0) {
                soapContent = sections.join("\n\n");
                console.log("[Approve] Using combined SOAP sections");
              }
            }
          }
        }

        // Step 2: Get and enrich entities
        const entities: NormalizedEntities | null = caseInfo.entities ?? null;

        // Enrich entities with patient data if available
        if (entities && patient) {
          CasesService.enrichEntitiesWithPatient(entities, patient);
        }

        // Enrich with IDEXX metadata if patient name is missing
        // Also use IDEXX consultation_notes as fallback for SOAP content
        const idexxMetadata = caseInfo.metadata as {
          idexx?: {
            pet_name?: string;
            species?: string;
            client_first_name?: string;
            client_last_name?: string;
            owner_name?: string;
            notes?: string;
            consultation_notes?: string;
          };
        } | null;

        if (idexxMetadata?.idexx) {
          const idexx = idexxMetadata.idexx;

          // Enrich entities with patient name if missing
          if (
            entities &&
            (!entities.patient?.name || entities.patient.name === "unknown")
          ) {
            if (idexx.pet_name?.trim()) {
              entities.patient.name = idexx.pet_name;
            }
            if (
              (!entities.patient.owner.name ||
                entities.patient.owner.name === "unknown") &&
              (idexx.owner_name ||
                (idexx.client_first_name && idexx.client_last_name))
            ) {
              entities.patient.owner.name =
                idexx.owner_name ??
                `${idexx.client_first_name} ${idexx.client_last_name}`.trim();
            }
          }

          // Use IDEXX consultation_notes (rich clinical data) or notes as fallback for SOAP content
          if (!soapContent) {
            if (idexx.consultation_notes) {
              // Strip HTML tags from consultation_notes
              soapContent = idexx.consultation_notes
                .replace(/<[^>]*>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/\s+/g, " ")
                .trim();
              console.log(
                "[Approve] Using IDEXX consultation_notes as fallback",
              );
            } else if (idexx.notes) {
              soapContent = idexx.notes;
              console.log("[Approve] Using IDEXX notes as fallback");
            }
          }
        }

        // Validate we have enough data to generate
        if (!soapContent && !entities) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot generate discharge summary: No clinical notes or entity data available",
          });
        }

        // Step 3: Generate discharge summary
        console.log("[Approve] Generating structured discharge summary...", {
          caseId: input.caseId,
          hasSoapContent: !!soapContent,
          hasEntities: !!entities,
          patientName: patient?.name ?? entities?.patient?.name,
        });

        const generateStructuredDischargeSummaryWithRetry =
          await getGenerateStructuredDischargeSummaryWithRetry();
        const { structured, plainText } =
          await generateStructuredDischargeSummaryWithRetry({
            soapContent,
            entityExtraction: entities,
            patientData: {
              name: patient?.name ?? entities?.patient?.name ?? undefined,
              species:
                patient?.species ?? entities?.patient?.species ?? undefined,
              breed: patient?.breed ?? entities?.patient?.breed ?? undefined,
              owner_name:
                patient?.owner_name ??
                entities?.patient?.owner?.name ??
                undefined,
            },
          });

        // Step 4: Save to database
        const { data: newSummary, error: summaryError } = await ctx.supabase
          .from("discharge_summaries")
          .insert({
            case_id: input.caseId,
            user_id: userId,
            content: plainText,
            structured_content: structured as unknown as Json,
          })
          .select("id, content, structured_content")
          .single();

        if (summaryError || !newSummary) {
          console.error(
            "[Approve] Failed to save generated summary:",
            summaryError,
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save generated discharge summary",
          });
        }

        console.log(
          "[Approve] Successfully generated and saved discharge summary",
          {
            caseId: input.caseId,
            summaryId: newSummary.id,
          },
        );

        summaryContent = newSummary.content;
        summaryId = newSummary.id;
        wasGenerated = true;
      }

      const now = new Date();

      // Log if immediate delivery mode is being used
      if (input.immediateDelivery) {
        console.log(
          "[Approve] Immediate delivery mode - scheduling via queue",
          {
            caseId: input.caseId,
            phoneEnabled: input.phoneEnabled,
            emailEnabled: input.emailEnabled,
            emailDelay: "1 minute",
            callDelay: "2 minutes",
          },
        );
      }

      const results: {
        callScheduled: boolean;
        emailScheduled: boolean;
        summaryGenerated: boolean;
        callId?: string;
        emailId?: string;
        emailScheduledFor?: string;
        callScheduledFor?: string;
        summaryId?: string;
      } = {
        callScheduled: false,
        emailScheduled: false,
        summaryGenerated: wasGenerated,
        summaryId,
      };

      // Schedule email if enabled and email available (normalized)
      // Email goes out first (typically 1 day after approval)
      // In immediate mode, schedule via QStash with 1 minute delay
      if (input.emailEnabled && normalizedEmail) {
        const emailScheduledFor = input.immediateDelivery
          ? new Date(now.getTime() + 60 * 1000) // 1 minute delay for immediate
          : calculateScheduleTime(now, emailDelayDays, preferredEmailTime);

        // Generate formatted email content using DischargeEmailTemplate
        // First, get structured content from the discharge summary
        const { data: dischargeSummaryData } = await ctx.supabase
          .from("discharge_summaries")
          .select("content, structured_content")
          .eq("id", summaryId!)
          .single();

        const structuredContent = dischargeSummaryData?.structured_content;

        // Get clinic branding for email template
        const clinic = await getClinicByUserId(userId, ctx.supabase);
        const { data: userData } = await ctx.supabase
          .from("users")
          .select("clinic_name, clinic_phone, clinic_email")
          .eq("id", userId)
          .single();

        // Import branding helper
        const { createClinicBranding } =
          await import("@odis-ai/types/clinic-branding");
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
          await import("@odis-ai/services-discharge");
        const emailContent = await generateDischargeEmailContent(
          summaryContent,
          patient?.name ?? "your pet",
          patient?.species ?? undefined,
          patient?.breed ?? undefined,
          branding,
          structuredContent as never, // Type assertion to satisfy StructuredDischargeSummary
          null,
        );

        console.log("[Approve] Generated formatted email content", {
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
            recipient_email: normalizedEmail, // Use normalized email (or test contact in test mode)
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
          console.error("[Approve] Failed to schedule email:", emailError);
        } else {
          // Schedule via QStash (both immediate and normal modes use the queue)
          try {
            const qstashMessageId = await scheduleEmailExecution(
              emailData.id,
              emailScheduledFor,
            );

            // Update email record with QStash message ID
            await ctx.supabase
              .from("scheduled_discharge_emails")
              .update({ qstash_message_id: qstashMessageId })
              .eq("id", emailData.id);

            console.log("[Approve] Email scheduled via QStash", {
              emailId: emailData.id,
              qstashMessageId,
              scheduledFor: emailScheduledFor.toISOString(),
              immediateMode: input.immediateDelivery,
            });
          } catch (qstashError) {
            console.error("[Approve] Failed to schedule email via QStash:", {
              emailId: emailData.id,
              error:
                qstashError instanceof Error
                  ? qstashError.message
                  : String(qstashError),
            });

            // Rollback: delete the email record since QStash scheduling failed
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
      }

      // Schedule call if enabled and phone available (normalized to E.164)
      // Call goes out after email (typically 2 days after approval)
      // In immediate mode, schedule via QStash with 2 minute delay (after email)
      if (input.phoneEnabled && normalizedPhone) {
        const callScheduledFor = input.immediateDelivery
          ? new Date(now.getTime() + 2 * 60 * 1000) // 2 minute delay for immediate (after email)
          : calculateScheduleTime(now, callDelayDays, preferredCallTime);

        // Get clinic data for call variables
        const clinic = await getClinicByUserId(userId, ctx.supabase);

        // Get user's first name for agent name
        const { data: userInfo } = await ctx.supabase
          .from("users")
          .select("first_name, clinic_name, clinic_phone")
          .eq("id", userId)
          .single();

        // Step 1: Ensure entities exist for proper variable extraction
        // If entities are missing, extract from IDEXX metadata
        let entities = caseInfo.entities;

        // Get IDEXX metadata for entity extraction
        const idexxMetadata = caseInfo.metadata as {
          idexx?: IdexxMetadata;
        } | null;

        if (!entities && idexxMetadata?.idexx) {
          console.log(
            "[Approve] No entities found, extracting from IDEXX metadata",
            {
              caseId: input.caseId,
              hasConsultationNotes: !!idexxMetadata.idexx.consultation_notes,
              hasProductsServices: !!idexxMetadata.idexx.products_services,
            },
          );

          // Try AI extraction first (CasesService.extractEntitiesFromIdexx)
          const aiEntities = await CasesService.extractEntitiesFromIdexx(
            idexxMetadata.idexx as Record<string, unknown>,
          );

          if (aiEntities) {
            entities = aiEntities;
            console.log("[Approve] AI extraction successful", {
              caseId: input.caseId,
              patientName: entities.patient.name,
              confidence: entities.confidence?.overall,
            });
          } else {
            // Fall back to building entities from IDEXX metadata directly
            entities = buildEntitiesFromIdexxMetadata(
              idexxMetadata.idexx,
              patient ?? null,
            );
            console.log("[Approve] Built entities from IDEXX metadata", {
              caseId: input.caseId,
              patientName: entities.patient.name,
              visitReason: entities.clinical.visitReason,
              procedures: entities.clinical.procedures,
            });
          }

          // Save entities to case for future use
          const { error: updateError } = await ctx.supabase
            .from("cases")
            .update({ entity_extraction: entities as unknown as Json })
            .eq("id", input.caseId);

          if (updateError) {
            console.error(
              "[Approve] Failed to save extracted entities:",
              updateError,
            );
            // Don't throw - continue with scheduling
          } else {
            console.log("[Approve] Saved extracted entities to case", {
              caseId: input.caseId,
            });
          }
        }

        // Step 2: Use CasesService.scheduleDischargeCall for complete variable extraction
        // This will:
        // - Extract all entity variables (patient_species, primary_diagnosis, medication_names, etc.)
        // - Generate AI call intelligence (assessment_questions, emergency_criteria, etc.)
        // - Add clinic configuration (clinic_name, clinic_phone, emergency_phone)
        // - Handle QStash scheduling
        try {
          const clinicName =
            clinic?.name ?? userInfo?.clinic_name ?? "Your Clinic";
          const clinicPhone = clinic?.phone ?? userInfo?.clinic_phone ?? "";
          const agentName = userInfo?.first_name ?? "Sarah";

          console.log(
            "[Approve] Scheduling call via CasesService with full variable extraction",
            {
              caseId: input.caseId,
              clinicName,
              hasEntities: !!entities,
              scheduledFor: callScheduledFor.toISOString(),
            },
          );

          const scheduledCall = await CasesService.scheduleDischargeCall(
            ctx.supabase,
            userId,
            input.caseId,
            {
              scheduledAt: callScheduledFor,
              summaryContent,
              clinicName,
              clinicPhone,
              emergencyPhone: clinicPhone, // Use clinic phone as emergency phone
              agentName,
            },
          );

          console.log("[Approve] Call scheduled via CasesService", {
            callId: scheduledCall.id,
            scheduledFor: scheduledCall.scheduled_for,
            variableCount: Object.keys(scheduledCall.dynamic_variables ?? {})
              .length,
          });

          results.callScheduled = true;
          results.callId = scheduledCall.id;
          results.callScheduledFor = scheduledCall.scheduled_for;
        } catch (scheduleError) {
          console.error("[Approve] Failed to schedule call via CasesService:", {
            caseId: input.caseId,
            error:
              scheduleError instanceof Error
                ? scheduleError.message
                : String(scheduleError),
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to schedule call delivery",
          });
        }
      }

      if (!results.callScheduled && !results.emailScheduled) {
        // Provide specific error message based on what failed
        const issues: string[] = [];

        if (input.phoneEnabled) {
          if (!patient?.owner_phone) {
            issues.push("No phone number on file");
          } else if (!normalizedPhone) {
            issues.push(`Invalid phone format: "${patient.owner_phone}"`);
          }
        }

        if (input.emailEnabled) {
          if (!patient?.owner_email) {
            issues.push("No email address on file");
          } else if (!normalizedEmail) {
            issues.push(`Invalid email format: "${patient.owner_email}"`);
          }
        }

        if (!input.phoneEnabled && !input.emailEnabled) {
          issues.push("Both phone and email delivery are disabled");
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
