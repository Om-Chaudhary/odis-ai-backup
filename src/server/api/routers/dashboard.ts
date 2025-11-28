import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { CallStatus, EmailStatus } from "~/types/dashboard";
import { startOfMonth, startOfWeek } from "date-fns";

// Type helpers for Supabase responses
type SupabasePatient = {
  id: string;
  name: string;
  species: string;
  owner_name?: string;
};

type SupabasePatientsResponse = SupabasePatient[];

type DynamicVariables = {
  pet_name?: string;
  owner_name?: string;
  [key: string]: unknown;
};

type CallAnalysis = {
  successEvaluation?: string | boolean;
  [key: string]: unknown;
};

export const dashboardRouter = createTRPCRouter({
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
    let callsQuery = ctx.supabase
      .from("scheduled_discharge_calls")
      .select("status, created_at, metadata")
      .eq("user_id", userId);

    // If test mode is disabled, filter out test calls
    if (!testModeEnabled) {
      callsQuery = callsQuery
        .not("metadata->test_call", "is", null)
        .neq("metadata->test_call", true);
    }

    const { data: calls } = await callsQuery;

    const totalCalls = calls?.length ?? 0;
    const completedCalls =
      calls?.filter((c) => c.status === "completed").length ?? 0;
    const pendingCalls =
      calls?.filter((c) => c.status === "queued" || c.status === "ringing")
        .length ?? 0;

    // Calculate success rate
    const successRate =
      completedCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

    // Get previous week's completed calls for trend
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const previousWeekCalls =
      calls?.filter(
        (c) => c.status === "completed" && new Date(c.created_at) < oneWeekAgo,
      ).length ?? 0;

    const casesTrend: "up" | "down" | "stable" =
      activeCases > 0 ? "up" : "stable";
    const callsTrend: "up" | "down" | "stable" =
      completedCalls > previousWeekCalls ? "up" : "down";

    return {
      activeCases,
      completedCalls,
      pendingCalls,
      successRate,
      trends: {
        cases: casesTrend,
        calls: callsTrend,
      },
    };
  }),

  /**
   * Get recent activity timeline (last 10 actions)
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Get recent cases
      let casesQuery = ctx.supabase
        .from("cases")
        .select(
          `
        id,
        created_at,
        status,
        patients!inner (
          name,
          species
        )
      `,
        )
        .eq("user_id", userId);

      if (startDate) {
        casesQuery = casesQuery.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        casesQuery = casesQuery.lte("created_at", end.toISOString());
      }

      const { data: recentCases } = await casesQuery
        .order("created_at", { ascending: false })
        .limit(5);

      // Get recent calls
      let callsQuery = ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          `
        id,
        created_at,
        status,
        ended_at,
        dynamic_variables
      `,
        )
        .eq("user_id", userId);

      if (startDate) {
        callsQuery = callsQuery.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        callsQuery = callsQuery.lte("created_at", end.toISOString());
      }

      const { data: recentCalls } = await callsQuery
        .order("created_at", { ascending: false })
        .limit(5);

      // Get recent discharge summaries
      let summariesQuery = ctx.supabase
        .from("discharge_summaries")
        .select(
          `
        id,
        created_at,
        case_id,
        cases!inner (
          patients!inner (
            name
          )
        )
      `,
        )
        .eq("user_id", userId);

      if (startDate) {
        summariesQuery = summariesQuery.gte(
          "created_at",
          startDate.toISOString(),
        );
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        summariesQuery = summariesQuery.lte("created_at", end.toISOString());
      }

      const { data: recentSummaries } = await summariesQuery
        .order("created_at", { ascending: false })
        .limit(5);

      // Combine and sort all activities
      const activities: Array<{
        id: string;
        type:
          | "case_created"
          | "call_completed"
          | "call_scheduled"
          | "discharge_summary";
        timestamp: string;
        description: string;
        metadata: Record<string, unknown>;
      }> = [
        ...(recentCases?.map((c) => {
          const patients = (c.patients as SupabasePatientsResponse) ?? [];
          const patient = patients[0];
          return {
            id: String(c.id ?? ""),
            type: "case_created" as const,
            timestamp: String(c.created_at ?? new Date().toISOString()),
            description: `Created case for ${patient?.name ?? "patient"}`,
            metadata: {
              caseId: c.id,
              patientName: patient?.name,
              species: patient?.species,
            },
          };
        }) ?? []),
        ...(recentCalls?.map((c) => {
          const dynamicVars =
            (c.dynamic_variables as DynamicVariables | null) ?? {};
          const petName = dynamicVars?.pet_name;
          return {
            id: String(c.id ?? ""),
            type:
              c.status === "completed"
                ? ("call_completed" as const)
                : ("call_scheduled" as const),
            timestamp: String(
              c.ended_at ?? c.created_at ?? new Date().toISOString(),
            ),
            description:
              c.status === "completed"
                ? `Completed follow-up call${petName ? ` for ${petName}` : ""}`
                : "Scheduled follow-up call",
            metadata: {
              callId: c.id,
              status: c.status,
            },
          };
        }) ?? []),
        ...(recentSummaries?.map((s) => {
          const casesData =
            (s.cases as { patients?: SupabasePatientsResponse } | null) ?? {};
          const patient = casesData?.patients?.[0];
          return {
            id: String(s.id ?? ""),
            type: "discharge_summary" as const,
            timestamp: String(s.created_at ?? new Date().toISOString()),
            description: `Generated discharge summary${
              patient?.name ? ` for ${patient.name}` : ""
            }`,
            metadata: {
              summaryId: s.id,
              caseId: s.case_id,
            },
          };
        }) ?? []),
      ]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 10);

      return activities;
    }),

  /**
   * Get weekly activity data for chart (last 7 days)
   */
  getWeeklyActivity: protectedProcedure
    .input(
      z.object({
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Determine date range
      let dateStart: Date;
      let dateEnd: Date;

      if (input.startDate || input.endDate) {
        dateStart = input.startDate ? new Date(input.startDate) : new Date();
        dateEnd = input.endDate ? new Date(input.endDate) : new Date();
      } else {
        // Default: last 7 days
        dateEnd = new Date();
        dateStart = new Date();
        dateStart.setDate(dateStart.getDate() - 7);
      }
      dateStart.setHours(0, 0, 0, 0);

      const { data: cases } = await ctx.supabase
        .from("cases")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", dateStart.toISOString())
        .lte("created_at", dateEnd.toISOString());

      const { data: calls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select("created_at, status, ended_at")
        .eq("user_id", userId)
        .gte("created_at", dateStart.toISOString())
        .lte("created_at", dateEnd.toISOString());

      // Group by day
      const dailyData = new Map<
        string,
        {
          date: string;
          cases: number;
          calls: number;
          completedCalls: number;
        }
      >();

      // Initialize last 7 days with zero counts
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split("T")[0];
        if (dateKey) {
          dailyData.set(dateKey, {
            date: dateKey,
            cases: 0,
            calls: 0,
            completedCalls: 0,
          });
        }
      }

      // Count cases by day
      cases?.forEach((c) => {
        const created = String(c.created_at ?? "");
        const dateKey = created.split("T")[0];
        if (dateKey) {
          const existing = dailyData.get(dateKey);
          if (existing) {
            existing.cases++;
          }
        }
      });

      // Count calls by day
      calls?.forEach((c) => {
        const created = String(c.created_at ?? "");
        const dateKey = created.split("T")[0];
        if (dateKey) {
          const existing = dailyData.get(dateKey);
          if (existing) {
            existing.calls++;
            if (c.status === "completed") {
              existing.completedCalls++;
            }
          }
        }
      });

      return Array.from(dailyData.values());
    }),

  /**
   * Get call performance metrics
   */
  getCallPerformance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const { data: calls } = await ctx.supabase
      .from("scheduled_discharge_calls")
      .select(
        "duration_seconds, cost, status, call_analysis, user_sentiment, success_evaluation",
      )
      .eq("user_id", userId)
      .eq("status", "completed");

    const totalCalls = calls?.length ?? 0;

    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        averageDuration: 0,
        totalCost: 0,
        successRate: 0,
        sentimentBreakdown: {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
      };
    }

    // Calculate average duration
    const totalDuration =
      calls?.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0) ?? 0;
    const averageDuration = Math.round(totalDuration / totalCalls);

    // Calculate total cost
    const totalCost =
      calls?.reduce((sum, c) => sum + (Number(c.cost) ?? 0), 0) ?? 0;

    // Calculate success rate based on success_evaluation or call_analysis
    const successfulCalls =
      calls?.filter((c) => {
        if (c.success_evaluation === "true" || c.success_evaluation === true) {
          return true;
        }
        const analysis = (c.call_analysis as CallAnalysis | null) ?? {};
        return (
          analysis.successEvaluation === "true" ||
          analysis.successEvaluation === true
        );
      }).length ?? 0;

    const successRate = Math.round((successfulCalls / totalCalls) * 100);

    // Calculate sentiment breakdown
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    calls?.forEach((c) => {
      const sentiment = String(c.user_sentiment ?? "neutral").toLowerCase();
      if (sentiment.includes("positive")) {
        sentimentCounts.positive++;
      } else if (sentiment.includes("negative")) {
        sentimentCounts.negative++;
      } else {
        sentimentCounts.neutral++;
      }
    });

    return {
      totalCalls,
      averageDuration,
      totalCost: Math.round(totalCost * 100) / 100,
      successRate,
      sentimentBreakdown: sentimentCounts,
    };
  }),

  /**
   * Get upcoming scheduled items (next 48 hours)
   */
  getUpcomingScheduled: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const now = new Date();
    const in48Hours = new Date();
    in48Hours.setHours(in48Hours.getHours() + 48);

    // Get upcoming calls
    const { data: upcomingCalls } = await ctx.supabase
      .from("scheduled_discharge_calls")
      .select(
        `
        id,
        scheduled_for,
        status,
        dynamic_variables,
        customer_phone
      `,
      )
      .eq("user_id", userId)
      .in("status", ["queued", "ringing"])
      .gte("scheduled_for", now.toISOString())
      .lte("scheduled_for", in48Hours.toISOString())
      .order("scheduled_for", { ascending: true });

    // Get upcoming emails
    const { data: upcomingEmails } = await ctx.supabase
      .from("scheduled_discharge_emails")
      .select(
        `
        id,
        scheduled_for,
        status,
        recipient_name,
        recipient_email
      `,
      )
      .eq("user_id", userId)
      .eq("status", "queued")
      .gte("scheduled_for", now.toISOString())
      .lte("scheduled_for", in48Hours.toISOString())
      .order("scheduled_for", { ascending: true });

    const items: Array<{
      id: string;
      type: "call" | "email";
      scheduledFor: string | null;
      status: CallStatus | EmailStatus;
      description: string;
      metadata: Record<string, unknown>;
    }> = [
      ...(upcomingCalls?.map((c) => {
        const dynamicVars =
          (c.dynamic_variables as DynamicVariables | null) ?? {};
        return {
          id: String(c.id ?? ""),
          type: "call" as const,
          scheduledFor: c.scheduled_for ? String(c.scheduled_for) : null,
          status: (c.status ?? null) as CallStatus,
          description: `Call to ${
            dynamicVars?.owner_name ?? c.customer_phone ?? "unknown"
          }`,
          metadata: {
            phone: c.customer_phone,
            patientName: dynamicVars?.pet_name,
          },
        };
      }) ?? []),
      ...(upcomingEmails?.map((e) => ({
        id: String(e.id ?? ""),
        type: "email" as const,
        scheduledFor: e.scheduled_for ? String(e.scheduled_for) : null,
        status: (e.status ?? null) as EmailStatus,
        description: `Email to ${
          e.recipient_name ?? e.recipient_email ?? "unknown"
        }`,
        metadata: {
          email: e.recipient_email,
          recipientName: e.recipient_name,
        },
      })) ?? []),
    ].sort((a, b) => {
      if (!a.scheduledFor || !b.scheduledFor) return 0;
      return (
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
      );
    });

    return items;
  }),

  /**
   * Get comprehensive case statistics including coverage metrics and completion rates
   *
   * @param input.startDate - Optional start date filter (ISO string)
   * @param input.endDate - Optional end date filter (ISO string)
   * @returns CaseStats with all metrics including new coverage and completion data
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
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Helper function to calculate percentage
      const calculatePercentage = (part: number, total: number): number => {
        return total > 0 ? Math.round((part / total) * 100) : 0;
      };

      // Helper function to get date boundaries
      const getDateBoundaries = () => {
        const now = new Date();
        return {
          weekStart: startOfWeek(now, { weekStartsOn: 1 }), // Monday
          monthStart: startOfMonth(now),
        };
      };

      // Type definition for case with relations
      type CaseWithRelations = {
        id: string;
        status: string | null;
        source: string | null;
        created_at: string | null;
        discharge_summaries: Array<{ id: string }> | null;
        soap_notes: Array<{ id: string }> | null;
      };

      // Helper function to check if case has discharge summary
      const hasDischargeSummary = (caseData: CaseWithRelations): boolean => {
        return (
          Array.isArray(caseData.discharge_summaries) &&
          caseData.discharge_summaries.length > 0
        );
      };

      // Helper function to check if case has SOAP note
      const hasSoapNote = (caseData: CaseWithRelations): boolean => {
        return (
          Array.isArray(caseData.soap_notes) && caseData.soap_notes.length > 0
        );
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
          discharge_summaries(id),
          soap_notes(id)
        `,
        )
        .eq("user_id", userId);

      if (startDate) {
        casesQuery = casesQuery.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        casesQuery = casesQuery.lte("created_at", end.toISOString());
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

      if (startDate) {
        soapNotesQuery = soapNotesQuery.gte(
          "created_at",
          startDate.toISOString(),
        );
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        soapNotesQuery = soapNotesQuery.lte("created_at", end.toISOString());
      }

      const { count: soapNotesCount } = await soapNotesQuery;

      // Discharge summaries count
      let dischargeSummariesQuery = ctx.supabase
        .from("discharge_summaries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (startDate) {
        dischargeSummariesQuery = dischargeSummariesQuery.gte(
          "created_at",
          startDate.toISOString(),
        );
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dischargeSummariesQuery = dischargeSummariesQuery.lte(
          "created_at",
          end.toISOString(),
        );
      }

      const { count: dischargeSummariesCount } = await dischargeSummariesQuery;

      // Calls completed
      let callsQuery = ctx.supabase
        .from("scheduled_discharge_calls")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");

      if (startDate) {
        callsQuery = callsQuery.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        callsQuery = callsQuery.lte("created_at", end.toISOString());
      }

      const { count: callsCompletedCount } = await callsQuery;

      // Emails sent
      let emailsQuery = ctx.supabase
        .from("scheduled_discharge_emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "sent");

      if (startDate) {
        emailsQuery = emailsQuery.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        emailsQuery = emailsQuery.lte("created_at", end.toISOString());
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

  /**
   * Get all cases with pagination and filters
   */
  getAllCases: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(50).default(20),
        status: z
          .enum(["draft", "ongoing", "completed", "reviewed"])
          .optional(),
        source: z.string().optional(),
        search: z.string().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Build base query
      let query = ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          source,
          created_at,
          patients!inner (
            id,
            name,
            species,
            owner_name
          )
        `,
          { count: "exact" },
        )
        .eq("user_id", userId);

      // Apply filters
      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.source) {
        query = query.eq("source", input.source);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      // Get total count before pagination
      const { count } = await query;

      // Apply pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;

      query = query.order("created_at", { ascending: false }).range(from, to);

      const { data: cases, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cases",
          cause: error,
        });
      }

      // For each case, check if it has SOAP notes, discharge summaries, calls, emails
      // Also fetch latest timestamps for completed items
      const enrichedCases = await Promise.all(
        (cases ?? []).map(async (c) => {
          const [
            { data: soapNotes },
            { data: dischargeSummaries },
            { data: calls },
            { data: emails },
          ] = await Promise.all([
            ctx.supabase
              .from("soap_notes")
              .select("id, created_at")
              .eq("case_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1),
            ctx.supabase
              .from("discharge_summaries")
              .select("id, created_at")
              .eq("case_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1),
            ctx.supabase
              .from("scheduled_discharge_calls")
              .select("id, created_at, ended_at")
              .eq("case_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1),
            ctx.supabase
              .from("scheduled_discharge_emails")
              .select("id, created_at, sent_at")
              .eq("case_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1),
          ]);

          const patients = (c.patients as SupabasePatientsResponse) ?? [];
          const patient = patients[0];

          // Get latest timestamps (use ended_at for calls, sent_at for emails, created_at for others)
          const soapNoteTimestamp =
            soapNotes && soapNotes.length > 0
              ? soapNotes[0]?.created_at
              : undefined;
          const dischargeSummaryTimestamp =
            dischargeSummaries && dischargeSummaries.length > 0
              ? dischargeSummaries[0]?.created_at
              : undefined;
          const dischargeCallTimestamp =
            calls && calls.length > 0
              ? (calls[0]?.ended_at ?? calls[0]?.created_at)
              : undefined;
          const dischargeEmailTimestamp =
            emails && emails.length > 0
              ? (emails[0]?.sent_at ?? emails[0]?.created_at)
              : undefined;

          return {
            id: c.id,
            status: c.status,
            source: c.source,
            created_at: c.created_at,
            patient: {
              id: patient?.id ?? "",
              name: patient?.name ?? "Unknown",
              species: patient?.species ?? "Unknown",
              owner_name: patient?.owner_name ?? "Unknown",
            },
            hasSoapNote: (soapNotes?.length ?? 0) > 0,
            hasDischargeSummary: (dischargeSummaries?.length ?? 0) > 0,
            hasDischargeCall: (calls?.length ?? 0) > 0,
            hasDischargeEmail: (emails?.length ?? 0) > 0,
            soapNoteTimestamp,
            dischargeSummaryTimestamp,
            dischargeCallTimestamp,
            dischargeEmailTimestamp,
          };
        }),
      );

      // Apply client-side search filter if provided
      let filteredCases = enrichedCases;
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredCases = enrichedCases.filter(
          (c) =>
            c.patient.name.toLowerCase().includes(searchLower) ||
            (c.patient.owner_name?.toLowerCase() ?? "").includes(searchLower),
        );
      }

      return {
        cases: filteredCases,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
      };
    }),
});
