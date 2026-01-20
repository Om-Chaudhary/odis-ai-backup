/**
 * Dashboard Activity Procedures
 *
 * Recent activity timeline and daily/weekly aggregates.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type SupabasePatientsResponse, type DynamicVariables } from "./types";
import {
  getClinicUserIds,
  getClinicBySlug,
  getClinicByUserId,
  userHasClinicAccess,
  getClinicUserIdsEnhanced,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import { TRPCError } from "@trpc/server";

export const activityRouter = createTRPCRouter({
  /**
   * Get recent activity timeline (last 10 actions)
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
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

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      // Get recent cases (clinic-scoped)
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
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds));

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

      // Get recent calls (clinic-scoped)
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
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds));

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

      // Get recent discharge summaries (clinic-scoped)
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
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds));

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
   * Get daily activity aggregates for timeline view (last 7 days)
   */
  getDailyActivityAggregates: protectedProcedure
    .input(
      z.object({
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
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

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const days = input.days ?? 7;

      // Calculate date range
      const endDate = input.endDate ? new Date(input.endDate) : new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = input.startDate
        ? new Date(input.startDate)
        : new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);

      // Initialize daily aggregates map
      const dailyAggregates = new Map<
        string,
        {
          date: string;
          casesCreated: number;
          dischargeSummariesGenerated: number;
          callsCompleted: number;
          callsScheduled: number;
          emailsSent: number;
          soapNotesCreated: number;
        }
      >();

      // Initialize all days in range with zero counts
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split("T")[0];
        if (dateKey) {
          dailyAggregates.set(dateKey, {
            date: dateKey,
            casesCreated: 0,
            dischargeSummariesGenerated: 0,
            callsCompleted: 0,
            callsScheduled: 0,
            emailsSent: 0,
            soapNotesCreated: 0,
          });
        }
      }

      // Fetch all data in parallel (clinic-scoped)
      const [
        { data: cases },
        { data: dischargeSummaries },
        { data: calls },
        { data: emails },
        { data: soapNotes },
      ] = await Promise.all([
        ctx.supabase
          .from("cases")
          .select("created_at")
          .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        ctx.supabase
          .from("discharge_summaries")
          .select("created_at")
          .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        ctx.supabase
          .from("scheduled_discharge_calls")
          .select("created_at, status, ended_at")
          .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        ctx.supabase
          .from("scheduled_discharge_emails")
          .select("created_at, status, sent_at")
          .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        ctx.supabase
          .from("soap_notes")
          .select("created_at, cases!inner(user_id)")
          .in("cases.user_id", clinicUserIds)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
      ]);

      // Aggregate cases
      cases?.forEach((c) => {
        const created = String(c.created_at ?? "");
        const dateKey = created.split("T")[0];
        if (dateKey) {
          const aggregate = dailyAggregates.get(dateKey);
          if (aggregate) {
            aggregate.casesCreated++;
          }
        }
      });

      // Aggregate discharge summaries
      dischargeSummaries?.forEach((s) => {
        const created = String(s.created_at ?? "");
        const dateKey = created.split("T")[0];
        if (dateKey) {
          const aggregate = dailyAggregates.get(dateKey);
          if (aggregate) {
            aggregate.dischargeSummariesGenerated++;
          }
        }
      });

      // Aggregate calls
      calls?.forEach((c) => {
        const created = String(c.created_at ?? "");
        const dateKey = created.split("T")[0];
        if (dateKey) {
          const aggregate = dailyAggregates.get(dateKey);
          if (aggregate) {
            if (c.status === "completed") {
              aggregate.callsCompleted++;
            } else if (
              c.status === "queued" ||
              c.status === "ringing" ||
              c.status === "in_progress"
            ) {
              aggregate.callsScheduled++;
            }
          }
        }
      });

      // Aggregate emails
      emails?.forEach((e) => {
        const created = String(e.created_at ?? "");
        const dateKey = created.split("T")[0];
        if (dateKey) {
          const aggregate = dailyAggregates.get(dateKey);
          if (aggregate && e.status === "sent") {
            aggregate.emailsSent++;
          }
        }
      });

      // Aggregate SOAP notes
      soapNotes?.forEach((n) => {
        const created = String(n.created_at ?? "");
        const dateKey = created.split("T")[0];
        if (dateKey) {
          const aggregate = dailyAggregates.get(dateKey);
          if (aggregate) {
            aggregate.soapNotesCreated++;
          }
        }
      });

      // Format dates and create result array
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const formatDateLabel = (dateStr: string): string => {
        const date = new Date(dateStr + "T00:00:00");
        const dateTime = date.getTime();

        if (dateTime === today.getTime()) {
          return "Today";
        }
        if (dateTime === yesterday.getTime()) {
          return "Yesterday";
        }
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      };

      return Array.from(dailyAggregates.values())
        .map((agg) => ({
          ...agg,
          dateLabel: formatDateLabel(agg.date),
        }))
        .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
    }),

  /**
   * Get weekly activity data for chart (last 7 days)
   */
  getWeeklyActivity: protectedProcedure
    .input(
      z.object({
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
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

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

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
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .gte("created_at", dateStart.toISOString())
        .lte("created_at", dateEnd.toISOString());

      const { data: calls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select("created_at, status, ended_at")
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
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
});
