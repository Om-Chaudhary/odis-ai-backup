/**
 * Find Case by Consultation ID Procedure
 *
 * Looks up a case by its IDEXX Neo consultation ID or appointment ID.
 * Searches in multiple locations:
 * 1. external_id column (stored as "idexx-appt-{appointmentId}")
 * 2. metadata->idexx->consultation_id (the IDEXX Neo consultation ID)
 * 3. metadata->idexx->appointment_id (the IDEXX Neo appointment ID)
 *
 * Also calculates the case's position in the sorted list for its date,
 * enabling direct navigation to the correct pagination page.
 *
 * Used for deep linking from the Chrome extension.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getClinicUserIds } from "@odis-ai/domain/clinics";
import { getLocalDayRange, DEFAULT_TIMEZONE } from "@odis-ai/shared/util/timezone";
import { format, parseISO, startOfDay } from "date-fns";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const findByConsultationIdInput = z.object({
  consultationId: z.string().min(1, "Consultation ID is required"),
  pageSize: z.number().min(1).max(100).optional().default(25),
});

export type FindByConsultationIdInput = z.infer<
  typeof findByConsultationIdInput
>;

/**
 * Calculate the page number for a case based on its position in the sorted list.
 * Cases are sorted by scheduled_at descending (most recent first).
 */
async function calculateCasePage(
  supabase: Parameters<typeof getClinicUserIds>[1],
  caseId: string,
  caseDate: string,
  clinicUserIds: string[],
  pageSize: number,
): Promise<number> {
  // Get the date's YYYY-MM-DD to query the same day range
  const dateStr = format(startOfDay(parseISO(caseDate)), "yyyy-MM-dd");
  const { startISO, endISO } = getLocalDayRange(dateStr, DEFAULT_TIMEZONE);

  // Get all case IDs for this date, sorted by scheduled_at descending
  // This matches the sorting used in list-cases.ts
  const { data: casesForDate, error } = await supabase
    .from("cases")
    .select("id, scheduled_at, created_at")
    .in("user_id", clinicUserIds)
    .or(
      `and(scheduled_at.gte.${startISO},scheduled_at.lte.${endISO}),and(scheduled_at.is.null,created_at.gte.${startISO},created_at.lte.${endISO})`,
    )
    .order("scheduled_at", { ascending: false, nullsFirst: false });

  if (error || !casesForDate) {
    // Default to page 1 if we can't determine position
    return 1;
  }

  // Find the case's position in the sorted list (0-indexed)
  const position = casesForDate.findIndex((c) => c.id === caseId);

  if (position === -1) {
    // Case not found in list (shouldn't happen), default to page 1
    return 1;
  }

  // Calculate page number (1-indexed)
  return Math.floor(position / pageSize) + 1;
}

export const findByConsultationRouter = createTRPCRouter({
  /**
   * Find a case by its IDEXX Neo consultation ID
   *
   * @param consultationId - The IDEXX Neo consultation ID (stored in cases.external_id)
   * @param pageSize - The page size used for pagination (default 25)
   * @returns The case ID, date, and page number if found
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
        const page = await calculateCasePage(
          ctx.supabase,
          caseByExternalId.id,
          caseDate,
          clinicUserIds,
          input.pageSize,
        );
        return {
          found: true,
          caseId: caseByExternalId.id,
          date: caseDate,
          page,
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
        const page = await calculateCasePage(
          ctx.supabase,
          caseByConsultationId.id,
          caseDate,
          clinicUserIds,
          input.pageSize,
        );
        return {
          found: true,
          caseId: caseByConsultationId.id,
          date: caseDate,
          page,
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
          page: null,
        };
      }

      const caseDate =
        caseByAppointmentId.scheduled_at ?? caseByAppointmentId.created_at;
      const page = await calculateCasePage(
        ctx.supabase,
        caseByAppointmentId.id,
        caseDate,
        clinicUserIds,
        input.pageSize,
      );

      return {
        found: true,
        caseId: caseByAppointmentId.id,
        date: caseDate,
        page,
      };
    }),
});
