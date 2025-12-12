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
import { getUrgentSummaryRouter } from "./procedures/get-urgent-summary";
import { findByConsultationRouter } from "./procedures/find-by-consultation";

export const outboundRouter = createTRPCRouter({
  // Queries
  listDischargeCases: listCasesRouter.listDischargeCases,
  getDischargeCaseStats: getStatsRouter.getDischargeCaseStats,
  getUrgentSummary: getUrgentSummaryRouter.getUrgentSummary,
  findByConsultationId: findByConsultationRouter.findByConsultationId,

  // Mutations
  approveAndSchedule: approveRouter.approveAndSchedule,
  skipCase: skipRouter.skipCase,
  retryFailedDelivery: retryRouter.retryFailedDelivery,
});
