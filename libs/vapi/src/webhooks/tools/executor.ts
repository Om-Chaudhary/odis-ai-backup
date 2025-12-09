/**
 * Tool Executor
 *
 * Executes registered tool handlers with proper error handling and logging.
 *
 * @module vapi/webhooks/tools/executor
 */

import { loggers } from "@odis/logger";
import { getRegisteredToolNames, getTool, hasTool } from "./registry";

const logger = loggers.webhook.child("tool-executor");

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  /** VAPI call ID */
  callId: string;
  /** Tool call ID from VAPI */
  toolCallId: string;
}

/**
 * Execute a tool by name
 *
 * @param name - Tool name
 * @param parameters - Tool parameters from VAPI
 * @param context - Execution context
 * @returns Tool execution result
 * @throws Error if tool is not registered
 */
export async function executeTool(
  name: string,
  parameters: Record<string, unknown>,
  context: ToolExecutionContext,
): Promise<Record<string, unknown>> {
  logger.debug("Executing tool", {
    toolName: name,
    callId: context.callId,
    toolCallId: context.toolCallId,
    parameterKeys: Object.keys(parameters),
  });

  // Check if tool is registered
  if (!hasTool(name)) {
    logger.warn("Unknown tool called", {
      toolName: name,
      callId: context.callId,
      registeredTools: getRegisteredToolNames(),
    });

    return {
      error: "Unknown tool",
      toolName: name,
      message: `Tool '${name}' is not implemented. Configure the tool in VAPI Dashboard and register a handler.`,
      availableTools: getRegisteredToolNames(),
    };
  }

  const tool = getTool(name)!;

  try {
    const startTime = Date.now();

    // Execute the tool handler
    const result = await tool.handler(parameters, context);

    const duration = Date.now() - startTime;

    logger.info("Tool executed successfully", {
      toolName: name,
      callId: context.callId,
      toolCallId: context.toolCallId,
      durationMs: duration,
    });

    return result;
  } catch (error) {
    logger.error("Tool execution failed", {
      toolName: name,
      callId: context.callId,
      toolCallId: context.toolCallId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Execute multiple tools in parallel
 *
 * @param tools - Array of tool calls to execute
 * @param context - Base execution context (callId)
 * @returns Array of results
 */
export async function executeToolsBatch(
  tools: Array<{
    name: string;
    parameters: Record<string, unknown>;
    toolCallId: string;
  }>,
  context: { callId: string },
): Promise<Array<{ toolCallId: string; result: Record<string, unknown> }>> {
  return Promise.all(
    tools.map(async (tool) => {
      const result = await executeTool(tool.name, tool.parameters, {
        callId: context.callId,
        toolCallId: tool.toolCallId,
      });

      return {
        toolCallId: tool.toolCallId,
        result,
      };
    }),
  );
}
