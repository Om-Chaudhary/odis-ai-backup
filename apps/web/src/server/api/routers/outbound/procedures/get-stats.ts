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

interface CaseRow {
  id: string;
  status: string | null;
  discharge_summaries: Array<{ id: string }>;
  scheduled_discharge_calls: Array<{
    id: string;
    status: string;
    scheduled_for: string | null;
    ended_reason: string | null;
    metadata: ScheduledCallMetadata | null;
    attention_types: string[] | null;
    attention_severity: string | null;
  }>;
  scheduled_discharge_emails: Array<{
    id: string;
    status: string;
    scheduled_for: string | null;
  }>;
}

/**
 * Categorize a failure based on ended_reason and statuses
 */
function categorizeFailure(
  callEndedReason: string | null,
  callStatus: string | null,
  emailStatus: string | null,
):
  | "silence_timeout"
  | "no_answer"
  | "connection_error"
  | "voicemail"
  | "email_failed"
  | "other"
  | null {
  // If neither call nor email failed, not a failure
  if (callStatus !== "failed" && emailStatus !== "failed") {
    return null;
  }

  // Email failure (when call didn't fail)
  if (emailStatus === "failed" && callStatus !== "failed") {
    return "email_failed";
  }

  // Call failure - categorize by ended_reason
  if (callStatus === "failed" && callEndedReason) {
    const reason = callEndedReason.toLowerCase();

    if (
      reason.includes("silence-timed-out") ||
      reason.includes("silence_timed_out")
    ) {
      return "silence_timeout";
    }
    if (
      reason.includes("no-answer") ||
      reason.includes("did-not-answer") ||
      reason.includes("no_answer")
    ) {
      return "no_answer";
    }
    if (reason.includes("voicemail")) {
      return "voicemail";
    }
    if (
      reason.includes("error") ||
      reason.includes("failed-to-connect") ||
      reason.includes("sip")
    ) {
      return "connection_error";
    }
  }

  return "other";
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
          scheduled_discharge_calls (id, status, scheduled_for, ended_reason, metadata, attention_types, attention_severity),
          scheduled_discharge_emails (id, status, scheduled_for)
        `,
        )
        .in("user_id", clinicUserIds);

      // Apply date filters with proper timezone-aware boundaries
      // Use scheduled_at (appointment time) instead of created_at (sync time)
      // This matches how the extension groups cases by appointment date
      // Falls back to created_at when scheduled_at is null (COALESCE pattern)
      if (input.startDate && input.endDate) {
        // Both dates provided - use timezone-aware range with fallback
        const startRange = getLocalDayRange(input.startDate, DEFAULT_TIMEZONE);
        const endRange = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        // Use .or() to implement COALESCE(scheduled_at, created_at) logic:
        // 1. Cases where scheduled_at is in range, OR
        // 2. Cases where scheduled_at is null AND created_at is in range
        query = query.or(
          `and(scheduled_at.gte.${startRange.startISO},scheduled_at.lte.${endRange.endISO}),and(scheduled_at.is.null,created_at.gte.${startRange.startISO},created_at.lte.${endRange.endISO})`,
        );
      } else if (input.startDate) {
        // Only start date - get timezone-aware start of day with fallback
        const { startISO } = getLocalDayRange(
          input.startDate,
          DEFAULT_TIMEZONE,
        );
        query = query.or(
          `scheduled_at.gte.${startISO},and(scheduled_at.is.null,created_at.gte.${startISO})`,
        );
      } else if (input.endDate) {
        // Only end date - get timezone-aware end of day with fallback
        const { endISO } = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        query = query.or(
          `scheduled_at.lte.${endISO},and(scheduled_at.is.null,created_at.lte.${endISO})`,
        );
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

      // Attention severity breakdown
      let needsAttentionCritical = 0;
      let needsAttentionUrgent = 0;
      let needsAttentionRoutine = 0;

      // Failure category counts
      const failureCategories = {
        silenceTimeout: 0,
        noAnswer: 0,
        connectionError: 0,
        voicemail: 0,
        emailFailed: 0,
        other: 0,
      };

      for (const c of (cases as CaseRow[]) ?? []) {
        const hasDischargeSummary = (c.discharge_summaries?.length ?? 0) > 0;
        const callData = c.scheduled_discharge_calls?.[0];
        const emailData = c.scheduled_discharge_emails?.[0];

        // Skip test calls when test mode is disabled
        const isTestCall = callData?.metadata?.test_call === true;
        if (!testModeEnabled && isTestCall) {
          continue;
        }

        // Check if flagged by AI (attention types present)
        const hasAttentionTypes = (callData?.attention_types?.length ?? 0) > 0;
        if (hasAttentionTypes) {
          needsAttention++;
          // Track severity breakdown
          const severity = callData?.attention_severity ?? "routine";
          if (severity === "critical") needsAttentionCritical++;
          else if (severity === "urgent") needsAttentionUrgent++;
          else needsAttentionRoutine++;
        }

        const callStatus = callData?.status ?? null;
        const emailStatus = emailData?.status ?? null;
        const callEndedReason = callData?.ended_reason ?? null;
        const callScheduledFor = callData?.scheduled_for ?? null;
        const emailScheduledFor = emailData?.scheduled_for ?? null;

        // Failed - categorize by reason
        if (callStatus === "failed" || emailStatus === "failed") {
          failed++;

          // Categorize the failure
          const category = categorizeFailure(
            callEndedReason,
            callStatus,
            emailStatus,
          );
          if (category) {
            switch (category) {
              case "silence_timeout":
                failureCategories.silenceTimeout++;
                break;
              case "no_answer":
                failureCategories.noAnswer++;
                break;
              case "connection_error":
                failureCategories.connectionError++;
                break;
              case "voicemail":
                failureCategories.voicemail++;
                break;
              case "email_failed":
                failureCategories.emailFailed++;
                break;
              case "other":
                failureCategories.other++;
                break;
            }
          }
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
        failureCategories,
        needsAttention,
        total:
          pendingReview + scheduled + ready + inProgress + completed + failed,
      };
    }),
});
