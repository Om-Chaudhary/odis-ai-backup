/**
 * AI Transcript Cleanup
 *
 * Uses a small LLM to fix speech-to-text transcription errors
 * with veterinary domain knowledge and call-specific context.
 *
 * IMPORTANT: This is a CORRECTION-ONLY tool. It fixes mishearings
 * and misspellings but does NOT remove, rephrase, or add content.
 * The cleaned transcript must be faithful to what was actually said.
 */

import { Anthropic } from "@llamaindex/anthropic";
import { env } from "@odis-ai/shared/env";
import type { ChatMessage } from "llamaindex";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";

/**
 * Phonetic correction patterns for Vapi/Deepgram transcription
 */
const TRANSCRIPTION_CORRECTIONS = `
## Vapi/Deepgram Transcription Error Patterns

### Phonetic Mishearings (Proper Nouns)
- "alam rock" / "alumrock" / "allamrock" → "Alum Rock"
- "dogtor" → "doctor"

### Veterinary Medical Terms
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

### Common Medication Names
- "metronidazole" not "metro nida zole"
- "gabapentin" not "gaba pentin"
- "apoquel" not "apo kwell" or "apoquill"
- "rimadyl" not "rima dill"
- "carprofen" not "car pro fen"
- "trazodone" not "trazo done"
- "cerenia" not "sa renia" or "serenia"

### Pet Breed Names
- "shih tzu" not "shitzu" or "shits oo"
- "chihuahua" not "chi wawa"
- "dachshund" not "dash hound" or "dock sind"
- "rottweiler" not "rot wiler"
- "german shepherd" not "german shepard"

### Word Repetitions (Transcription Artifacts)
- "I I want" → "I want"
- "We we we have" → "We have"
- "The the appointment" → "The appointment"
`;

const SYSTEM_PROMPT = `You are a transcript corrector for veterinary clinic phone calls transcribed by Vapi/Deepgram. Your ONLY job is to fix speech-to-text transcription errors (mishearings, misspellings, word-split artifacts).

${TRANSCRIPTION_CORRECTIONS}

## Rules

### ONLY fix these types of errors:
1. Phonetic mishearings — words the transcriber heard wrong (e.g. "alam rock" → "Alum Rock")
2. Medical term misspellings — veterinary terms the transcriber split or mangled
3. Proper noun misspellings — clinic names, pet names, medication names the transcriber got wrong
4. Word-split artifacts — single words the transcriber split into multiple (e.g. "gaba pentin" → "gabapentin")
5. Obvious word repetitions from transcription glitches (e.g. "I I want" → "I want")

### NEVER do any of the following:
1. Add words, phrases, or sentences that were not in the original
2. Remove words, phrases, or sentences that were in the original
3. Complete truncated or cut-off sentences
4. Rephrase or reword anything
5. Remove filler words (um, uh, like, you know) — these were actually spoken
6. Remove hesitations, pauses, or self-corrections — these were actually spoken
7. Change informal speech to formal (keep "gonna", "wanna", "kinda" etc.)
8. Summarize or shorten any part of the conversation
9. Change speaker attribution

### Output Format
Output ONLY the corrected transcript. No explanations or commentary.
Preserve speaker labels exactly as provided (AI:, User:, Assistant:, etc.).
The output must contain the same number of speaker turns as the input.`;

function createUserPrompt(
  transcript: string,
  clinicName?: string | null,
  callContext?: CallContext | null,
): string {
  const contextLines: string[] = [];

  if (clinicName) {
    contextLines.push(`Clinic name (correct spelling): "${clinicName}"`);
  }
  if (callContext?.petName) {
    contextLines.push(`Pet name (correct spelling): "${callContext.petName}"`);
  }
  if (callContext?.ownerName) {
    contextLines.push(
      `Owner name (correct spelling): "${callContext.ownerName}"`,
    );
  }
  if (callContext?.agentName) {
    contextLines.push(
      `Agent name (correct spelling): "${callContext.agentName}"`,
    );
  }

  let prompt = "";
  if (contextLines.length > 0) {
    prompt += `Known names (use these exact spellings when the transcriber mishears them):\n${contextLines.join("\n")}\n\n`;
  }

  prompt += `Fix only transcription errors in this transcript:\n\n${transcript}`;

  return prompt;
}

/**
 * Get LLM instance for transcript cleanup
 * Uses Haiku model for fast, cost-effective processing
 */
function getCleanupLLM() {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured. Add it to your environment variables.",
    );
  }

  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-haiku-4-5-20251001",
    temperature: 0, // Zero temperature for maximum faithfulness
    maxTokens: 8192,
  });
}

/**
 * Call-specific context for more accurate corrections
 */
export interface CallContext {
  /** Pet name from the call's dynamic variables */
  petName?: string | null;
  /** Owner name from the call's dynamic variables */
  ownerName?: string | null;
  /** AI agent name used in the call */
  agentName?: string | null;
}

export interface CleanTranscriptInput {
  /** The raw transcript text to clean */
  transcript: string;
  /** Optional clinic name for context-aware corrections */
  clinicName?: string | null;
  /** Optional call-specific context (pet name, owner name, etc.) */
  callContext?: CallContext | null;
  /** Optional additional terms that should be preserved/corrected */
  knowledgeBase?: {
    /** Hospital/clinic names that might be misspelled */
    hospitalNames?: string[];
    /** Doctor/staff names that might be misspelled */
    staffNames?: string[];
    /** Common pet names at this clinic */
    petNames?: string[];
    /** Any other terms to preserve exactly */
    customTerms?: string[];
  };
}

export interface CleanTranscriptOutput {
  /** The cleaned transcript */
  cleanedTranscript: string;
  /** Whether any changes were made */
  wasModified: boolean;
}

/**
 * Clean up a transcript using AI to fix transcription errors
 *
 * This is a CORRECTION-ONLY tool. It fixes mishearings and misspellings
 * but does NOT remove, rephrase, or add content. The cleaned transcript
 * will be faithful to what was actually said.
 *
 * @param input - The transcript and optional context
 * @returns Cleaned transcript
 *
 * @example
 * ```ts
 * const result = await cleanTranscript({
 *   transcript: "AI: Thank you for calling Alam rock animal hospital...",
 *   clinicName: "Alum Rock Animal Hospital",
 *   callContext: { petName: "Bella", ownerName: "John Smith" },
 * });
 * // result.cleanedTranscript: "AI: Thank you for calling Alum Rock Animal Hospital..."
 * ```
 */
export async function cleanTranscript(
  input: CleanTranscriptInput,
): Promise<CleanTranscriptOutput> {
  const { transcript, clinicName, callContext, knowledgeBase } = input;

  if (!transcript || transcript.trim().length === 0) {
    return {
      cleanedTranscript: transcript,
      wasModified: false,
    };
  }

  // For very short transcripts, return as-is.
  // Short transcripts (e.g. from 3-second calls where the customer hung up)
  // are prone to hallucinated completions by the LLM.
  if (transcript.trim().length < 100) {
    return {
      cleanedTranscript: transcript,
      wasModified: false,
    };
  }

  try {
    const llm = getCleanupLLM();

    console.log("[CLEAN_TRANSCRIPT_AI] Processing transcript", {
      transcriptLength: transcript.length,
      hasClinicName: !!clinicName,
      hasCallContext: !!callContext,
      hasKnowledgeBase: !!knowledgeBase,
    });

    // Build extended system prompt with knowledge base if provided
    let extendedSystemPrompt = SYSTEM_PROMPT;

    if (knowledgeBase) {
      const kbLines: string[] = [];

      if (knowledgeBase.hospitalNames?.length) {
        kbLines.push(
          `Known hospital/clinic names: ${knowledgeBase.hospitalNames.join(", ")}`,
        );
      }
      if (knowledgeBase.staffNames?.length) {
        kbLines.push(
          `Known staff/doctor names: ${knowledgeBase.staffNames.join(", ")}`,
        );
      }
      if (knowledgeBase.petNames?.length) {
        kbLines.push(`Known pet names: ${knowledgeBase.petNames.join(", ")}`);
      }
      if (knowledgeBase.customTerms?.length) {
        kbLines.push(
          `Other terms to preserve: ${knowledgeBase.customTerms.join(", ")}`,
        );
      }

      if (kbLines.length > 0) {
        extendedSystemPrompt += `\n\nClinic-Specific Knowledge:\n${kbLines.join("\n")}`;
      }
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: extendedSystemPrompt,
      },
      {
        role: "user",
        content: createUserPrompt(transcript, clinicName, callContext),
      },
    ];

    const response = await llm.chat({ messages });
    const cleanedTranscript = extractTextFromResponse(response).trim();

    // Check if any changes were made (simple comparison)
    const wasModified =
      cleanedTranscript.toLowerCase().trim() !==
      transcript.toLowerCase().trim();

    console.log("[CLEAN_TRANSCRIPT_AI] Successfully cleaned transcript", {
      originalLength: transcript.length,
      cleanedLength: cleanedTranscript.length,
      wasModified,
    });

    return {
      cleanedTranscript,
      wasModified,
    };
  } catch (error) {
    const statusCode = extractApiErrorStatus(error);
    if (statusCode !== null) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown LlamaIndex API error";
      console.error("[CLEAN_TRANSCRIPT_AI] LlamaIndex API error:", {
        status: statusCode,
        message: errorMessage,
      });
      // Return original transcript on error
      return {
        cleanedTranscript: transcript,
        wasModified: false,
      };
    }

    console.error("[CLEAN_TRANSCRIPT_AI] Unexpected error:", error);
    // Return original transcript on error
    return {
      cleanedTranscript: transcript,
      wasModified: false,
    };
  }
}
