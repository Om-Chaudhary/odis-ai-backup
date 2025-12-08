import { initializeLlamaIndex } from "./config";

/**
 * Initialize LlamaIndex on module load (server-side only)
 *
 * This file automatically initializes LlamaIndex when imported on the server side.
 * The initialization sets up the default LLM configuration for all LlamaIndex operations.
 *
 * Import this file early in your app startup to ensure LlamaIndex is configured
 * before any AI operations are performed.
 */
if (typeof window === "undefined") {
  initializeLlamaIndex();
  console.log("[LlamaIndex] Initialized with Anthropic LLM");
}

export { initializeLlamaIndex };
