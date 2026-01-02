#!/usr/bin/env tsx

/**
 * Backfill Inbound Call Outcomes
 *
 * This script backfills missing structured outputs for inbound calls by:
 * 1. Fetching calls from the past 3 days with missing outcome data
 * 2. Retrieving full call details from VAPI API (including transcripts)
 * 3. Using Claude AI to analyze transcripts and generate structured outputs
 * 4. Updating the database with the generated intelligence data
 *
 * Usage:
 *   pnpm tsx apps/web/src/scripts/backfill-inbound-outcomes.ts
 *
 * Environment variables required:
 *   - VAPI_PRIVATE_KEY
 *   - ANTHROPIC_API_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import { resolve } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY!;
const VAPI_API_URL = "https://api.vapi.ai";

// Types
interface VapiCall {
  id: string;
  transcript?: string;
  messages?: Array<{ role: string; message: string }>;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  };
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
}

interface StructuredOutputs {
  call_outcome_data: {
    call_outcome: string;
    outcome_summary: string;
    key_topics_discussed: string[];
    conversation_stage_reached: string;
  };
  pet_health_data: {
    health_summary: string | null;
    symptoms_reported: string[];
    owner_observations: string | null;
    pet_recovery_status: string | null;
  };
  medication_compliance_data: {
    compliance_summary: string | null;
    medication_concerns: string | null;
    medication_compliance: string;
    medications_mentioned: string[];
  };
  owner_sentiment_data: {
    owner_sentiment: string;
    notable_comments: string | null;
    sentiment_summary: string;
  };
  escalation_data: {
    escalation_type: string;
    escalation_summary: string;
    staff_action_needed: string;
    escalation_triggered: boolean;
  };
  follow_up_data: {
    next_steps: string;
    follow_up_needed: boolean;
    follow_up_summary: string;
    appointment_status: string;
  };
}

/**
 * Fetch call details from VAPI API with retry logic for rate limiting
 */
async function fetchCallFromVapi(
  callId: string,
  retries = 3,
): Promise<VapiCall | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
        },
      });

      if (response.status === 429) {
        // Rate limited - exponential backoff
        const waitTime = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
        console.error(
          `   ⏳ Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${retries}...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        console.error(`Failed to fetch call ${callId}: ${response.statusText}`);
        return null;
      }

      const data = (await response.json()) as VapiCall;
      return data;
    } catch (error) {
      console.error(`Error fetching call ${callId}:`, error);
      if (attempt === retries - 1) return null;
    }
  }
  return null;
}

/**
 * Build transcript text from messages array
 */
function buildTranscriptText(
  messages: Array<{ role: string; message: string }>,
): string {
  return messages
    .map((msg) => {
      const speaker = msg.role === "user" ? "Owner" : "Assistant";
      return `${speaker}: ${msg.message}`;
    })
    .join("\n");
}

/**
 * Map old outcome values to new dashboard-compatible values
 */
function mapOldOutcomeToNew(oldOutcome: string): string {
  const mapping: Record<string, string> = {
    appointment_scheduled: "Scheduled",
    cancellation: "Cancellation",
    voicemail: "Info",
    successful: "Completed",
    message_taken: "Call Back",
    // Already correct values (pass through)
    Scheduled: "Scheduled",
    Cancellation: "Cancellation",
    Info: "Info",
    Urgent: "Urgent",
    "Call Back": "Call Back",
    Completed: "Completed",
  };

  return mapping[oldOutcome] ?? "Completed"; // Default to Completed if unknown
}

/**
 * Use Claude to analyze transcript and generate structured outputs
 */
async function analyzeTranscriptWithClaude(
  transcript: string,
  callId: string,
): Promise<StructuredOutputs | null> {
  try {
    const prompt = `You are analyzing a veterinary clinic's inbound phone call transcript. Extract comprehensive structured information from this conversation.

TRANSCRIPT:
${transcript}

Extract the following information in JSON format:

{
  "call_outcome_data": {
    "call_outcome": "Scheduled|Cancellation|Info|Urgent|Call Back|Completed",
    "outcome_summary": "Brief summary of what was accomplished",
    "key_topics_discussed": ["topic1", "topic2"],
    "conversation_stage_reached": "greeting|triage|scheduling|closing"
  },
  "pet_health_data": {
    "health_summary": "Summary of pet's condition or null",
    "symptoms_reported": ["symptom1", "symptom2"],
    "owner_observations": "Owner's observations or null",
    "pet_recovery_status": "improving|declining|concerning|stable|not_discussed"
  },
  "medication_compliance_data": {
    "compliance_summary": "Summary or null",
    "medication_concerns": "Concerns or null",
    "medication_compliance": "compliant|non_compliant|partial|not_discussed",
    "medications_mentioned": ["med1", "med2"]
  },
  "owner_sentiment_data": {
    "owner_sentiment": "positive|neutral|negative|anxious|angry",
    "notable_comments": "Important quotes or null",
    "sentiment_summary": "Context around sentiment"
  },
  "escalation_data": {
    "escalation_type": "urgent_concern|callback_requested|complaint|none",
    "escalation_summary": "What needs escalation",
    "staff_action_needed": "Specific staff actions",
    "escalation_triggered": true|false
  },
  "follow_up_data": {
    "next_steps": "Detailed next steps",
    "follow_up_needed": true|false,
    "follow_up_summary": "What follow-up is needed",
    "appointment_status": "Appointment status or 'No appointment discussed'"
  }
}

Important:
- Use null for fields where information is not available
- Use empty arrays [] for lists with no items
- Be specific and detailed in summaries
- Include phone numbers and contact info in staff_action_needed when present
- Flag escalation_triggered as true if ANY staff attention is needed

Call Outcome Guidelines:
- "Scheduled" - Appointment was successfully scheduled
- "Cancellation" - Appointment was cancelled or call about cancellation
- "Info" - Informational call with no specific action needed
- "Urgent" - Urgent medical concern requiring immediate attention
- "Call Back" - Callback was requested by owner
- "Completed" - General successful call completion (default for completed calls)`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch =
      /```json\n([\s\S]+?)\n```/.exec(responseText) ??
      /\{[\s\S]+\}/.exec(responseText);
    if (!jsonMatch) {
      console.error(`No JSON found in Claude response for call ${callId}`);
      return null;
    }

    const jsonText = jsonMatch[1] ?? jsonMatch[0];
    const structured = JSON.parse(jsonText) as StructuredOutputs;

    return structured;
  } catch (error) {
    console.error(`Error analyzing transcript for call ${callId}:`, error);
    return null;
  }
}

/**
 * Main backfill function
 */
async function backfillInboundOutcomes() {
  console.log("🚀 Starting inbound call outcomes backfill...\n");

  // Calculate date from December 25, 2025
  const startDate = new Date("2025-12-25T00:00:00.000Z");
  const startDateISO = startDate.toISOString();

  console.log(
    `📅 Fetching calls from December 25, 2025 to today (since ${startDateISO})...\n`,
  );

  // Query calls missing outcomes from Dec 25 onward
  // Check for missing 'outcome' field (not call_outcome_data) since previous backfill
  // may have set call_outcome_data but not the outcome display field
  // Include all structured output fields so we can reuse existing data
  const { data: calls, error: queryError } = await supabase
    .from("inbound_vapi_calls")
    .select(
      "id, vapi_call_id, created_at, transcript, call_outcome_data, pet_health_data, medication_compliance_data, owner_sentiment_data, escalation_data, follow_up_data",
    )
    .is("outcome", null)
    .gte("created_at", startDateISO)
    .order("created_at", { ascending: false });

  if (queryError) {
    console.error("❌ Failed to query database:", queryError);
    process.exit(1);
  }

  if (!calls || calls.length === 0) {
    console.log("✅ No calls found missing outcomes since December 25, 2025!");
    return;
  }

  console.log(`📊 Found ${calls.length} calls missing outcomes\n`);
  console.log("=".repeat(80));

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // Process each call
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    const progress = `[${i + 1}/${calls.length}]`;

    console.log(`\n${progress} Processing call: ${call.vapi_call_id}`);
    console.log(`   Database ID: ${call.id}`);
    console.log(`   Created: ${call.created_at}`);

    // Check if call_outcome_data already exists (from previous backfill)
    // If so, we can skip Claude AI analysis and just extract the outcome
    let structured: StructuredOutputs | null = null;

    if (call.call_outcome_data) {
      console.log(
        `   ♻️  Using existing structured data from previous backfill...`,
      );
      try {
        // Reconstruct StructuredOutputs from individual JSONB fields
        structured = {
          call_outcome_data: call.call_outcome_data as {
            call_outcome: string;
            outcome_summary: string;
            key_topics_discussed: string[];
            conversation_stage_reached: string;
          },
          pet_health_data: (call.pet_health_data ?? {
            health_summary: null,
            symptoms_reported: [],
            owner_observations: null,
            pet_recovery_status: null,
          }) as {
            health_summary: string | null;
            symptoms_reported: string[];
            owner_observations: string | null;
            pet_recovery_status: string | null;
          },
          medication_compliance_data: (call.medication_compliance_data ?? {
            compliance_summary: null,
            medication_concerns: null,
            medication_compliance: "not_discussed",
            medications_mentioned: [],
          }) as {
            compliance_summary: string | null;
            medication_concerns: string | null;
            medication_compliance: string;
            medications_mentioned: string[];
          },
          owner_sentiment_data: (call.owner_sentiment_data ?? {
            owner_sentiment: "neutral",
            notable_comments: null,
            sentiment_summary: "No sentiment data available",
          }) as {
            owner_sentiment: string;
            notable_comments: string | null;
            sentiment_summary: string;
          },
          escalation_data: (call.escalation_data ?? {
            escalation_type: "none",
            escalation_summary: "No escalation needed",
            staff_action_needed: "None",
            escalation_triggered: false,
          }) as {
            escalation_type: string;
            escalation_summary: string;
            staff_action_needed: string;
            escalation_triggered: boolean;
          },
          follow_up_data: (call.follow_up_data ?? {
            next_steps: "None",
            follow_up_needed: false,
            follow_up_summary: "No follow-up needed",
            appointment_status: "No appointment discussed",
          }) as {
            next_steps: string;
            follow_up_needed: boolean;
            follow_up_summary: string;
            appointment_status: string;
          },
        };
      } catch {
        console.log(`   ⚠️  Failed to parse existing data, will re-analyze...`);
      }
    }

    // If we don't have structured data yet, analyze with Claude
    if (!structured) {
      // Fetch full call data from VAPI
      console.log(`   📡 Fetching from VAPI API...`);
      const vapiCall = await fetchCallFromVapi(call.vapi_call_id);

      if (!vapiCall) {
        console.log(`   ⚠️  Failed to fetch from VAPI - skipping`);
        failureCount++;
        continue;
      }

      // Get transcript - use existing DB transcript or build from messages
      let transcript = call.transcript ?? vapiCall.transcript;

      if (!transcript && vapiCall.messages) {
        console.log(`   🔧 Building transcript from messages...`);
        transcript = buildTranscriptText(vapiCall.messages);
      }

      if (!transcript || transcript.trim().length === 0) {
        console.log(`   ⚠️  No transcript available - skipping`);
        skippedCount++;
        continue;
      }

      console.log(`   📝 Transcript length: ${transcript.length} characters`);

      // Analyze with Claude
      console.log(`   🤖 Analyzing with Claude AI...`);
      structured = await analyzeTranscriptWithClaude(
        transcript,
        call.vapi_call_id,
      );

      if (!structured) {
        console.log(`   ❌ Failed to analyze transcript`);
        failureCount++;
        continue;
      }
    }

    // Update database
    console.log(`   💾 Updating database...`);

    // Map old outcome value to new dashboard-compatible format
    const rawOutcome = structured.call_outcome_data.call_outcome;
    const mappedOutcome = mapOldOutcomeToNew(rawOutcome);

    // Prepare update data (only include fields we have)
    const updateData: Record<string, unknown> = {
      // Set the simple outcome field for frontend display (mapped to new format)
      outcome: mappedOutcome,
      // Set all structured output JSONB fields
      call_outcome_data: structured.call_outcome_data,
      pet_health_data: structured.pet_health_data,
      medication_compliance_data: structured.medication_compliance_data,
      owner_sentiment_data: structured.owner_sentiment_data,
      escalation_data: structured.escalation_data,
      follow_up_data: structured.follow_up_data,
    };

    const { error: updateError } = await supabase
      .from("inbound_vapi_calls")
      .update(updateData)
      .eq("id", call.id);

    if (updateError) {
      console.log(`   ❌ Database update failed:`, updateError);
      failureCount++;
      continue;
    }

    console.log(`   ✅ Successfully backfilled!`);
    console.log(
      `      Outcome: ${mappedOutcome}${rawOutcome !== mappedOutcome ? ` (mapped from: ${rawOutcome})` : ""}`,
    );
    console.log(
      `      Sentiment: ${structured.owner_sentiment_data.owner_sentiment}`,
    );
    console.log(
      `      Escalation: ${structured.escalation_data.escalation_triggered ? "YES" : "NO"}`,
    );
    successCount++;

    // Rate limiting - wait 5 seconds between API calls to avoid hitting rate limits
    if (i < calls.length - 1) {
      console.log(`   ⏱️  Waiting 5s before next call...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("\n📊 BACKFILL SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total calls processed: ${calls.length}`);
  console.log(`✅ Successfully backfilled: ${successCount}`);
  console.log(`⚠️  Skipped (no transcript): ${skippedCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(
    `\nSuccess rate: ${((successCount / calls.length) * 100).toFixed(1)}%`,
  );
  console.log("=".repeat(80));
  console.log("\n🎉 Backfill complete!\n");
}

// Run the script
backfillInboundOutcomes().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
