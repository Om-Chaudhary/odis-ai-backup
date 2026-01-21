/**
 * Get Inbound Stats Procedure
 *
 * Fetches combined statistics for VAPI bookings and inbound calls.
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { getInboundStatsInput } from "../schemas";

export const getStatsRouter = createTRPCRouter({
  /**
   * Get combined inbound statistics
   */
  getInboundStats: protectedProcedure
    .input(getInboundStatsInput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get current user's clinic (gracefully handles missing user record)
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // Also get user's clinic_name for calls filtering (which uses clinic_name, not clinic_id)
      const { data: userRecord } = await ctx.supabase
        .from("users")
        .select("clinic_name, role")
        .eq("id", userId)
        .maybeSingle();

      // Build date filter helper - uses generic type to preserve query builder chain
      const buildDateFilter = <
        T extends {
          gte: (column: string, value: string) => T;
          lte: (column: string, value: string) => T;
        },
      >(
        query: T,
        startDate?: string,
        endDate?: string,
      ): T => {
        let filtered = query;
        if (startDate) {
          filtered = filtered.gte("created_at", startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filtered = filtered.lte("created_at", end.toISOString());
        }
        return filtered;
      };

      // Fetch appointment stats from vapi_bookings
      let appointmentQuery = ctx.supabase
        .from("vapi_bookings")
        .select("status", { count: "exact" });

      if (clinic?.id) {
        appointmentQuery = appointmentQuery.eq("clinic_id", clinic.id);
      }

      appointmentQuery = buildDateFilter(
        appointmentQuery,
        input.startDate,
        input.endDate,
      );

      const { data: appointments, count: appointmentCount } =
        await appointmentQuery;

      // Count appointment statuses
      const appointmentStats = {
        total: appointmentCount ?? 0,
        pending: (appointments ?? []).filter((a) => a.status === "pending")
          .length,
        confirmed: (appointments ?? []).filter((a) => a.status === "confirmed")
          .length,
        rejected: (appointments ?? []).filter((a) => a.status === "rejected")
          .length,
        cancelled: (appointments ?? []).filter((a) => a.status === "cancelled")
          .length,
      };

      // Fetch call stats (from inbound_vapi_calls table)
      // Include outcome field to calculate needsAttention
      let callQuery = ctx.supabase
        .from("inbound_vapi_calls")
        .select("status, user_sentiment, outcome", { count: "exact" });

      // Apply clinic filtering for calls (uses clinic_name field)
      if (userRecord?.clinic_name) {
        callQuery = callQuery.eq("clinic_name", userRecord.clinic_name);
      }

      callQuery = buildDateFilter(callQuery, input.startDate, input.endDate);

      const { data: calls, count: callCount } = await callQuery;

      // Count call statuses
      const scheduled = (calls ?? []).filter(
        (c) => c.outcome === "scheduled",
      ).length;
      const rescheduled = (calls ?? []).filter(
        (c) => c.outcome === "rescheduled",
      ).length;
      const cancellation = (calls ?? []).filter(
        (c) => c.outcome === "cancellation",
      ).length;
      const emergency = (calls ?? []).filter(
        (c) => c.outcome === "emergency" || c.outcome === "Urgent",
      ).length;
      const callback = (calls ?? []).filter(
        (c) => c.outcome === "callback" || c.outcome === "Call Back",
      ).length;
      const info = (calls ?? []).filter(
        (c) => c.outcome === "info" || c.outcome === "Info Only",
      ).length;

      const callStats = {
        total: callCount ?? 0,
        completed: (calls ?? []).filter((c) => c.status === "completed").length,
        inProgress: (calls ?? []).filter(
          (c) => c.status === "in_progress" || c.status === "ringing",
        ).length,
        failed: (calls ?? []).filter((c) => c.status === "failed").length,
        cancelled: (calls ?? []).filter((c) => c.status === "cancelled").length,
        // Count calls that need attention (Urgent, Call Back outcomes)
        needsAttention: (calls ?? []).filter(
          (c) => c.outcome === "Urgent" || c.outcome === "Call Back",
        ).length,
        // Granular outcome counts
        scheduled,
        rescheduled,
        cancellation,
        emergency,
        callback,
        info,
        // Legacy grouped count (computed from granular counts)
        appointment: scheduled + rescheduled + cancellation,
      };

      return {
        appointments: appointmentStats,
        calls: callStats,
        totals: {
          appointments: appointmentStats.total,
          calls: callStats.total,
          needsAttention: appointmentStats.pending + callStats.needsAttention,
        },
      };
    }),
});
