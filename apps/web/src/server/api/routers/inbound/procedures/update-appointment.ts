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
        .from("appointment_bookings")
        .select("id, clinic_id, status, metadata, date, start_time")
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

      // Build update object for appointment_bookings table
      const updateData: {
        status: string;
        metadata?: Json;
        confirmation_number?: string;
        time_range?: string;
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

      // Update time_range if date or time is provided (for confirmed bookings)
      // date and start_time are GENERATED columns derived from time_range
      if (input.confirmedDate || input.confirmedTime) {
        // Use provided values or fall back to existing booking data
        const date = input.confirmedDate ?? booking.date;
        let time = input.confirmedTime;

        if (time) {
          // Normalize time to HH:MM:SS format
          const timeParts = time.split(":");
          if (timeParts.length === 2) {
            time = `${time}:00`;
          }
        } else {
          time = booking.start_time ?? undefined;
        }

        if (date && time) {
          const startTimestamp = `${date} ${time} America/Los_Angeles`;
          // Default to 30-minute appointment duration
          const [hours, minutes, seconds] = time.split(":").map(Number);
          const endMinutes = minutes ?? 0 + 30;
          const endHours = hours ?? 0 + Math.floor(endMinutes / 60);
          const endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}:${String(seconds ?? 0).padStart(2, "0")}`;
          const endTimestamp = `${date} ${endTime} America/Los_Angeles`;
          updateData.time_range = `[${startTimestamp},${endTimestamp})`;
        }
      }

      // Update the booking
      const { data: updated, error: updateError } = await ctx.supabase
        .from("appointment_bookings")
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
