/**
 * Call Outcome Structured Output Schema
 *
 * Captures how the call concluded and key conversation metrics.
 */

import { z } from "zod";

export const CallOutcomeSchema = z.object({
  call_outcome: z
    .enum([
      "successful_connection",
      "voicemail_left",
      "no_answer",
      "wrong_number",
      "callback_requested",
      "transferred",
      "hung_up",
    ])
    .describe("The final outcome of the call"),

  conversation_stage: z
    .enum([
      "greeting",
      "verification",
      "main_content",
      "closing",
      "premature_end",
    ])
    .describe("Where in the conversation the call ended"),

  owner_availability: z
    .enum(["available_engaged", "available_brief", "busy", "unavailable"])
    .optional()
    .describe("Owner's availability during the call"),

  key_topics_discussed: z
    .array(z.string())
    .optional()
    .describe("Main topics covered during the call"),
});

export type CallOutcome = z.infer<typeof CallOutcomeSchema>;
