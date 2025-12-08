/**
 * Model Output Handler
 *
 * Handles model-output webhook events when the LLM generates a response.
 *
 * @module vapi/webhooks/handlers/model-output
 */

import { loggers } from "~/lib/logger";
import type { ModelOutputMessage, WebhookHandlerContext } from "../types";

const logger = loggers.webhook.child("model-output");

/**
 * Handle model-output webhook
 *
 * Receives the raw output from the LLM before text-to-speech.
 * Can be used for:
 * - Custom logging of AI responses
 * - Response filtering or modification
 * - Analytics on AI behavior
 * - Debugging conversation flow
 *
 * @param message - Model output message from VAPI
 * @param context - Handler context with isInbound flag
 */
export async function handleModelOutput(
  message: ModelOutputMessage,
  context: WebhookHandlerContext,
): Promise<void> {
  const callId = message.call?.id;

  logger.debug("Model output received", {
    callId,
    outputLength: message.output?.length,
    role: message.role,
    isInbound: context.isInbound,
  });

  // Log model output for debugging
  logger.debug("Model output", {
    callId,
    output:
      message.output?.substring(0, 200) +
      ((message.output?.length ?? 0) > 200 ? "..." : ""),
  });

  // Model outputs are typically used for debugging or custom logging
  // The complete transcript is available in end-of-call-report
}
