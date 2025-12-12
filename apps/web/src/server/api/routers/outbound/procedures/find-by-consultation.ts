/**
 * Find Case by Consultation ID Procedure
 *
 * Looks up a case by its IDEXX Neo consultation ID or appointment ID.
 * Searches in multiple locations:
 * 1. external_id column (stored as "idexx-appt-{appointmentId}")
 * 2. metadata->idexx->consultation_id (the IDEXX Neo consultation ID)
 * 3. metadata->idexx->appointment_id (the IDEXX Neo appointment ID)
 *
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

      // The consultation ID could match:
      // 1. external_id column (stored as "idexx-appt-{appointmentId}")
      // 2. metadata->idexx->consultation_id (the IDEXX Neo consultation ID)
      // 3. metadata->idexx->appointment_id (the IDEXX Neo appointment ID)
      const rawId = input.consultationId.replace(/^idexx-appt-/, "");
      const prefixedId = `idexx-appt-${rawId}`;

      // First try external_id (exact match with prefix)
      const { data: caseByExternalId, error: extIdError } = await ctx.supabase
        .from("cases")
        .select("id, scheduled_at, created_at")
        .eq("external_id", prefixedId)
        .in("user_id", clinicUserIds)
        .maybeSingle();

      if (extIdError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to find case: ${extIdError.message}`,
        });
      }

      if (caseByExternalId) {
        const caseDate =
          caseByExternalId.scheduled_at ?? caseByExternalId.created_at;
        return {
          found: true,
          caseId: caseByExternalId.id,
          date: caseDate,
        };
      }

      // If not found by external_id, try metadata->idexx->consultation_id
      const { data: caseByConsultationId, error: consultError } =
        await ctx.supabase
          .from("cases")
          .select("id, scheduled_at, created_at")
          .eq("metadata->idexx->>consultation_id", rawId)
          .in("user_id", clinicUserIds)
          .maybeSingle();

      if (consultError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to find case: ${consultError.message}`,
        });
      }

      if (caseByConsultationId) {
        const caseDate =
          caseByConsultationId.scheduled_at ?? caseByConsultationId.created_at;
        return {
          found: true,
          caseId: caseByConsultationId.id,
          date: caseDate,
        };
      }

      // If still not found, try metadata->idexx->appointment_id
      const { data: caseByAppointmentId, error: apptError } = await ctx.supabase
        .from("cases")
        .select("id, scheduled_at, created_at")
        .eq("metadata->idexx->>appointment_id", rawId)
        .in("user_id", clinicUserIds)
        .maybeSingle();

      if (apptError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to find case: ${apptError.message}`,
        });
      }

      if (!caseByAppointmentId) {
        return {
          found: false,
          caseId: null,
          date: null,
        };
      }

      const caseDate =
        caseByAppointmentId.scheduled_at ?? caseByAppointmentId.created_at;

      return {
        found: true,
        caseId: caseByAppointmentId.id,
        date: caseDate,
      };
    }),
});
