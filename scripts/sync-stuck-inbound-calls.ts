#!/usr/bin/env npx tsx
/**
 * Sync Stuck Inbound Calls
 *
 * Fetches call data from VAPI and updates database records for inbound calls
 * that are stuck in 'ringing' status.
 *
 * Usage:
 *   pnpm exec tsx scripts/sync-stuck-inbound-calls.ts
 *   pnpm exec tsx scripts/sync-stuck-inbound-calls.ts --dry-run
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local first (for local development), then .env as fallback
config({ path: ".env.local" });
config({ path: ".env" });

// Get env vars directly (avoid @odis-ai/env validation)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

if (!VAPI_API_KEY) {
  console.error("Missing VAPI_PRIVATE_KEY");
  process.exit(1);
}

// Create Supabase client directly
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// VAPI call response type
interface VapiCallResponse {
  id: string;
  status: string;
  endedReason?: string;
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  recordingUrl?: string;
  messages?: unknown[];
  analysis?: {
    summary?: string;
    [key: string]: unknown;
  };
  artifact?: {
    stereoRecordingUrl?: string;
    transcript?: string;
    messages?: unknown[];
  };
}

// Fetch call from VAPI
async function getCall(callId: string): Promise<VapiCallResponse | null> {
  const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`VAPI API error: ${response.status}`);
  }

  return response.json();
}

const DRY_RUN = process.argv.includes("--dry-run");

interface StuckCall {
  id: string;
  vapi_call_id: string;
  status: string;
  clinic_name: string | null;
  created_at: string;
}

async function main() {
  console.log("============================================================");
  console.log("Sync Stuck Inbound Calls from VAPI");
  console.log("============================================================");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log("");

  // Find all stuck inbound calls
  const { data: stuckCalls, error: queryError } = await supabase
    .from("inbound_vapi_calls")
    .select("id, vapi_call_id, status, clinic_name, created_at")
    .eq("status", "ringing")
    .order("created_at", { ascending: false });

  if (queryError) {
    console.error("Failed to query stuck calls:", queryError.message);
    process.exit(1);
  }

  if (!stuckCalls || stuckCalls.length === 0) {
    console.log("✅ No stuck calls found!");
    return;
  }

  console.log(`Found ${stuckCalls.length} stuck calls:\n`);

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const call of stuckCalls as StuckCall[]) {
    console.log(`Processing: ${call.vapi_call_id}`);
    console.log(`  Clinic: ${call.clinic_name ?? "Unknown"}`);
    console.log(`  Created: ${call.created_at}`);

    try {
      // Fetch from VAPI
      const vapiCall = await getCall(call.vapi_call_id);

      if (!vapiCall) {
        console.log(`  ⚠️  Not found in VAPI - skipping`);
        skipped++;
        continue;
      }

      console.log(`  VAPI Status: ${vapiCall.status}`);
      console.log(`  Ended Reason: ${vapiCall.endedReason ?? "N/A"}`);
      console.log(`  Duration: ${calculateDuration(vapiCall)}s`);
      console.log(`  Has Transcript: ${!!vapiCall.transcript}`);
      console.log(`  Has Recording: ${!!vapiCall.recordingUrl}`);

      if (DRY_RUN) {
        console.log(`  📋 Would update to: ${mapStatus(vapiCall)}`);
        synced++;
        continue;
      }

      // Update database
      const updateData = buildUpdateData(vapiCall);
      const { error: updateError } = await supabase
        .from("inbound_vapi_calls")
        .update(updateData)
        .eq("id", call.id);

      if (updateError) {
        console.log(`  ❌ Update failed: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ Updated to: ${String(updateData.status)}`);
        synced++;
      }
    } catch (error) {
      console.log(
        `  ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      failed++;
    }

    console.log("");
  }

  console.log("============================================================");
  console.log("Summary");
  console.log("============================================================");
  console.log(`Total: ${stuckCalls.length}`);
  console.log(`  ✅ Synced: ${synced}`);
  console.log(`  ⚠️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);

  if (DRY_RUN) {
    console.log("\n💡 Run without --dry-run to apply changes.");
  }
}

function calculateDuration(call: VapiCallResponse): number | null {
  if (!call.startedAt || !call.endedAt) return null;
  const start = new Date(call.startedAt).getTime();
  const end = new Date(call.endedAt).getTime();
  return Math.round((end - start) / 1000);
}

function mapStatus(call: VapiCallResponse): string {
  if (call.endedReason) {
    if (
      call.endedReason === "customer-ended-call" ||
      call.endedReason === "assistant-ended-call"
    ) {
      return "completed";
    }
    if (call.endedReason.includes("cancelled")) {
      return "cancelled";
    }
    if (
      call.endedReason.includes("error") ||
      call.endedReason.includes("failed")
    ) {
      return "failed";
    }
  }

  switch (call.status) {
    case "ended":
      return "completed";
    case "queued":
      return "queued";
    case "ringing":
      return "ringing";
    case "in-progress":
      return "in_progress";
    default:
      return call.status ?? "unknown";
  }
}

function buildUpdateData(call: VapiCallResponse): Record<string, unknown> {
  const analysis = call.analysis ?? {};
  const artifact = (
    call as unknown as {
      artifact?: {
        stereoRecordingUrl?: string;
        transcript?: string;
        messages?: unknown[];
      };
    }
  ).artifact;

  return {
    status: mapStatus(call),
    started_at: call.startedAt ?? null,
    ended_at: call.endedAt ?? null,
    duration_seconds: calculateDuration(call),
    recording_url: call.recordingUrl ?? null,
    stereo_recording_url: artifact?.stereoRecordingUrl ?? null,
    transcript: call.transcript ?? artifact?.transcript ?? null,
    transcript_messages: call.messages ?? artifact?.messages ?? null,
    call_analysis: analysis,
    summary: analysis.summary ?? null,
    ended_reason: call.endedReason ?? null,
    updated_at: new Date().toISOString(),
  };
}

main().catch(console.error);
