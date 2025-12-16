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
 */
const COMMON_CORRECTIONS = `
Common transcription errors in veterinary calls:
- "Alam rock" → "Alum Rock" (hospital name)
- "alumrock" → "Alum Rock" (hospital name)  
- "allamrock" → "Alum Rock" (hospital name)
- "um", "uh", "like", "you know" → remove filler words
- "gonna" → "going to"
- "wanna" → "want to"
- "kinda" → "kind of"
- "gotta" → "got to"
- Repeated words: "I I want" → "I want"
- False starts: "Can you-- Can you help" → "Can you help"
- "dogtor" or "doctor" in vet context often means "doctor"
- Pet breed names are often misheard (e.g., "golden lab" vs "golden retriever", "labrador")
- Medical terms: "subcutaneous" not "sub Q taneous", "intramuscular" not "intra muscular"
`;

const SYSTEM_PROMPT = `You are an expert transcript editor specializing in veterinary clinic phone calls. Your task is to clean up speech-to-text transcription errors while preserving the exact meaning and flow of the conversation.

${COMMON_CORRECTIONS}

Guidelines:
1. Fix obvious transcription errors (misspelled proper nouns, broken words)
2. Remove unnecessary filler words (um, uh, like, you know) when they add no meaning
3. Fix repeated words and false starts
4. Preserve speaker labels exactly (AI:, User:, etc.)
5. Maintain the conversational tone - don't make it sound robotic
6. Keep contractions natural ("I'm", "don't", "can't")
7. Preserve any veterinary/medical terminology accurately
8. If a clinic name is provided, correct any misspellings of that name
9. Do NOT change the meaning or add information
10. Do NOT summarize - output the full transcript

Output ONLY the cleaned transcript. No explanations or JSON.`;

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
