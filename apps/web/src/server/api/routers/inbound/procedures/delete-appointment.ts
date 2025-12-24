/**
 * Delete Appointment Request Procedure
 *
 * Allows deleting appointment requests.
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

      // First, verify the appointment belongs to the user's clinic
      const { data: appointment, error: fetchError } = await ctx.supabase
        .from("appointment_requests")
        .select("id, clinic_id")
        .eq("id", input.id)
        .single();

      if (fetchError || !appointment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appointment request not found",
        });
      }

      // Check authorization - only allow deletion of appointments in user's clinic
      if (clinic?.id && appointment.clinic_id !== clinic.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this appointment request",
        });
      }

      // Delete the appointment
      const { error: deleteError } = await ctx.supabase
        .from("appointment_requests")
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
