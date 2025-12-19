#!/usr/bin/env npx tsx
/**
 * Configure VAPI Assistant Webhooks
 *
 * This script updates VAPI assistants with the webhook server URL so that
 * webhook events (status-update, end-of-call-report, etc.) are sent to
 * our application.
 *
 * Usage:
 *   npx tsx scripts/configure-vapi-webhooks.ts
 *
 * Environment variables required:
 *   - VAPI_PRIVATE_KEY: Your VAPI API key
 *   - VAPI_WEBHOOK_SECRET: (optional) Secret for webhook signature verification
 */

import { config } from "dotenv";

// Load .env.local first (for local development), then .env as fallback
config({ path: ".env.local" });
config({ path: ".env" });

// Inbound assistant IDs that need webhook configuration
const INBOUND_ASSISTANT_IDS = [
  "ae3e6a54-17a3-4915-9c3e-48779b5dbf09", // OdisAI - Alum Rock After-Hours Inbound
  "1a9e1517-696e-4293-a5ea-1a59c2bcf0d9", // odis_inbound_receptionist_v1
];

// Production webhook URL
const WEBHOOK_URL = "https://odisai.net/api/webhooks/vapi";

interface ServerConfig {
  url: string;
  secret?: string;
  timeoutSeconds?: number;
}

async function updateAssistantServer(
  assistantId: string,
  serverConfig: ServerConfig,
): Promise<void> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error("VAPI_PRIVATE_KEY not configured in environment variables");
  }

  console.log(`\nUpdating assistant ${assistantId}...`);
  console.log(`  Server URL: ${serverConfig.url}`);

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
    throw new Error(`Failed to update assistant: ${response.status} ${error}`);
  }

  const data = (await response.json()) as {
    name?: string;
    server?: { url?: string };
  };
  console.log(`  ✅ Updated successfully!`);
  console.log(`  Name: ${data.name ?? "Unknown"}`);

  // Verify the server config was set
  if (data.server?.url) {
    console.log(`  Verified server.url: ${data.server.url}`);
  }
}

interface AssistantResponse {
  name?: string;
  server?: { url?: string };
}

async function getAssistant(assistantId: string): Promise<AssistantResponse> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error("VAPI_PRIVATE_KEY not configured in environment variables");
  }

  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get assistant: ${response.status} ${error}`);
  }

  return response.json() as Promise<AssistantResponse>;
}

async function main() {
  console.log("=".repeat(60));
  console.log("VAPI Webhook Configuration Script");
  console.log("=".repeat(60));

  if (!process.env.VAPI_PRIVATE_KEY) {
    console.error(
      "\n❌ Error: VAPI_PRIVATE_KEY environment variable is not set",
    );
    console.error("   Please set it in your .env file or environment");
    process.exit(1);
  }

  console.log(`\nWebhook URL: ${WEBHOOK_URL}`);
  console.log(`Assistants to configure: ${INBOUND_ASSISTANT_IDS.length}`);

  // Check current configuration first
  console.log("\n--- Current Configuration ---");
  for (const assistantId of INBOUND_ASSISTANT_IDS) {
    try {
      const assistant = await getAssistant(assistantId);
      console.log(
        `\nAssistant: ${assistant.name ?? "Unknown"} (${assistantId})`,
      );
      if (assistant.server?.url) {
        console.log(`  Current server.url: ${assistant.server.url}`);
      } else {
        console.log("  Current server.url: (not configured)");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `\n❌ Error getting assistant ${assistantId}:`,
        errorMessage,
      );
    }
  }

  // Update configuration
  console.log("\n--- Updating Configuration ---");

  const serverConfig: ServerConfig = {
    url: WEBHOOK_URL,
    timeoutSeconds: 30, // 30 second timeout for webhook requests
  };

  // Optionally add secret if configured
  if (process.env.VAPI_WEBHOOK_SECRET) {
    serverConfig.secret = process.env.VAPI_WEBHOOK_SECRET;
    console.log("  Including webhook secret for signature verification");
  }

  for (const assistantId of INBOUND_ASSISTANT_IDS) {
    try {
      await updateAssistantServer(assistantId, serverConfig);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `\n❌ Error updating assistant ${assistantId}:`,
        errorMessage,
      );
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Configuration complete!");
  console.log("=".repeat(60));
  console.log("\nNext steps:");
  console.log("1. Test an inbound call to verify webhooks are working");
  console.log("2. Check the logs for webhook events being received");
  console.log("3. Verify the inbound_vapi_calls table is being updated");
}

main().catch(console.error);
