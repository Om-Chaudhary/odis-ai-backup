/**
 * Speech Update Handler
 *
 * Handles speech-update webhook events for speech detection
 * (when user/assistant starts or stops speaking).
 *
 * @module vapi/webhooks/handlers/speech-update
 */

import { loggers } from "@odis/logger";
import type { SpeechUpdateMessage, WebhookHandlerContext } from "../types";

const logger = loggers.webhook.child("speech-update");

/**
 * Handle speech-update webhook
 *
 * Receives notifications when speech starts or stops.
 * Can be used for:
 * - Real-time UI updates (showing speaking indicator)
 * - Analytics on speech patterns
 * - Turn-taking analysis
 *
 * @param message - Speech update message from VAPI
 * @param context - Handler context with isInbound flag
 */
export async function handleSpeechUpdate(
  message: SpeechUpdateMessage,
  context: WebhookHandlerContext,
): Promise<void> {
  const callId = message.call?.id;

  logger.debug("Speech update received", {
    callId,
    status: message.status,
    role: message.role,
    isInbound: context.isInbound,
  });

  // Speech updates are typically used for real-time UI feedback
  // No database updates needed unless you're tracking speech patterns

  if (message.status === "started") {
    logger.debug(`${message.role} started speaking`, { callId });
  } else if (message.status === "stopped") {
    logger.debug(`${message.role} stopped speaking`, { callId });
  }
}
