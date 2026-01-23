/**
 * VAPI Tool Handler Factory
 *
 * Creates standardized Next.js route handlers for VAPI tool calls.
 * Handles request parsing, validation, clinic resolution, and response formatting.
 *
 * @module vapi/core/tool-handler
 */

import type { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { loggers } from "@odis-ai/shared/logger";
import { createServiceClient } from "@odis-ai/data-access/db";
import { extractToolArguments } from "./request-parser";
import {
  buildVapiResponse,
  buildErrorResponse,
  handleCorsPreflightRequest,
} from "./response-builder";
import { findClinicWithConfigByAssistantId } from "./clinic-resolver";
import type { ToolContext, ToolResult } from "./types";

/**
 * Configuration for createToolHandler
 */
export interface CreateToolHandlerConfig<TSchema extends z.ZodType> {
  /** Tool name for logging */
  name: string;
  /** Zod schema for input validation */
  schema: TSchema;
  /** Business logic processor */
  processor: (
    input: z.infer<TSchema>,
    context: ToolContext,
  ) => Promise<ToolResult>;
  /** Whether clinic resolution is required (default: true) */
  clinicRequired?: boolean;
}

/**
 * Create a standardized VAPI tool handler
 *
 * This factory creates POST and OPTIONS handlers that:
 * 1. Handle CORS preflight requests
 * 2. Parse VAPI request payloads
 * 3. Validate input against Zod schema
 * 4. Resolve clinic from assistant ID
 * 5. Execute the business logic processor
 * 6. Format the response for VAPI
 *
 * @example
 * ```typescript
 * // In route.ts
 * import { createToolHandler } from "@odis-ai/integrations/vapi/core";
 * import { LeaveMessageSchema } from "@odis-ai/integrations/vapi/inbound-tools";
 *
 * const handler = createToolHandler({
 *   name: "leave-message",
 *   schema: LeaveMessageSchema,
 *   processor: async (input, ctx) => {
 *     // Your business logic here
 *     return { success: true, message: "Message recorded" };
 *   },
 * });
 *
 * export const { POST, OPTIONS } = handler;
 * ```
 */
export function createToolHandler<TSchema extends z.ZodType>(
  config: CreateToolHandlerConfig<TSchema>,
): {
  POST: (req: NextRequest) => Promise<NextResponse>;
  OPTIONS: (req: NextRequest) => NextResponse;
} {
  const { name, schema, processor, clinicRequired = true } = config;

  return {
    OPTIONS: (req: NextRequest) => handleCorsPreflightRequest(req),

    POST: async (req: NextRequest): Promise<NextResponse> => {
      const logger = loggers.api.child(name);
      const startTime = Date.now();

      try {
        // 1. Parse request body
        const body = (await req.json()) as Record<string, unknown>;
        const {
          arguments: args,
          toolCallId,
          callId,
          assistantId,
        } = extractToolArguments(body);

        logger.debug("Tool call received", {
          toolCallId,
          callId,
          assistantId,
          argKeys: Object.keys(args),
        });

        // 2. Merge VAPI metadata into args for schema validation
        const inputWithMetadata = {
          ...args,
          assistant_id: assistantId,
          vapi_call_id: callId,
        };

        // 3. Validate input against schema
        const parsed = schema.safeParse(inputWithMetadata);
        if (!parsed.success) {
          const errorMessage = parsed.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");

          logger.warn("Validation failed", {
            toolCallId,
            errors: parsed.error.errors,
          });

          return buildErrorResponse(
            req,
            "validation_error",
            `Invalid input: ${errorMessage}`,
            toolCallId,
          );
        }

        // 4. Create Supabase client
        const supabase = await createServiceClient();

        // 5. Resolve clinic if required
        let clinic = null;
        if (clinicRequired && assistantId) {
          clinic = await findClinicWithConfigByAssistantId(
            supabase,
            assistantId,
          );

          if (!clinic) {
            logger.warn("Clinic not found", { assistantId });
            return buildErrorResponse(
              req,
              "clinic_not_found",
              "Unable to identify the clinic. Please try again or contact support.",
              toolCallId,
              404,
            );
          }

          logger.debug("Clinic resolved", {
            clinicId: clinic.id,
            clinicName: clinic.name,
          });
        }

        // 6. Build context and execute processor
        const context: ToolContext = {
          callId,
          toolCallId,
          assistantId,
          clinic,
          supabase,
          logger,
        };

        const result = await processor(parsed.data, context);

        // 7. Log completion
        const duration = Date.now() - startTime;
        logger.info("Tool call completed", {
          toolCallId,
          success: result.success,
          durationMs: duration,
        });

        // 8. Build response
        return buildVapiResponse(
          req,
          {
            success: result.success,
            message: result.message,
            ...result.data,
            ...(result.error && { error: result.error }),
          },
          toolCallId,
        );
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error("Tool call failed", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          durationMs: duration,
        });

        // Try to extract toolCallId from body for error response
        let toolCallId: string | undefined;
        try {
          const body = (await req.clone().json()) as Record<string, unknown>;
          const extracted = extractToolArguments(body);
          toolCallId = extracted.toolCallId;
        } catch {
          // Ignore parsing errors
        }

        return buildErrorResponse(
          req,
          "internal_error",
          "An unexpected error occurred. Please try again.",
          toolCallId,
          500,
        );
      }
    },
  };
}

// Re-export types for convenience
export type { ToolContext, ToolResult } from "./types";
