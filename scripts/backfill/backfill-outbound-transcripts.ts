/**
 * Backfill Script: Clean Outbound Discharge Call Transcripts
 *
 * This script uses AI to clean up speech-to-text transcription errors
 * for outbound discharge calls that have a transcript but no cleaned_transcript.
 * The enhanced cleaning also removes agent mistakes and hiccups to make
 * transcripts look spotless for veterinarians.
 *
 * It will:
 * - Fetch outbound discharge calls with transcripts but missing cleaned_transcript
 * - Use the cleanTranscript AI function to fix transcription errors AND remove agent mistakes
 * - Update the cleaned_transcript column in the database
 *
 * Usage:
 *   pnpm tsx scripts/backfill-outbound-transcripts.ts [options]
 *
 * Options:
 *   --dry-run           Show what would be updated without making changes
 *   --days=N            Look back N days (default: 14 for 2 weeks)
 *   --limit=N           Limit to N records (default: 200)
 *   --force-update      Re-clean calls that already have cleaned_transcript
 *
 * Examples:
 *   # Dry run to see what would be cleaned (last 2 weeks)
 *   pnpm tsx scripts/backfill-outbound-transcripts.ts --dry-run
 *
 *   # Process last 2 weeks, max 200 calls
 *   pnpm tsx scripts/backfill-outbound-transcripts.ts --days=14 --limit=200
 *
 *   # Force re-clean all calls in last week
 *   pnpm tsx scripts/backfill-outbound-transcripts.ts --days=7 --force-update
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Load environment variables from .env.local
config({ path: ".env.local" });

// ============================================================================
// TYPES
// ============================================================================

interface OutboundCallRecord {
  id: string;
  vapi_call_id: string | null;
  transcript: string | null;
  cleaned_transcript: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface BackfillStats {
  total: number;
  cleaned: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ callId: string; error: string }>;
}

// ============================================================================
// ENHANCED TRANSCRIPT CLEANING PROMPT
// ============================================================================

const COMMON_CORRECTIONS = `
## Vapi/Deepgram Transcription Errors

### Phonetic Mishearings
- "odis" or "oh dis" → "ODIS" (our company name)
- "vee eye pee" or "v i p" → "V.I.P."
- "alam rock" / "alumrock" / "allamrock" → "Alum Rock" (hospital name)
- "dogtor" → "doctor"

### Filler Words & Speech Disfluencies (REMOVE)
- "um", "uh", "er", "ah" → remove
- "like" (when used as filler, not comparison) → remove
- "you know", "I mean", "so basically" → remove when meaningless
- "gonna" → "going to"
- "wanna" → "want to"
- "kinda" → "kind of"
- "gotta" → "got to"
- "sorta" → "sort of"
- "lemme" → "let me"
- "gimme" → "give me"

### Repetitions & False Starts
- "I I want" → "I want"
- "Can you-- Can you help" → "Can you help"
- "We we we have" → "We have"
- "The the appointment" → "The appointment"

### Veterinary Medical Terms (Correct Spellings)
- "sub q" / "sub Q taneous" / "subq" → "subcutaneous"
- "intra muscular" / "I M" → "intramuscular"
- "I V" / "eye vee" → "IV" (intravenous)
- "newter" / "nuter" → "neuter"
- "spey" / "spade" → "spay"
- "disstemper" → "distemper"
- "parvo" not "parbow" or "par vo"
- "rabies" not "rabees"
- "bordatella" / "bordetela" → "Bordetella"
- "heart worm" → "heartworm"
- "flea tick" → "flea and tick"

### Common Medication Names
- "metronidazole" not "metro nida zole"
- "gabapentin" not "gaba pentin"
- "apoquel" not "apo kwell" or "apoquill"
- "rimadyl" not "rima dill"
- "carprofen" not "car pro fen"
- "trazodone" not "trazo done"
- "cerenia" not "sa renia" or "serenia"

### Pet Breed Corrections
- "golden lab" → "Golden Labrador" or "Golden Retriever" (use context)
- "lab" → "Labrador" (when clearly referring to breed)
- "pit" / "pitt" → "Pit Bull" or "Pitbull"
- "shih tzu" not "shitzu" or "shits oo"
- "chihuahua" not "chi wawa"
- "dachshund" not "dash hound" or "dock sind"
- "rottweiler" not "rot wiler"
- "german shepherd" not "german shepard"

### Agent Mistakes & Corrections (CRITICAL - REMOVE THESE)
- If AI provides wrong information then corrects itself, keep ONLY the correction
  Example: "AI: The appointment is on Monday. Actually, I apologize, it's on Tuesday."
  → "AI: The appointment is on Tuesday."
- Remove ALL AI apologies and self-corrections ("I apologize", "Let me correct that", "Sorry, I meant", "My mistake")
- Remove technical issues/system hiccups ("Can you hear me?", "Sorry, I lost you there", "Are you still there?")
- Remove uncertain AI statements later clarified ("I think...", "I'm not sure, but...", "Let me see...")
- If AI asks the same question twice, keep only the first instance
- Remove AI acknowledgments of confusion ("I didn't catch that", "Could you repeat?", "What was that?")
- Remove any "hold on" or "one moment" - present information as if immediately available

### Professional Polish (Make AI Sound Expert)
- Remove AI hesitations: "let me see", "one moment", "hold on", "give me a second"
- Remove meta-commentary: "Let me check that", "I'm looking at your record", "Let me pull that up"
- Remove qualifying language from AI: "I believe", "I think", "probably", "maybe"
- If AI repeats information, consolidate to single clear statement
- Remove indicators AI had to "figure something out" - present info confidently and directly
- Transform uncertain language to confident: "I think it's Tuesday" → "It's Tuesday"

### Conversation Flow Improvements
- If AI asks same question multiple times due to misunderstanding, keep only final successful exchange
- Remove false starts where AI begins sentence then restarts differently
- Remove redundant acknowledgments ("Okay", "Alright", "Sure" used excessively)
- Consolidate multiple attempts to explain same thing into clearest single version
`;

const SYSTEM_PROMPT = `You are an expert transcript editor specializing in veterinary clinic phone calls transcribed by Vapi/Deepgram. Your task is to clean up speech-to-text transcription errors AND remove any agent mistakes or hiccups to make the transcript look spotless and professional for veterinarians to review.

${COMMON_CORRECTIONS}

## Editing Guidelines

### DO:
1. Fix phonetic mishearings and misspellings (especially proper nouns, medical terms, medications)
2. Remove excessive filler words (um, uh, like, you know) that add no meaning
3. Fix word repetitions and false starts ("I I want" → "I want")
4. Correct veterinary terminology to proper medical spellings
5. Preserve speaker labels EXACTLY as provided (AI:, User:, Assistant:, etc.)
6. Maintain natural conversational tone - keep appropriate contractions ("I'm", "don't", "can't")
7. Keep "[inaudible]" and "[crosstalk]" markers as-is
8. If a clinic name is provided, correct any phonetic misspellings of that name
9. Preserve the COMPLETE transcript - every meaningful exchange
10. Remove AI mistakes, self-corrections, and uncertainties to present professional, confident communication
11. If AI said something wrong then corrected it, show ONLY the correct information

### DO NOT:
1. Change the meaning or intent of what was said
2. Add information that wasn't in the original
3. Summarize or shorten the conversation
4. Remove meaningful pauses indicated by "..." 
5. Change speaker attribution
6. Over-correct casual speech that's grammatically correct
7. Remove emotional expressions or emphasis ("Oh!", "Wow", "Great!") unless they're part of an error/correction

### What to KEEP
- Natural empathetic responses ("I'm sorry to hear that", "I understand your concern")
- Appropriate thank yous and acknowledgments that show attentiveness
- Clarifying questions that were part of proper conversation flow
- Context that aids understanding (only remove actual mistakes, not helpful context)

### Output Format
Output ONLY the cleaned transcript text. No explanations, headers, or JSON wrapping.
Each speaker turn should start on a new line with the speaker label (e.g., "AI:", "User:").
The transcript should read as if the AI agent was completely professional and error-free from the start.`;

// ============================================================================
// AI TRANSCRIPT CLEANING
// ============================================================================

async function cleanTranscript(
  transcript: string,
  clinicName: string | null,
  anthropic: Anthropic,
): Promise<string> {
  let userPrompt = "";

  if (clinicName) {
    userPrompt += `Clinic Context: This call is for "${clinicName}". Correct any misspellings of this clinic name.\n\n`;
  }

  userPrompt += `Clean up this transcript:\n\n${transcript}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (textBlock?.type !== "text") {
    throw new Error("No text response from AI");
  }

  return textBlock.text.trim();
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function fetchCallsToClean(
  supabase: SupabaseClient,
  options: {
    days: number;
    limit: number;
    forceUpdate: boolean;
  },
): Promise<OutboundCallRecord[]> {
  const { days, limit, forceUpdate } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from("scheduled_discharge_calls")
    .select(
      "id, vapi_call_id, transcript, cleaned_transcript, metadata, created_at",
    )
    .gte("created_at", startDate.toISOString())
    .not("transcript", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Only get calls without cleaned_transcript (unless force update)
  if (!forceUpdate) {
    query = query.is("cleaned_transcript", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch calls: ${error.message}`);
  }

  // Filter out calls with very short transcripts (not enough to clean)
  return ((data ?? []) as OutboundCallRecord[]).filter((call) => {
    if (!call.transcript) return false;
    const transcript = String(call.transcript).trim();
    // Must be at least 100 characters
    return transcript.length >= 100;
  });
}

async function updateCleanedTranscript(
  supabase: SupabaseClient,
  callId: string,
  cleanedTranscript: string,
): Promise<void> {
  const { error } = await supabase
    .from("scheduled_discharge_calls")
    .update({ cleaned_transcript: cleanedTranscript })
    .eq("id", callId);

  if (error) {
    throw new Error(`Failed to update call: ${error.message}`);
  }
}

// ============================================================================
// MAIN BACKFILL FUNCTION
// ============================================================================

async function backfillTranscripts(options: {
  dryRun?: boolean;
  days?: number;
  limit?: number;
  forceUpdate?: boolean;
}): Promise<BackfillStats> {
  const {
    dryRun = false,
    days = 14, // Default to 2 weeks for outbound calls
    limit = 200, // Higher limit for outbound
    forceUpdate = false,
  } = options;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (!anthropicApiKey) {
    throw new Error("Missing required environment variable: ANTHROPIC_API_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const stats: BackfillStats = {
    total: 0,
    cleaned: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL OUTBOUND DISCHARGE CALL TRANSCRIPTS");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Days to look back: ${days}`);
  console.log(`Limit: ${limit} records`);
  console.log(`Force update existing: ${forceUpdate}`);
  console.log("");

  const calls = await fetchCallsToClean(supabase, {
    days,
    limit,
    forceUpdate,
  });

  console.log(`Found ${calls.length} calls to process\n`);
  stats.total = calls.length;

  for (const call of calls) {
    try {
      if (!call.transcript || call.transcript.trim().length < 100) {
        console.log(
          `[SKIP] ${call.id}: Transcript too short (${call.transcript?.length ?? 0} chars)`,
        );
        stats.skipped++;
        continue;
      }

      // Extract clinic name from metadata
      const clinicName = call.metadata?.clinic_name as
        | string
        | null
        | undefined;
      const clinicDisplay = clinicName ?? "unknown clinic";

      console.log(`[CLEAN] ${call.id} (${clinicDisplay})`);
      console.log(`  Original length: ${call.transcript.length} chars`);

      if (!dryRun) {
        const cleanedTranscript = await cleanTranscript(
          call.transcript,
          clinicName ?? null,
          anthropic,
        );

        console.log(`  Cleaned length: ${cleanedTranscript.length} chars`);

        await updateCleanedTranscript(supabase, call.id, cleanedTranscript);
        console.log(`  ✅ Updated successfully`);

        stats.cleaned++;
      } else {
        console.log(`  (DRY RUN - no changes made)`);
        stats.cleaned++;
      }

      // Rate limiting - 1 request per second for Anthropic
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
  const forceUpdate = args.includes("--force-update");

  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? parseInt(daysArg.split("=")[1] ?? "14") : 14;

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "200") : 200;

  try {
    const stats = await backfillTranscripts({
      dryRun,
      days,
      limit,
      forceUpdate,
    });

    console.log("\n" + "=".repeat(60));
    console.log("BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total records found: ${stats.total}`);
    console.log(`Cleaned: ${stats.cleaned}`);
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
