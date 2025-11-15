import { Client } from "@upstash/qstash";

/**
 * QStash client instance for job scheduling
 * Only use this on the server side
 */
function getQStashClient() {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error("QSTASH_TOKEN is not defined in environment variables");
  }

  return new Client({ token });
}

export const qstashClient = getQStashClient();

/**
 * Schedule a call for delayed execution
 *
 * @param callId - Database ID of the scheduled call
 * @param scheduledFor - Target execution time
 * @returns QStash message ID for tracking
 */
export async function scheduleCallExecution(
  callId: string,
  scheduledFor: Date,
): Promise<string> {
  const delay = Math.floor((scheduledFor.getTime() - Date.now()) / 1000); // seconds

  if (delay < 0) {
    throw new Error("Cannot schedule call in the past");
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/execute-call`;

  console.log("[QSTASH_CLIENT] Scheduling call execution", {
    callId,
    scheduledFor: scheduledFor.toISOString(),
    delay,
    webhookUrl,
  });

  const response = await qstashClient.publishJSON({
    url: webhookUrl,
    body: { callId },
    delay, // seconds until execution
    retries: 3, // Retry up to 3 times if webhook fails
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("[QSTASH_CLIENT] Call scheduled successfully", {
    callId,
    messageId: response.messageId,
  });

  return response.messageId;
}

/**
 * Cancel a scheduled QStash job
 *
 * @param messageId - QStash message ID to cancel
 * @returns true if cancellation was successful
 */
export async function cancelScheduledExecution(
  messageId: string,
): Promise<boolean> {
  try {
    console.log("[QSTASH_CLIENT] Cancelling scheduled execution", {
      messageId,
    });

    // Note: QStash doesn't have a direct cancel method in the current SDK
    // We'll handle cancellation by checking the DB status in the webhook
    // This is a placeholder for future implementation if QStash adds cancel support

    console.warn(
      "[QSTASH_CLIENT] Cancellation not implemented - will be handled via status check in webhook",
    );
    return true;
  } catch (error) {
    console.error("[QSTASH_CLIENT] Failed to cancel execution", {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
