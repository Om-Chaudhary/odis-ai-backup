/**
 * Tool Calls Handler
 *
 * Handles tool-calls webhook events when an assistant invokes server-side tools.
 * Routes tool calls to the tool registry for execution.
 *
 * @module vapi/webhooks/handlers/tool-calls
 */

import { loggers } from "@odis-ai/logger";
import type {
  ToolCallsMessage,
  ToolCallsResponse,
  VapiToolCallResult,
} from "../types";
import { executeTool } from "../tools";

const logger = loggers.webhook.child("tool-calls");

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
  const toolCallList = message.toolCallList ?? [];
  const callId = message.call?.id ?? "unknown";
  const assistantId = message.call?.assistantId;

  logger.info("Processing tool calls", {
    callId,
    assistantId,
    toolCount: toolCallList.length,
    toolNames: toolCallList.map((t) => t.name),
  });

  if (toolCallList.length === 0) {
    logger.warn("Tool-calls message received with empty toolCallList", {
      callId,
    });
    return { results: [] };
  }

  // Process each tool call
  const results: VapiToolCallResult[] = await Promise.all(
    toolCallList.map(async (toolCall) => {
      try {
        const result = await executeTool(toolCall.name, toolCall.parameters, {
          callId,
          toolCallId: toolCall.id,
          assistantId,
        });

        return {
          toolCallId: toolCall.id,
          result: JSON.stringify(result),
        };
      } catch (error) {
        logger.error("Tool call execution failed", {
          callId,
          toolName: toolCall.name,
          toolCallId: toolCall.id,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          toolCallId: toolCall.id,
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
