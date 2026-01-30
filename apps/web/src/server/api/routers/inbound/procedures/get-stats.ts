/**
 * Get Inbound Stats Procedure
 *
 * Fetches combined statistics for VAPI bookings and inbound calls.
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { getInboundStatsInput } from "../schemas";

export const getStatsRouter = createTRPCRouter({
  /**
   * Get combined inbound statistics
   */
  getInboundStats: protectedProcedure
    .input(getInboundStatsInput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Use service client to bypass RLS (consistent with listInboundCalls)
      const serviceClient = await createServiceClient();

      // Use provided clinicId from input, or fall back to user's default clinic
      let clinic = null;
      let clinicName = null;

      if (input.clinicId) {
        // If clinicId is provided, fetch that clinic directly from clinics table
        const { data } = await serviceClient
          .from("clinics")
          .select("id, name")
          .eq("id", input.clinicId)
          .maybeSingle();

        if (data) {
          clinic = { id: data.id };
          clinicName = data.name;
        }
      } else {
        // Fall back to user's default clinic
        clinic = await getClinicByUserId(userId, serviceClient);

        // If we have a clinic, look up its name from the clinics table
        if (clinic?.id) {
          const { data: clinicData } = await serviceClient
            .from("clinics")
            .select("name")
            .eq("id", clinic.id)
            .maybeSingle();

          clinicName = clinicData?.name ?? null;
        }
      }

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
      let appointmentQuery = serviceClient
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
      let callQuery = serviceClient
        .from("inbound_vapi_calls")
        .select("status, user_sentiment, outcome", { count: "exact" });

      // Apply clinic filtering for calls (uses clinic_name field)
      if (clinicName) {
        callQuery = callQuery.eq("clinic_name", clinicName);
      }

      callQuery = buildDateFilter(callQuery, input.startDate, input.endDate);

      const { data: calls, count: callCount } = await callQuery;

      // Count call statuses (case-insensitive matching to align with listInboundCalls)
      const normalizeOutcome = (outcome: string | null) =>
        (outcome ?? "").toLowerCase();

      const scheduled = (calls ?? []).filter((c) =>
        normalizeOutcome(c.outcome).includes("scheduled"),
      ).length;
      const rescheduled = (calls ?? []).filter((c) =>
        normalizeOutcome(c.outcome).includes("rescheduled"),
      ).length;
      const cancellation = (calls ?? []).filter((c) =>
        normalizeOutcome(c.outcome).includes("cancellation"),
      ).length;
      const emergency = (calls ?? []).filter((c) => {
        const outcome = normalizeOutcome(c.outcome);
        return outcome.includes("emergency") || outcome.includes("urgent");
      }).length;
      const callback = (calls ?? []).filter((c) => {
        const outcome = normalizeOutcome(c.outcome);
        return outcome.includes("callback") || outcome.includes("call back");
      }).length;
      const info = (calls ?? []).filter((c) => {
        const outcome = normalizeOutcome(c.outcome);
        return outcome.includes("info");
      }).length;

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
