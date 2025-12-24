/**
 * AI Transcript Translation
 *
 * Detects language and translates non-English transcripts to English,
 * plus generates an English summary.
 */

import { Anthropic } from "@llamaindex/anthropic";
import { env } from "@odis-ai/shared/env";
import type { ChatMessage } from "llamaindex";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";

const SYSTEM_PROMPT = `You are a multilingual veterinary call transcript translator and summarizer. Your role is to:

1. Detect the language of the transcript
2. If the transcript is not in English, translate it to natural, fluent English
3. Generate a concise summary of the call (2-3 sentences)

You MUST respond with valid JSON in this exact format:
{
  "originalLanguage": "the detected language name in English (e.g., 'Spanish', 'English', 'French')",
  "translatedTranscript": "the full transcript translated to English (or the original if already English)",
  "summary": "a 2-3 sentence summary of what happened in the call",
  "wasTranslated": true or false (whether translation was needed)
}

Translation guidelines:
- Preserve speaker labels (AI:, User:, etc.)
- Maintain the conversational tone
- Translate idioms to their English equivalents
- Keep proper nouns (names, places) unchanged
- Preserve any medical/veterinary terminology accurately

Summary guidelines:
- Focus on the key purpose of the call
- Mention the pet name and type if discussed
- Note any appointments scheduled or actions taken
- Keep it professional and concise`;

function createUserPrompt(transcript: string): string {
  return `Analyze, translate if needed, and summarize this veterinary call transcript:

<transcript>
${transcript}
</transcript>

Remember to respond with valid JSON only.`;
}

/**
 * Get LLM instance for translation
 * Uses Haiku model for fast, cost-effective processing
 */
function getTranslationLLM() {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured. Add it to your environment variables.",
    );
  }

  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-haiku-4-5-20251001",
    temperature: 0.1,
    maxTokens: 4096,
  });
}

export interface TranslateTranscriptInput {
  transcript: string;
}

export interface TranslateTranscriptOutput {
  originalLanguage: string;
  translatedTranscript: string;
  summary: string;
  wasTranslated: boolean;
}

/**
 * Translate a transcript to English and generate a summary
 */
export async function translateTranscript(
  input: TranslateTranscriptInput,
): Promise<TranslateTranscriptOutput> {
  const { transcript } = input;

  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Transcript is required for translation");
  }

  try {
    const llm = getTranslationLLM();

    console.log("[TRANSLATE_AI] Processing transcript", {
      transcriptLength: transcript.length,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: createUserPrompt(transcript),
      },
    ];

    const response = await llm.chat({ messages });
    const responseText = extractTextFromResponse(response);

    // Parse JSON response
    let parsed: TranslateTranscriptOutput;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = /\{[\s\S]*\}/.exec(responseText);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      parsed = JSON.parse(jsonMatch[0]) as TranslateTranscriptOutput;
    } catch (parseError) {
      console.error("[TRANSLATE_AI] Failed to parse JSON response:", {
        responseText,
        error: parseError,
      });
      // Return original transcript if parsing fails
      return {
        originalLanguage: "Unknown",
        translatedTranscript: transcript,
        summary: "Unable to generate summary.",
        wasTranslated: false,
      };
    }

    // Validate required fields
    if (
      !parsed.originalLanguage ||
      !parsed.translatedTranscript ||
      !parsed.summary
    ) {
      console.error("[TRANSLATE_AI] Missing required fields in response:", {
        parsed,
      });
      return {
        originalLanguage: parsed.originalLanguage ?? "Unknown",
        translatedTranscript: parsed.translatedTranscript ?? transcript,
        summary: parsed.summary ?? "Unable to generate summary.",
        wasTranslated: parsed.wasTranslated ?? false,
      };
    }

    console.log("[TRANSLATE_AI] Successfully processed transcript", {
      originalLanguage: parsed.originalLanguage,
      wasTranslated: parsed.wasTranslated,
      summaryLength: parsed.summary.length,
    });

    return parsed;
  } catch (error) {
    const statusCode = extractApiErrorStatus(error);
    if (statusCode !== null) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown LlamaIndex API error";
      console.error("[TRANSLATE_AI] LlamaIndex API error:", {
        status: statusCode,
        message: errorMessage,
      });
      throw new Error(`LlamaIndex API error (${statusCode}): ${errorMessage}`);
    }

    console.error("[TRANSLATE_AI] Unexpected error:", error);
    throw error;
  }
}
