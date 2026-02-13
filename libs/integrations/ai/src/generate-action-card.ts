/**
 * Generate Action Card Data from Transcript
 *
 * Uses an LLM to extract action card data from inbound call transcripts.
 * Used for backfilling legacy calls that don't have VAPI structured output.
 *
 * @module integrations/ai/generate-action-card
 */

import { Anthropic } from "@llamaindex/anthropic";
import { env } from "@odis-ai/shared/env";
import type { ChatMessage } from "llamaindex";
import {
  extractApiErrorStatus,
  extractTextFromResponse,
} from "./llamaindex/utils";
import { ACTION_CARD_OUTPUT_SCHEMA } from "@odis-ai/shared/types";

/**
 * Action card data structure (matches VAPI structured output schema)
 */
export interface GeneratedActionCardData {
  card_type:
    | "scheduled"
    | "rescheduled"
    | "cancellation"
    | "emergency"
    | "callback"
    | "info";

  info_data?: {
    reason?: string;
  };

  callback_data?: {
    reason?: string;
    caller_name?: string;
    pet_name?: string;
    phone_number?: string;
  };

  emergency_data?: {
    symptoms?: string;
    er_name?: string;
    urgency_level?: "critical" | "urgent" | "monitor";
  };

  appointment_data?: {
    date?: string;
    time?: string;
    reason?: string;
    client_name?: string;
    patient_name?: string;
    reschedule_reason?: string;
    cancellation_reason?: string;
    original_appointment?: {
      date?: string;
      time?: string;
    };
  };
}

const SYSTEM_PROMPT = `You are an expert data extractor for veterinary clinic phone calls. Your task is to analyze call transcripts and extract structured action card data for the clinic dashboard.

## Schema Definition
${JSON.stringify(ACTION_CARD_OUTPUT_SCHEMA, null, 2)}

## Card Type Selection Guide

1. **scheduled** - A new appointment was booked
   - Look for: booking confirmations, appointment dates/times mentioned, "scheduled for", "appointment is set"

2. **rescheduled** - An existing appointment was moved to a new time
   - Look for: changing appointment, moving appointment, original date vs new date

3. **cancellation** - An appointment was cancelled
   - Look for: cancel, cancellation, won't be able to make it, need to cancel

4. **emergency** - Caller was referred to emergency care
   - Look for: ER referral, emergency symptoms, urgent care needed, life-threatening signs
   - Urgency levels: critical (life-threatening), urgent (same-day care needed), monitor (watch closely)

5. **callback** - Staff callback is needed
   - Look for: message taken, will have someone call back, prescription refill requests, billing questions
   - Includes: medication refills, billing inquiries, records requests, questions requiring staff follow-up

6. **info** - Caller just needed information (no action required)
   - Look for: asking about hours, pricing, services, general questions answered by AI
   - The call was purely informational with no follow-up needed

## Field Guidelines

- **reason fields**: Keep SHORT (1-6 words). Topic only, no full sentences.
  - GOOD: "Annual checkup", "Vomiting, lethargy", "Clinic hours"
  - BAD: "The owner wants to bring in their dog for an annual checkup"

- **symptoms**: Comma-separated keywords only. No articles or pronouns.
  - GOOD: "vomiting, lethargy, not eating"
  - BAD: "The dog is vomiting and seems lethargic"

- **names**: Extract exactly as mentioned. First name or full name.

- **dates/times**: Use YYYY-MM-DD for dates, HH:MM (24h) for times.

## Output Format

Return ONLY valid JSON matching the schema. No explanations, no markdown code blocks, no extra text.
If you cannot determine a field value, omit it entirely (don't use null or empty string).`;

function createUserPrompt(
  transcript: string,
  callSummary?: string | null,
): string {
  let prompt = "Extract action card data from this call:\n\n";
  prompt += `## Transcript\n${transcript}\n\n`;

  if (callSummary) {
    prompt += `## Call Summary\n${callSummary}\n\n`;
  }

  prompt += "Return ONLY the JSON object.";

  return prompt;
}

/**
 * Get LLM instance for action card generation
 * Uses Haiku model for fast, cost-effective processing
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
    temperature: 0.1, // Low temperature for consistent extraction
    maxTokens: 1024, // Action card data is small
  });
}

export interface GenerateActionCardInput {
  /** The call transcript to analyze */
  transcript: string;
  /** Optional call summary for additional context */
  callSummary?: string | null;
}

export interface GenerateActionCardOutput {
  /** The generated action card data */
  actionCardData: GeneratedActionCardData | null;
  /** Whether generation was successful */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Generate action card data from a call transcript using LLM
 *
 * Used to backfill legacy inbound calls that don't have VAPI structured output.
 *
 * @param input - The transcript and optional call summary
 * @returns Generated action card data or error
 *
 * @example
 * ```ts
 * const result = await generateActionCardFromTranscript({
 *   transcript: "AI: Thank you for calling... User: I need to schedule...",
 *   callSummary: "Caller scheduled annual checkup for Max",
 * });
 *
 * if (result.success) {
 *   console.log(result.actionCardData);
 *   // { card_type: "scheduled", appointment_data: { patient_name: "Max", ... } }
 * }
 * ```
 */
export async function generateActionCardFromTranscript(
  input: GenerateActionCardInput,
): Promise<GenerateActionCardOutput> {
  const { transcript, callSummary } = input;

  if (!transcript || transcript.trim().length === 0) {
    return {
      actionCardData: null,
      success: false,
      error: "No transcript provided",
    };
  }

  // For very short transcripts, return as info
  if (transcript.trim().length < 50) {
    return {
      actionCardData: {
        card_type: "info",
        info_data: { reason: "Brief call" },
      },
      success: true,
    };
  }

  try {
    const llm = getExtractionLLM();

    console.log("[GENERATE_ACTION_CARD] Processing transcript", {
      transcriptLength: transcript.length,
      hasCallSummary: !!callSummary,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: createUserPrompt(transcript, callSummary),
      },
    ];

    const response = await llm.chat({ messages });
    const responseText = extractTextFromResponse(response).trim();

    // Parse the JSON response
    let actionCardData: GeneratedActionCardData;
    try {
      // Remove any markdown code block markers if present
      const cleanJson = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      actionCardData = JSON.parse(cleanJson) as GeneratedActionCardData;
    } catch (parseError) {
      console.error("[GENERATE_ACTION_CARD] Failed to parse JSON response:", {
        responseText: responseText.slice(0, 200),
        error: parseError,
      });
      return {
        actionCardData: null,
        success: false,
        error: "Failed to parse LLM response as JSON",
      };
    }

    // Validate card_type is present
    if (!actionCardData.card_type) {
      return {
        actionCardData: null,
        success: false,
        error: "LLM response missing required card_type field",
      };
    }

    console.log("[GENERATE_ACTION_CARD] Successfully generated action card", {
      cardType: actionCardData.card_type,
      hasAppointmentData: !!actionCardData.appointment_data,
      hasEmergencyData: !!actionCardData.emergency_data,
      hasCallbackData: !!actionCardData.callback_data,
      hasInfoData: !!actionCardData.info_data,
    });

    return {
      actionCardData,
      success: true,
    };
  } catch (error) {
    const statusCode = extractApiErrorStatus(error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (statusCode !== null) {
      console.error("[GENERATE_ACTION_CARD] API error:", {
        status: statusCode,
        message: errorMessage,
      });
    } else {
      console.error("[GENERATE_ACTION_CARD] Unexpected error:", error);
    }

    return {
      actionCardData: null,
      success: false,
      error: `LLM API error: ${errorMessage}`,
    };
  }
}
