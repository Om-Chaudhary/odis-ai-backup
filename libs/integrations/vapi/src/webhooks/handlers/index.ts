/**
 * VAPI Webhook Handlers
 *
 * Central export for all webhook event handlers.
 *
 * @module vapi/webhooks/handlers
 */

// Core handlers (existing functionality)
export { handleStatusUpdate } from "./status-update";
export { handleEndOfCallReport } from "./end-of-call-report";
export { handleHang } from "./hang";
export { handleToolCalls } from "./tool-calls";

// Real-time event handlers
export { handleTranscript } from "./transcript";
export { handleSpeechUpdate } from "./speech-update";
export { handleConversationUpdate } from "./conversation-update";
export { handleModelOutput } from "./model-output";

// Dynamic routing handlers
export { handleAssistantRequest } from "./assistant-request";

// Transfer handlers
export { handleTransferUpdate } from "./transfer-update";
export { handleTransferDestinationRequest } from "./transfer-destination-request";

// Legacy handlers
export { handleFunctionCall } from "./function-call";

// Helper exports
export {
  createInboundCallRecord,
  fetchExistingCall,
} from "./inbound-call-helpers";
