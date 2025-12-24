/**
 * Delete Clinic Message Procedure
 *
 * Allows deleting clinic messages.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";

export const deleteMessageRouter = createTRPCRouter({
  /**
   * Delete a clinic message
   */
  deleteClinicMessage: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get current user's clinic (gracefully handles missing user record)
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // First, verify the message belongs to the user's clinic
      const { data: message, error: fetchError } = await ctx.supabase
        .from("clinic_messages")
        .select("id, clinic_id")
        .eq("id", input.id)
        .single();

      if (fetchError || !message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Check authorization - only allow deletion of messages in user's clinic
      if (clinic?.id && message.clinic_id !== clinic.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this message",
        });
      }

      // Delete the message
      const { error: deleteError } = await ctx.supabase
        .from("clinic_messages")
        .delete()
        .eq("id", input.id);

      if (deleteError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete message: ${deleteError.message}`,
        });
      }

      return {
        success: true,
      };
    }),
});
