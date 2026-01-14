/**
 * VAPI Response Builder
 *
 * Builds properly formatted responses for VAPI tool calls.
 * Re-exports from inbound-tools for consistency.
 *
 * @module vapi/core/response-builder
 */

// Re-export the existing, well-tested implementation
export {
  buildVapiResponse,
  buildSuccessResponse,
  buildErrorResponse,
  handleCorsPreflightRequest,
  type VapiToolResult,
} from "../inbound-tools/build-vapi-response";
