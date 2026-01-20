/**
 * Dashboard Daily Stats Procedures
 *
 * Provides today's metrics with comparison to yesterday for trend indicators.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getClinicByUserId,
  getClinicBySlug,
  userHasClinicAccess,
  getClinicUserIdsEnhanced,
  getClinicUserIds,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import { startOfDay, subDays, endOfDay } from "date-fns";
import { TRPCError } from "@trpc/server";

interface CallAnalysis {
  summary?: string;
  structuredData?: {
    wentToVoicemail?: boolean;
    appointmentScheduled?: boolean;
  };
  successEvaluation?: boolean | string;
}

export const dailyStatsRouter = createTRPCRouter({
  /**
   * Get today's comprehensive stats with yesterday comparison
   */
  getTodayStats: protectedProcedure
    .input(
      z
        .object({
          clinicSlug: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic
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

      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      // Calculate date ranges
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      const yesterdayStart = startOfDay(subDays(new Date(), 1));
      const yesterdayEnd = endOfDay(subDays(new Date(), 1));

      // Fetch today's inbound calls
      let todayInboundQuery = ctx.supabase
        .from("inbound_vapi_calls")
        .select("id, status, duration_seconds")
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString());

      if (clinic?.name) {
        todayInboundQuery = todayInboundQuery.eq("clinic_name", clinic.name);
      }

      const { data: todayInbound } = await todayInboundQuery;

      // Fetch yesterday's inbound calls
      let yesterdayInboundQuery = ctx.supabase
        .from("inbound_vapi_calls")
        .select("id, status")
        .gte("created_at", yesterdayStart.toISOString())
        .lte("created_at", yesterdayEnd.toISOString());

      if (clinic?.name) {
        yesterdayInboundQuery = yesterdayInboundQuery.eq(
          "clinic_name",
          clinic.name,
        );
      }

      const { data: yesterdayInbound } = await yesterdayInboundQuery;

      // Calculate inbound metrics
      const todayInboundTotal = todayInbound?.length ?? 0;
      const todayInboundCompleted =
        todayInbound?.filter((c) => c.status === "completed").length ?? 0;
      const todayInboundTransferred =
        todayInbound?.filter((c) => c.status === "transferred").length ?? 0;

      const yesterdayInboundTotal = yesterdayInbound?.length ?? 0;
      const yesterdayInboundCompleted =
        yesterdayInbound?.filter((c) => c.status === "completed").length ?? 0;

      const aiHandledRate =
        todayInboundTotal > 0
          ? Math.round((todayInboundCompleted / todayInboundTotal) * 100)
          : 0;

      // Calculate trend
      const inboundTrend =
        todayInboundTotal > yesterdayInboundTotal
          ? ("up" as const)
          : todayInboundTotal < yesterdayInboundTotal
            ? ("down" as const)
            : ("stable" as const);

      const inboundChange =
        yesterdayInboundTotal > 0
          ? Math.round(
              ((todayInboundTotal - yesterdayInboundTotal) /
                yesterdayInboundTotal) *
                100,
            )
          : 0;

      // Fetch today's outbound calls
      const { data: todayOutbound } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select("id, status, call_analysis, success_evaluation")
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString());

      // Fetch yesterday's outbound calls
      const { data: yesterdayOutbound } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select("id, status")
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .gte("created_at", yesterdayStart.toISOString())
        .lte("created_at", yesterdayEnd.toISOString());

      // Calculate outbound metrics
      const todayOutboundTotal = todayOutbound?.length ?? 0;
      const todayOutboundCompleted =
        todayOutbound?.filter((c) => c.status === "completed").length ?? 0;

      const todayOutboundVoicemail =
        todayOutbound?.filter((c) => {
          if (c.status !== "completed") return false;
          const analysis = c.call_analysis as CallAnalysis | null;
          return analysis?.structuredData?.wentToVoicemail === true;
        }).length ?? 0;

      const todayOutboundSuccessful =
        todayOutbound?.filter((c) => {
          if (c.status !== "completed") return false;
          return c.success_evaluation === "true";
        }).length ?? 0;

      const yesterdayOutboundTotal = yesterdayOutbound?.length ?? 0;
      const yesterdayOutboundCompleted =
        yesterdayOutbound?.filter((c) => c.status === "completed").length ?? 0;

      const outboundSuccessRate =
        todayOutboundCompleted > 0
          ? Math.round((todayOutboundSuccessful / todayOutboundCompleted) * 100)
          : 0;

      const outboundTrend =
        todayOutboundCompleted > yesterdayOutboundCompleted
          ? ("up" as const)
          : todayOutboundCompleted < yesterdayOutboundCompleted
            ? ("down" as const)
            : ("stable" as const);

      const outboundChange =
        yesterdayOutboundCompleted > 0
          ? Math.round(
              ((todayOutboundCompleted - yesterdayOutboundCompleted) /
                yesterdayOutboundCompleted) *
                100,
            )
          : 0;

      return {
        inbound: {
          today: {
            total: todayInboundTotal,
            completed: todayInboundCompleted,
            transferred: todayInboundTransferred,
            aiHandledRate,
          },
          yesterday: {
            total: yesterdayInboundTotal,
            completed: yesterdayInboundCompleted,
          },
          trend: inboundTrend,
          changePercent: inboundChange,
        },
        outbound: {
          today: {
            total: todayOutboundTotal,
            completed: todayOutboundCompleted,
            voicemail: todayOutboundVoicemail,
            successful: todayOutboundSuccessful,
            successRate: outboundSuccessRate,
          },
          yesterday: {
            total: yesterdayOutboundTotal,
            completed: yesterdayOutboundCompleted,
          },
          trend: outboundTrend,
          changePercent: outboundChange,
        },
      };
    }),
});
