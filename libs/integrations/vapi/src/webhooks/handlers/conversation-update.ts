/**
 * Conversation Update Handler
 *
 * Handles conversation-update webhook events for conversation state changes.
 *
 * @module vapi/webhooks/handlers/conversation-update
 */

import { loggers } from "@odis-ai/shared/logger";
import type {
  ConversationUpdateMessage,
  WebhookHandlerContext,
} from "../types";

const logger = loggers.webhook.child("conversation-update");

/**
 * Handle conversation-update webhook
 *
 * Receives updates about the conversation state including the full message history.
 * Can be used for:
 * - Real-time conversation tracking
 * - Context window monitoring
 * - Custom conversation analytics
 *
 * @param message - Conversation update message from VAPI
 * @param context - Handler context with isInbound flag
 */
export async function handleConversationUpdate(
  message: ConversationUpdateMessage,
  context: WebhookHandlerContext,
): Promise<void> {
  const callId = message.call?.id;
  const messageCount = message.messages?.length ?? 0;

  logger.debug("Conversation update received", {
    callId,
    messageCount,
    isInbound: context.isInbound,
    hasOpenAIFormat: !!message.messagesOpenAIFormatted,
  });

  // Log conversation state for debugging
  if (message.messages && message.messages.length > 0) {
    const lastMessage = message.messages.at(-1);
    if (lastMessage) {
      const messageText = lastMessage.message ?? lastMessage.content ?? "";
      logger.debug("Conversation state update", {
        callId,
        totalMessages: messageCount,
        lastMessageRole: lastMessage.role,
        lastMessagePreview:
          messageText.substring(0, 100) +
          (messageText.length > 100 ? "..." : ""),
      });
    }
  }

  // Conversation updates are typically used for real-time monitoring
  // The complete conversation is available in end-of-call-report
}
