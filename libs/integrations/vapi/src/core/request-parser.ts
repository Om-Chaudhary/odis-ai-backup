/**
 * VAPI Request Parser
 *
 * Parses VAPI tool call requests and extracts arguments.
 * Re-exports from inbound-tools for consistency.
 *
 * @module vapi/core/request-parser
 */

// Re-export the existing, well-tested implementation
export {
  extractToolArguments,
  type ExtractedToolArgs,
} from "../inbound-tools/extract-tool-arguments";

/**
 * Parse a VAPI request body and extract tool arguments
 *
 * This is a convenience alias for extractToolArguments.
 *
 * @param body - Raw request body from VAPI
 * @returns Extracted arguments with metadata
 */
export { extractToolArguments as parseVapiRequest } from "../inbound-tools/extract-tool-arguments";
