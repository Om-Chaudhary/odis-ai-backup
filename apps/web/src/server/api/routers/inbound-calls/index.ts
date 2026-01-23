/**
 * Inbound Calls Router
 *
 * Combines all inbound call procedures into a single router:
 * - Call listing, details, stats, and deletion
 * - Transcript management (update, translate, clean)
 * - VAPI sync operations
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { callsRouter } from "./calls";
import { transcriptRouter } from "./transcript";
import { syncRouter } from "./sync";

export const inboundCallsRouter = createTRPCRouter({
  // Call listing and management
  listInboundCalls: callsRouter.listInboundCalls,
  getInboundCall: callsRouter.getInboundCall,
  getInboundCallByVapiId: callsRouter.getInboundCallByVapiId,
  getInboundCallStats: callsRouter.getInboundCallStats,
  getInboundCallsByClinic: callsRouter.getInboundCallsByClinic,
  deleteInboundCall: callsRouter.deleteInboundCall,

  // Transcript management
  updateDisplayTranscript: transcriptRouter.updateDisplayTranscript,
  translateTranscript: transcriptRouter.translateTranscript,
  cleanTranscript: transcriptRouter.cleanTranscript,

  // VAPI sync operations
  fetchCallFromVAPI: syncRouter.fetchCallFromVAPI,
  getCallDataForAppointment: syncRouter.getCallDataForAppointment,
  syncCallFromVAPI: syncRouter.syncCallFromVAPI,
  batchSyncFromVAPI: syncRouter.batchSyncFromVAPI,
});

// Re-export schemas and types
export * from "./schemas";
