#!/usr/bin/env tsx

/**
 * Fix Escalation Data in Inbound Calls
 *
 * This script corrects escalation_triggered values that are incorrectly set as strings
 * instead of booleans, causing false positive "Escalation Required" banners.
 *
 * The issue: VAPI structured output was configured with escalation_triggered as String (required),
 * so the AI fills it with "false", "no", etc. which are truthy in JavaScript.
 *
 * This script:
 * 1. Finds all inbound calls with escalation_data
 * 2. Converts string "false"/"no" values to boolean false
 * 3. If summary contains benign text ("no concerns", "standard", "routine"), sets to false
 * 4. Updates the database
 *
 * Usage:
 *   pnpm tsx apps/web/src/scripts/fix-escalation-data.ts
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface EscalationData {
  escalation_triggered?: unknown;
  escalation_summary?: string;
  escalation_type?: string;
  staff_action_needed?: string;
}

/**
 * Parse escalation_triggered value to boolean
 * Handles string values like "false", "no", "true", "yes"
 */
function parseEscalationTriggered(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "false" || normalized === "no" || normalized === "0") {
      return false;
    }
    if (normalized === "true" || normalized === "yes" || normalized === "1") {
      return true;
    }
  }

  // Default to false if we can't determine
  return false;
}

/**
 * Check if escalation summary indicates no real escalation
 * Common patterns from benign calls marked as escalations
 */
function isBenignEscalation(summary: string | undefined): boolean {
  if (!summary) return false;

  const benignPatterns = [
    "no concerns",
    "no issues",
    "standard appointment",
    "routine",
    "normal",
    "successful",
    "appointment scheduled",
    "call completed successfully",
  ];

  const normalized = summary.toLowerCase();
  return benignPatterns.some((pattern) => normalized.includes(pattern));
}

/**
 * Fix escalation data for a single call
 */
function fixEscalationData(escalationData: EscalationData): EscalationData {
  const triggered = parseEscalationTriggered(
    escalationData.escalation_triggered,
  );

  // If summary indicates no real escalation, force to false
  if (isBenignEscalation(escalationData.escalation_summary)) {
    return {
      ...escalationData,
      escalation_triggered: false,
      // Clear escalation fields if not actually needed
      escalation_type: undefined,
      escalation_summary: undefined,
      staff_action_needed: undefined,
    };
  }

  // Otherwise, just normalize the triggered value to boolean
  return {
    ...escalationData,
    escalation_triggered: triggered,
  };
}

/**
 * Main function
 */
async function main() {
  console.log("🔧 Fixing escalation data in inbound calls...\n");

  // Fetch all calls with escalation_data
  const { data: calls, error } = await supabase
    .from("inbound_vapi_calls")
    .select("id, vapi_call_id, customer_phone, escalation_data, outcome")
    .not("escalation_data", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching calls:", error.message);
    process.exit(1);
  }

  if (!calls || calls.length === 0) {
    console.log("✅ No calls with escalation data found");
    return;
  }

  console.log(`📊 Found ${calls.length} calls with escalation data\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const call of calls) {
    try {
      const escalationData = call.escalation_data as EscalationData | null;
      if (!escalationData) {
        skippedCount++;
        continue;
      }

      // Check if needs fixing
      const currentTriggered = escalationData.escalation_triggered;
      const isStringValue = typeof currentTriggered === "string";
      const isBenign = isBenignEscalation(escalationData.escalation_summary);

      if (!isStringValue && !isBenign) {
        skippedCount++;
        continue;
      }

      // Fix the data
      const fixedData = fixEscalationData(escalationData);

      // Update database
      const { error: updateError } = await supabase
        .from("inbound_vapi_calls")
        .update({
          escalation_data:
            fixedData as unknown as Database["public"]["Tables"]["inbound_vapi_calls"]["Update"]["escalation_data"],
        })
        .eq("id", call.id);

      if (updateError) {
        errors.push({ id: call.id, error: updateError.message });
        console.error(
          `❌ Failed to update call ${call.vapi_call_id}: ${updateError.message}`,
        );
        continue;
      }

      fixedCount++;
      console.log(
        `✅ Fixed call ${call.vapi_call_id} (${call.customer_phone})`,
      );

      if (isStringValue) {
        const oldValue = String(currentTriggered);
        const newValue = String(fixedData.escalation_triggered);
        console.log(
          `   - Converted escalation_triggered from string "${oldValue}" to boolean ${newValue}`,
        );
      }

      if (isBenign) {
        console.log(
          `   - Cleared benign escalation: "${escalationData.escalation_summary}"`,
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push({ id: call.id, error: errorMessage });
      console.error(`❌ Error processing call ${call.id}: ${errorMessage}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📈 Summary:");
  console.log(`   ✅ Fixed: ${fixedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n❌ Failed calls:");
    errors.forEach(({ id, error }) => {
      console.log(`   - ${id}: ${error}`);
    });
  }

  console.log("=".repeat(60) + "\n");
  console.log("✨ Done!");
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
