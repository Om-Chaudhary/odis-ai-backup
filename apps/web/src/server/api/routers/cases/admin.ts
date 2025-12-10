/**
 * Cases Router - Admin Procedures
 *
 * Admin routes for case management.
 */

import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { caseSchema } from "./schemas";

export const adminRouter = createTRPCRouter({
  /**
   * [ADMIN] List all cases with optional filters
   */
  listCases: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z
          .enum(["draft", "ongoing", "completed", "reviewed"])
          .optional(),
        type: z
          .enum(["checkup", "emergency", "surgery", "follow_up"])
          .optional(),
        visibility: z.enum(["public", "private"]).optional(),
        userId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.serviceClient
        .from("cases")
        .select(
          `
          *,
          user:users(id, email, first_name, last_name),
          patient:patients(id, name, species, breed, owner_name)
        `,
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.type) {
        query = query.eq("type", input.type);
      }

      if (input.visibility) {
        query = query.eq("visibility", input.visibility);
      }

      if (input.userId) {
        query = query.eq("user_id", input.userId);
      }

      if (input.dateFrom) {
        query = query.gte("created_at", input.dateFrom);
      }

      if (input.dateTo) {
        query = query.lte("created_at", input.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cases",
          cause: error,
        });
      }

      // Apply search filter if provided
      let filteredData = data;
      if (input.search && data) {
        const searchLower = input.search.toLowerCase();
        filteredData = data.filter((c) => {
          const patientName =
            (c.patient as unknown as { name?: string })?.name?.toLowerCase() ??
            "";
          const ownerName =
            (
              c.patient as unknown as { owner_name?: string }
            )?.owner_name?.toLowerCase() ?? "";
          return (
            patientName.includes(searchLower) ?? ownerName.includes(searchLower)
          );
        });
      }

      return filteredData;
    }),

  /**
   * [ADMIN] Get single case with all related data
   */
  getCase: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("cases")
        .select(
          `
          *,
          user:users(id, email, first_name, last_name),
          patient:patients(*),
          soap_notes(*),
          discharge_summaries(*),
          transcriptions(*)
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * [ADMIN] Update case (any field)
   */
  updateCase: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: caseSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("cases")
        .update(input.data)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update case",
          cause: error,
        });
      }

      return data;
    }),

  /**
   * [ADMIN] Delete case (hard delete)
   */
  deleteCase: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.serviceClient
        .from("cases")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete case",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * [ADMIN] Bulk create cases with patients
   * Creates one case + one patient per entry
   */
  bulkCreateCases: adminProcedure
    .input(
      z.array(
        z.object({
          userId: z.string().uuid(),
          patientName: z.string().min(2),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const results = {
        successful: [] as Array<{
          caseId: string;
          patientId: string;
          patientName: string;
        }>,
        failed: [] as Array<{ patientName: string; error: string }>,
      };

      // Process each entry
      for (const entry of input) {
        try {
          // 1. Verify user exists
          const { data: user, error: userError } = await ctx.serviceClient
            .from("users")
            .select("id")
            .eq("id", entry.userId)
            .single();

          if (userError ?? !user) {
            results.failed.push({
              patientName: entry.patientName,
              error: "User not found",
            });
            continue;
          }

          // 2. Create patient
          const { data: patient, error: patientError } = await ctx.serviceClient
            .from("patients")
            .insert({
              name: entry.patientName,
              user_id: entry.userId,
            })
            .select()
            .single();

          if (patientError ?? !patient) {
            results.failed.push({
              patientName: entry.patientName,
              error: `Failed to create patient: ${
                patientError?.message ?? "Unknown error"
              }`,
            });
            continue;
          }

          // 3. Create case with defaults
          const { data: caseData, error: caseError } = await ctx.serviceClient
            .from("cases")
            .insert({
              user_id: entry.userId,
              status: "draft" as const,
              type: "checkup" as const,
              visibility: "private" as const,
            })
            .select()
            .single();

          if (caseError ?? !caseData) {
            // Clean up patient if case creation fails
            await ctx.serviceClient
              .from("patients")
              .delete()
              .eq("id", patient.id);

            results.failed.push({
              patientName: entry.patientName,
              error: `Failed to create case: ${
                caseError?.message ?? "Unknown error"
              }`,
            });
            continue;
          }

          // 4. Link patient to case
          const { error: updateError } = await ctx.serviceClient
            .from("patients")
            .update({ case_id: caseData.id })
            .eq("id", patient.id);

          if (updateError) {
            // Clean up both if linking fails
            await ctx.serviceClient
              .from("cases")
              .delete()
              .eq("id", caseData.id);
            await ctx.serviceClient
              .from("patients")
              .delete()
              .eq("id", patient.id);

            results.failed.push({
              patientName: entry.patientName,
              error: `Failed to link patient to case: ${updateError.message}`,
            });
            continue;
          }

          results.successful.push({
            caseId: caseData.id,
            patientId: patient.id,
            patientName: entry.patientName,
          });
        } catch (error) {
          results.failed.push({
            patientName: entry.patientName,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),

  /**
   * [ADMIN] Get case statistics for dashboard
   */
  getCaseStats: adminProcedure.query(async ({ ctx }) => {
    // Total cases
    const { count: totalCases } = await ctx.serviceClient
      .from("cases")
      .select("*", { count: "exact", head: true });

    // Cases by status
    const { data: statusData } = await ctx.serviceClient
      .from("cases")
      .select("status")
      .not("status", "is", null);

    // Cases by type
    const { data: typeData } = await ctx.serviceClient
      .from("cases")
      .select("type")
      .not("type", "is", null);

    const stats = {
      totalCases: totalCases ?? 0,
      byStatus: {
        draft: statusData?.filter((c) => c.status === "draft").length ?? 0,
        ongoing: statusData?.filter((c) => c.status === "ongoing").length ?? 0,
        completed:
          statusData?.filter((c) => c.status === "completed").length ?? 0,
        reviewed:
          statusData?.filter((c) => c.status === "reviewed").length ?? 0,
      },
      byType: {
        checkup: typeData?.filter((c) => c.type === "checkup").length ?? 0,
        emergency: typeData?.filter((c) => c.type === "emergency").length ?? 0,
        surgery: typeData?.filter((c) => c.type === "surgery").length ?? 0,
        follow_up: typeData?.filter((c) => c.type === "follow_up").length ?? 0,
      },
    };

    return stats;
  }),

  /**
   * [ADMIN] Get time series data for dashboard charts
   */
  getTimeSeriesStats: adminProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);
      const startDate = daysAgo.toISOString();

      // Fetch cases created in the time period
      const { data: casesData } = await ctx.serviceClient
        .from("cases")
        .select("created_at, status")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });

      // Fetch SOAP notes created in the time period
      const { data: soapNotesData } = await ctx.serviceClient
        .from("soap_notes")
        .select("created_at")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });

      // Fetch discharge summaries created in the time period
      const { data: dischargeSummariesData } = await ctx.serviceClient
        .from("discharge_summaries")
        .select("created_at")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });

      // Generate array of dates for the period
      const dateArray: string[] = [];
      for (let i = 0; i < input.days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (input.days - 1 - i));
        dateArray.push(date.toISOString().split("T")[0] ?? "");
      }

      // Helper function to count items by date
      const countByDate = (
        data: Array<{ created_at: string }> | null,
      ): Record<string, number> => {
        const counts: Record<string, number> = {};
        dateArray.forEach((date) => (counts[date] = 0));

        data?.forEach((item) => {
          const date = item.created_at.split("T")[0];
          if (date && counts[date] !== undefined) {
            counts[date]++;
          }
        });

        return counts;
      };

      // Process data
      const casesByDate = countByDate(casesData ?? []);
      const soapNotesByDate = countByDate(soapNotesData ?? []);
      const dischargeSummariesByDate = countByDate(
        dischargeSummariesData ?? [],
      );

      // Count completed cases by date
      const completedCasesByDate: Record<string, number> = {};
      dateArray.forEach((date) => (completedCasesByDate[date] = 0));
      casesData
        ?.filter((c) => c.status === "completed")
        .forEach((item) => {
          const date = (item.created_at as string).split("T")[0];
          if (date && completedCasesByDate[date] !== undefined) {
            completedCasesByDate[date]++;
          }
        });

      // Format for chart consumption
      const chartData = dateArray.map((date) => ({
        date,
        casesCreated: casesByDate[date] ?? 0,
        casesCompleted: completedCasesByDate[date] ?? 0,
        soapNotes: soapNotesByDate[date] ?? 0,
        dischargeSummaries: dischargeSummariesByDate[date] ?? 0,
      }));

      // Calculate totals
      const totals = {
        casesCreated: Object.values(casesByDate).reduce((a, b) => a + b, 0),
        casesCompleted: Object.values(completedCasesByDate).reduce(
          (a, b) => a + b,
          0,
        ),
        soapNotes: Object.values(soapNotesByDate).reduce((a, b) => a + b, 0),
        dischargeSummaries: Object.values(dischargeSummariesByDate).reduce(
          (a, b) => a + b,
          0,
        ),
      };

      return {
        chartData,
        totals,
      };
    }),
});
