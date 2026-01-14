/**
 * VAPI Tool Handler Core
 *
 * Core infrastructure for building VAPI tool handlers.
 *
 * @module vapi/core
 *
 * @example
 * ```typescript
 * import { createToolHandler } from "@odis-ai/integrations/vapi/core";
 * import type { ToolContext, ToolResult } from "@odis-ai/integrations/vapi/core";
 * ```
 */

// Main factory
export {
  createToolHandler,
  type CreateToolHandlerConfig,
} from "./tool-handler";

// Types
export type {
  ToolContext,
  ToolResult,
  ToolProcessor,
  ToolHandlerConfig,
} from "./types";

// Request parsing
export {
  extractToolArguments,
  parseVapiRequest,
  type ExtractedToolArgs,
} from "./request-parser";

// Response building
export {
  buildVapiResponse,
  buildSuccessResponse,
  buildErrorResponse,
  handleCorsPreflightRequest,
  type VapiToolResult,
} from "./response-builder";

// Clinic resolution
export {
  findClinicByAssistantId,
  findClinicWithConfigByAssistantId,
  findClinicById,
  findClinicWithConfigById,
  resolveClinic,
  resolveClinicWithConfig,
  type ClinicLookupResult,
  type ClinicWithConfig,
} from "./clinic-resolver";
