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
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";
import { getClinicUserIds } from "@odis-ai/clinics/utils";
import { generateStructuredDischargeSummaryWithRetry } from "@odis-ai/ai/generate-structured-discharge";
import { normalizeToE164, normalizeEmail } from "@odis-ai/utils/phone";
import type { NormalizedEntities } from "@odis-ai/validators/scribe";
import type { Json } from "@odis-ai/types";
import { scheduleEmailExecution, scheduleCallExecution } from "@odis-ai/qstash";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { approveAndScheduleInput } from "../schemas";

// Dynamic imports for lazy-loaded libraries
const getCasesService = () =>
  import("@odis-ai/services-cases").then((m) => m.CasesService);

const getEmailExecutor = () =>
  import("@odis-ai/services-discharge/email-executor").then(
    (m) => m.executeScheduledEmail,
  );

const getCallExecutor = () =>
  import("@odis-ai/services-discharge/call-executor").then(
    (m) => m.executeScheduledCall,
  );

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
      // In immediate mode, execute directly without QStash delay
      if (input.emailEnabled && normalizedEmail) {
        const emailScheduledFor = input.immediateDelivery
          ? new Date(now.getTime() + 5 * 1000) // 5 seconds buffer for immediate
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
          // Execute immediately or schedule via QStash
          if (input.immediateDelivery) {
            // Immediate mode: execute email directly
            console.log("[Approve] Immediate delivery - executing email now", {
              emailId: emailData.id,
              recipientEmail: normalizedEmail,
            });

            try {
              const executeScheduledEmail = await getEmailExecutor();
              const result = await executeScheduledEmail(
                emailData.id,
                ctx.supabase,
              );
              if (!result.success) {
                console.error("[Approve] Immediate email execution failed:", {
                  emailId: emailData.id,
                  error: result.error,
                });
                // Don't throw - email record was created, just execution failed
              }
            } catch (execError) {
              console.error("[Approve] Immediate email execution error:", {
                emailId: emailData.id,
                error:
                  execError instanceof Error
                    ? execError.message
                    : String(execError),
              });
              // Don't throw - email record was created
            }
          } else {
            // Normal mode: schedule via QStash for delayed execution
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
          }

          results.emailScheduled = true;
          results.emailId = emailData.id;
          results.emailScheduledFor = emailScheduledFor.toISOString();
        }
      }

      // Schedule call if enabled and phone available (normalized to E.164)
      // Call goes out after email (typically 2 days after approval)
      // In immediate mode, execute directly without QStash delay
      if (input.phoneEnabled && normalizedPhone) {
        const callScheduledFor = input.immediateDelivery
          ? new Date(now.getTime() + 10 * 1000) // 10 seconds buffer for immediate
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
          .select("id, metadata")
          .single();

        if (callError) {
          console.error("[Approve] Failed to schedule call:", callError);
        } else {
          // Execute immediately or schedule via QStash
          if (input.immediateDelivery) {
            // Immediate mode: execute call directly
            console.log("[Approve] Immediate delivery - executing call now", {
              callId: callData.id,
              customerPhone: normalizedPhone,
            });

            try {
              const executeScheduledCall = await getCallExecutor();
              const result = await executeScheduledCall(
                callData.id,
                ctx.supabase,
              );
              if (!result.success) {
                console.error("[Approve] Immediate call execution failed:", {
                  callId: callData.id,
                  error: result.error,
                });
                // Don't throw - call record was created, just execution failed
              }
            } catch (execError) {
              console.error("[Approve] Immediate call execution error:", {
                callId: callData.id,
                error:
                  execError instanceof Error
                    ? execError.message
                    : String(execError),
              });
              // Don't throw - call record was created
            }
          } else {
            // Normal mode: schedule via QStash for delayed execution
            try {
              const qstashMessageId = await scheduleCallExecution(
                callData.id,
                callScheduledFor,
              );

              // Update call record with QStash message ID in metadata
              const updatedMetadata = {
                ...(callData.metadata as Record<string, unknown> | null),
                qstash_message_id: qstashMessageId,
              };

              await ctx.supabase
                .from("scheduled_discharge_calls")
                .update({ metadata: updatedMetadata })
                .eq("id", callData.id);

              console.log("[Approve] Call scheduled via QStash", {
                callId: callData.id,
                qstashMessageId,
                scheduledFor: callScheduledFor.toISOString(),
              });
            } catch (qstashError) {
              console.error("[Approve] Failed to schedule call via QStash:", {
                callId: callData.id,
                error:
                  qstashError instanceof Error
                    ? qstashError.message
                    : String(qstashError),
              });

              // Rollback: delete the call record since QStash scheduling failed
              await ctx.supabase
                .from("scheduled_discharge_calls")
                .delete()
                .eq("id", callData.id);

              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to schedule call delivery",
              });
            }
          }

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
