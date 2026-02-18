/**
 * Function Call Handler (Legacy)
 *
 * Handles function-call webhook events (older format).
 * Note: Modern integrations should use tool-calls instead.
 *
 * @module vapi/webhooks/handlers/function-call
 */

import { loggers } from "@odis-ai/shared/logger";
import type { FunctionCallMessage } from "../types";
import { executeTool } from "../tools";

const logger = loggers.webhook.child("function-call");

/**
 * Known tool names for prefix stripping (same as tool-calls.ts)
 */
const KNOWN_TOOLS = [
  "check_availability",
  "check_availability_range",
  "book_appointment",
  "leave_message",
  "get_clinic_hours",
  "log_emergency_triage",
] as const;

/**
 * Normalize tool name by stripping any clinic prefix.
 */
function normalizeToolName(name: string): string {
  for (const tool of KNOWN_TOOLS) {
    if (name.endsWith(tool) && name !== tool) {
      return tool;
    }
  }
  return name;
}

/**
 * Handle function-call webhook (legacy format)
 *
 * Some older integrations may use this format instead of tool-calls.
 * This handler provides backwards compatibility.
 *
 * @param message - Function call message from VAPI
 * @returns Function call result
 */
export async function handleFunctionCall(
  message: FunctionCallMessage,
): Promise<{ result: unknown }> {
  const callId = message.call?.id ?? "unknown";
  const { functionCall } = message;
  const normalizedName = normalizeToolName(functionCall.name);

  logger.info("Function call received (legacy format)", {
    callId,
    functionName: functionCall.name,
    normalizedName,
  });

  try {
    const result = await executeTool(normalizedName, functionCall.parameters, {
      callId,
      toolCallId: `legacy-${Date.now()}`,
    });

    logger.info("Function call completed", {
      callId,
      functionName: functionCall.name,
      normalizedName,
    });

    return { result };
  } catch (error) {
    logger.error("Function call failed", {
      callId,
      functionName: functionCall.name,
      normalizedName,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      result: {
        error: "Function execution failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
