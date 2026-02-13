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
 * Payload for AI enrichment jobs
 */
export interface AIEnrichmentPayload {
  caseId: string;
  userId: string;
  consultation: {
    id: string;
    notes?: string;
    dischargeSummary?: string;
    productsServices?: string;
    declinedProductsServices?: string;
    reason?: string;
  };
}

/**
 * Schedule AI enrichment for a case to run in background
 *
 * @param payload - The case and consultation data for AI processing
 * @returns QStash message ID for tracking
 */
export async function scheduleAIEnrichment(
  payload: AIEnrichmentPayload,
): Promise<string> {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/ai-enrich-case`;

  console.log("[QSTASH_CLIENT] Scheduling AI enrichment", {
    caseId: payload.caseId,
    userId: payload.userId,
    hasNotes: !!payload.consultation.notes,
    hasDischargeSummary: !!payload.consultation.dischargeSummary,
    webhookUrl,
  });

  const response = await qstashClient.publishJSON({
    url: webhookUrl,
    body: payload,
    delay: 0, // Execute immediately
    retries: 2, // Allow some retries for transient failures
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("[QSTASH_CLIENT] AI enrichment scheduled successfully", {
    caseId: payload.caseId,
    messageId: response.messageId,
  });

  return response.messageId;
}

/**
 * Schedule multiple AI enrichment jobs in batch
 * More efficient than scheduling one at a time
 *
 * @param payloads - Array of case and consultation data
 * @returns Array of QStash message IDs
 */
export async function scheduleAIEnrichmentBatch(
  payloads: AIEnrichmentPayload[],
): Promise<string[]> {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/ai-enrich-case`;

  console.log("[QSTASH_CLIENT] Scheduling AI enrichment batch", {
    count: payloads.length,
    webhookUrl,
  });

  const messageIds: string[] = [];

  // QStash batch API has limits, process in chunks of 100
  const batchSize = 100;
  for (let i = 0; i < payloads.length; i += batchSize) {
    const batch = payloads.slice(i, i + batchSize);

    // Use batch endpoint for efficiency
    const responses = await qstashClient.batchJSON(
      batch.map((payload) => ({
        url: webhookUrl,
        body: payload,
        retries: 2,
        headers: {
          "Content-Type": "application/json",
        },
      })),
    );

    for (const response of responses) {
      if ("messageId" in response) {
        messageIds.push(response.messageId);
      }
    }
  }

  console.log("[QSTASH_CLIENT] AI enrichment batch scheduled", {
    requested: payloads.length,
    scheduled: messageIds.length,
  });

  return messageIds;
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

    // Use the QStash SDK's messages.delete method to cancel the scheduled job
    await qstashClient.messages.delete(messageId);

    console.log("[QSTASH_CLIENT] Successfully cancelled scheduled execution", {
      messageId,
    });
    return true;
  } catch (error) {
    // Handle case where message is already delivered or doesn't exist
    const errorMessage = error instanceof Error ? error.message : String(error);

    // QStash returns 404 if message not found (already delivered or expired)
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      console.warn(
        "[QSTASH_CLIENT] Message not found - may have already been delivered",
        { messageId },
      );
      return true; // Consider this a "success" since the job won't execute
    }

    console.error("[QSTASH_CLIENT] Failed to cancel execution", {
      messageId,
      error: errorMessage,
    });
    return false;
  }
}
