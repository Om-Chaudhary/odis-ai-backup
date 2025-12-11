import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const reviewCategoryEnum = z.enum([
  "to_review",
  "good",
  "bad",
  "voicemail",
  "failed",
  "no_answer",
  "needs_followup",
]);

export type ReviewCategory = z.infer<typeof reviewCategoryEnum>;

const listDischargeCallsInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(10).max(100).default(50),
  reviewCategory: reviewCategoryEnum.optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  search: z.string().optional(), // Search by patient name, owner name, or phone
  sortBy: z
    .enum(["created_at", "duration_seconds", "cost", "ended_at"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const updateReviewCategoryInput = z.object({
  callId: z.string().uuid(),
  reviewCategory: reviewCategoryEnum,
});

const bulkUpdateReviewCategoryInput = z.object({
  callIds: z.array(z.string().uuid()).min(1).max(100),
  reviewCategory: reviewCategoryEnum,
});

// ============================================================================
// ROUTER
// ============================================================================

export const adminDischargeCallsRouter = createTRPCRouter({
  /**
   * List discharge calls for admin triage
   * Optimized for reviewing ~200 pilot calls efficiently
   */
  listDischargeCalls: adminProcedure
    .input(listDischargeCallsInput)
    .query(async ({ ctx, input }) => {
      const { serviceClient } = ctx;

      // Build query with all fields needed for triage view
      let query = serviceClient
        .from("scheduled_discharge_calls")
        .select(
          `
          id,
          status,
          review_category,
          created_at,
          ended_at,
          ended_reason,
          duration_seconds,
          cost,
          customer_phone,
          recording_url,
          transcript,
          summary,
          success_evaluation,
          user_sentiment,
          vapi_call_id,
          case_id,
          cases!scheduled_discharge_calls_case_id_fkey (
            id,
            patients (
              id,
              name,
              owner_name,
              owner_phone,
              owner_email
            )
          )
        `,
          { count: "exact" },
        )
        .order(input.sortBy, { ascending: input.sortOrder === "asc" });

      // Apply review category filter (default to 'to_review' for triage workflow)
      if (input.reviewCategory) {
        query = query.eq("review_category", input.reviewCategory);
      }

      // Apply date filters
      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      // Apply search filter
      if (input.search) {
        query = query.or(
          `customer_phone.ilike.%${input.search}%,transcript.ilike.%${input.search}%`,
        );
      }

      // Apply pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;
      query = query.range(from, to);

      const { data: calls, error, count } = await query;

      if (error) {
        console.error("[AdminDischargeCalls] Query error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch discharge calls: ${error.message}`,
        });
      }

      // Transform the nested data for easier frontend consumption
      const transformedCalls = (calls ?? []).map((call) => {
        // Safely handle the nested case/patient data from Supabase
        const caseData = call.cases;
        const patients =
          caseData && typeof caseData === "object" && "patients" in caseData
            ? (caseData.patients as
                | Array<{
                    id: string;
                    name: string;
                    owner_name: string;
                    owner_phone: string;
                    owner_email: string | null;
                  }>
                | undefined)
            : undefined;
        const patient = patients?.[0];

        return {
          id: call.id,
          status: call.status,
          reviewCategory: call.review_category ?? "to_review",
          createdAt: call.created_at,
          endedAt: call.ended_at,
          endedReason: call.ended_reason,
          durationSeconds: call.duration_seconds,
          cost: call.cost,
          customerPhone: call.customer_phone,
          recordingUrl: call.recording_url,
          transcript: call.transcript,
          summary: call.summary,
          successEvaluation: call.success_evaluation,
          userSentiment: call.user_sentiment,
          vapiCallId: call.vapi_call_id,
          caseId: call.case_id,
          patientName: patient?.name ?? "Unknown",
          ownerName: patient?.owner_name ?? "Unknown",
          ownerPhone: patient?.owner_phone ?? null,
          ownerEmail: patient?.owner_email ?? null,
        };
      });

      return {
        calls: transformedCalls,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
      };
    }),

  /**
   * Get triage statistics for progress tracking
   */
  getTriageStats: adminProcedure.query(async ({ ctx }) => {
    const { serviceClient } = ctx;

    const { data: calls, error } = await serviceClient
      .from("scheduled_discharge_calls")
      .select("review_category, status, ended_reason");

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch triage stats: ${error.message}`,
      });
    }

    const allCalls = calls ?? [];
    const total = allCalls.length;

    // Count by review category
    const byCategory = {
      to_review: allCalls.filter(
        (c) => c.review_category === "to_review" || !c.review_category,
      ).length,
      good: allCalls.filter((c) => c.review_category === "good").length,
      bad: allCalls.filter((c) => c.review_category === "bad").length,
      voicemail: allCalls.filter((c) => c.review_category === "voicemail")
        .length,
      failed: allCalls.filter((c) => c.review_category === "failed").length,
      no_answer: allCalls.filter((c) => c.review_category === "no_answer")
        .length,
      needs_followup: allCalls.filter(
        (c) => c.review_category === "needs_followup",
      ).length,
    };

    const reviewed = total - byCategory.to_review;
    const reviewedPercentage =
      total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return {
      total,
      reviewed,
      reviewedPercentage,
      byCategory,
    };
  }),

  /**
   * Update review category for a single call
   */
  updateReviewCategory: adminProcedure
    .input(updateReviewCategoryInput)
    .mutation(async ({ ctx, input }) => {
      const { serviceClient } = ctx;

      const { error } = await serviceClient
        .from("scheduled_discharge_calls")
        .update({ review_category: input.reviewCategory })
        .eq("id", input.callId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update review category: ${error.message}`,
        });
      }

      return { success: true };
    }),

  /**
   * Bulk update review category for multiple calls
   * Optimized for batch operations during triage
   */
  bulkUpdateReviewCategory: adminProcedure
    .input(bulkUpdateReviewCategoryInput)
    .mutation(async ({ ctx, input }) => {
      const { serviceClient } = ctx;

      const { error } = await serviceClient
        .from("scheduled_discharge_calls")
        .update({ review_category: input.reviewCategory })
        .in("id", input.callIds);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to bulk update review categories: ${error.message}`,
        });
      }

      return { success: true, updatedCount: input.callIds.length };
    }),

  /**
   * Get single call with full details for expanded view
   */
  getCallDetails: adminProcedure
    .input(z.object({ callId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { serviceClient } = ctx;

      const { data: call, error } = await serviceClient
        .from("scheduled_discharge_calls")
        .select(
          `
          *,
          cases!scheduled_discharge_calls_case_id_fkey (
            id,
            status,
            source,
            created_at,
            patients (
              id,
              name,
              species,
              breed,
              owner_name,
              owner_phone,
              owner_email
            ),
            discharge_summaries (
              id,
              content,
              created_at
            )
          )
        `,
        )
        .eq("id", input.callId)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      return call;
    }),
});
