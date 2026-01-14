/**
 * VAPI Tool Handler Core Types
 *
 * Common types for the createToolHandler factory pattern.
 *
 * @module vapi/core/types
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import type { Logger } from "@odis-ai/shared/logger";
import type { ClinicWithConfig } from "../inbound-tools/find-clinic-by-assistant";

/**
 * Context provided to tool processors
 */
export interface ToolContext {
  /** VAPI call ID */
  callId?: string;
  /** VAPI tool call ID (for response routing) */
  toolCallId?: string;
  /** VAPI assistant ID that invoked the tool */
  assistantId?: string;
  /** Resolved clinic (null if clinicRequired is false) */
  clinic: ClinicWithConfig | null;
  /** Supabase client for database operations */
  supabase: SupabaseClient<Database>;
  /** Logger instance for this tool */
  logger: Logger;
}

/**
 * Result returned from tool processors
 */
export interface ToolResult<T = Record<string, unknown>> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Human-readable message for the voice AI */
  message: string;
  /** Additional data to include in response */
  data?: T;
  /** Error code/type if failed */
  error?: string;
}

/**
 * Tool processor function signature
 *
 * Pure function that handles the business logic for a tool.
 * Easy to test with mock context.
 */
export type ToolProcessor<TInput, TOutput = Record<string, unknown>> = (
  input: TInput,
  context: ToolContext,
) => Promise<ToolResult<TOutput>>;

/**
 * Configuration for createToolHandler
 */
export interface ToolHandlerConfig<TSchema> {
  /** Tool name for logging */
  name: string;
  /** Zod schema for input validation */
  schema: TSchema;
  /** Business logic processor */
  processor: ToolProcessor<unknown>;
  /** Whether clinic resolution is required (default: true) */
  clinicRequired?: boolean;
}
