/**
 * VAPI Webhook Processors
 *
 * Shared processors for webhook data transformation and business logic.
 * These modules are extracted from handlers for reusability and testability.
 *
 * @module vapi/webhooks/processors
 */

// Structured output parsing
export {
  parseVapiStructuredOutput,
  extractStructuredOutputByName,
  parseAllStructuredOutputs,
  logStructuredOutputAvailability,
  STRUCTURED_OUTPUT_SCHEMAS,
  type ParsedStructuredOutputs,
} from "./structured-output";

// Attention case handling
export {
  extractAttentionData,
  parseAttentionTypes,
  buildAttentionUpdateFields,
  handleOutboundAttentionCase,
  handleInboundAttentionCase,
  type AttentionCaseData,
  type AttentionCallRecord,
} from "./attention-handler";
