/**
 * Backfill Script: Sync Inbound Calls from VAPI to Supabase
 *
 * This script fetches inbound calls from VAPI API and syncs them to Supabase.
 * It will:
 * - Fetch all inbound calls from VAPI within a date range
 * - Skip failed/error calls (only sync successful or completed calls)
 * - Insert new calls or update existing ones with missing data
 *
 * Usage:
 *   pnpm tsx scripts/backfill-inbound-calls.ts [options]
 *
 * Options:
 *   --dry-run           Show what would be updated without making changes
 *   --days=N            Look back N days (default: 30)
 *   --limit=N           Limit to N records from VAPI (default: 1000)
 *   --include-failed    Include failed/error calls (default: skip them)
 *   --force-update      Update all fields even if record exists
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/database.types.js";

// Load environment variables from .env.local
config({ path: ".env.local" });

// ============================================================================
// TYPES
// ============================================================================

interface VapiCallResponse {
  id: string;
  orgId: string;
  type: "outboundPhoneCall" | "inboundPhoneCall" | "webCall";
  phoneNumber?: {
    number: string;
    id: string;
  };
  customer?: {
    number: string;
  };
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  endedReason?: string;
  messages?: Array<{
    role: "assistant" | "user" | "system" | "tool_call" | "tool_call_result";
    message?: string;
    content?: string;
    time?: number;
    secondsFromStart?: number;
  }>;
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
    structuredData?: Record<string, unknown>;
  };
  artifact?: {
    recordingUrl?: string;
    stereoRecordingUrl?: string;
    transcript?: string;
    messages?: Array<unknown>;
    structuredOutputs?: Record<string, unknown>;
  };
  costs?: Array<{
    amount: number;
    description: string;
  }>;
  cost?: number;
  startedAt?: string;
  endedAt?: string;
  assistantId?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackfillStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{
    callId: string;
    error: string;
  }>;
  details: Array<{
    callId: string;
    action: "insert" | "update" | "skip";
    reason?: string;
  }>;
}

// ============================================================================
// VAPI API CLIENT
// ============================================================================

async function fetchVapiCalls(
  apiKey: string,
  options: {
    limit?: number;
    createdAtGe?: Date;
    createdAtLe?: Date;
  },
): Promise<VapiCallResponse[]> {
  const allCalls: VapiCallResponse[] = [];
  let cursor: string | null = null;
  const limit = options.limit ?? 1000;
  const pageSize = Math.min(limit, 100); // VAPI max per page is 100

  console.log("Fetching calls from VAPI API...");
  console.log(
    `  Date range: ${options.createdAtGe?.toISOString()} to ${options.createdAtLe?.toISOString()}`,
  );

  do {
    const params = new URLSearchParams();
    params.set("limit", String(pageSize));

    if (options.createdAtGe) {
      params.set("createdAtGe", options.createdAtGe.toISOString());
    }
    if (options.createdAtLe) {
      params.set("createdAtLe", options.createdAtLe.toISOString());
    }
    if (cursor) {
      params.set("cursor", cursor);
    }

    const url = `https://api.vapi.ai/call?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VAPI API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as VapiCallResponse[];

    if (!Array.isArray(data)) {
      console.log("Unexpected response format:", data);
      break;
    }

    allCalls.push(...data);
    console.log(`  Fetched ${data.length} calls (total: ${allCalls.length})`);

    // Check if there might be more (if we got a full page)
    if (data.length === pageSize && allCalls.length < limit) {
      // Use the last call's createdAt as cursor for next page
      const lastCall = data[data.length - 1];
      // VAPI uses cursor-based pagination, but falls back to date-based if needed
      cursor = lastCall?.id ?? null;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else {
      cursor = null;
    }
  } while (cursor && allCalls.length < limit);

  return allCalls.slice(0, limit);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map VAPI status to our internal status
 */
function mapVapiStatus(vapiStatus: string | undefined): string {
  switch (vapiStatus) {
    case "queued":
      return "queued";
    case "ringing":
      return "ringing";
    case "in-progress":
      return "in_progress";
    case "forwarding":
      return "in_progress";
    case "ended":
      return "completed";
    default:
      return "completed";
  }
}

/**
 * Extract sentiment from analysis
 */
function extractSentiment(
  analysis: Record<string, unknown> | undefined,
): string | null {
  if (!analysis) return null;

  const userSentiment = analysis.userSentiment as string | undefined;
  if (
    userSentiment &&
    ["positive", "neutral", "negative"].includes(userSentiment.toLowerCase())
  ) {
    return userSentiment.toLowerCase();
  }

  return null;
}

/**
 * Calculate duration in seconds
 */
function calculateDuration(
  startedAt: string | undefined,
  endedAt: string | undefined,
): number | null {
  if (!startedAt || !endedAt) return null;

  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    return Math.round((end - start) / 1000);
  } catch {
    return null;
  }
}

/**
 * Calculate total cost from VAPI costs array
 */
function calculateTotalCost(
  costs?: Array<{ amount: number; description: string }>,
  cost?: number,
): number | null {
  if (cost !== undefined) return cost;
  if (!costs || costs.length === 0) return null;
  return costs.reduce((total, c) => total + c.amount, 0);
}

/**
 * Check if call should be considered a failure
 */
function isFailedCall(call: VapiCallResponse): boolean {
  const failedReasons = [
    "pipeline-error",
    "twilio-failed-to-connect-call",
    "assistant-request-failed",
    "assistant-not-found",
    "phone-number-not-found",
    "exceeded-max-duration",
    "no-answer",
    "busy",
    "manually-canceled",
  ];

  if (
    call.endedReason &&
    failedReasons.some((r) => call.endedReason?.includes(r))
  ) {
    return true;
  }

  return false;
}

/**
 * Get clinic name and user ID from assistant ID
 */
async function getClinicByAssistantId(
  assistantId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<{ clinicName: string | null; userId: string | null }> {
  if (!assistantId) {
    return { clinicName: null, userId: null };
  }

  // First, try clinics table via inbound_assistant_id
  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("name")
    .eq("inbound_assistant_id", assistantId)
    .maybeSingle();

  if (clinicError) {
    console.warn(
      `Error looking up clinic by assistant ID: ${clinicError.message}`,
    );
  }

  if (clinic?.name) {
    // Find a user from this clinic
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .ilike("clinic_name", clinic.name)
      .limit(1)
      .maybeSingle();

    return {
      clinicName: clinic.name,
      userId: user?.id ?? null,
    };
  }

  // Fallback: try clinic_assistants table
  const { data: clinicAssistant, error: caError } = await supabase
    .from("clinic_assistants")
    .select("clinic_name")
    .eq("assistant_id", assistantId)
    .eq("is_active", true)
    .maybeSingle();

  if (caError) {
    console.warn(`Error looking up clinic_assistants: ${caError.message}`);
  }

  if (clinicAssistant?.clinic_name) {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clinic_name", clinicAssistant.clinic_name)
      .limit(1)
      .maybeSingle();

    return {
      clinicName: clinicAssistant.clinic_name,
      userId: user?.id ?? null,
    };
  }

  return { clinicName: null, userId: null };
}

/**
 * Transform VAPI call to database format
 */
function formatInboundCallData(
  call: VapiCallResponse,
  clinicName: string | null,
  userId: string | null,
): Record<string, unknown> {
  const analysis = call.analysis ?? {};
  const artifact = call.artifact ?? {};

  // Determine final status
  let finalStatus = mapVapiStatus(call.status);
  if (call.endedReason) {
    if (isFailedCall(call)) {
      finalStatus = "failed";
    } else if (
      call.endedReason === "customer-ended-call" ||
      call.endedReason === "assistant-ended-call"
    ) {
      finalStatus = "completed";
    } else if (call.endedReason.includes("cancelled")) {
      finalStatus = "cancelled";
    }
  }

  return {
    vapi_call_id: call.id,
    assistant_id: call.assistantId ?? null,
    phone_number_id: call.phoneNumber?.id ?? null,
    user_id: userId,
    clinic_name: clinicName,
    customer_phone: call.customer?.number ?? null,
    customer_number: call.customer?.number ?? null,
    status: finalStatus,
    type: "inbound",
    started_at: call.startedAt ?? null,
    ended_at: call.endedAt ?? null,
    duration_seconds: calculateDuration(call.startedAt, call.endedAt),
    recording_url: call.recordingUrl ?? artifact.recordingUrl ?? null,
    stereo_recording_url:
      call.stereoRecordingUrl ?? artifact.stereoRecordingUrl ?? null,
    transcript: call.transcript ?? artifact.transcript ?? null,
    transcript_messages: call.messages ?? artifact.messages ?? null,
    call_analysis: analysis,
    summary: analysis.summary ?? null,
    success_evaluation: analysis.successEvaluation ?? null,
    structured_data:
      analysis.structuredData ?? artifact.structuredOutputs ?? null,
    user_sentiment: extractSentiment(analysis as Record<string, unknown>),
    cost: calculateTotalCost(call.costs, call.cost),
    ended_reason: call.endedReason ?? null,
    metadata: {},
    created_at: call.createdAt,
    updated_at: call.updatedAt,
  };
}

// ============================================================================
// MAIN BACKFILL FUNCTION
// ============================================================================

async function backfillInboundCalls(
  options: {
    dryRun?: boolean;
    days?: number;
    limit?: number;
    includeFailed?: boolean;
    forceUpdate?: boolean;
  } = {},
): Promise<BackfillStats> {
  const {
    dryRun = false,
    days = 30,
    limit = 1000,
    includeFailed = false,
    forceUpdate = false,
  } = options;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapiApiKey = process.env.VAPI_PRIVATE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (!vapiApiKey) {
    throw new Error("Missing required environment variable: VAPI_PRIVATE_KEY");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  const stats: BackfillStats = {
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    details: [],
  };

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL INBOUND CALLS FROM VAPI");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Days to look back: ${days}`);
  console.log(`Limit: ${limit} records`);
  console.log(`Include failed calls: ${includeFailed}`);
  console.log(`Force update existing: ${forceUpdate}`);
  console.log("");

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch calls from VAPI
  const vapiCalls = await fetchVapiCalls(vapiApiKey, {
    limit,
    createdAtGe: startDate,
    createdAtLe: endDate,
  });

  console.log(`\nTotal calls from VAPI: ${vapiCalls.length}`);

  // Filter for inbound calls only
  const inboundCalls = vapiCalls.filter(
    (call) => call.type === "inboundPhoneCall",
  );
  console.log(`Inbound calls: ${inboundCalls.length}`);

  // Filter out failed calls if not including them
  const callsToProcess = includeFailed
    ? inboundCalls
    : inboundCalls.filter((call) => !isFailedCall(call));

  console.log(
    `Calls to process (${includeFailed ? "including" : "excluding"} failed): ${callsToProcess.length}`,
  );

  if (callsToProcess.length === 0) {
    console.log("\nNo calls to process.");
    return stats;
  }

  // Get existing call IDs from Supabase
  const vapiCallIds = callsToProcess.map((call) => call.id);
  const { data: existingCalls, error: fetchError } = await supabase
    .from("inbound_vapi_calls")
    .select("vapi_call_id, recording_url, transcript")
    .in("vapi_call_id", vapiCallIds);

  if (fetchError) {
    console.error("Error fetching existing calls:", fetchError);
    throw fetchError;
  }

  const existingCallMap = new Map(
    (existingCalls ?? []).map((c) => [c.vapi_call_id, c]),
  );
  console.log(`Existing calls in Supabase: ${existingCallMap.size}`);

  // Cache for assistant ID lookups
  const clinicCache = new Map<
    string,
    { clinicName: string | null; userId: string | null }
  >();

  console.log("\nProcessing calls...\n");

  stats.total = callsToProcess.length;

  for (const call of callsToProcess) {
    try {
      const existingCall = existingCallMap.get(call.id);

      // Check if assistant mapping is cached
      let clinicInfo = clinicCache.get(call.assistantId ?? "");
      if (!clinicInfo && call.assistantId) {
        clinicInfo = await getClinicByAssistantId(call.assistantId, supabase);
        clinicCache.set(call.assistantId, clinicInfo);
      }
      clinicInfo = clinicInfo ?? { clinicName: null, userId: null };

      const callData = formatInboundCallData(
        call,
        clinicInfo.clinicName,
        clinicInfo.userId,
      );

      if (existingCall && !forceUpdate) {
        // Check if we need to update (missing recording or transcript)
        const needsUpdate =
          (!existingCall.recording_url && callData.recording_url) ??
          (!existingCall.transcript && callData.transcript);

        if (!needsUpdate) {
          console.log(`[SKIP] ${call.id}: Already exists with complete data`);
          stats.skipped++;
          stats.details.push({
            callId: call.id,
            action: "skip",
            reason: "Already exists with complete data",
          });
          continue;
        }

        // Update only missing fields
        console.log(`[UPDATE] ${call.id}: Updating missing fields`);
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from("inbound_vapi_calls")
            .update({
              ...(callData.recording_url && {
                recording_url: callData.recording_url,
              }),
              ...(callData.stereo_recording_url && {
                stereo_recording_url: callData.stereo_recording_url,
              }),
              ...(callData.transcript && { transcript: callData.transcript }),
              ...(callData.transcript_messages && {
                transcript_messages: callData.transcript_messages,
              }),
              ...(callData.summary && { summary: callData.summary }),
              ...(callData.call_analysis && {
                call_analysis: callData.call_analysis,
              }),
              ...(callData.user_sentiment && {
                user_sentiment: callData.user_sentiment,
              }),
              ...(callData.cost && { cost: callData.cost }),
            })
            .eq("vapi_call_id", call.id);

          if (updateError) {
            console.error(`  ❌ Error updating: ${updateError.message}`);
            stats.errors++;
            stats.errorDetails.push({
              callId: call.id,
              error: updateError.message,
            });
            continue;
          }
          console.log(`  ✅ Updated successfully`);
        } else {
          console.log(`  (DRY RUN - no changes made)`);
        }

        stats.updated++;
        stats.details.push({ callId: call.id, action: "update" });
      } else if (existingCall && forceUpdate) {
        // Force update all fields
        console.log(`[FORCE UPDATE] ${call.id}: Updating all fields`);
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from("inbound_vapi_calls")
            .update(callData)
            .eq("vapi_call_id", call.id);

          if (updateError) {
            console.error(`  ❌ Error updating: ${updateError.message}`);
            stats.errors++;
            stats.errorDetails.push({
              callId: call.id,
              error: updateError.message,
            });
            continue;
          }
          console.log(`  ✅ Force updated successfully`);
        } else {
          console.log(`  (DRY RUN - no changes made)`);
        }

        stats.updated++;
        stats.details.push({ callId: call.id, action: "update" });
      } else {
        // Insert new call
        console.log(
          `[INSERT] ${call.id}: New call from ${call.customer?.number ?? "unknown"} to ${clinicInfo.clinicName ?? "unknown clinic"}`,
        );
        if (!dryRun) {
          const { error: insertError } = await supabase
            .from("inbound_vapi_calls")
            .insert(callData);

          if (insertError) {
            console.error(`  ❌ Error inserting: ${insertError.message}`);
            stats.errors++;
            stats.errorDetails.push({
              callId: call.id,
              error: insertError.message,
            });
            continue;
          }
          console.log(`  ✅ Inserted successfully`);
        } else {
          console.log(`  (DRY RUN - no changes made)`);
        }

        stats.inserted++;
        stats.details.push({ callId: call.id, action: "insert" });
      }
    } catch (err) {
      console.error(`[ERROR] ${call.id}:`, err);
      stats.errors++;
      stats.errorDetails.push({
        callId: call.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return stats;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const includeFailed = args.includes("--include-failed");
  const forceUpdate = args.includes("--force-update");

  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? parseInt(daysArg.split("=")[1] ?? "30") : 30;

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "1000") : 1000;

  try {
    const stats = await backfillInboundCalls({
      dryRun,
      days,
      limit,
      includeFailed,
      forceUpdate,
    });

    console.log("\n" + "=".repeat(60));
    console.log("BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total records processed: ${stats.total}`);
    console.log(`Inserted: ${stats.inserted}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (dryRun) {
      console.log("\n⚠️  DRY RUN MODE - No actual changes were made");
      console.log("Run without --dry-run to apply changes");
    } else {
      console.log("\n✅ Backfill complete!");
    }

    if (stats.errorDetails.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("ERROR DETAILS");
      console.log("=".repeat(60));
      stats.errorDetails.slice(0, 10).forEach((detail) => {
        console.log(`  ${detail.callId}: ${detail.error}`);
      });
      if (stats.errorDetails.length > 10) {
        console.log(`  ... and ${stats.errorDetails.length - 10} more errors`);
      }
    }

    process.exit(stats.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Backfill failed:", error);
    process.exit(1);
  }
}

void main();
