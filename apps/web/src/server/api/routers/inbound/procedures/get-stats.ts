/**
 * Get Inbound Stats Procedure
 *
 * Fetches combined statistics for appointment requests, clinic messages, and calls.
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

      // Fetch appointment stats
      let appointmentQuery = ctx.supabase
        .from("appointment_requests")
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

      // Fetch message stats
      let messageQuery = ctx.supabase
        .from("clinic_messages")
        .select("status, priority", { count: "exact" });

      if (clinic?.id) {
        messageQuery = messageQuery.eq("clinic_id", clinic.id);
      }

      messageQuery = buildDateFilter(
        messageQuery,
        input.startDate,
        input.endDate,
      );

      const { data: messages, count: messageCount } = await messageQuery;

      // Count message statuses and priorities
      const messageStats = {
        total: messageCount ?? 0,
        new: (messages ?? []).filter((m) => m.status === "new").length,
        read: (messages ?? []).filter((m) => m.status === "read").length,
        resolved: (messages ?? []).filter((m) => m.status === "resolved")
          .length,
        urgent: (messages ?? []).filter((m) => m.priority === "urgent").length,
      };

      // Fetch call stats (from existing inbound_vapi_calls table)
      let callQuery = ctx.supabase
        .from("inbound_vapi_calls")
        .select("status, user_sentiment", { count: "exact" });

      // Apply clinic filtering for calls (uses clinic_name field)
      if (userRecord?.clinic_name) {
        callQuery = callQuery.eq("clinic_name", userRecord.clinic_name);
      }

      callQuery = buildDateFilter(callQuery, input.startDate, input.endDate);

      const { data: calls, count: callCount } = await callQuery;

      // Count call statuses
      const callStats = {
        total: callCount ?? 0,
        completed: (calls ?? []).filter((c) => c.status === "completed").length,
        inProgress: (calls ?? []).filter(
          (c) => c.status === "in_progress" || c.status === "ringing",
        ).length,
        failed: (calls ?? []).filter((c) => c.status === "failed").length,
        cancelled: (calls ?? []).filter((c) => c.status === "cancelled").length,
      };

      return {
        appointments: appointmentStats,
        messages: messageStats,
        calls: callStats,
        totals: {
          appointments: appointmentStats.total,
          messages: messageStats.total,
          calls: callStats.total,
          needsAttention:
            appointmentStats.pending + messageStats.new + messageStats.urgent,
        },
      };
    }),
});
