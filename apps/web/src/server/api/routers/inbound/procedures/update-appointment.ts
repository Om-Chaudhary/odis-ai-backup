/**
 * Update Appointment Request Procedure
 *
 * Allows confirming, rejecting, or cancelling appointment requests.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createClient } from "@odis-ai/db/server";
import { updateAppointmentRequestInput } from "../schemas";

/**
 * Get user's clinic ID for authorization
 */
async function getUserClinicId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, clinic_id")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user information",
    });
  }

  return user;
}

export const updateAppointmentRouter = createTRPCRouter({
  /**
   * Update an appointment request (confirm, reject, cancel)
   */
  updateAppointmentRequest: protectedProcedure
    .input(updateAppointmentRequestInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's clinic
      const user = await getUserClinicId(supabase, ctx.user.id);

      // First, verify the appointment belongs to the user's clinic
      const { data: appointment, error: fetchError } = await supabase
        .from("appointment_requests")
        .select("id, clinic_id, status")
        .eq("id", input.id)
        .single();

      if (fetchError || !appointment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appointment request not found",
        });
      }

      // Check authorization
      if (user.clinic_id && appointment.clinic_id !== user.clinic_id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this appointment request",
        });
      }

      // Build update object
      const updateData: {
        status: string;
        notes?: string;
        confirmed_appointment_id?: string;
        updated_at: string;
      } = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };

      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }

      if (input.confirmedAppointmentId) {
        updateData.confirmed_appointment_id = input.confirmedAppointmentId;
      }

      // Update the appointment
      const { data: updated, error: updateError } = await supabase
        .from("appointment_requests")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update appointment: ${updateError.message}`,
        });
      }

      return {
        success: true,
        appointment: {
          id: updated.id,
          status: updated.status,
          notes: updated.notes,
          confirmedAppointmentId: updated.confirmed_appointment_id,
          updatedAt: updated.updated_at,
        },
      };
    }),
});
