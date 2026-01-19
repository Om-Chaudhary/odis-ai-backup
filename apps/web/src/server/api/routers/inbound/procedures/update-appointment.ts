/**
 * Update Appointment Request Procedure
 *
 * Allows confirming, rejecting, or cancelling VAPI bookings.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { updateAppointmentRequestInput } from "../schemas";
import type { Json } from "@odis-ai/shared/types";

export const updateAppointmentRouter = createTRPCRouter({
  /**
   * Update an appointment request (confirm, reject, cancel)
   */
  updateAppointmentRequest: protectedProcedure
    .input(updateAppointmentRequestInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get current user's clinic (gracefully handles missing user record)
      const clinic = await getClinicByUserId(userId, ctx.supabase);

      // First, verify the booking belongs to the user's clinic
      const { data: booking, error: fetchError } = await ctx.supabase
        .from("vapi_bookings")
        .select("id, clinic_id, status, metadata")
        .eq("id", input.id)
        .single();

      if (fetchError || !booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appointment request not found",
        });
      }

      // Check authorization - only allow updates to bookings in user's clinic
      if (clinic?.id && booking.clinic_id !== clinic.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this appointment request",
        });
      }

      // Build update object for vapi_bookings table
      const updateData: {
        status: string;
        metadata?: Json;
        confirmation_number?: string;
        date?: string;
        start_time?: string;
        updated_at: string;
      } = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };

      // Handle notes by storing in metadata
      if (input.notes !== undefined) {
        const existingMetadata =
          (booking.metadata as Record<string, unknown>) ?? {};
        updateData.metadata = {
          ...existingMetadata,
          notes: input.notes,
        } as Json;
      }

      if (input.confirmedAppointmentId) {
        updateData.confirmation_number = input.confirmedAppointmentId;
      }

      // Update date and time if provided (for confirmed bookings)
      if (input.confirmedDate) {
        updateData.date = input.confirmedDate;
      }

      if (input.confirmedTime) {
        // Normalize time to HH:MM:SS format
        const timeParts = input.confirmedTime.split(":");
        const normalizedTime =
          timeParts.length === 2
            ? `${input.confirmedTime}:00`
            : input.confirmedTime;
        updateData.start_time = normalizedTime;
      }

      // Update the booking
      const { data: updated, error: updateError } = await ctx.supabase
        .from("vapi_bookings")
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

      // Extract notes from metadata for response
      const updatedMetadata = updated.metadata as Record<
        string,
        unknown
      > | null;

      return {
        success: true,
        appointment: {
          id: updated.id,
          status: updated.status,
          notes:
            typeof updatedMetadata?.notes === "string"
              ? updatedMetadata.notes
              : null,
          confirmedAppointmentId: updated.confirmation_number,
          confirmedDate: updated.date,
          confirmedTime: updated.start_time,
          updatedAt: updated.updated_at,
        },
      };
    }),
});
