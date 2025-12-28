/**
 * Delete Appointment Request Procedure
 *
 * Allows deleting VAPI bookings.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";

export const deleteAppointmentRouter = createTRPCRouter({
  /**
   * Delete an appointment request
   */
  deleteAppointmentRequest: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get current user's clinic (gracefully handles missing user record)
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // First, verify the booking belongs to the user's clinic
      const { data: booking, error: fetchError } = await ctx.supabase
        .from("vapi_bookings")
        .select("id, clinic_id")
        .eq("id", input.id)
        .single();

      if (fetchError || !booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appointment request not found",
        });
      }

      // Check authorization - only allow deletion of bookings in user's clinic
      if (clinic?.id && booking.clinic_id !== clinic.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this appointment request",
        });
      }

      // Delete the booking
      const { error: deleteError } = await ctx.supabase
        .from("vapi_bookings")
        .delete()
        .eq("id", input.id);

      if (deleteError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete appointment: ${deleteError.message}`,
        });
      }

      return {
        success: true,
      };
    }),
});
