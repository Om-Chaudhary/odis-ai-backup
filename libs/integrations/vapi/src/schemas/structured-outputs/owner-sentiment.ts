/**
 * Owner Sentiment Structured Output Schema
 *
 * Captures the pet owner's emotional state and satisfaction level.
 */

import { z } from "zod";

export const OwnerSentimentSchema = z.object({
  overall_sentiment: z
    .enum([
      "very_positive",
      "positive",
      "neutral",
      "concerned",
      "frustrated",
      "upset",
    ])
    .describe("Owner's emotional state during the call"),

  satisfaction_with_care: z
    .enum([
      "very_satisfied",
      "satisfied",
      "neutral",
      "dissatisfied",
      "not_expressed",
    ])
    .optional()
    .describe("Satisfaction with clinic care"),

  engagement_level: z
    .enum(["highly_engaged", "engaged", "passive", "disengaged"])
    .optional()
    .describe("How engaged owner was in conversation"),

  specific_concerns: z
    .array(z.string())
    .optional()
    .describe("Any specific concerns or complaints"),
});

export type OwnerSentiment = z.infer<typeof OwnerSentimentSchema>;
