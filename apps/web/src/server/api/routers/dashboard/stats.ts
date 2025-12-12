/**
 * Dashboard Stats Procedures
 *
 * Quick stats overview and comprehensive case statistics.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { startOfMonth, startOfWeek } from "date-fns";
import { getLocalDayRange, DEFAULT_TIMEZONE } from "@odis-ai/utils/timezone";
import {
  type CaseWithRelations,
  hasDischargeSummary,
  hasSoapNote,
  calculatePercentage,
} from "./types";

export const statsRouter = createTRPCRouter({
  /**
   * Get quick stats overview
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get user's test mode setting
    const { data: user } = await ctx.supabase
      .from("users")
      .select("test_mode_enabled")
      .eq("id", userId)
      .single();

    const testModeEnabled = user?.test_mode_enabled ?? false;

    // Get case counts by status
    const { data: cases } = await ctx.supabase
      .from("cases")
      .select("status")
      .eq("user_id", userId);

    const activeCases =
      cases?.filter((c) => c.status === "ongoing" || c.status === "draft")
        .length ?? 0;

    // Get call stats (exclude test mode calls if test mode is disabled)
    const { data: allCalls } = await ctx.supabase
      .from("scheduled_discharge_calls")
      .select("status, created_at, metadata")
      .eq("user_id", userId);

    // Filter out test calls when test mode is disabled
    const calls = testModeEnabled
      ? allCalls
      : allCalls?.filter((call) => {
          const metadata = call.metadata as { test_call?: boolean } | null;
          return metadata?.test_call !== true;
        });

    const totalCalls = calls?.length ?? 0;
    const completedCalls =
      calls?.filter((c) => c.status === "completed").length ?? 0;
    const pendingCalls =
      calls?.filter((c) => c.status === "queued" || c.status === "ringing")
        .length ?? 0;

    // Calculate call success rate
    const callSuccessRate =
      completedCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

    // Get email stats
    const { data: emails } = await ctx.supabase
      .from("scheduled_discharge_emails")
      .select("status, created_at")
      .eq("user_id", userId);

    const totalEmails = emails?.length ?? 0;
    const sentEmails = emails?.filter((e) => e.status === "sent").length ?? 0;
    const queuedEmails =
      emails?.filter((e) => e.status === "queued").length ?? 0;
    const failedEmails =
      emails?.filter((e) => e.status === "failed").length ?? 0;

    // Calculate email success rate (sent / (sent + failed))
    const completedEmailAttempts = sentEmails + failedEmails;
    const emailSuccessRate =
      completedEmailAttempts > 0
        ? Math.round((sentEmails / completedEmailAttempts) * 100)
        : 0;

    // Get previous week's completed calls for trend
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const previousWeekCalls =
      calls?.filter(
        (c) => c.status === "completed" && new Date(c.created_at) < oneWeekAgo,
      ).length ?? 0;

    // Get previous week's sent emails for trend
    const previousWeekEmails =
      emails?.filter(
        (e) => e.status === "sent" && new Date(e.created_at) < oneWeekAgo,
      ).length ?? 0;

    const casesTrend: "up" | "down" | "stable" =
      activeCases > 0 ? "up" : "stable";
    const callsTrend: "up" | "down" | "stable" =
      completedCalls > previousWeekCalls ? "up" : "down";
    const emailsTrend: "up" | "down" | "stable" =
      sentEmails > previousWeekEmails ? "up" : "down";

    return {
      activeCases,
      // Call stats
      completedCalls,
      pendingCalls,
      successRate: callSuccessRate, // Keep for backward compatibility
      callSuccessRate,
      // Email stats
      totalEmails,
      sentEmails,
      queuedEmails,
      failedEmails,
      emailSuccessRate,
      // Trends
      trends: {
        cases: casesTrend,
        calls: callsTrend,
        emails: emailsTrend,
      },
    };
  }),

  /**
   * Get comprehensive case statistics including coverage metrics and completion rates
   */
  getCaseStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get timezone-aware date boundaries for filtering
      let startIso: string | undefined;
      let endIso: string | undefined;

      if (input.startDate) {
        const { startISO } = getLocalDayRange(
          input.startDate,
          DEFAULT_TIMEZONE,
        );
        startIso = startISO;
      }
      if (input.endDate) {
        const { endISO } = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        endIso = endISO;
      }

      // Helper function to get date boundaries
      const getDateBoundaries = () => {
        const now = new Date();
        return {
          weekStart: startOfWeek(now, { weekStartsOn: 1 }), // Monday
          monthStart: startOfMonth(now),
        };
      };

      // Single query to get all cases with relations for efficient calculation
      let casesQuery = ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          source,
          created_at,
          scheduled_at,
          discharge_summaries(id),
          soap_notes(id)
        `,
        )
        .eq("user_id", userId);

      if (startIso) {
        casesQuery = casesQuery.gte("created_at", startIso);
      }
      if (endIso) {
        casesQuery = casesQuery.lte("created_at", endIso);
      }

      const { data: allCases } = await casesQuery;

      const totalCases = allCases?.length ?? 0;

      // Calculate date boundaries (consistent for all "this week/month" calculations)
      const { weekStart, monthStart } = getDateBoundaries();

      // Cases this week (using consistent weekStart calculation)
      const casesThisWeek =
        allCases?.filter((c) => {
          if (!c.created_at) return false;
          const caseCreatedAt = new Date(c.created_at);
          return caseCreatedAt >= weekStart;
        }).length ?? 0;

      // By status
      const byStatus = {
        draft: allCases?.filter((c) => c.status === "draft").length ?? 0,
        ongoing: allCases?.filter((c) => c.status === "ongoing").length ?? 0,
        completed:
          allCases?.filter((c) => c.status === "completed").length ?? 0,
        reviewed: allCases?.filter((c) => c.status === "reviewed").length ?? 0,
      };

      // By source
      const sourceMap = new Map<string, number>();
      allCases?.forEach((c) => {
        const source = c.source ?? "manual";
        sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
      });
      const bySource = Object.fromEntries(sourceMap);

      // SOAP notes count (linked through cases)
      let soapNotesQuery = ctx.supabase
        .from("soap_notes")
        .select("id, cases!inner(user_id)", {
          count: "exact",
          head: true,
        })
        .eq("cases.user_id", userId);

      if (startIso) {
        soapNotesQuery = soapNotesQuery.gte("created_at", startIso);
      }
      if (endIso) {
        soapNotesQuery = soapNotesQuery.lte("created_at", endIso);
      }

      const { count: soapNotesCount } = await soapNotesQuery;

      // Discharge summaries count
      let dischargeSummariesQuery = ctx.supabase
        .from("discharge_summaries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (startIso) {
        dischargeSummariesQuery = dischargeSummariesQuery.gte(
          "created_at",
          startIso,
        );
      }
      if (endIso) {
        dischargeSummariesQuery = dischargeSummariesQuery.lte(
          "created_at",
          endIso,
        );
      }

      const { count: dischargeSummariesCount } = await dischargeSummariesQuery;

      // Calls completed
      let callsQuery = ctx.supabase
        .from("scheduled_discharge_calls")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");

      if (startIso) {
        callsQuery = callsQuery.gte("created_at", startIso);
      }
      if (endIso) {
        callsQuery = callsQuery.lte("created_at", endIso);
      }

      const { count: callsCompletedCount } = await callsQuery;

      // Emails sent
      let emailsQuery = ctx.supabase
        .from("scheduled_discharge_emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "sent");

      if (startIso) {
        emailsQuery = emailsQuery.gte("created_at", startIso);
      }
      if (endIso) {
        emailsQuery = emailsQuery.lte("created_at", endIso);
      }

      const { count: emailsSentCount } = await emailsQuery;

      // Initialize counters
      let totalNeedingDischarge = 0;
      let thisWeekNeedingDischarge = 0;
      let thisMonthNeedingDischarge = 0;

      let totalNeedingSoap = 0;
      let thisWeekNeedingSoap = 0;
      let thisMonthNeedingSoap = 0;

      let totalWithDischarge = 0;
      let totalWithSoap = 0;

      let completedCasesTotal = 0;
      let completedCasesThisWeek = 0;
      let createdCasesThisWeek = 0;
      let completedCasesThisMonth = 0;
      let createdCasesThisMonth = 0;

      // Process each case
      allCases?.forEach((c) => {
        // Skip cases with null created_at for date-based calculations
        if (!c.created_at) {
          // Still count for total metrics but skip date-based calculations
          const hasDischarge = hasDischargeSummary(c as CaseWithRelations);
          const hasSoap = hasSoapNote(c as CaseWithRelations);
          const isCompleted = c.status === "completed";

          if (!hasDischarge) {
            totalNeedingDischarge++;
          } else {
            totalWithDischarge++;
          }

          if (!hasSoap) {
            totalNeedingSoap++;
          } else {
            totalWithSoap++;
          }

          if (isCompleted) {
            completedCasesTotal++;
          }

          return; // Skip date-based calculations
        }

        const caseCreatedAt = new Date(c.created_at);
        const hasDischarge = hasDischargeSummary(c as CaseWithRelations);
        const hasSoap = hasSoapNote(c as CaseWithRelations);
        const isCompleted = c.status === "completed";

        // Cases needing discharge
        if (!hasDischarge) {
          totalNeedingDischarge++;
          if (caseCreatedAt >= weekStart) {
            thisWeekNeedingDischarge++;
          }
          if (caseCreatedAt >= monthStart) {
            thisMonthNeedingDischarge++;
          }
        } else {
          totalWithDischarge++;
        }

        // Cases needing SOAP
        if (!hasSoap) {
          totalNeedingSoap++;
          if (caseCreatedAt >= weekStart) {
            thisWeekNeedingSoap++;
          }
          if (caseCreatedAt >= monthStart) {
            thisMonthNeedingSoap++;
          }
        } else {
          totalWithSoap++;
        }

        // Completion rate calculations
        if (isCompleted) {
          completedCasesTotal++;
        }

        // This week metrics
        if (caseCreatedAt >= weekStart) {
          createdCasesThisWeek++;
          if (isCompleted) {
            completedCasesThisWeek++;
          }
        }

        // This month metrics
        if (caseCreatedAt >= monthStart) {
          createdCasesThisMonth++;
          if (isCompleted) {
            completedCasesThisMonth++;
          }
        }
      });

      // Calculate coverage percentages
      const soapCoveragePercentage = calculatePercentage(
        totalWithSoap,
        totalCases,
      );
      const dischargeCoveragePercentage = calculatePercentage(
        totalWithDischarge,
        totalCases,
      );

      // Calculate completion rates
      const completionRateOverall = calculatePercentage(
        completedCasesTotal,
        totalCases,
      );
      const completionRateThisWeek = calculatePercentage(
        completedCasesThisWeek,
        createdCasesThisWeek,
      );
      const completionRateThisMonth = calculatePercentage(
        completedCasesThisMonth,
        createdCasesThisMonth,
      );

      return {
        total: totalCases,
        thisWeek: casesThisWeek,
        byStatus,
        bySource,
        soapNotes: soapNotesCount ?? 0,
        dischargeSummaries: dischargeSummariesCount ?? 0,
        callsCompleted: callsCompletedCount ?? 0,
        emailsSent: emailsSentCount ?? 0,
        casesNeedingDischarge: {
          total: totalNeedingDischarge,
          thisWeek: thisWeekNeedingDischarge,
          thisMonth: thisMonthNeedingDischarge,
        },
        casesNeedingSoap: {
          total: totalNeedingSoap,
          thisWeek: thisWeekNeedingSoap,
          thisMonth: thisMonthNeedingSoap,
        },
        soapCoverage: {
          percentage: soapCoveragePercentage,
          totalCases,
          casesWithSoap: totalWithSoap,
          casesNeedingSoap: totalNeedingSoap,
        },
        dischargeCoverage: {
          percentage: dischargeCoveragePercentage,
          totalCases,
          casesWithDischarge: totalWithDischarge,
          casesNeedingDischarge: totalNeedingDischarge,
        },
        completionRate: {
          overall: {
            completed: completedCasesTotal,
            total: totalCases,
            percentage: completionRateOverall,
          },
          thisWeek: {
            completed: completedCasesThisWeek,
            created: createdCasesThisWeek,
            percentage: completionRateThisWeek,
          },
          thisMonth: {
            completed: completedCasesThisMonth,
            created: createdCasesThisMonth,
            percentage: completionRateThisMonth,
          },
        },
      };
    }),
});
