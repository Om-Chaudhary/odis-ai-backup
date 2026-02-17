/**
 * Slack Notification Service
 *
 * Generic notification service for sending typed notifications to Slack.
 * Uses environment-based configuration for single-workspace setup.
 *
 * @example
 * ```ts
 * import { sendSlackNotification } from '@odis-ai/integrations/slack';
 *
 * await sendSlackNotification('appointment_booked', {
 *   clinicName: 'Alum Rock',
 *   clientName: 'John Smith',
 *   petName: 'Max',
 *   date: 'Monday, Feb 17, 2026',
 *   time: '2:30 PM',
 *   phone: '(555) 123-4567',
 * });
 * ```
 */

import { loggers } from "@odis-ai/shared/logger";
import { getEnvSlackClient, isEnvSlackConfigured } from "../client";
import { formatNotification } from "./formatters";
import type {
  SlackNotificationType,
  NotificationPayloadMap,
  SendNotificationOptions,
} from "./types";
import { NOTIFICATION_CHANNELS } from "./types";

const logger = loggers.webhook.child("slack-notifications");

// Re-export types for convenience
export * from "./types";
export { formatNotification, formatters, getFormatter } from "./formatters";

/**
 * Send a Slack notification using the generic notification service.
 *
 * This function uses the SLACK_BOT_TOKEN environment variable for authentication,
 * which is suitable for single-workspace setups (like ODIS team notifications).
 *
 * @param type - Notification type (determines channel and formatting)
 * @param data - Notification payload (type-checked based on notification type)
 * @param options - Optional overrides for channel or threading
 * @returns Promise that resolves when notification is sent (or logs error)
 *
 * @example
 * ```ts
 * // Simple usage - uses default channel for type
 * await sendSlackNotification('appointment_booked', {
 *   clinicName: 'Valley Vet',
 *   clientName: 'Jane Doe',
 *   // ... other required fields
 * });
 *
 * // With channel override
 * await sendSlackNotification('admin_alert', {
 *   title: 'System Update',
 *   message: 'Deployment completed',
 * }, { channel: 'deployments' });
 * ```
 */
export async function sendSlackNotification<T extends SlackNotificationType>(
  type: T,
  data: NotificationPayloadMap[T],
  options?: SendNotificationOptions,
): Promise<{ ok: boolean; error?: string }> {
  // Check if Slack is configured
  if (!isEnvSlackConfigured()) {
    logger.debug("Slack not configured, skipping notification", { type });
    return { ok: false, error: "Slack not configured" };
  }

  const client = getEnvSlackClient();
  if (!client) {
    logger.error("Failed to get Slack client", { type });
    return { ok: false, error: "Failed to get Slack client" };
  }

  // Determine channel
  const channel = options?.channel ?? NOTIFICATION_CHANNELS[type];

  // Format the notification
  const blocks = formatNotification(type, data);

  // Generate fallback text (first block's text content)
  const fallbackText = `[${type.replace(/_/g, " ")}] New notification`;

  try {
    const result = await client.chat.postMessage({
      channel,
      blocks,
      text: fallbackText,
      thread_ts: options?.threadTs,
    });

    if (result.ok) {
      logger.info("Slack notification sent", {
        type,
        channel,
        ts: result.ts,
      });
      return { ok: true };
    } else {
      logger.error("Slack API returned error", {
        type,
        channel,
        error: result.error,
      });
      return { ok: false, error: result.error ?? "Unknown error" };
    }
  } catch (error) {
    logger.error("Failed to send Slack notification", {
      type,
      channel,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fire-and-forget notification sender.
 *
 * Sends notification in background without blocking.
 * Errors are logged but not thrown.
 *
 * @param type - Notification type
 * @param data - Notification payload
 * @param options - Optional overrides
 */
export function notifySlack<T extends SlackNotificationType>(
  type: T,
  data: NotificationPayloadMap[T],
  options?: SendNotificationOptions,
): void {
  void sendSlackNotification(type, data, options).catch((error) => {
    logger.error("Background notification failed", {
      type,
      error: error instanceof Error ? error.message : String(error),
    });
  });
}
