/**
 * Find Case by Consultation ID Procedure
 *
 * Looks up a case by its IDEXX Neo consultation ID (stored in external_id).
 * Used for deep linking from the Chrome extension.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getClinicUserIds } from "@odis-ai/clinics/utils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const findByConsultationIdInput = z.object({
  consultationId: z.string().min(1, "Consultation ID is required"),
});

export type FindByConsultationIdInput = z.infer<
  typeof findByConsultationIdInput
>;

export const findByConsultationRouter = createTRPCRouter({
  /**
   * Find a case by its IDEXX Neo consultation ID
   *
   * @param consultationId - The IDEXX Neo consultation ID (stored in cases.external_id)
   * @returns The case ID if found, null otherwise
   */
  findByConsultationId: protectedProcedure
    .input(findByConsultationIdInput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get all user IDs in the same clinic for shared view
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);

      // Look up case by external_id (IDEXX consultation ID)
      const { data: caseData, error } = await ctx.supabase
        .from("cases")
        .select("id, scheduled_at, created_at")
        .eq("external_id", input.consultationId)
        .in("user_id", clinicUserIds)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to find case: ${error.message}`,
        });
      }

      if (!caseData) {
        return {
          found: false,
          caseId: null,
          date: null,
        };
      }

      // Return the case ID and the date to navigate to
      // Use scheduled_at (appointment date) if available, otherwise created_at
      const caseDate = caseData.scheduled_at ?? caseData.created_at;

      return {
        found: true,
        caseId: caseData.id,
        date: caseDate,
      };
    }),
});
