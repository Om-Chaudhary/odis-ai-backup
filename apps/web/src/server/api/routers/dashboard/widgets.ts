/**
 * Dashboard Widgets Procedures
 *
 * New procedures for critical actions, outbound success, failed calls, and voicemail tracking.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { startOfDay, subHours } from "date-fns";
import {
  getClinicUserIds,
  getClinicBySlug,
  getClinicByUserId,
  userHasClinicAccess,
  getClinicUserIdsEnhanced,
} from "@odis-ai/domain/clinics";
import { TRPCError } from "@trpc/server";

// Type for call analysis structure
interface CallAnalysisStructuredData {
  needsAttention?: {
    flagged?: boolean;
    type?: string;
    severity?: string;
    summary?: string;
  };
  wentToVoicemail?: boolean;
  appointmentScheduled?: boolean;
}

interface CallAnalysis {
  summary?: string;
  structuredData?: CallAnalysisStructuredData;
  successEvaluation?: boolean | string;
}

export const widgetsRouter = createTRPCRouter({
  /**
   * Get critical actions that need immediate attention
   */
  getCriticalActions: protectedProcedure
    .input(z.object({ clinicSlug: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input?.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const last24Hours = subHours(new Date(), 24);

      // Get cases missing contact info (clinic-scoped)
      const { data: casesWithMissingContact } = await ctx.supabase
        .from("cases")
        .select(
          `
        id,
        status,
        created_at,
        patients(id, name, owner_name, owner_phone, owner_email)
      `,
        )
        .in("user_id", clinicUserIds)
        .in("status", ["ongoing", "draft"]);

      const missingContactCases =
        casesWithMissingContact?.filter((c) => {
          const patient = Array.isArray(c.patients)
            ? c.patients[0]
            : c.patients;
          if (!patient) return true;
          return !patient.owner_phone && !patient.owner_email;
        }) ?? [];

      // Get failed calls in last 24 hours (clinic-scoped)
      const { data: failedCalls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          `
        id,
        status,
        created_at,
        scheduled_for,
        dynamic_variables,
        case_id,
        cases(id, patients(name, owner_name))
      `,
        )
        .in("user_id", clinicUserIds)
        .eq("status", "failed")
        .gte("created_at", last24Hours.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      // Get calls with health concerns or emergency flags (clinic-scoped)
      const { data: concernCalls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          `
        id,
        status,
        ended_at,
        call_analysis,
        dynamic_variables,
        case_id,
        cases(id, patients(name, owner_name))
      `,
        )
        .in("user_id", clinicUserIds)
        .eq("status", "completed")
        .gte("ended_at", last24Hours.toISOString())
        .order("ended_at", { ascending: false });

      // Filter for health concerns, emergency signs, or dissatisfaction
      const healthConcernCalls =
        concernCalls?.filter((call) => {
          const analysis = call.call_analysis as CallAnalysis | null;
          const structuredData = analysis?.structuredData;
          if (!structuredData?.needsAttention?.flagged) return false;
          const type = structuredData.needsAttention.type?.toLowerCase() ?? "";
          return (
            type.includes("health") ||
            type.includes("emergency") ||
            type.includes("dissatisfaction")
          );
        }) ?? [];

      // Get callback requests
      const callbackRequests =
        concernCalls?.filter((call) => {
          const analysis = call.call_analysis as CallAnalysis | null;
          const structuredData = analysis?.structuredData;
          return (
            structuredData?.needsAttention?.flagged &&
            structuredData.needsAttention.type
              ?.toLowerCase()
              .includes("callback")
          );
        }) ?? [];

      const totalCritical =
        missingContactCases.length +
        (failedCalls?.length ?? 0) +
        healthConcernCalls.length;

      return {
        totalCritical,
        missingContact: {
          count: missingContactCases.length,
          cases: missingContactCases.slice(0, 5).map((c) => {
            const patient = Array.isArray(c.patients)
              ? c.patients[0]
              : c.patients;
            return {
              id: c.id,
              petName: patient?.name ?? "Unknown",
              ownerName: patient?.owner_name ?? "Unknown",
              createdAt: c.created_at,
            };
          }),
        },
        failedCalls: {
          count: failedCalls?.length ?? 0,
          calls:
            failedCalls?.slice(0, 5).map((call) => {
              const caseData = Array.isArray(call.cases)
                ? call.cases[0]
                : call.cases;
              const patient = caseData?.patients
                ? Array.isArray(caseData.patients)
                  ? caseData.patients[0]
                  : caseData.patients
                : null;
              const dynamicVars = call.dynamic_variables as Record<
                string,
                string
              > | null;
              return {
                id: call.id,
                caseId: call.case_id,
                petName: dynamicVars?.pet_name ?? patient?.name ?? "Unknown",
                ownerName:
                  dynamicVars?.owner_name ?? patient?.owner_name ?? "Unknown",
                scheduledFor: call.scheduled_for,
                createdAt: call.created_at,
              };
            }) ?? [],
        },
        healthConcerns: {
          count: healthConcernCalls.length,
          calls: healthConcernCalls.slice(0, 5).map((call) => {
            const caseData = Array.isArray(call.cases)
              ? call.cases[0]
              : call.cases;
            const patient = caseData?.patients
              ? Array.isArray(caseData.patients)
                ? caseData.patients[0]
                : caseData.patients
              : null;
            const dynamicVars = call.dynamic_variables as Record<
              string,
              string
            > | null;
            const analysis = call.call_analysis as CallAnalysis | null;
            return {
              id: call.id,
              caseId: call.case_id,
              petName: dynamicVars?.pet_name ?? patient?.name ?? "Unknown",
              ownerName:
                dynamicVars?.owner_name ?? patient?.owner_name ?? "Unknown",
              concernType:
                analysis?.structuredData?.needsAttention?.type ?? "Unknown",
              severity:
                analysis?.structuredData?.needsAttention?.severity ?? "routine",
              summary:
                analysis?.structuredData?.needsAttention?.summary ??
                analysis?.summary ??
                "",
              endedAt: call.ended_at,
            };
          }),
        },
        callbackRequests: {
          count: callbackRequests.length,
          calls: callbackRequests.slice(0, 5).map((call) => {
            const caseData = Array.isArray(call.cases)
              ? call.cases[0]
              : call.cases;
            const patient = caseData?.patients
              ? Array.isArray(caseData.patients)
                ? caseData.patients[0]
                : caseData.patients
              : null;
            const dynamicVars = call.dynamic_variables as Record<
              string,
              string
            > | null;
            return {
              id: call.id,
              caseId: call.case_id,
              petName: dynamicVars?.pet_name ?? patient?.name ?? "Unknown",
              ownerName:
                dynamicVars?.owner_name ?? patient?.owner_name ?? "Unknown",
              endedAt: call.ended_at,
            };
          }),
        },
      };
    }),

  /**
   * Get today's outbound success metrics
   */
  getTodayOutboundSuccess: protectedProcedure
    .input(z.object({ clinicSlug: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input?.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const todayStart = startOfDay(new Date());

      // Get user's test mode setting
      const { data: user } = await ctx.supabase
        .from("users")
        .select("test_mode_enabled")
        .eq("id", userId)
        .single();

      const testModeEnabled = user?.test_mode_enabled ?? false;

      // Get all calls from today (clinic-scoped)
      const { data: allCalls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          "id, status, duration_seconds, cost, call_analysis, success_evaluation, metadata",
        )
        .in("user_id", clinicUserIds)
        .gte("created_at", todayStart.toISOString());

      // Filter out test calls when test mode is disabled
      const calls = testModeEnabled
        ? allCalls
        : allCalls?.filter((call) => {
            const metadata = call.metadata as { test_call?: boolean } | null;
            return metadata?.test_call !== true;
          });

      // Get all emails from today (clinic-scoped)
      const { data: emails } = await ctx.supabase
        .from("scheduled_discharge_emails")
        .select("id, status")
        .in("user_id", clinicUserIds)
        .gte("created_at", todayStart.toISOString());

      const totalCalls = calls?.length ?? 0;
      const completedCalls =
        calls?.filter((c) => c.status === "completed").length ?? 0;
      const failedCalls =
        calls?.filter((c) => c.status === "failed").length ?? 0;
      const queuedCalls =
        calls?.filter((c) => c.status === "queued" || c.status === "ringing")
          .length ?? 0;

      // Calculate voicemail rate from completed calls
      const voicemailCalls =
        calls?.filter((c) => {
          if (c.status !== "completed") return false;
          const analysis = c.call_analysis as CallAnalysis | null;
          return analysis?.structuredData?.wentToVoicemail === true;
        }).length ?? 0;

      const voicemailRate =
        completedCalls > 0
          ? Math.round((voicemailCalls / completedCalls) * 100)
          : 0;

      // Calculate success rate from completed calls
      const successfulCalls =
        calls?.filter((c) => {
          if (c.status !== "completed") return false;
          return c.success_evaluation === "true";
        }).length ?? 0;

      const successRate =
        completedCalls > 0
          ? Math.round((successfulCalls / completedCalls) * 100)
          : 0;

      // Calculate costs
      const totalCost =
        calls?.reduce((sum, c) => sum + (Number(c.cost) ?? 0), 0) ?? 0;
      const costPerSuccess =
        successfulCalls > 0 ? totalCost / successfulCalls : 0;

      // Calculate average duration
      const completedCallsData = calls?.filter((c) => c.status === "completed");
      const totalDuration =
        completedCallsData?.reduce(
          (sum, c) => sum + (c.duration_seconds ?? 0),
          0,
        ) ?? 0;
      const avgDuration =
        completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0;

      // Email stats
      const totalEmails = emails?.length ?? 0;
      const sentEmails = emails?.filter((e) => e.status === "sent").length ?? 0;
      const failedEmails =
        emails?.filter((e) => e.status === "failed").length ?? 0;
      const queuedEmails =
        emails?.filter((e) => e.status === "queued").length ?? 0;

      const emailSuccessRate =
        sentEmails + failedEmails > 0
          ? Math.round((sentEmails / (sentEmails + failedEmails)) * 100)
          : 0;

      return {
        calls: {
          total: totalCalls,
          completed: completedCalls,
          failed: failedCalls,
          queued: queuedCalls,
          voicemails: voicemailCalls,
          voicemailRate,
          successRate,
          avgDuration,
          totalCost: Math.round(totalCost * 100) / 100,
          costPerSuccess: Math.round(costPerSuccess * 100) / 100,
        },
        emails: {
          total: totalEmails,
          sent: sentEmails,
          failed: failedEmails,
          queued: queuedEmails,
          successRate: emailSuccessRate,
        },
        combined: {
          totalAttempts: totalCalls + totalEmails,
          successfulContacts: successfulCalls + sentEmails,
          failedContacts: failedCalls + failedEmails,
          overallSuccessRate:
            totalCalls + totalEmails > 0
              ? Math.round(
                  ((successfulCalls + sentEmails) /
                    (totalCalls + totalEmails)) *
                    100,
                )
              : 0,
        },
      };
    }),

  /**
   * Get failed calls details for the tracker
   */
  getFailedCalls: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        hoursBack: z.number().min(1).max(168).optional().default(48), // Default 48 hours
        clinicSlug: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const cutoffTime = subHours(new Date(), input.hoursBack);

      const { data: failedCalls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          `
          id,
          status,
          created_at,
          scheduled_for,
          duration_seconds,
          cost,
          dynamic_variables,
          case_id,
          cases(
            id,
            type,
            patients(name, owner_name, owner_phone, owner_email, species)
          )
        `,
        )
        .in("user_id", clinicUserIds)
        .eq("status", "failed")
        .gte("created_at", cutoffTime.toISOString())
        .order("created_at", { ascending: false })
        .limit(input.limit);

      // Also get count of all failed calls in period (clinic-scoped)
      const { count: totalCount } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select("id", { count: "exact", head: true })
        .in("user_id", clinicUserIds)
        .eq("status", "failed")
        .gte("created_at", cutoffTime.toISOString());

      // Calculate wasted cost
      const wastedCost =
        failedCalls?.reduce((sum, c) => sum + (Number(c.cost) ?? 0), 0) ?? 0;

      return {
        totalCount: totalCount ?? 0,
        wastedCost: Math.round(wastedCost * 100) / 100,
        calls:
          failedCalls?.map((call) => {
            const caseData = Array.isArray(call.cases)
              ? call.cases[0]
              : call.cases;
            const patient = caseData?.patients
              ? Array.isArray(caseData.patients)
                ? caseData.patients[0]
                : caseData.patients
              : null;
            const dynamicVars = call.dynamic_variables as Record<
              string,
              string
            > | null;

            return {
              id: call.id,
              caseId: call.case_id,
              caseType: caseData?.type ?? "checkup",
              petName: dynamicVars?.pet_name ?? patient?.name ?? "Unknown",
              ownerName:
                dynamicVars?.owner_name ?? patient?.owner_name ?? "Unknown",
              ownerPhone: patient?.owner_phone ?? null,
              ownerEmail: patient?.owner_email ?? null,
              species: patient?.species ?? "unknown",
              scheduledFor: call.scheduled_for,
              createdAt: call.created_at,
              duration: call.duration_seconds,
              cost: Number(call.cost) ?? 0,
            };
          }) ?? [],
      };
    }),

  /**
   * Get voicemail follow-up queue
   */
  getVoicemailQueue: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        hoursBack: z.number().min(1).max(168).optional().default(72), // Default 72 hours
        clinicSlug: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const cutoffTime = subHours(new Date(), input.hoursBack);

      // Get completed calls that went to voicemail (clinic-scoped)
      const { data: voicemailCalls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          `
          id,
          status,
          created_at,
          ended_at,
          duration_seconds,
          call_analysis,
          dynamic_variables,
          case_id,
          cases(
            id,
            type,
            status,
            patients(name, owner_name, owner_phone, owner_email)
          )
        `,
        )
        .in("user_id", clinicUserIds)
        .eq("status", "completed")
        .gte("ended_at", cutoffTime.toISOString())
        .order("ended_at", { ascending: false });

      // Filter for voicemail calls
      const voicemails =
        voicemailCalls?.filter((call) => {
          const analysis = call.call_analysis as CallAnalysis | null;
          // Check if explicitly marked as voicemail or if summary indicates voicemail
          if (analysis?.structuredData?.wentToVoicemail === true) return true;
          const summary = analysis?.summary?.toLowerCase() ?? "";
          return (
            summary.includes("voicemail") ||
            summary.includes("went to vm") ||
            summary.includes("no answer")
          );
        }) ?? [];

      // For each voicemail, check if there's been a successful follow-up
      const voicemailsWithFollowUp = await Promise.all(
        voicemails.slice(0, input.limit).map(async (vm) => {
          const vmTimestamp = vm.ended_at ?? vm.created_at ?? new Date(0).toISOString();
          const vmCaseId = vm.case_id;

          // Check for follow-up email (only if case_id exists)
          let followUpEmail = null;
          let followUpCall = null;

          if (vmCaseId) {
            const { data: emailData } = await ctx.supabase
              .from("scheduled_discharge_emails")
              .select("id, status, sent_at")
              .eq("case_id", vmCaseId)
              .eq("status", "sent")
              .gte("sent_at", vmTimestamp)
              .limit(1)
              .maybeSingle();
            followUpEmail = emailData;

            // Check for successful follow-up call
            const { data: callData } = await ctx.supabase
              .from("scheduled_discharge_calls")
              .select("id, status, ended_at, success_evaluation")
              .eq("case_id", vmCaseId)
              .eq("status", "completed")
              .gt("ended_at", vmTimestamp)
              .limit(1)
              .maybeSingle();
            followUpCall = callData;
          }

          const hasSuccessfulFollowUp =
            followUpCall?.success_evaluation === "true";

          const caseData = Array.isArray(vm.cases) ? vm.cases[0] : vm.cases;
          const patient = caseData?.patients
            ? Array.isArray(caseData.patients)
              ? caseData.patients[0]
              : caseData.patients
            : null;
          const dynamicVars = vm.dynamic_variables as Record<
            string,
            string
          > | null;

          return {
            id: vm.id,
            caseId: vm.case_id,
            caseType: caseData?.type ?? "checkup",
            caseStatus: caseData?.status ?? "ongoing",
            petName: dynamicVars?.pet_name ?? patient?.name ?? "Unknown",
            ownerName:
              dynamicVars?.owner_name ?? patient?.owner_name ?? "Unknown",
            ownerPhone: patient?.owner_phone ?? null,
            ownerEmail: patient?.owner_email ?? null,
            endedAt: vm.ended_at,
            duration: vm.duration_seconds,
            followUp: {
              emailSent: !!followUpEmail,
              emailSentAt: followUpEmail?.sent_at ?? null,
              callbackMade: !!followUpCall,
              callbackSuccessful: hasSuccessfulFollowUp,
            },
            needsAction: !followUpEmail && !hasSuccessfulFollowUp,
          };
        }),
      );

      // Count those needing action
      const needingAction = voicemailsWithFollowUp.filter(
        (vm) => vm.needsAction,
      ).length;

      return {
        totalVoicemails: voicemails.length,
        needingAction,
        resolved: voicemails.length - needingAction,
        voicemails: voicemailsWithFollowUp,
      };
    }),
});
