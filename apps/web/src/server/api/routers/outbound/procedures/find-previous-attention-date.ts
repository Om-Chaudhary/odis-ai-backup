/**
 * Find Previous Attention Date Procedure
 *
 * Returns the most recent date before the provided date that has at least
 * one case needing attention (has attention_types in scheduled_discharge_calls).
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { format, subDays } from "date-fns";
import { getClinicUserIds } from "@odis-ai/domain/clinics";
import { getLocalDayRange, DEFAULT_TIMEZONE } from "@odis-ai/shared/util/timezone";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const findPreviousAttentionDateInput = z.object({
  /** The current date in YYYY-MM-DD format to search before */
  currentDate: z.string(),
  /** How many days back to search (default 90) */
  maxDaysBack: z.number().min(1).max(365).default(90),
});

export const findPreviousAttentionDateRouter = createTRPCRouter({
  findPreviousAttentionDate: protectedProcedure
    .input(findPreviousAttentionDateInput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get user's test mode setting
      const { data: userSettings } = await ctx.supabase
        .from("users")
        .select("test_mode_enabled")
        .eq("id", userId)
        .single();

      const testModeEnabled = userSettings?.test_mode_enabled ?? false;

      // Get all user IDs in the same clinic for shared view
      const clinicUserIds = await getClinicUserIds(userId, ctx.supabase);

      // Calculate the date range: from (currentDate - maxDaysBack) to (currentDate - 1 day)
      const currentDateObj = new Date(input.currentDate);
      const searchEndDate = subDays(currentDateObj, 1); // Day before current
      const searchStartDate = subDays(currentDateObj, input.maxDaysBack);

      const { startISO } = getLocalDayRange(
        format(searchStartDate, "yyyy-MM-dd"),
        DEFAULT_TIMEZONE,
      );
      const { endISO } = getLocalDayRange(
        format(searchEndDate, "yyyy-MM-dd"),
        DEFAULT_TIMEZONE,
      );

      // Query for cases with needs attention (attention_types is not empty)
      // Join with scheduled_discharge_calls to find flagged calls
      const { data: casesWithAttention, error } = await ctx.supabase
        .from("cases")
        .select(
          `
          id,
          scheduled_at,
          created_at,
          scheduled_discharge_calls!inner (
            id,
            attention_types,
            metadata
          )
        `,
        )
        .in("user_id", clinicUserIds)
        .not("scheduled_discharge_calls.attention_types", "is", null)
        .or(
          `and(scheduled_at.gte.${startISO},scheduled_at.lte.${endISO}),and(scheduled_at.is.null,created_at.gte.${startISO},created_at.lte.${endISO})`,
        )
        .order("scheduled_at", { ascending: false, nullsFirst: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to find previous attention date: ${error.message}`,
        });
      }

      // Filter out test calls if test mode is disabled
      interface ScheduledCallWithMetadata {
        id: string;
        attention_types: string[] | null;
        metadata: { test_call?: boolean } | null;
      }

      interface CaseWithAttention {
        id: string;
        scheduled_at: string | null;
        created_at: string;
        scheduled_discharge_calls: ScheduledCallWithMetadata[];
      }

      let filteredCases = casesWithAttention as CaseWithAttention[];
      if (!testModeEnabled) {
        filteredCases = filteredCases.filter((c) => {
          const call = c.scheduled_discharge_calls?.[0];
          return call?.metadata?.test_call !== true;
        });
      }

      // Filter to only cases with non-empty attention_types array
      filteredCases = filteredCases.filter((c) => {
        const call = c.scheduled_discharge_calls?.[0];
        return (
          call?.attention_types &&
          Array.isArray(call.attention_types) &&
          call.attention_types.length > 0
        );
      });

      if (filteredCases.length === 0) {
        return {
          found: false,
          date: null,
          casesCount: 0,
        };
      }

      // Group by date and find the most recent date
      const casesByDate = new Map<string, number>();

      for (const c of filteredCases) {
        const caseDate = c.scheduled_at ?? c.created_at;
        // Extract just the date part (YYYY-MM-DD) in local timezone
        const dateKey = format(new Date(caseDate), "yyyy-MM-dd");
        casesByDate.set(dateKey, (casesByDate.get(dateKey) ?? 0) + 1);
      }

      // Sort dates descending and get the most recent one
      const sortedDates = Array.from(casesByDate.entries()).sort(
        ([dateA], [dateB]) => dateB.localeCompare(dateA),
      );

      const [mostRecentDate, casesCount] = sortedDates[0] ?? [null, 0];

      if (!mostRecentDate) {
        return {
          found: false,
          date: null,
          casesCount: 0,
        };
      }

      return {
        found: true,
        date: mostRecentDate,
        casesCount,
      };
    }),
});
