/**
 * Sentiment Analysis Utilities
 *
 * Extracts sentiment information from VAPI analysis data.
 *
 * @module vapi/webhooks/utils/sentiment-analyzer
 */

import type { VapiAnalysis } from "../types";

/**
 * Sentiment types
 */
export type Sentiment = "positive" | "neutral" | "negative";

/**
 * Extract sentiment from analysis data
 *
 * @param analysis - VAPI analysis object
 * @returns Detected sentiment
 */
export function extractSentiment(analysis?: VapiAnalysis): Sentiment {
  if (!analysis?.successEvaluation) return "neutral";

  const evalLower = analysis.successEvaluation.toLowerCase();

  if (evalLower.includes("success") || evalLower.includes("positive")) {
    return "positive";
  }

  if (evalLower.includes("fail") || evalLower.includes("negative")) {
    return "negative";
  }

  return "neutral";
}

/**
 * Map sentiment to a numeric score
 *
 * @param sentiment - Sentiment type
 * @returns Numeric score (-1 to 1)
 */
export function sentimentToScore(sentiment: Sentiment): number {
  switch (sentiment) {
    case "positive":
      return 1;
    case "negative":
      return -1;
    default:
      return 0;
  }
}

/**
 * Map numeric score to sentiment type
 *
 * @param score - Numeric score (-1 to 1)
 * @returns Sentiment type
 */
export function scoreToSentiment(score: number): Sentiment {
  if (score > 0.3) return "positive";
  if (score < -0.3) return "negative";
  return "neutral";
}
