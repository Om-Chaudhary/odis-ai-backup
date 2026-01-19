/**
 * Dashboard Performance Procedures
 *
 * Email and call performance metrics.
 */

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type CallAnalysis } from "./types";
import {
  getClinicUserIds,
  getClinicBySlug,
  getClinicByUserId,
  userHasClinicAccess,
  getClinicUserIdsEnhanced,
} from "@odis-ai/domain/clinics";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const performanceRouter = createTRPCRouter({
  /**
   * Get email performance metrics
   */
  getEmailPerformance: protectedProcedure
    .input(z.object({ clinicSlug: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input?.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      // Get all emails for this clinic (clinic-scoped)
      const { data: emails } = await ctx.supabase
        .from("scheduled_discharge_emails")
        .select("status, created_at, sent_at, scheduled_for")
        .in("user_id", clinicUserIds);

      const totalEmails = emails?.length ?? 0;

      if (totalEmails === 0) {
        return {
          totalEmails: 0,
          sentEmails: 0,
          queuedEmails: 0,
          failedEmails: 0,
          successRate: 0,
          emailsThisWeek: 0,
          emailsToday: 0,
        };
      }

      // Count by status
      const sentEmails = emails?.filter((e) => e.status === "sent").length ?? 0;
      const queuedEmails =
        emails?.filter((e) => e.status === "queued").length ?? 0;
      const failedEmails =
        emails?.filter((e) => e.status === "failed").length ?? 0;

      // Calculate success rate (sent / (sent + failed))
      const completedEmails = sentEmails + failedEmails;
      const successRate =
        completedEmails > 0
          ? Math.round((sentEmails / completedEmails) * 100)
          : 0;

      // Get emails this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const emailsThisWeek =
        emails?.filter((e) => new Date(e.created_at) >= oneWeekAgo).length ?? 0;

      // Get emails today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const emailsToday =
        emails?.filter((e) => new Date(e.created_at) >= today).length ?? 0;

      return {
        totalEmails,
        sentEmails,
        queuedEmails,
        failedEmails,
        successRate,
        emailsThisWeek,
        emailsToday,
      };
    }),

  /**
   * Get call performance metrics
   */
  getCallPerformance: protectedProcedure
    .input(z.object({ clinicSlug: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input?.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      const { data: calls } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          "duration_seconds, cost, status, call_analysis, user_sentiment, success_evaluation",
        )
        .in("user_id", clinicUserIds)
        .eq("status", "completed");

      const totalCalls = calls?.length ?? 0;

      if (totalCalls === 0) {
        return {
          totalCalls: 0,
          averageDuration: 0,
          totalCost: 0,
          successRate: 0,
          sentimentBreakdown: {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
        };
      }

      // Calculate average duration
      const totalDuration =
        calls?.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0) ?? 0;
      const averageDuration = Math.round(totalDuration / totalCalls);

      // Calculate total cost
      const totalCost =
        calls?.reduce((sum, c) => sum + (Number(c.cost) ?? 0), 0) ?? 0;

      // Calculate success rate based on success_evaluation or call_analysis
      const successfulCalls =
        calls?.filter((c) => {
          if (c.success_evaluation === "true") {
            return true;
          }
          const analysis = (c.call_analysis as CallAnalysis | null) ?? {};
          return (
            analysis.successEvaluation === "true" ||
            analysis.successEvaluation === true
          );
        }).length ?? 0;

      const successRate = Math.round((successfulCalls / totalCalls) * 100);

      // Calculate sentiment breakdown
      const sentimentCounts = {
        positive: 0,
        neutral: 0,
        negative: 0,
      };

      calls?.forEach((c) => {
        const sentiment = String(c.user_sentiment ?? "neutral").toLowerCase();
        if (sentiment.includes("positive")) {
          sentimentCounts.positive++;
        } else if (sentiment.includes("negative")) {
          sentimentCounts.negative++;
        } else {
          sentimentCounts.neutral++;
        }
      });

      return {
        totalCalls,
        averageDuration,
        totalCost: Math.round(totalCost * 100) / 100,
        successRate,
        sentimentBreakdown: sentimentCounts,
      };
    }),
});
