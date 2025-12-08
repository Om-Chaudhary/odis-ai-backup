import { Anthropic } from "@llamaindex/anthropic";
import { Settings } from "llamaindex";
import { env } from "~/env";

/**
 * Initialize LlamaIndex with default LLM configuration
 * Call this once on app startup
 *
 * Sets the default LLM for LlamaIndex to Anthropic's Claude Sonnet model.
 * Individual functions can override this with specific model configurations.
 */
export function initializeLlamaIndex() {
  if (!env.ANTHROPIC_API_KEY) {
    console.warn(
      "ANTHROPIC_API_KEY not configured. LlamaIndex will not function properly.",
    );
    return;
  }

  Settings.llm = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-sonnet-4-20250514", // Default for summaries
  });
}

/**
 * Get LLM instance for entity extraction
 * Uses Haiku model with low temperature for consistent extraction
 *
 * Configuration:
 * - Model: claude-haiku-4-5-20251001 (fast, cost-effective)
 * - Temperature: 0.1 (very low for consistency)
 * - Max Tokens: 4096
 */
export function getEntityExtractionLLM() {
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

/**
 * Get LLM instance for discharge summary generation
 * Uses Sonnet model with moderate temperature for natural language
 *
 * Configuration:
 * - Model: claude-sonnet-4-20250514 (balanced quality/cost)
 * - Temperature: 0.3 (moderate for natural language)
 * - Max Tokens: 4000
 */
export function getDischargeSummaryLLM() {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured. Add it to your environment variables.",
    );
  }

  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-sonnet-4-20250514",
    temperature: 0.3,
    maxTokens: 4000,
  });
}
