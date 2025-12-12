/**
 * Get Discharge Case Stats Procedure
 *
 * Returns aggregated counts by status for filter tab badges.
 */

import { TRPCError } from "@trpc/server";
import { getClinicUserIds } from "@odis-ai/clinics/utils";
import { getLocalDayRange, DEFAULT_TIMEZONE } from "@odis-ai/utils/timezone";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getDischargeCaseStatsInput } from "../schemas";

interface ScheduledCallMetadata {
  test_call?: boolean;
  [key: string]: unknown;
}

interface ScheduledCallStructuredData {
  urgent_case?: boolean;
  [key: string]: unknown;
}

interface CaseRow {
  id: string;
  status: string | null;
  discharge_summaries: Array<{ id: string }>;
  scheduled_discharge_calls: Array<{
    id: string;
    status: string;
    scheduled_for: string | null;
    metadata: ScheduledCallMetadata | null;
    structured_data: ScheduledCallStructuredData | null;
  }>;
  scheduled_discharge_emails: Array<{
    id: string;
    status: string;
    scheduled_for: string | null;
  }>;
}

export const getStatsRouter = createTRPCRouter({
  getDischargeCaseStats: protectedProcedure
    .input(getDischargeCaseStatsInput)
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

      // Fetch all completed cases with minimal data for counting
      let query = ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          discharge_summaries (id),
          scheduled_discharge_calls (id, status, scheduled_for, metadata, structured_data),
          scheduled_discharge_emails (id, status, scheduled_for)
        `,
        )
        .in("user_id", clinicUserIds);

      // Apply date filters with proper timezone-aware boundaries
      // Use scheduled_at (appointment time) instead of created_at (sync time)
      // This matches how the extension groups cases by appointment date
      if (input.startDate && input.endDate) {
        // Both dates provided - use timezone-aware range
        const startRange = getLocalDayRange(input.startDate, DEFAULT_TIMEZONE);
        const endRange = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        query = query
          .gte("scheduled_at", startRange.startISO)
          .lte("scheduled_at", endRange.endISO);
      } else if (input.startDate) {
        // Only start date - get timezone-aware start of day
        const { startISO } = getLocalDayRange(
          input.startDate,
          DEFAULT_TIMEZONE,
        );
        query = query.gte("scheduled_at", startISO);
      } else if (input.endDate) {
        // Only end date - get timezone-aware end of day
        const { endISO } = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        query = query.lte("scheduled_at", endISO);
      }

      const { data: cases, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch case stats: ${error.message}`,
        });
      }

      const now = new Date();

      // Count by derived status
      let pendingReview = 0;
      let scheduled = 0;
      let ready = 0;
      let inProgress = 0;
      let completed = 0;
      let failed = 0;
      let needsAttention = 0;

      for (const c of (cases as CaseRow[]) ?? []) {
        const hasDischargeSummary = (c.discharge_summaries?.length ?? 0) > 0;
        const callData = c.scheduled_discharge_calls?.[0];
        const emailData = c.scheduled_discharge_emails?.[0];

        // Skip test calls when test mode is disabled
        const isTestCall = callData?.metadata?.test_call === true;
        if (!testModeEnabled && isTestCall) {
          continue;
        }

        // Check if flagged as urgent by AI
        const isUrgentCase = callData?.structured_data?.urgent_case === true;
        if (isUrgentCase) {
          needsAttention++;
        }

        const callStatus = callData?.status ?? null;
        const emailStatus = emailData?.status ?? null;
        const callScheduledFor = callData?.scheduled_for ?? null;
        const emailScheduledFor = emailData?.scheduled_for ?? null;

        // Failed
        if (callStatus === "failed" || emailStatus === "failed") {
          failed++;
          continue;
        }

        // Completed
        if (
          (callStatus === "completed" || callStatus === null) &&
          (emailStatus === "sent" || emailStatus === null) &&
          (callStatus === "completed" || emailStatus === "sent")
        ) {
          completed++;
          continue;
        }

        // In Progress
        if (callStatus === "ringing" || callStatus === "in_progress") {
          inProgress++;
          continue;
        }

        // Check if queued items are scheduled for the future
        const callIsFuture =
          callScheduledFor && new Date(callScheduledFor) > now;
        const emailIsFuture =
          emailScheduledFor && new Date(emailScheduledFor) > now;

        // Scheduled: has queued items with future scheduled_for time
        if (
          (callStatus === "queued" && callIsFuture) ||
          (emailStatus === "queued" && emailIsFuture)
        ) {
          scheduled++;
          continue;
        }

        // Ready: has queued items with past/current scheduled_for time
        if (callStatus === "queued" || emailStatus === "queued") {
          ready++;
          continue;
        }

        // Pending Review
        if (c.status === "completed" && hasDischargeSummary) {
          pendingReview++;
          continue;
        }

        // Default to pending review
        pendingReview++;
      }

      return {
        pendingReview,
        scheduled,
        ready,
        inProgress,
        completed,
        failed,
        needsAttention,
        total:
          pendingReview + scheduled + ready + inProgress + completed + failed,
      };
    }),
});
