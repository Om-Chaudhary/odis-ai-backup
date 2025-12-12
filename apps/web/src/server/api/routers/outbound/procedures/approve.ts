/**
 * Approve and Schedule Procedure
 *
 * Schedules discharge call and/or email for a case.
 * Auto-generates discharge summary if missing using SOAP notes or entity extraction.
 * Uses user-configured delay settings:
 * - email_delay_days (default 1): Days after approval to send email
 * - call_delay_days (default 2): Days after approval to make call
 * - preferred_email_start_time (default 09:00): Time of day for email
 * - preferred_call_start_time (default 14:00): Time of day for call
 */

import { TRPCError } from "@trpc/server";
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";
import { getClinicUserIds } from "@odis-ai/clinics/utils";
import { generateStructuredDischargeSummaryWithRetry } from "@odis-ai/ai/generate-structured-discharge";
import { normalizeToE164, normalizeEmail } from "@odis-ai/utils/phone";
import type { NormalizedEntities } from "@odis-ai/validators/scribe";
import type { Json } from "@odis-ai/types";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { approveAndScheduleInput } from "../schemas";

// Dynamic import for lazy-loaded library
const getCasesService = () =>
  import("@odis-ai/services-cases").then((m) => m.CasesService);

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
        userSettings?.preferred_email_start_time ?? "09:00";
      const preferredCallTime =
        userSettings?.preferred_call_start_time ?? "14:00";
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
        console.log("[Approve] Immediate delivery mode - scheduling for now", {
          caseId: input.caseId,
          phoneEnabled: input.phoneEnabled,
          emailEnabled: input.emailEnabled,
        });
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
      // In immediate mode, schedule for 30 seconds from now
      if (input.emailEnabled && normalizedEmail) {
        const emailScheduledFor = input.immediateDelivery
          ? new Date(now.getTime() + 30 * 1000) // 30 seconds from now
          : calculateScheduleTime(now, emailDelayDays, preferredEmailTime);

        const { data: emailData, error: emailError } = await ctx.supabase
          .from("scheduled_discharge_emails")
          .insert({
            user_id: userId,
            case_id: input.caseId,
            recipient_email: normalizedEmail, // Use normalized email (or test contact in test mode)
            recipient_name: recipientName,
            subject: `Discharge Instructions for ${patient?.name ?? "Your Pet"}`,
            html_content: summaryContent,
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

      // Schedule call if enabled and phone available (normalized to E.164)
      // Call goes out after email (typically 2 days after approval)
      // In immediate mode, schedule for 1 minute from now (slightly after email)
      if (input.phoneEnabled && normalizedPhone) {
        const callScheduledFor = input.immediateDelivery
          ? new Date(now.getTime() + 60 * 1000) // 1 minute from now
          : calculateScheduleTime(now, callDelayDays, preferredCallTime);

        const { data: callData, error: callError } = await ctx.supabase
          .from("scheduled_discharge_calls")
          .insert({
            user_id: userId,
            case_id: input.caseId,
            customer_phone: normalizedPhone, // Use normalized phone in E.164 format (or test contact in test mode)
            scheduled_for: callScheduledFor.toISOString(),
            status: "queued",
            dynamic_variables: {
              pet_name: patient?.name,
              owner_name: recipientName ?? patient?.owner_name,
              species: patient?.species,
              breed: patient?.breed,
              discharge_summary: summaryContent,
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
