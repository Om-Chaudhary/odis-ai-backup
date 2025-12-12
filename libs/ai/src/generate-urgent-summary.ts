/**
 * AI Urgent Case Summary Generation
 *
 * Analyzes call transcripts to extract why a case was flagged as urgent.
 */

import { Anthropic } from "@llamaindex/anthropic";
import { env } from "@odis-ai/env";
import type { ChatMessage } from "llamaindex";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";

const SYSTEM_PROMPT = `You are an expert veterinary call analyst. Your role is to analyze discharge call transcripts and identify why a case was flagged as requiring urgent clinic attention.

Requirements:
- Be concise: 1-2 sentences maximum
- Focus on the specific concern or issue identified
- Explain why this requires immediate clinic attention
- Use professional but accessible language

Output format:
A brief summary of the urgent concern, written as if explaining to a clinic staff member why they should review this case.`;

function createUserPrompt(transcript: string): string {
  return `Analyze this veterinary discharge call transcript. The AI agent flagged this as an urgent case requiring clinic review.

Extract and summarize in 1-2 sentences:
- What specific concern or issue was identified
- Why this requires immediate clinic attention

<transcript>
${transcript}
</transcript>

Provide only the summary, no preamble or explanation.`;
}

/**
 * Get LLM instance for urgent summary generation
 * Uses Haiku model for fast, cost-effective analysis
 */
function getUrgentSummaryLLM() {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured. Add it to your environment variables.",
    );
  }

  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-haiku-4-5-20251001",
    temperature: 0.2,
    maxTokens: 256,
  });
}

export interface GenerateUrgentSummaryInput {
  transcript: string;
}

/**
 * Generate a summary explaining why a call was flagged as urgent
 */
export async function generateUrgentSummary(
  input: GenerateUrgentSummaryInput,
): Promise<string> {
  const { transcript } = input;

  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Transcript is required to generate urgent summary");
  }

  try {
    const llm = getUrgentSummaryLLM();

    console.log("[URGENT_SUMMARY_AI] Generating urgent case summary", {
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
    const summaryText = extractTextFromResponse(response);

    console.log("[URGENT_SUMMARY_AI] Successfully generated urgent summary", {
      summaryLength: summaryText.length,
    });

    return summaryText.trim();
  } catch (error) {
    const statusCode = extractApiErrorStatus(error);
    if (statusCode !== null) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown LlamaIndex API error";
      console.error("[URGENT_SUMMARY_AI] LlamaIndex API error:", {
        status: statusCode,
        message: errorMessage,
      });
      throw new Error(`LlamaIndex API error (${statusCode}): ${errorMessage}`);
    }

    console.error("[URGENT_SUMMARY_AI] Unexpected error:", error);
    throw error;
  }
}
