/**
 * Update Communication Preferences Procedure
 *
 * Updates the communication preferences (call_enabled, email_enabled) for a case.
 * This allows doctors to opt-out of specific communication channels for a case
 * before or after scheduling.
 */

import { TRPCError } from "@trpc/server";
import {
  getClinicUserIds,
  getClinicByUserId,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { updateCommunicationPreferencesInput } from "../schemas";

export const updateCommunicationPreferencesRouter = createTRPCRouter({
  updateCommunicationPreferences: protectedProcedure
    .input(updateCommunicationPreferencesInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get all user IDs in the same clinic for shared access
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // Verify the case exists and belongs to the user's clinic
      const { data: existingCase, error: fetchError } = await ctx.supabase
        .from("cases")
        .select("id")
        .eq("id", input.caseId)
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .single();

      if (fetchError || !existingCase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found or you do not have access",
        });
      }

      // Update the case with new communication preferences
      const { error: updateError } = await ctx.supabase
        .from("cases")
        .update({
          call_enabled: input.callEnabled,
          email_enabled: input.emailEnabled,
        })
        .eq("id", input.caseId);

      if (updateError) {
        console.error(
          "[UpdateCommunicationPreferences] Failed to update case:",
          updateError
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update communication preferences",
        });
      }

      console.log("[UpdateCommunicationPreferences] Updated preferences", {
        caseId: input.caseId,
        callEnabled: input.callEnabled,
        emailEnabled: input.emailEnabled,
      });

      return {
        success: true,
        callEnabled: input.callEnabled,
        emailEnabled: input.emailEnabled,
      };
    }),
});
