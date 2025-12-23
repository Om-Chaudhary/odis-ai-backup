/**
 * Get Admin Stats Procedure
 *
 * Returns global statistics for the admin dashboard overview.
 */

import { TRPCError } from "@trpc/server";
import { createServiceClient } from "@odis-ai/db/server";
import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import { getAdminStatsInput } from "../schemas";

export const getAdminStatsRouter = createTRPCRouter({
  getAdminStats: adminProcedure
    .input(getAdminStatsInput)
    .query(async ({ input }) => {
      const supabase = await createServiceClient();

      try {
        // Get total users count by role
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("role", { count: "exact" });

        if (usersError) throw usersError;

        // Count users by role
        const usersByRole = (users ?? []).reduce(
          (acc, user) => {
            const role = user.role ?? "unknown";
            acc[role] = (acc[role] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        // Get total cases count
        const { count: totalCases, error: casesError } = await supabase
          .from("cases")
          .select("*", { count: "exact", head: true });

        if (casesError) throw casesError;

        // Get cases by status
        const { data: casesByStatus, error: caseStatusError } = await supabase
          .from("cases")
          .select("status");

        if (caseStatusError) throw caseStatusError;

        const casesStats = (casesByStatus ?? []).reduce(
          (acc, c) => {
            const status = c.status ?? "unknown";
            acc[status] = (acc[status] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        // Get total patients count
        const { count: totalPatients, error: patientsError } = await supabase
          .from("patients")
          .select("*", { count: "exact", head: true });

        if (patientsError) throw patientsError;

        // Get scheduled calls stats
        const { data: callsData, error: callsError } = await supabase
          .from("scheduled_discharge_calls")
          .select("status, attention_types");

        if (callsError) throw callsError;

        const callsStats = (callsData ?? []).reduce(
          (acc, call) => {
            const status = call.status ?? "unknown";
            acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
            if (
              call.attention_types &&
              Array.isArray(call.attention_types) &&
              call.attention_types.length > 0
            ) {
              acc.needsAttention += 1;
            }
            return acc;
          },
          { byStatus: {} as Record<string, number>, needsAttention: 0 },
        );

        // Get scheduled emails stats
        const { data: emailsData, error: emailsError } = await supabase
          .from("scheduled_discharge_emails")
          .select("status");

        if (emailsError) throw emailsError;

        const emailsStats = (emailsData ?? []).reduce(
          (acc, email) => {
            const status = email.status ?? "unknown";
            acc[status] = (acc[status] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        // Get recent activity (last 24 hours)
        const twentyFourHoursAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString();

        const { count: recentCases } = await supabase
          .from("cases")
          .select("*", { count: "exact", head: true })
          .gte("created_at", twentyFourHoursAgo);

        const { count: recentCalls } = await supabase
          .from("scheduled_discharge_calls")
          .select("*", { count: "exact", head: true })
          .gte("created_at", twentyFourHoursAgo);

        const { count: recentEmails } = await supabase
          .from("scheduled_discharge_emails")
          .select("*", { count: "exact", head: true })
          .gte("created_at", twentyFourHoursAgo);

        return {
          users: {
            total: users?.length ?? 0,
            byRole: usersByRole,
          },
          cases: {
            total: totalCases ?? 0,
            byStatus: casesStats,
          },
          patients: {
            total: totalPatients ?? 0,
          },
          calls: {
            total: callsData?.length ?? 0,
            byStatus: callsStats.byStatus,
            needsAttention: callsStats.needsAttention,
          },
          emails: {
            total: emailsData?.length ?? 0,
            byStatus: emailsStats,
          },
          recentActivity: {
            cases: recentCases ?? 0,
            calls: recentCalls ?? 0,
            emails: recentEmails ?? 0,
          },
        };
      } catch (error) {
        console.error("[Admin Stats] Error fetching stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch admin statistics",
        });
      }
    }),
});
