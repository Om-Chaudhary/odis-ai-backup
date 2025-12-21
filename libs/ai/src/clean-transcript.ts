/**
 * AI Transcript Cleanup
 *
 * Uses a small LLM to clean up speech-to-text transcription errors
 * with veterinary domain knowledge and optional clinic-specific context.
 */

import { Anthropic } from "@llamaindex/anthropic";
import { env } from "@odis-ai/env";
import type { ChatMessage } from "llamaindex";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";

/**
 * Common transcription error patterns in veterinary context
 * These serve as examples for the LLM to learn the pattern
 * Optimized for Vapi/Deepgram transcription output
 */
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

### Number/Phone Formatting
- "one two three four" in phone context → format as phone number when obvious
- Preserve spoken numbers naturally otherwise

### Speaker Diarization Artifacts
- "[inaudible]" → keep as-is (indicates unclear audio)
- "[crosstalk]" → keep as-is (indicates overlapping speech)
- Remove isolated single-word fragments that don't contribute meaning
`;

const SYSTEM_PROMPT = `You are an expert transcript editor specializing in veterinary clinic phone calls transcribed by Vapi/Deepgram. Your task is to clean up speech-to-text transcription errors while preserving the exact meaning and flow of the conversation.

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

### DO NOT:
1. Change the meaning or intent of what was said
2. Add information that wasn't in the original
3. Summarize or shorten the conversation
4. Remove meaningful pauses indicated by "..." 
5. Change speaker attribution
6. Over-correct casual speech that's grammatically correct
7. Remove emotional expressions or emphasis ("Oh!", "Wow", "Great!")

### Output Format
Output ONLY the cleaned transcript text. No explanations, headers, or JSON wrapping.
Each speaker turn should start on a new line with the speaker label (e.g., "AI:", "User:").`;

function createUserPrompt(
  transcript: string,
  clinicName?: string | null,
): string {
  let prompt = "";

  if (clinicName) {
    prompt += `Clinic Context: This call is for "${clinicName}". Correct any misspellings of this clinic name.\n\n`;
  }

  prompt += `Clean up this transcript:\n\n${transcript}`;

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
    temperature: 0.1, // Low temperature for consistent corrections
    maxTokens: 8192, // Allow for long transcripts
  });
}

export interface CleanTranscriptInput {
  /** The raw transcript text to clean */
  transcript: string;
  /** Optional clinic name for context-aware corrections */
  clinicName?: string | null;
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
 * @param input - The transcript and optional context
 * @returns Cleaned transcript
 *
 * @example
 * ```ts
 * const result = await cleanTranscript({
 *   transcript: "AI: Thank you for calling Alam rock animal hospital...",
 *   clinicName: "Alum Rock Animal Hospital",
 * });
 * // result.cleanedTranscript: "AI: Thank you for calling Alum Rock Animal Hospital..."
 * ```
 */
export async function cleanTranscript(
  input: CleanTranscriptInput,
): Promise<CleanTranscriptOutput> {
  const { transcript, clinicName, knowledgeBase } = input;

  if (!transcript || transcript.trim().length === 0) {
    return {
      cleanedTranscript: transcript,
      wasModified: false,
    };
  }

  // For very short transcripts, return as-is
  if (transcript.trim().length < 20) {
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
        content: createUserPrompt(transcript, clinicName),
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
