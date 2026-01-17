/**
 * End of Call Report Handler
 *
 * Modular handler for end-of-call-report webhook events.
 * Split into separate processors for inbound and outbound calls.
 *
 * @module vapi/webhooks/handlers/end-of-call-report
 */

// Main handler export (backwards compatible)
export { handleEndOfCallReport } from "./handler";

// Processor exports (for direct use if needed)
export { handleInboundCallEnd } from "./inbound-processor";
export { handleOutboundCallEnd } from "./outbound-processor";
