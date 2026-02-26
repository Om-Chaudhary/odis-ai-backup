/**
 * VAPI Assistant Configuration
 *
 * Functions for managing VAPI assistant settings and configurations.
 */

import type { AssistantServerConfig } from "./types";
import { getVapiApiKey, getVapiClient } from "./utils";

/**
 * Updates an assistant's server (webhook) configuration
 *
 * This is required for VAPI to send webhook events like:
 * - status-update: Call status changes
 * - end-of-call-report: Comprehensive call data at end
 * - hang: Call termination
 * - tool-calls: Server-side tool execution
 *
 * @param assistantId - VAPI assistant ID
 * @param serverConfig - Server configuration
 * @returns Updated assistant data
 *
 * @example
 * await updateAssistantServer('ae3e6a54-...', {
 *   url: 'https://odis-ai-web.vercel.app/api/webhooks/vapi',
 *   secret: process.env.VAPI_WEBHOOK_SECRET
 * });
 */
export async function updateAssistantServer(
  assistantId: string,
  serverConfig: AssistantServerConfig,
): Promise<Record<string, unknown>> {
  const apiKey = getVapiApiKey();

  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      server: serverConfig,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[VAPI_CLIENT] Failed to update assistant server config:", {
      assistantId,
      status: response.status,
      error,
    });
    throw new Error(`Failed to update assistant: ${response.status} ${error}`);
  }

  const data = await response.json();

  console.log("[VAPI_CLIENT] Assistant server config updated successfully", {
    assistantId,
    serverUrl: serverConfig.url,
  });

  return data as Record<string, unknown>;
}

/**
 * Gets an assistant's current configuration
 *
 * @param assistantId - VAPI assistant ID
 * @returns Assistant configuration
 */
export async function getAssistant(
  assistantId: string,
): Promise<Record<string, unknown>> {
  const vapi = getVapiClient();

  try {
    const assistant = await vapi.assistants.get(assistantId);
    return assistant as Record<string, unknown>;
  } catch (error) {
    console.error(
      `[VAPI_CLIENT] Failed to get assistant ${assistantId}:`,
      error,
    );
    throw error;
  }
}
