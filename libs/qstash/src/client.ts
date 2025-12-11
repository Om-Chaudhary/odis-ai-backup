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
  // Calculate delay using server time to ensure accuracy
  // scheduledFor should already be validated to be in the future
  const serverNow = Date.now();
  const delay = Math.floor((scheduledFor.getTime() - serverNow) / 1000); // seconds

  if (delay < 0) {
    throw new Error(
      `Cannot schedule call in the past. Scheduled: ${scheduledFor.toISOString()}, Server now: ${new Date(
        serverNow,
      ).toISOString()}`,
    );
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
    retries: 0, // No retries - VAPI failures should not trigger duplicate calls
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
 * Schedule a discharge email for delayed delivery
 *
 * @param emailId - Database ID of the scheduled email
 * @param scheduledFor - Target delivery time
 * @returns QStash message ID for tracking
 */
export async function scheduleEmailExecution(
  emailId: string,
  scheduledFor: Date,
): Promise<string> {
  // Calculate delay using server time to ensure accuracy
  // scheduledFor should already be validated to be in the future
  const serverNow = Date.now();
  const delay = Math.floor((scheduledFor.getTime() - serverNow) / 1000); // seconds

  if (delay < 0) {
    throw new Error(
      `Cannot schedule email in the past. Scheduled: ${scheduledFor.toISOString()}, Server now: ${new Date(
        serverNow,
      ).toISOString()}`,
    );
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/execute-discharge-email`;

  console.log("[QSTASH_CLIENT] Scheduling email delivery", {
    emailId,
    scheduledFor: scheduledFor.toISOString(),
    delay,
    webhookUrl,
  });

  const response = await qstashClient.publishJSON({
    url: webhookUrl,
    body: { emailId },
    delay, // seconds until execution
    retries: 0, // No retries - email failures should not trigger duplicate sends
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("[QSTASH_CLIENT] Email scheduled successfully", {
    emailId,
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

/**
 * Execute an email immediately (bypassing QStash)
 * This is used in test mode to send emails without delay
 *
 * @param emailId - Database ID of the scheduled email
 * @returns true if execution was triggered successfully
 */
export async function executeEmailImmediately(
  emailId: string,
): Promise<boolean> {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/execute-discharge-email`;
    const immediateExecutionSecret = process.env.IMMEDIATE_EXECUTION_SECRET;

    if (!immediateExecutionSecret) {
      throw new Error(
        "IMMEDIATE_EXECUTION_SECRET is not configured - cannot execute immediately",
      );
    }

    console.log("[QSTASH_CLIENT] Executing email immediately (test mode)", {
      emailId,
      webhookUrl,
    });

    // Call the webhook directly without going through QStash
    // Include secret header to bypass QStash signature verification
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Immediate-Execution-Secret": immediateExecutionSecret,
      },
      body: JSON.stringify({ emailId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[QSTASH_CLIENT] Immediate email execution failed", {
        emailId,
        status: response.status,
        error: errorText,
      });
      return false;
    }

    const result = await response.json();
    console.log("[QSTASH_CLIENT] Email executed immediately", {
      emailId,
      result,
    });

    return true;
  } catch (error) {
    console.error("[QSTASH_CLIENT] Failed to execute email immediately", {
      emailId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Execute a call immediately (bypassing QStash)
 * This is used in test mode to make calls without delay
 *
 * @param callId - Database ID of the scheduled call
 * @returns true if execution was triggered successfully
 */
export async function executeCallImmediately(callId: string): Promise<boolean> {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/execute-call`;
    const immediateExecutionSecret = process.env.IMMEDIATE_EXECUTION_SECRET;

    if (!immediateExecutionSecret) {
      throw new Error(
        "IMMEDIATE_EXECUTION_SECRET is not configured - cannot execute immediately",
      );
    }

    console.log("[QSTASH_CLIENT] Executing call immediately (test mode)", {
      callId,
      webhookUrl,
    });

    // Call the webhook directly without going through QStash
    // Include secret header to bypass QStash signature verification
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Immediate-Execution-Secret": immediateExecutionSecret,
      },
      body: JSON.stringify({ callId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[QSTASH_CLIENT] Immediate call execution failed", {
        callId,
        status: response.status,
        error: errorText,
      });
      return false;
    }

    const result = await response.json();
    console.log("[QSTASH_CLIENT] Call executed immediately", {
      callId,
      result,
    });

    return true;
  } catch (error) {
    console.error("[QSTASH_CLIENT] Failed to execute call immediately", {
      callId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
