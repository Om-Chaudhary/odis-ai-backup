/**
 * Function Call Handler (Legacy)
 *
 * Handles function-call webhook events (older format).
 * Note: Modern integrations should use tool-calls instead.
 *
 * @module vapi/webhooks/handlers/function-call
 */

import { loggers } from "@odis/logger";
import type { FunctionCallMessage } from "../types";
import { executeTool } from "../tools";

const logger = loggers.webhook.child("function-call");

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

  logger.info("Function call received (legacy format)", {
    callId,
    functionName: functionCall.name,
  });

  try {
    const result = await executeTool(
      functionCall.name,
      functionCall.parameters,
      {
        callId,
        toolCallId: `legacy-${Date.now()}`,
      },
    );

    logger.info("Function call completed", {
      callId,
      functionName: functionCall.name,
    });

    return { result };
  } catch (error) {
    logger.error("Function call failed", {
      callId,
      functionName: functionCall.name,
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
