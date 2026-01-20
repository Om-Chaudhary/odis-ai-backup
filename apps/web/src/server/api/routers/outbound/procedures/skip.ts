/**
 * Skip Case Procedure
 *
 * Marks a case as skipped with optional reason.
 */

import { TRPCError } from "@trpc/server";
import {
  getClinicUserIds,
  getClinicByUserId,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { skipCaseInput } from "../schemas";

export const skipRouter = createTRPCRouter({
  skipCase: protectedProcedure
    .input(skipCaseInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // Verify case belongs to clinic
      const { data: caseData, error: fetchError } = await ctx.supabase
        .from("cases")
        .select("id, metadata")
        .eq("id", input.caseId)
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .single();

      if (fetchError || !caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      // Update metadata with skip info
      const existingMetadata =
        (caseData.metadata as Record<string, unknown>) ?? {};
      const updatedMetadata = {
        ...existingMetadata,
        discharge_skipped: true,
        discharge_skipped_at: new Date().toISOString(),
        discharge_skip_reason: input.reason ?? null,
      };

      const { error: updateError } = await ctx.supabase
        .from("cases")
        .update({ metadata: updatedMetadata })
        .eq("id", input.caseId);

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to skip case: ${updateError.message}`,
        });
      }

      return { success: true };
    }),
});
