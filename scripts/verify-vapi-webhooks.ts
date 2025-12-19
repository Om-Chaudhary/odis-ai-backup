#!/usr/bin/env npx tsx
/**
 * Verify VAPI Assistant Webhook Configuration
 *
 * Checks if inbound assistants are properly configured to send webhooks.
 * Reports any misconfiguration and optionally fixes issues.
 *
 * Usage:
 *   npx tsx scripts/verify-vapi-webhooks.ts           # Check only
 *   npx tsx scripts/verify-vapi-webhooks.ts --fix     # Check and fix issues
 *   npx tsx scripts/verify-vapi-webhooks.ts --verbose # Detailed output
 */

import { config } from "dotenv";

// Load .env.local first (for local development), then .env as fallback
config({ path: ".env.local" });
config({ path: ".env" });

// Expected webhook URL
const EXPECTED_WEBHOOK_URL = "https://odisai.net/api/webhooks/vapi";

// Inbound assistant IDs to verify
const INBOUND_ASSISTANT_IDS = [
  "ae3e6a54-17a3-4915-9c3e-48779b5dbf09", // OdisAI - Alum Rock After-Hours Inbound
];

interface AssistantInfo {
  id: string;
  name: string;
  serverUrl: string | null;
  serverSecret: boolean;
  serverTimeout: number | null;
}

interface VerificationResult {
  assistantId: string;
  name: string;
  status: "ok" | "warning" | "error";
  issues: string[];
  currentUrl: string | null;
}

async function getAssistant(
  assistantId: string,
): Promise<AssistantInfo | null> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error("VAPI_PRIVATE_KEY not configured");
  }

  try {
    const response = await fetch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      id: string;
      name?: string;
      server?: {
        url?: string;
        secret?: string;
        timeoutSeconds?: number;
      };
    };

    return {
      id: data.id,
      name: data.name ?? "Unknown",
      serverUrl: data.server?.url ?? null,
      serverSecret: !!data.server?.secret,
      serverTimeout: data.server?.timeoutSeconds ?? null,
    };
  } catch (error) {
    console.error(`Error fetching assistant ${assistantId}:`, error);
    return null;
  }
}

async function fixAssistant(assistantId: string): Promise<boolean> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error("VAPI_PRIVATE_KEY not configured");
  }

  const serverConfig: Record<string, unknown> = {
    url: EXPECTED_WEBHOOK_URL,
    timeoutSeconds: 30,
  };

  if (process.env.VAPI_WEBHOOK_SECRET) {
    serverConfig.secret = process.env.VAPI_WEBHOOK_SECRET;
  }

  try {
    const response = await fetch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          server: serverConfig,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to fix assistant ${assistantId}: ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error fixing assistant ${assistantId}:`, error);
    return false;
  }
}

function verifyAssistant(assistant: AssistantInfo): VerificationResult {
  const issues: string[] = [];
  let status: "ok" | "warning" | "error" = "ok";

  // Check if webhook URL is configured
  if (!assistant.serverUrl) {
    issues.push("No webhook URL configured");
    status = "error";
  } else if (assistant.serverUrl !== EXPECTED_WEBHOOK_URL) {
    issues.push(
      `Webhook URL mismatch: expected "${EXPECTED_WEBHOOK_URL}", got "${assistant.serverUrl}"`,
    );
    status = "error";
  }

  // Check if secret is configured (warning only)
  if (!assistant.serverSecret) {
    issues.push("Webhook secret not configured (recommended for security)");
    if (status === "ok") status = "warning";
  }

  // Check timeout configuration (warning only)
  if (assistant.serverTimeout && assistant.serverTimeout < 20) {
    issues.push(
      `Webhook timeout is low (${assistant.serverTimeout}s), recommend 30s+`,
    );
    if (status === "ok") status = "warning";
  }

  return {
    assistantId: assistant.id,
    name: assistant.name,
    status,
    issues,
    currentUrl: assistant.serverUrl,
  };
}

function printResult(result: VerificationResult, verbose: boolean) {
  const statusIcon =
    result.status === "ok" ? "✅" : result.status === "warning" ? "⚠️" : "❌";

  console.log(`\n${statusIcon} ${result.name} (${result.assistantId})`);
  console.log(`   Webhook URL: ${result.currentUrl ?? "(not configured)"}`);

  if (result.issues.length > 0) {
    console.log("   Issues:");
    result.issues.forEach((issue) => {
      console.log(`     - ${issue}`);
    });
  } else if (verbose) {
    console.log("   No issues found");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes("--fix");
  const verbose = args.includes("--verbose");

  console.log("=".repeat(60));
  console.log("VAPI Webhook Configuration Verification");
  console.log("=".repeat(60));

  if (!process.env.VAPI_PRIVATE_KEY) {
    console.error(
      "\n❌ Error: VAPI_PRIVATE_KEY environment variable is not set",
    );
    process.exit(1);
  }

  console.log(`\nExpected webhook URL: ${EXPECTED_WEBHOOK_URL}`);
  console.log(`Assistants to verify: ${INBOUND_ASSISTANT_IDS.length}`);
  if (shouldFix) {
    console.log("Mode: CHECK AND FIX");
  } else {
    console.log("Mode: CHECK ONLY (use --fix to auto-fix issues)");
  }

  const results: VerificationResult[] = [];

  // Check each assistant
  for (const assistantId of INBOUND_ASSISTANT_IDS) {
    const assistant = await getAssistant(assistantId);

    if (!assistant) {
      results.push({
        assistantId,
        name: "Unknown",
        status: "error",
        issues: ["Assistant not found in VAPI (404)"],
        currentUrl: null,
      });
      continue;
    }

    const result = verifyAssistant(assistant);
    results.push(result);
    printResult(result, verbose);

    // Auto-fix if requested and there are issues
    if (shouldFix && result.status === "error") {
      console.log(`   Attempting to fix...`);
      const fixed = await fixAssistant(assistantId);
      if (fixed) {
        console.log(`   ✅ Fixed successfully!`);
        result.status = "ok";
        result.issues = [];
      } else {
        console.log(`   ❌ Failed to fix`);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));

  const ok = results.filter((r) => r.status === "ok").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log(`\nTotal: ${results.length}`);
  console.log(`  ✅ OK: ${ok}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log(`  ❌ Errors: ${errors}`);

  if (errors > 0) {
    console.log("\n❌ Some assistants have configuration errors!");
    if (!shouldFix) {
      console.log("   Run with --fix to auto-fix issues.");
    }
    process.exit(1);
  } else if (warnings > 0) {
    console.log("\n⚠️  Some assistants have warnings (non-critical).");
    process.exit(0);
  } else {
    console.log("\n✅ All assistants are properly configured!");
    process.exit(0);
  }
}

main().catch(console.error);
