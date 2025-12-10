/**
 * Cases Router
 *
 * Merges all cases sub-routers into a single router.
 * The procedures are flattened to maintain API compatibility.
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { userCasesRouter } from "./user-cases";
import { patientManagementRouter } from "./patient-management";
import { batchOperationsRouter } from "./batch-operations";
import { adminRouter } from "./admin";

export const casesRouter = createTRPCRouter({
  // User cases procedures
  listMyCasesToday: userCasesRouter.listMyCasesToday,
  getMostRecentCaseDate: userCasesRouter.getMostRecentCaseDate,
  getCaseDetail: userCasesRouter.getCaseDetail,
  deleteMyCase: userCasesRouter.deleteMyCase,

  // Patient management procedures
  updatePatientInfo: patientManagementRouter.updatePatientInfo,
  triggerDischarge: patientManagementRouter.triggerDischarge,
  getDischargeSettings: patientManagementRouter.getDischargeSettings,
  updateDischargeSettings: patientManagementRouter.updateDischargeSettings,

  // Batch operations procedures
  getEligibleCasesForBatch: batchOperationsRouter.getEligibleCasesForBatch,
  createDischargeBatch: batchOperationsRouter.createDischargeBatch,
  getBatchStatus: batchOperationsRouter.getBatchStatus,
  cancelBatch: batchOperationsRouter.cancelBatch,
  getRecentBatches: batchOperationsRouter.getRecentBatches,

  // Admin procedures
  listCases: adminRouter.listCases,
  getCase: adminRouter.getCase,
  updateCase: adminRouter.updateCase,
  deleteCase: adminRouter.deleteCase,
  bulkCreateCases: adminRouter.bulkCreateCases,
  getCaseStats: adminRouter.getCaseStats,
  getTimeSeriesStats: adminRouter.getTimeSeriesStats,
});

// Re-export schemas for convenience
export * from "./schemas";
