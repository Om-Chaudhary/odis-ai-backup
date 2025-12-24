/**
 * Cases Router - User Cases Procedures
 *
 * User's own cases queries and mutations.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { checkCaseDischargeReadiness } from "@odis-ai/shared/util/discharge-readiness";
import { getLocalDayRange, DEFAULT_TIMEZONE } from "@odis-ai/shared/util/timezone";
import type { BackendCase } from "@odis-ai/shared/types";
import { getClinicUserIds } from "@odis-ai/domain/clinics";

export const userCasesRouter = createTRPCRouter({
  /**
   * List current user's cases for a specific date with pagination
   */
  listMyCasesToday: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(50).default(10),
        date: z.string().optional(), // Single day (YYYY-MM-DD)
        startDate: z.string().optional(), // Range start (YYYY-MM-DD)
        endDate: z.string().optional(), // Range end (YYYY-MM-DD)
        readinessFilter: z
          .enum(["all", "ready_for_discharge", "not_ready"])
          .optional()
          .default("all"),
        fetchAll: z.boolean().optional().default(false), // Fetch all cases (no pagination)
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get all user IDs in the same clinic for shared data access
      const clinicUserIds = await getClinicUserIds(ctx.user.id, ctx.supabase);

      // Determine date range: use startDate/endDate if provided, otherwise use single date
      // If no date parameters provided at all, search all time (used when search is active)
      // Uses timezone-aware boundaries to ensure cases are filtered by LOCAL day, not UTC day
      let startIso: string | null = null;
      let endIso: string | null = null;
      const hasDateFilter = !!(input.startDate ?? input.endDate ?? input.date);

      if (input.startDate && input.endDate) {
        // Date range mode - get proper timezone-aware boundaries
        const startRange = getLocalDayRange(input.startDate, DEFAULT_TIMEZONE);
        const endRange = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        startIso = startRange.startISO;
        endIso = endRange.endISO;
      } else if (input.date) {
        // Single date mode (backward compatible) - get proper timezone-aware boundaries
        const dayRange = getLocalDayRange(input.date, DEFAULT_TIMEZONE);
        startIso = dayRange.startISO;
        endIso = dayRange.endISO;
      }
      // else: no date filter = search all time (startIso and endIso remain null)

      // Get total count - filter by scheduled_at (with created_at fallback when scheduled_at is null)
      // We need to count cases where:
      // 1. scheduled_at is in range, OR
      // 2. scheduled_at is null AND created_at is in range
      let count: number | null = null;

      if (hasDateFilter && startIso && endIso) {
        // Use .or() to implement COALESCE(scheduled_at, created_at) logic
        // Filter by clinic users for shared dashboard access
        const { count: filteredCount } = await ctx.supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .in("user_id", clinicUserIds)
          .or(
            `and(scheduled_at.gte.${startIso},scheduled_at.lte.${endIso}),and(scheduled_at.is.null,created_at.gte.${startIso},created_at.lte.${endIso})`,
          );
        count = filteredCount;
      } else {
        // No date filter - count all cases (for clinic)
        const { count: totalCount } = await ctx.supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .in("user_id", clinicUserIds);
        count = totalCount;
      }

      // Calculate pagination range
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;

      // Get paginated data with all relations
      let dataQuery = ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          source,
          type,
          created_at,
          scheduled_at,
          metadata,
          patients (
            id,
            name,
            species,
            breed,
            owner_name,
            owner_email,
            owner_phone
          ),
          transcriptions (
            id,
            transcript
          ),
          soap_notes (
            id,
            subjective,
            objective,
            assessment,
            plan
          ),
          discharge_summaries (
            id,
            content,
            created_at
          ),
          scheduled_discharge_calls (
            id,
            status,
            scheduled_for,
            ended_at,
            ended_reason,
            vapi_call_id,
            transcript,
            recording_url,
            duration_seconds,
            created_at
          ),
          scheduled_discharge_emails (
            id,
            status,
            scheduled_for,
            sent_at,
            created_at
          )
        `,
        )
        .in("user_id", clinicUserIds);

      // Apply date filter by scheduled_at (with created_at fallback when scheduled_at is null)
      // Cases are shown on the day they are scheduled for, or created_at if not scheduled
      if (hasDateFilter && startIso && endIso) {
        // Use .or() to implement COALESCE(scheduled_at, created_at) logic
        dataQuery = dataQuery.or(
          `and(scheduled_at.gte.${startIso},scheduled_at.lte.${endIso}),and(scheduled_at.is.null,created_at.gte.${startIso},created_at.lte.${endIso})`,
        );
      }

      // Execute query - skip pagination if fetchAll is true
      let data;
      let error;
      if (input.fetchAll) {
        const result = await dataQuery.order("scheduled_at", {
          ascending: false,
          nullsFirst: false,
        });
        data = result.data;
        error = result.error;
      } else {
        const result = await dataQuery
          .order("scheduled_at", { ascending: false, nullsFirst: false })
          .range(from, to);
        data = result.data;
        error = result.error;
      }

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cases",
          cause: error,
        });
      }

      // Fetch user settings for test mode
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select("test_mode_enabled, test_contact_email, test_contact_phone")
        .eq("id", ctx.user.id)
        .single();

      const testModeEnabled = userSettings?.test_mode_enabled ?? false;
      const testContactEmail = userSettings?.test_contact_email ?? null;
      const testContactPhone = userSettings?.test_contact_phone ?? null;

      // Apply readiness filtering if requested
      let filteredCases = data ?? [];
      const userEmail = ctx.user.email;

      if (input.readinessFilter !== "all" && filteredCases.length > 0) {
        filteredCases = filteredCases.filter((caseData) => {
          // Type assertion: the query returns data compatible with BackendCase structure
          // The query may not include all BackendCase fields, but has the fields needed for readiness check
          const readiness = checkCaseDischargeReadiness(
            caseData as unknown as BackendCase,
            userEmail,
            testModeEnabled,
            testContactEmail,
            testContactPhone,
          );
          if (input.readinessFilter === "ready_for_discharge") {
            return readiness.isReady;
          }
          if (input.readinessFilter === "not_ready") {
            return !readiness.isReady;
          }
          return true;
        });
      }

      // Sort cases: no discharge attempts first, then by readiness, then by date
      const sortedCases = filteredCases.sort((a, b) => {
        // Check if cases have any discharge attempts
        const aHasDischarge =
          (a.scheduled_discharge_calls?.length ?? 0) > 0 ||
          (a.scheduled_discharge_emails?.length ?? 0) > 0;
        const bHasDischarge =
          (b.scheduled_discharge_calls?.length ?? 0) > 0 ||
          (b.scheduled_discharge_emails?.length ?? 0) > 0;

        // Primary sort: cases without discharge attempts first
        if (!aHasDischarge && bHasDischarge) return -1;
        if (aHasDischarge && !bHasDischarge) return 1;

        const aReadiness = checkCaseDischargeReadiness(
          a as unknown as BackendCase,
          userEmail,
          testModeEnabled,
          testContactEmail,
          testContactPhone,
        );
        const bReadiness = checkCaseDischargeReadiness(
          b as unknown as BackendCase,
          userEmail,
          testModeEnabled,
          testContactEmail,
          testContactPhone,
        );

        // Secondary sort: ready cases first
        if (aReadiness.isReady && !bReadiness.isReady) return -1;
        if (!aReadiness.isReady && bReadiness.isReady) return 1;

        // Tertiary sort: by scheduled_at (with created_at fallback), newest first
        const aDate = a.scheduled_at ?? a.created_at;
        const bDate = b.scheduled_at ?? b.created_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      // When fetchAll is true, use the actual data length for pagination info
      const totalCases = input.fetchAll ? sortedCases.length : (count ?? 0);

      return {
        cases: sortedCases,
        pagination: {
          page: input.fetchAll ? 1 : input.page,
          pageSize: input.fetchAll ? totalCases : input.pageSize,
          total: totalCases,
          totalPages: input.fetchAll
            ? 1
            : Math.ceil(totalCases / input.pageSize),
        },
        date:
          input.date ??
          input.startDate ??
          new Date().toISOString().split("T")[0], // Return date in YYYY-MM-DD format, or today if no filter
        userEmail: ctx.user.email, // Include user email for transform layer
        testModeSettings: {
          enabled: testModeEnabled,
          testContactEmail,
          testContactPhone,
        },
      };
    }),

  /**
   * Get the most recent date that has at least one case for the clinic
   * Used for auto-navigation on initial page load
   * Uses scheduled_at with fallback to created_at when scheduled_at is null
   */
  getMostRecentCaseDate: protectedProcedure.query(async ({ ctx }) => {
    // Get all user IDs in the same clinic for shared data access
    const clinicUserIds = await getClinicUserIds(ctx.user.id, ctx.supabase);

    // Query to find the most recent case by scheduled_at (with created_at fallback)
    // We need both fields to determine the effective date
    const { data, error } = await ctx.supabase
      .from("cases")
      .select("scheduled_at, created_at")
      .in("user_id", clinicUserIds)
      .order("scheduled_at", { ascending: false, nullsFirst: false })
      .limit(10); // Get a few cases to find the most recent by effective date

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch most recent case date",
        cause: error,
      });
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Find the case with the most recent effective date (scheduled_at ?? created_at)
    let mostRecentDate: Date | null = null;
    for (const caseData of data) {
      const effectiveDate = caseData.scheduled_at ?? caseData.created_at;
      if (effectiveDate) {
        const date = new Date(effectiveDate);
        if (!mostRecentDate || date > mostRecentDate) {
          mostRecentDate = date;
        }
      }
    }

    if (!mostRecentDate) {
      return null;
    }

    return mostRecentDate.toISOString().split("T")[0] ?? null;
  }),

  /**
   * Get single case with all related data (user's own cases only)
   */
  getCaseDetail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // First check if case exists and belongs to user
      const { data: caseCheck, error: caseCheckError } = await ctx.supabase
        .from("cases")
        .select("id, user_id")
        .eq("id", input.id)
        .single();

      if (caseCheckError ?? !caseCheck) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
          cause: caseCheckError,
        });
      }

      // Verify ownership
      if (caseCheck.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this case",
        });
      }

      // Now fetch full case details with all relations (using left joins)
      // Note: Supabase doesn't support ordering in nested selects, so we'll sort in JS
      const { data, error } = await ctx.supabase
        .from("cases")
        .select(
          `
          id, status, type, visibility, created_at, updated_at, scheduled_at,
          source, external_id, metadata,
          patients (
            id, name, species, breed,
            owner_name, owner_email, owner_phone,
            date_of_birth, sex, weight_kg
          ),
          transcriptions (id, transcript, created_at),
          soap_notes (id, subjective, objective, assessment, plan, created_at),
          discharge_summaries (id, content, created_at),
          vital_signs (
            id, temperature, temperature_unit, pulse, respiration,
            weight, weight_unit, systolic, diastolic, notes,
            measured_at, source, created_at
          ),
          scheduled_discharge_calls (
            id, status, scheduled_for, ended_at, ended_reason, started_at,
            vapi_call_id, transcript, cleaned_transcript, transcript_messages, call_analysis,
            summary, success_evaluation, structured_data, user_sentiment,
            recording_url, stereo_recording_url, duration_seconds, cost, created_at
          ),
          scheduled_discharge_emails (
            id, status, scheduled_for, sent_at, created_at
          )
        `,
        )
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch case details",
          cause: error,
        });
      }

      // Sort related data by date (newest first)
      if (data) {
        if (Array.isArray(data.transcriptions)) {
          data.transcriptions.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
        if (Array.isArray(data.soap_notes)) {
          data.soap_notes.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
        if (Array.isArray(data.discharge_summaries)) {
          data.discharge_summaries.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
        if (Array.isArray(data.scheduled_discharge_calls)) {
          data.scheduled_discharge_calls.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
        if (Array.isArray(data.scheduled_discharge_emails)) {
          data.scheduled_discharge_emails.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        }
      }

      return data;
    }),

  /**
   * Delete case (user can only delete their own cases)
   */
  deleteMyCase: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // First verify the case belongs to the user
      const { data: caseData, error: fetchError } = await ctx.supabase
        .from("cases")
        .select("id, user_id")
        .eq("id", input.id)
        .single();

      if (fetchError ?? !caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
          cause: fetchError,
        });
      }

      if (caseData.user_id !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own cases",
        });
      }

      // Delete the case (cascade will handle related records)
      const { error } = await ctx.supabase
        .from("cases")
        .delete()
        .eq("id", input.id)
        .eq("user_id", userId); // Double-check ownership in delete query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete case",
          cause: error,
        });
      }

      return { success: true };
    }),
});
