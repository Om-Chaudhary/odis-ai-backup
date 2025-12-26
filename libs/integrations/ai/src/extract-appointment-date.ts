/**
 * AI Appointment Date Extraction
 *
 * Uses AI to extract appointment date/time preferences from call transcripts
 * when they weren't captured in the structured output.
 */

import { Anthropic } from "@llamaindex/anthropic";
import { env } from "@odis-ai/shared/env";
import type { ChatMessage } from "llamaindex";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";

const SYSTEM_PROMPT = `You are a date extraction assistant. Your job is to find appointment scheduling preferences from veterinary clinic phone call transcripts.

## Your Task
Extract any specific date or time the caller mentions for their preferred appointment.

## Date/Time Patterns to Look For
- Specific dates: "January 5th", "the 15th", "next Monday", "December 20"
- Relative dates: "tomorrow", "next week", "this Friday", "day after tomorrow"
- Time preferences: "in the morning", "around 2pm", "after 3", "afternoon"
- Time of day: "morning", "afternoon", "evening"

## Important Rules
1. Only extract dates/times the CALLER mentions as their preference
2. Do NOT extract dates the AI assistant suggests or confirms
3. If the caller says "any time" or "whenever", that means NO preference
4. If NO clear date/time preference is stated by the caller, return null values
5. Convert relative dates to actual dates using today's date as reference

## Output Format (JSON only, no markdown)
{
  "hasPreference": true/false,
  "date": "YYYY-MM-DD" or null,
  "time": "HH:MM" (24-hour) or null,
  "timeOfDay": "morning" | "afternoon" | "evening" | null,
  "rawMention": "the exact words the caller used" or null
}`;

function createUserPrompt(transcript: string, currentDate: string): string {
  return `Today's date is ${currentDate}.

Extract any appointment date/time preferences from this call transcript:

${transcript}

Return JSON only, no markdown.`;
}

/**
 * Get LLM instance for date extraction
 * Uses Haiku for fast, cost-effective extraction
 */
function getExtractionLLM() {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured. Add it to your environment variables.",
    );
  }

  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-haiku-4-5-20251001",
    temperature: 0.0, // Zero temperature for deterministic extraction
    maxTokens: 256, // Short response expected
  });
}

export interface ExtractedAppointmentDate {
  /** Whether the caller expressed a date/time preference */
  hasPreference: boolean;
  /** ISO date string YYYY-MM-DD if extracted */
  date: string | null;
  /** Time in HH:MM format (24-hour) if extracted */
  time: string | null;
  /** General time of day preference */
  timeOfDay: "morning" | "afternoon" | "evening" | null;
  /** The raw words the caller used */
  rawMention: string | null;
}

/**
 * Extract appointment date/time preferences from a call transcript
 *
 * @param transcript - The call transcript to analyze
 * @param referenceDate - The date to use for relative date calculations (defaults to now)
 * @returns Extracted date/time preferences or null values if no preference found
 *
 * @example
 * ```ts
 * const result = await extractAppointmentDate(
 *   "User: I'd like to come in next Tuesday if possible",
 *   new Date("2025-12-25")
 * );
 * // result: { hasPreference: true, date: "2025-12-30", time: null, ... }
 * ```
 */
export async function extractAppointmentDate(
  transcript: string,
  referenceDate: Date = new Date(),
): Promise<ExtractedAppointmentDate> {
  const noPreference: ExtractedAppointmentDate = {
    hasPreference: false,
    date: null,
    time: null,
    timeOfDay: null,
    rawMention: null,
  };

  if (!transcript || transcript.trim().length === 0) {
    return noPreference;
  }

  // Skip very short transcripts
  if (transcript.trim().length < 50) {
    return noPreference;
  }

  try {
    const llm = getExtractionLLM();

    // Format current date for context
    const currentDateStr = referenceDate.toISOString().split("T")[0];

    console.log("[EXTRACT_APPOINTMENT_DATE] Processing transcript", {
      transcriptLength: transcript.length,
      referenceDate: currentDateStr,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: createUserPrompt(transcript, currentDateStr!),
      },
    ];

    const response = await llm.chat({ messages });
    const responseText = extractTextFromResponse(response).trim();

    // Parse JSON response
    // Remove markdown code blocks if present
    const jsonStr = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(jsonStr) as {
      hasPreference?: boolean;
      date?: string | null;
      time?: string | null;
      timeOfDay?: string | null;
      rawMention?: string | null;
    };

    console.log("[EXTRACT_APPOINTMENT_DATE] Extracted date info", {
      hasPreference: parsed.hasPreference,
      date: parsed.date,
      time: parsed.time,
      rawMention: parsed.rawMention,
    });

    if (!parsed.hasPreference) {
      return noPreference;
    }

    return {
      hasPreference: true,
      date: parsed.date ?? null,
      time: parsed.time ?? null,
      timeOfDay:
        (parsed.timeOfDay as "morning" | "afternoon" | "evening") ?? null,
      rawMention: parsed.rawMention ?? null,
    };
  } catch (error) {
    const statusCode = extractApiErrorStatus(error);
    if (statusCode !== null) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown API error";
      console.error("[EXTRACT_APPOINTMENT_DATE] API error:", {
        status: statusCode,
        message: errorMessage,
      });
    } else {
      console.error("[EXTRACT_APPOINTMENT_DATE] Unexpected error:", error);
    }

    // Return no preference on error
    return noPreference;
  }
}

/**
 * Convert time of day to a default time string
 */
export function timeOfDayToTime(
  timeOfDay: "morning" | "afternoon" | "evening" | null,
): string | null {
  switch (timeOfDay) {
    case "morning":
      return "09:00";
    case "afternoon":
      return "14:00";
    case "evening":
      return "17:00";
    default:
      return null;
  }
}
