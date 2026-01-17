/**
 * End of Call Report Handler
 *
 * @deprecated This file is maintained for backwards compatibility.
 * Import from './end-of-call-report/index' for the modular implementation.
 *
 * @module vapi/webhooks/handlers/end-of-call-report
 */

// Re-export everything from the new modular location
export {
  handleEndOfCallReport,
  handleInboundCallEnd,
  handleOutboundCallEnd,
} from "./end-of-call-report/index";
