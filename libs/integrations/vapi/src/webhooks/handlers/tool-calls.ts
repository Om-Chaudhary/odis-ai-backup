/**
 * Tool Calls Handler
 *
 * Handles tool-calls webhook events when an assistant invokes server-side tools.
 * Routes tool calls to the tool registry for execution.
 *
 * @module vapi/webhooks/handlers/tool-calls
 */

import { loggers } from "@odis-ai/shared/logger";
import type {
  ToolCallsMessage,
  ToolCallsResponse,
  VapiToolCallResult,
} from "../types";
import { executeTool } from "../tools";

const logger = loggers.webhook.child("tool-calls");

/**
 * Known tool names that are registered in the tool registry.
 * Used for dynamic prefix stripping - any clinic prefix will be automatically detected.
 *
 * When VAPI sends `masson_check_availability` or `del_valle_book_appointment`,
 * we detect that it ends with a known tool and strip the clinic prefix.
 *
 * To add a new tool: add its name here AND register it in built-in.ts
 */
const KNOWN_TOOLS = [
  // Appointment tools
  "check_availability",
  "check_availability_range",
  "book_appointment",
  // Messaging tools
  "leave_message",
  // Info tools
  "get_clinic_hours",
] as const;

/**
 * Normalize tool name by stripping any clinic prefix.
 * Uses suffix matching against known tools - works for ANY clinic slug automatically.
 *
 * @example
 * normalizeToolName("masson_check_availability") -> "check_availability"
 * normalizeToolName("del_valle_book_appointment") -> "book_appointment"
 * normalizeToolName("new_clinic_xyz_leave_message") -> "leave_message"
 * normalizeToolName("check_availability") -> "check_availability" (no prefix)
 */
function normalizeToolName(name: string): string {
  // Check if name ends with a known tool (after any prefix)
  for (const tool of KNOWN_TOOLS) {
    if (name.endsWith(tool) && name !== tool) {
      // Has a prefix - strip it by returning just the tool name
      return tool;
    }
  }
  return name;
}

/**
 * Extract tool call data from VAPI's payload format.
 * VAPI sends tool calls in OpenAI format with function.name and function.arguments.
 * Arguments can be either a JSON string OR an already-parsed object.
 */
function extractToolCallData(toolCall: Record<string, unknown>): {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
} {
  const id = (toolCall.id as string) ?? `unknown-${Date.now()}`;

  // VAPI sends OpenAI-style format: { id, type: "function", function: { name, arguments } }
  const functionData = toolCall.function as
    | { name?: string; arguments?: string | Record<string, unknown> }
    | undefined;

  if (functionData?.name) {
    // OpenAI/VAPI format - arguments can be string OR object
    let parameters: Record<string, unknown> = {};
    const args = functionData.arguments;

    if (args) {
      // Handle object case first (VAPI sometimes sends pre-parsed objects)
      if (typeof args === "object" && args !== null) {
        parameters = args;
      } else if (typeof args === "string") {
        // Parse JSON string
        try {
          parameters = JSON.parse(args) as Record<string, unknown>;
        } catch {
          logger.warn("Failed to parse function.arguments", {
            id,
            arguments: args,
          });
        }
      }
    }

    return { id, name: functionData.name, parameters };
  }

  // Legacy format: { id, name, parameters }
  return {
    id,
    name: (toolCall.name as string) ?? "unknown",
    parameters: (toolCall.parameters as Record<string, unknown>) ?? {},
  };
}

/**
 * Handle tool-calls webhook
 *
 * When VAPI assistant invokes a server-side tool, this handler executes the tool
 * and returns results. The response MUST include results for each tool call.
 *
 * IMPORTANT: Tool-calls require synchronous response - VAPI waits for the result
 * to continue the conversation. Keep tool execution fast (<10s recommended).
 *
 * @param message - Tool calls message from VAPI
 * @returns Tool call results to return to VAPI
 */
export async function handleToolCalls(
  message: ToolCallsMessage,
): Promise<ToolCallsResponse> {
  const toolCallList = (message.toolCallList ?? []) as unknown as Record<
    string,
    unknown
  >[];
  const callId = message.call?.id ?? "unknown";
  const assistantId = message.call?.assistantId;

  logger.info("Processing tool calls", {
    callId,
    assistantId,
    toolCount: toolCallList.length,
  });

  if (toolCallList.length === 0) {
    logger.warn("Tool-calls message received with empty toolCallList", {
      callId,
    });
    return { results: [] };
  }

  // Process each tool call
  const results: VapiToolCallResult[] = await Promise.all(
    toolCallList.map(async (rawToolCall) => {
      // Extract and normalize tool call data
      const {
        id,
        name: rawName,
        parameters,
      } = extractToolCallData(rawToolCall);
      const normalizedName = normalizeToolName(rawName);

      logger.debug("Tool call extracted", {
        callId,
        toolCallId: id,
        rawName,
        normalizedName,
        parameterKeys: Object.keys(parameters),
      });

      try {
        const result = await executeTool(normalizedName, parameters, {
          callId,
          toolCallId: id,
          assistantId,
        });

        return {
          toolCallId: id,
          result: JSON.stringify(result),
        };
      } catch (error) {
        logger.error("Tool call execution failed", {
          callId,
          toolName: normalizedName,
          rawToolName: rawName,
          toolCallId: id,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          toolCallId: id,
          result: JSON.stringify({
            error: "Tool execution failed",
            message: error instanceof Error ? error.message : "Unknown error",
          }),
        };
      }
    }),
  );

  logger.info("Tool calls processed successfully", {
    callId,
    resultCount: results.length,
  });

  return { results };
}
