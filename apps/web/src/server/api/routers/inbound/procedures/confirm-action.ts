/**
 * Confirm Call Action Procedure
 *
 * Marks an inbound call's action card as confirmed by the user.
 * This indicates the staff member has acknowledged/handled the action.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { confirmCallActionInput } from "../schemas";

export const confirmActionRouter = createTRPCRouter({
  /**
   * Confirm an action card for an inbound call
   */
  confirmCallAction: protectedProcedure
    .input(confirmCallActionInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get current user's clinic (gracefully handles missing user record)
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // First, verify the call exists and belongs to the user's clinic
      const { data: call, error: fetchError } = await ctx.supabase
        .from("inbound_vapi_calls")
        .select("id, clinic_name")
        .eq("id", input.callId)
        .single();

      if (fetchError || !call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      // Check authorization - only allow updates to calls in user's clinic
      if (clinic?.name && call.clinic_name !== clinic.name) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this call",
        });
      }

      // Update the call to mark action as confirmed
      const { data: updated, error: updateError } = await ctx.supabase
        .from("inbound_vapi_calls")
        .update({
          action_confirmed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.callId)
        .select("id, action_confirmed, updated_at")
        .single();

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to confirm action: ${updateError.message}`,
        });
      }

      return {
        success: true,
        call: {
          id: updated.id,
          actionConfirmed: updated.action_confirmed,
          updatedAt: updated.updated_at,
        },
      };
    }),
});
