/**
 * Dashboard Overview Procedures
 *
 * Provides data for the general overview dashboard.
 * Designed to answer: "Is everything okay?" and "What value is the AI providing?"
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

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
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get user's clinic
      const clinic = await getClinicByUserId(userId, ctx.supabase);
      const { data: userRecord } = await ctx.supabase
        .from("users")
        .select("clinic_name")
        .eq("id", userId)
        .maybeSingle();

      const clinicName = userRecord?.clinic_name ?? null;

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

      if (clinicName) {
        callQuery = callQuery.eq("clinic_name", clinicName);
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
        .from("vapi_bookings")
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

        // Value metrics
        value: {
          callsAnswered: completedCalls.length,
          appointmentsBooked:
            confirmedAppointments.length + pendingAppointments.length,
          messagesCapured: allMessages.length,
          avgCallDuration: avgDuration,
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
  getLastActivity: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const { data: userRecord } = await ctx.supabase
      .from("users")
      .select("clinic_name")
      .eq("id", userId)
      .maybeSingle();

    const clinicName = userRecord?.clinic_name ?? null;

    // Get most recent activity across all sources
    let callQuery = ctx.supabase
      .from("inbound_vapi_calls")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (clinicName) {
      callQuery = callQuery.eq("clinic_name", clinicName);
    }

    const { data: lastCall } = await callQuery;

    return {
      lastActivity: lastCall?.[0]?.created_at ?? null,
    };
  }),
});
