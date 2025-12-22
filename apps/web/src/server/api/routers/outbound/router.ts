/**
 * Outbound Discharge Router
 *
 * Combines all outbound discharge procedures into a single router.
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { listCasesRouter } from "./procedures/list-cases";
import { getStatsRouter } from "./procedures/get-stats";
import { approveRouter } from "./procedures/approve";
import { skipRouter } from "./procedures/skip";
import { retryRouter } from "./procedures/retry";
import { findByConsultationRouter } from "./procedures/find-by-consultation";
import { findPreviousAttentionDateRouter } from "./procedures/find-previous-attention-date";
import { scheduleRemainingRouter } from "./procedures/schedule-remaining";
import { cancelScheduledRouter } from "./procedures/cancel-scheduled";
import { batchScheduleRouter } from "./procedures/batch-schedule";
import { getCaseByIdRouter } from "./procedures/get-case-by-id";

export const outboundRouter = createTRPCRouter({
  // Queries
  listDischargeCases: listCasesRouter.listDischargeCases,
  getDischargeCaseStats: getStatsRouter.getDischargeCaseStats,
  findByConsultationId: findByConsultationRouter.findByConsultationId,
  findPreviousAttentionDate:
    findPreviousAttentionDateRouter.findPreviousAttentionDate,
  getCaseById: getCaseByIdRouter.getCaseById,

  // Mutations
  approveAndSchedule: approveRouter.approveAndSchedule,
  skipCase: skipRouter.skipCase,
  retryFailedDelivery: retryRouter.retryFailedDelivery,
  scheduleRemainingOutreach: scheduleRemainingRouter.scheduleRemainingOutreach,
  cancelScheduledDelivery: cancelScheduledRouter.cancelScheduledDelivery,
  batchSchedule: batchScheduleRouter.batchSchedule,
});
