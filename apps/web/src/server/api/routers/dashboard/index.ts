/**
 * Dashboard Router
 *
 * Merges all dashboard sub-routers into a single router.
 * The procedures are flattened to maintain API compatibility.
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { statsRouter } from "./stats";
import { activityRouter } from "./activity";
import { performanceRouter } from "./performance";
import { scheduledRouter } from "./scheduled";
import { listingsRouter } from "./listings";
import { widgetsRouter } from "./widgets";
import { overviewRouter } from "./overview";
import { clinicsRouter } from "./clinics";
import { dailyStatsRouter } from "./daily-stats";
import { userRouter } from "./user";

export const dashboardRouter = createTRPCRouter({
  // Overview procedures (new dashboard overview)
  getOverview: overviewRouter.getOverview,
  getLastActivity: overviewRouter.getLastActivity,

  // Stats procedures
  getStats: statsRouter.getStats,
  getCaseStats: statsRouter.getCaseStats,

  // Activity procedures
  getRecentActivity: activityRouter.getRecentActivity,
  getDailyActivityAggregates: activityRouter.getDailyActivityAggregates,
  getWeeklyActivity: activityRouter.getWeeklyActivity,

  // Performance procedures
  getEmailPerformance: performanceRouter.getEmailPerformance,
  getCallPerformance: performanceRouter.getCallPerformance,

  // Scheduled items procedures
  getUpcomingScheduled: scheduledRouter.getUpcomingScheduled,
  getCasesNeedingAttention: scheduledRouter.getCasesNeedingAttention,

  // Listings procedures
  getAllCases: listingsRouter.getAllCases,
  getCallHistory: listingsRouter.getCallHistory,
  getEmailHistory: listingsRouter.getEmailHistory,
  toggleStarred: listingsRouter.toggleStarred,

  // Widget procedures (new dashboard widgets)
  getCriticalActions: widgetsRouter.getCriticalActions,
  getTodayOutboundSuccess: widgetsRouter.getTodayOutboundSuccess,
  getFailedCalls: widgetsRouter.getFailedCalls,
  getVoicemailQueue: widgetsRouter.getVoicemailQueue,

  // Clinic procedures (multi-clinic support)
  getUserClinics: clinicsRouter.getUserClinics,

  // User procedures
  getCurrentUserRole: userRouter.getCurrentUserRole,

  // Daily stats procedures (today vs yesterday comparison)
  getTodayStats: dailyStatsRouter.getTodayStats,
});

// Re-export types for convenience
export * from "./types";
