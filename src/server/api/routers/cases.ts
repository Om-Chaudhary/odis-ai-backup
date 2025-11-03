import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const caseSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  visibility: z.enum(["public", "private"]).nullable().optional(),
  type: z.enum(["checkup", "emergency", "surgery", "follow_up"]).nullable().optional(),
  status: z.enum(["draft", "ongoing", "completed", "reviewed"]).nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const casesRouter = createTRPCRouter({
  /**
   * List all cases with optional filters
   */
  listCases: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["draft", "ongoing", "completed", "reviewed"]).optional(),
        type: z.enum(["checkup", "emergency", "surgery", "follow_up"]).optional(),
        visibility: z.enum(["public", "private"]).optional(),
        userId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.serviceClient
        .from("cases")
        .select(`
          *,
          user:users(id, email, first_name, last_name),
          patient:patients(id, name, species, breed, owner_name)
        `)
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

      // Search across patient name and owner name
      if (input.search) {
        // Note: This requires a more complex query with joins
        // For now, we'll filter in memory after fetching
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
          const patientName = (c.patient as unknown as { name?: string })?.name?.toLowerCase() ?? "";
          const ownerName = (c.patient as unknown as { owner_name?: string })?.owner_name?.toLowerCase() ?? "";
          return patientName.includes(searchLower) || ownerName.includes(searchLower);
        });
      }

      return filteredData;
    }),

  /**
   * Get single case with all related data
   */
  getCase: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.serviceClient
        .from("cases")
        .select(`
          *,
          user:users(id, email, first_name, last_name),
          patient:patients(*),
          soap_notes(*),
          discharge_summaries(*),
          transcriptions(*)
        `)
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
   * Update case (any field)
   */
  updateCase: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: caseSchema.partial(),
      })
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
   * Delete case (hard delete)
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
   * Get case statistics for dashboard
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
        completed: statusData?.filter((c) => c.status === "completed").length ?? 0,
        reviewed: statusData?.filter((c) => c.status === "reviewed").length ?? 0,
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
});
