/**
 * Get Inbound Stats Procedure
 *
 * Fetches combined statistics for appointment requests, clinic messages, and calls.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createClient } from "@odis-ai/db/server";
import { getInboundStatsInput } from "../schemas";

/**
 * Get user's clinic ID for filtering
 */
async function getUserClinicId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, clinic_id, clinic_name")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user information",
    });
  }

  return user;
}

export const getStatsRouter = createTRPCRouter({
  /**
   * Get combined inbound statistics
   */
  getInboundStats: protectedProcedure
    .input(getInboundStatsInput)
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's clinic
      const user = await getUserClinicId(supabase, ctx.user.id);

      // Build date filter helper - uses generic type to preserve query builder chain
      const buildDateFilter = <
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        T extends {
          gte: (column: string, value: string) => any;
          lte: (column: string, value: string) => any;
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
      let appointmentQuery = supabase
        .from("appointment_requests")
        .select("status", { count: "exact" });

      if (user.clinic_id) {
        appointmentQuery = appointmentQuery.eq("clinic_id", user.clinic_id);
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
      let messageQuery = supabase
        .from("clinic_messages")
        .select("status, priority", { count: "exact" });

      if (user.clinic_id) {
        messageQuery = messageQuery.eq("clinic_id", user.clinic_id);
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
      let callQuery = supabase
        .from("inbound_vapi_calls")
        .select("status, user_sentiment", { count: "exact" });

      // Apply role-based filtering for calls
      const isAdminOrOwner =
        user.role === "admin" || user.role === "practice_owner";
      if (!isAdminOrOwner && user.clinic_name) {
        callQuery = callQuery.eq("clinic_name", user.clinic_name);
      } else if (user.clinic_name) {
        callQuery = callQuery.eq("clinic_name", user.clinic_name);
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
