/**
 * Admin Router
 *
 * Combines all admin procedures into a single router.
 * All procedures require admin role.
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { getAdminStatsRouter } from "./procedures/get-admin-stats";
import { listUsersRouter } from "./procedures/list-users";
import { listAllCasesRouter } from "./procedures/list-all-cases";
import { listDischargesRouter } from "./procedures/list-discharges";
import { bulkOperationsRouter } from "./procedures/bulk-operations";

export const adminRouter = createTRPCRouter({
  // Stats
  getAdminStats: getAdminStatsRouter.getAdminStats,

  // Users
  listUsers: listUsersRouter.listUsers,
  getUser: listUsersRouter.getUser,
  updateUser: listUsersRouter.updateUser,

  // Cases
  listAllCases: listAllCasesRouter.listAllCases,
  getCase: listAllCasesRouter.getCase,

  // Discharges
  listScheduledCalls: listDischargesRouter.listScheduledCalls,
  listScheduledEmails: listDischargesRouter.listScheduledEmails,

  // Bulk Operations
  bulkUpdateCases: bulkOperationsRouter.bulkUpdateCases,
  bulkDeleteCases: bulkOperationsRouter.bulkDeleteCases,
  bulkCancelDischarges: bulkOperationsRouter.bulkCancelDischarges,
  bulkReschedule: bulkOperationsRouter.bulkReschedule,
});
