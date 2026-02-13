/**
 * Dashboard Overview Procedures
 *
 * Provides data for the general overview dashboard.
 * Designed to answer: "Is everything okay?" and "What value is the AI providing?"
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getClinicByUserId,
  getClinicBySlug,
  userHasClinicAccess,
  getClinicUserIdsEnhanced,
  getClinicUserIds,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import { subDays, subHours, format, startOfDay, endOfDay } from "date-fns";
import { TRPCError } from "@trpc/server";

// Constants for ROI calculations
const AVG_MANUAL_CALL_MINUTES = 5; // Average time for a manual discharge call
const HOURLY_RATE = 25; // Average hourly rate for receptionist

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

export const overviewRouter = createTRPCRouter({
  /**
   * Get overview dashboard data
   *
   * Returns:
   * - Status summary (all clear vs items needing attention)
   * - Value metrics (calls answered, appointments booked, messages captured)
   * - Flagged items that need human review
   * - Time period info
   */
  getOverview: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(30).default(7),
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
        // Verify user has access to this clinic
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

      // Calculate date range
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(subDays(new Date(), input.days));
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // ============================================================================
      // INBOUND CALLS STATS
      // ============================================================================
      let callQuery = ctx.supabase
        .from("inbound_vapi_calls")
        .select(
          "id, status, duration_seconds, user_sentiment, attention_severity, attention_types, attention_summary, created_at, customer_phone, call_analysis, call_outcome_data",
        )
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);

      if (clinic?.name) {
        callQuery = callQuery.eq("clinic_name", clinic.name);
      }

      const { data: calls } = await callQuery;
      const allCalls = calls ?? [];

      // Filter out internal/test phone numbers
      const validCalls = allCalls.filter((call) => {
        const phone = String(call.customer_phone ?? "");
        // Filter out common test patterns
        return phone && !phone.includes("5550") && phone.length >= 10;
      });

      const completedCalls = validCalls.filter((c) => c.status === "completed");
      const inProgressCalls = validCalls.filter(
        (c) => c.status === "ringing" || c.status === "in_progress",
      );
      const failedCalls = validCalls.filter((c) => c.status === "failed");

      // Calculate average duration
      const totalDuration = completedCalls.reduce(
        (sum, c) => sum + (c.duration_seconds ?? 0),
        0,
      );
      const avgDuration =
        completedCalls.length > 0
          ? Math.round(totalDuration / completedCalls.length)
          : 0;

      // ============================================================================
      // APPOINTMENT STATS (from vapi_bookings)
      // ============================================================================
      let appointmentQuery = ctx.supabase
        .from("appointment_bookings")
        .select("id, status, created_at")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);

      if (clinic?.id) {
        appointmentQuery = appointmentQuery.eq("clinic_id", clinic.id);
      }

      const { data: appointments } = await appointmentQuery;
      const allAppointments = appointments ?? [];
      const confirmedAppointments = allAppointments.filter(
        (a) => a.status === "confirmed",
      );
      const pendingAppointments = allAppointments.filter(
        (a) => a.status === "pending",
      );

      // ============================================================================
      // MESSAGE STATS
      // ============================================================================
      let messageQuery = ctx.supabase
        .from("clinic_messages")
        .select("id, status, priority, created_at")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);

      if (clinic?.id) {
        messageQuery = messageQuery.eq("clinic_id", clinic.id);
      }

      const { data: messages } = await messageQuery;
      const allMessages = messages ?? [];
      const newMessages = allMessages.filter((m) => m.status === "new");
      const urgentMessages = allMessages.filter((m) => m.priority === "urgent");

      // ============================================================================
      // FLAGGED/ATTENTION ITEMS (urgent or critical calls needing review)
      // ============================================================================
      const flaggedCalls = validCalls.filter((call) => {
        const severity = call.attention_severity;
        return severity === "urgent" || severity === "critical";
      });

      // Get detailed info for flagged items (limit to 5)
      const flaggedItems = flaggedCalls.slice(0, 5).map((call) => {
        const callOutcome = call.call_outcome_data as Record<
          string,
          unknown
        > | null;
        const callAnalysis = call.call_analysis as Record<
          string,
          unknown
        > | null;

        // Try to extract pet/owner names from call data
        let petName = "Unknown";
        let ownerName = "Unknown";

        if (callOutcome) {
          petName = (callOutcome.pet_name as string) ?? "Unknown";
          ownerName = (callOutcome.owner_name as string) ?? "Unknown";
        }

        return {
          id: call.id,
          petName,
          ownerName,
          severity: call.attention_severity,
          summary:
            call.attention_summary ??
            (callAnalysis?.summary as string) ??
            "Review required",
          types: call.attention_types ?? [],
          createdAt: call.created_at,
        };
      });

      // ============================================================================
      // STATUS DETERMINATION
      // ============================================================================
      const urgentCount = flaggedCalls.filter(
        (c) => c.attention_severity === "urgent",
      ).length;
      const criticalCount = flaggedCalls.filter(
        (c) => c.attention_severity === "critical",
      ).length;
      const totalFlagged = flaggedCalls.length;
      const hasUrgentItems = criticalCount > 0 || urgentCount > 0;

      // ============================================================================
      // OUTBOUND STATS (Discharge calls)
      // ============================================================================
      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      // Get outbound calls in the period (clinic-scoped)
      const { data: outboundCallsData } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          "id, status, duration_seconds, cost, call_analysis, success_evaluation, created_at",
        )
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);

      const outboundCalls = outboundCallsData ?? [];
      const outboundCompleted = outboundCalls.filter(
        (c) => c.status === "completed",
      ).length;
      const outboundFailed = outboundCalls.filter(
        (c) => c.status === "failed",
      ).length;
      const outboundQueued = outboundCalls.filter(
        (c) => c.status === "queued" || c.status === "ringing",
      ).length;

      // Calculate voicemail count from completed outbound calls
      const outboundVoicemails = outboundCalls.filter((c) => {
        if (c.status !== "completed") return false;
        const analysis = c.call_analysis as CallAnalysis | null;
        return analysis?.structuredData?.wentToVoicemail === true;
      }).length;

      // Calculate success rate from completed calls
      const outboundSuccessful = outboundCalls.filter((c) => {
        if (c.status !== "completed") return false;
        return c.success_evaluation === "true";
      }).length;

      const outboundSuccessRate =
        outboundCompleted > 0
          ? Math.round((outboundSuccessful / outboundCompleted) * 100)
          : 0;

      // ============================================================================
      // TODAY'S ACTIVITY (Real-time snapshot)
      // ============================================================================
      const todayStart = startOfDay(new Date());
      const todayStartStr = todayStart.toISOString();

      // Today's inbound calls
      let todayInboundQuery = ctx.supabase
        .from("inbound_vapi_calls")
        .select("id, status")
        .gte("created_at", todayStartStr);

      if (clinic?.name) {
        todayInboundQuery = todayInboundQuery.eq("clinic_name", clinic.name);
      }

      const { data: todayInboundData } = await todayInboundQuery;
      const todayInbound = todayInboundData ?? [];
      const todayCallsHandled = todayInbound.filter(
        (c) => c.status === "completed",
      ).length;

      // Today's appointments
      let todayAppointmentsQuery = ctx.supabase
        .from("appointment_bookings")
        .select("id")
        .gte("created_at", todayStartStr);

      if (clinic?.id) {
        todayAppointmentsQuery = todayAppointmentsQuery.eq(
          "clinic_id",
          clinic.id,
        );
      }

      const { data: todayAppointmentsData } = await todayAppointmentsQuery;
      const todayAppointments = todayAppointmentsData?.length ?? 0;

      // Today's messages
      let todayMessagesQuery = ctx.supabase
        .from("clinic_messages")
        .select("id")
        .gte("created_at", todayStartStr);

      if (clinic?.id) {
        todayMessagesQuery = todayMessagesQuery.eq("clinic_id", clinic.id);
      }

      const { data: todayMessagesData } = await todayMessagesQuery;
      const todayMessages = todayMessagesData?.length ?? 0;

      // ============================================================================
      // CASE COVERAGE STATS
      // ============================================================================
      const { data: casesData } = await ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          discharge_summaries(id),
          soap_notes(id)
        `,
        )
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds));

      const cases = casesData ?? [];
      const totalCases = cases.length;

      // Count cases with discharge summaries
      const casesWithDischarge = cases.filter((c) => {
        const summaries = c.discharge_summaries;
        return Array.isArray(summaries) && summaries.length > 0;
      }).length;

      // Count cases with SOAP notes
      const casesWithSoap = cases.filter((c) => {
        const notes = c.soap_notes;
        return Array.isArray(notes) && notes.length > 0;
      }).length;

      const dischargeCoveragePct =
        totalCases > 0
          ? Math.round((casesWithDischarge / totalCases) * 100)
          : 0;
      const soapCoveragePct =
        totalCases > 0 ? Math.round((casesWithSoap / totalCases) * 100) : 0;

      // ============================================================================
      // CRITICAL ACTIONS COUNT (for status banner)
      // ============================================================================
      const last24Hours = subHours(new Date(), 24);

      // Get failed outbound calls in last 24h
      const { count: failedCallsCount } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select("id", { count: "exact", head: true })
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .eq("status", "failed")
        .gte("created_at", last24Hours.toISOString());

      // Get voicemails needing follow-up (last 72 hours)
      const last72Hours = subHours(new Date(), 72);
      const { data: voicemailCallsData } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select("id, call_analysis, case_id, ended_at")
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .eq("status", "completed")
        .gte("ended_at", last72Hours.toISOString());

      // Filter for voicemail calls
      const voicemailCalls =
        voicemailCallsData?.filter((call) => {
          const analysis = call.call_analysis as CallAnalysis | null;
          if (analysis?.structuredData?.wentToVoicemail === true) return true;
          const summary = analysis?.summary?.toLowerCase() ?? "";
          return (
            summary.includes("voicemail") ||
            summary.includes("went to vm") ||
            summary.includes("no answer")
          );
        }) ?? [];

      const voicemailsNeedingAction = voicemailCalls.length;

      // ============================================================================
      // ROI CALCULATIONS
      // ============================================================================
      // Time saved = total calls handled * avg manual call time
      const totalCallsHandled = completedCalls.length + outboundCompleted;
      const timeSavedMinutes = totalCallsHandled * AVG_MANUAL_CALL_MINUTES;
      const timeSavedHours = Math.round((timeSavedMinutes / 60) * 10) / 10; // Round to 1 decimal

      // Cost saved = time saved (in hours) * hourly rate
      const costSaved = Math.round(timeSavedHours * HOURLY_RATE);

      // ============================================================================
      // SYSTEM HEALTH STATUS
      // ============================================================================
      // Get most recent activity timestamp
      let lastActivityQuery = ctx.supabase
        .from("inbound_vapi_calls")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (clinic?.name) {
        lastActivityQuery = lastActivityQuery.eq("clinic_name", clinic.name);
      }

      const { data: lastActivityData } = await lastActivityQuery;
      const lastActivity = lastActivityData?.[0]?.created_at ?? null;

      // Determine system health based on recent activity and errors
      const totalCriticalActions =
        (failedCallsCount ?? 0) +
        criticalCount +
        urgentCount +
        voicemailsNeedingAction;

      const systemStatus: "healthy" | "warning" | "error" =
        criticalCount > 0
          ? "error"
          : totalCriticalActions > 5
            ? "warning"
            : "healthy";

      // ============================================================================
      // RETURN OVERVIEW DATA
      // ============================================================================
      return {
        // Time period
        period: {
          startDate: format(startDate, "MMM d"),
          endDate: format(endDate, "MMM d"),
          days: input.days,
        },

        // Overall status
        status: {
          allClear: !hasUrgentItems && inProgressCalls.length === 0,
          hasUrgentItems,
          urgentCount,
          criticalCount,
          totalFlagged,
          inProgressCalls: inProgressCalls.length,
        },

        // System health
        systemHealth: {
          status: systemStatus,
          lastActivity,
          totalCriticalActions,
          failedCallsCount: failedCallsCount ?? 0,
          voicemailsNeedingAction,
        },

        // Today's activity (real-time snapshot)
        todayActivity: {
          callsHandled: todayCallsHandled,
          appointmentsBooked: todayAppointments,
          messagesCaptured: todayMessages,
        },

        // Value metrics (inbound)
        value: {
          callsAnswered: completedCalls.length,
          appointmentsBooked:
            confirmedAppointments.length + pendingAppointments.length,
          messagesCapured: allMessages.length,
          avgCallDuration: avgDuration,
          // ROI metrics
          timeSavedMinutes,
          timeSavedHours,
          costSaved,
        },

        // Outbound performance
        outboundPerformance: {
          total: outboundCalls.length,
          completed: outboundCompleted,
          failed: outboundFailed,
          queued: outboundQueued,
          voicemails: outboundVoicemails,
          successRate: outboundSuccessRate,
        },

        // Case coverage
        caseCoverage: {
          totalCases,
          casesWithDischarge,
          casesWithSoap,
          dischargeCoveragePct,
          soapCoveragePct,
        },

        // Detailed stats
        stats: {
          calls: {
            total: validCalls.length,
            completed: completedCalls.length,
            inProgress: inProgressCalls.length,
            failed: failedCalls.length,
          },
          appointments: {
            total: allAppointments.length,
            confirmed: confirmedAppointments.length,
            pending: pendingAppointments.length,
          },
          messages: {
            total: allMessages.length,
            new: newMessages.length,
            urgent: urgentMessages.length,
          },
        },

        // Flagged items for review
        flaggedItems,
        totalFlaggedCount: flaggedCalls.length,
      };
    }),

  /**
   * Get last activity timestamp for "last checked" indicator
   */
  getLastActivity: protectedProcedure
    .input(
      z
        .object({
          clinicSlug: z.string().optional(),
        })
        .optional(),
    )
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
        // Verify user has access to this clinic
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

      // Get most recent activity across all sources
      let callQuery = ctx.supabase
        .from("inbound_vapi_calls")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (clinic?.name) {
        callQuery = callQuery.eq("clinic_name", clinic.name);
      }

      const { data: lastCall } = await callQuery;

      return {
        lastActivity: lastCall?.[0]?.created_at ?? null,
      };
    }),
});
