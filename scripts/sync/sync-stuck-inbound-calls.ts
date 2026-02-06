#!/usr/bin/env npx tsx
/**
 * Sync Stuck Inbound Calls
 *
 * Fetches call data from VAPI and updates database records for inbound calls
 * that are stuck in 'ringing' status.
 *
 * Usage:
 *   pnpm tsx scripts/sync/sync-stuck-inbound-calls.ts
 *   pnpm tsx scripts/sync/sync-stuck-inbound-calls.ts --dry-run
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY - Required for database access
 *   VAPI_PRIVATE_KEY - Required for VAPI API access
 */

import {
  loadScriptEnv,
  parseScriptArgs,
  createScriptSupabaseClient,
  scriptLog,
  requireEnv,
} from "@odis-ai/shared/script-utils";

// Load environment variables
loadScriptEnv({
  required: ["SUPABASE_SERVICE_ROLE_KEY", "VAPI_PRIVATE_KEY"],
});

// Parse CLI arguments
const args = parseScriptArgs();

// Get VAPI key for API calls
const VAPI_API_KEY = requireEnv("VAPI_PRIVATE_KEY");

// Create Supabase client
const supabase = createScriptSupabaseClient();

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

interface StuckCall {
  id: string;
  vapi_call_id: string;
  status: string;
  clinic_name: string | null;
  created_at: string;
}

async function main() {
  scriptLog.header("Sync Stuck Inbound Calls from VAPI");

  if (args.dryRun) {
    scriptLog.dryRun("Running in dry-run mode - no changes will be made");
  }

  // Find all stuck inbound calls
  const { data: stuckCalls, error: queryError } = await supabase
    .from("inbound_vapi_calls")
    .select("id, vapi_call_id, status, clinic_name, created_at")
    .eq("status", "ringing")
    .order("created_at", { ascending: false });

  if (queryError) {
    scriptLog.error("Failed to query stuck calls:", queryError.message);
    process.exit(1);
  }

  if (!stuckCalls || stuckCalls.length === 0) {
    scriptLog.success("No stuck calls found!");
    return;
  }

  scriptLog.info(`Found ${stuckCalls.length} stuck calls`);

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const call of stuckCalls as StuckCall[]) {
    scriptLog.info(`Processing: ${call.vapi_call_id}`);

    if (args.verbose) {
      scriptLog.debug(`  Clinic: ${call.clinic_name ?? "Unknown"}`);
      scriptLog.debug(`  Created: ${call.created_at}`);
    }

    try {
      // Fetch from VAPI
      const vapiCall = await getCall(call.vapi_call_id);

      if (!vapiCall) {
        scriptLog.warn(`  Not found in VAPI - skipping`);
        skipped++;
        continue;
      }

      if (args.verbose) {
        scriptLog.debug(`  VAPI Status: ${vapiCall.status}`);
        scriptLog.debug(`  Ended Reason: ${vapiCall.endedReason ?? "N/A"}`);
        scriptLog.debug(`  Duration: ${calculateDuration(vapiCall)}s`);
        scriptLog.debug(`  Has Transcript: ${!!vapiCall.transcript}`);
        scriptLog.debug(`  Has Recording: ${!!vapiCall.recordingUrl}`);
      }

      if (args.dryRun) {
        scriptLog.dryRun(`Would update to: ${mapStatus(vapiCall)}`);
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
        scriptLog.error(`  Update failed: ${updateError.message}`);
        failed++;
      } else {
        scriptLog.success(`  Updated to: ${String(updateData.status)}`);
        synced++;
      }
    } catch (error) {
      scriptLog.error(
        `  Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      failed++;
    }
  }

  scriptLog.divider();
  scriptLog.header("Summary");
  scriptLog.info(`Total: ${stuckCalls.length}`);
  scriptLog.success(`Synced: ${synced}`);
  if (skipped > 0) scriptLog.warn(`Skipped: ${skipped}`);
  if (failed > 0) scriptLog.error(`Failed: ${failed}`);

  if (args.dryRun) {
    scriptLog.info("Run without --dry-run to apply changes.");
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

main().catch((error) => {
  scriptLog.error("Script failed:", error);
  process.exit(1);
});
