# Task 1: LlamaIndex Foundation Setup

## Objective

Install LlamaIndex dependencies and create central configuration for LLM abstraction layer. This is a foundational task that must complete before other AI refactoring tasks.

## Context

### Current Implementation

- Direct Anthropic SDK calls in:
  - `src/lib/ai/normalize-scribe.ts` (entity extraction)
  - `src/lib/ai/generate-discharge.ts` (discharge summary generation)
- Environment variables managed via `src/env.js` (t3-oss/env-nextjs)
- Current models:
  - Entity extraction: `claude-haiku-4-5-20251001` (temperature: 0.1, maxTokens: 4096)
  - Discharge summary: `claude-sonnet-4-20250514` (temperature: 0.3, maxTokens: 4000)

### Key Files to Review

- `src/env.js` - Environment variable schema (ANTHROPIC_API_KEY is optional)
- `src/lib/ai/normalize-scribe.ts` - Lines 11-40 show current Anthropic client setup
- `src/lib/ai/generate-discharge.ts` - Lines 9-35 show current Anthropic client setup

## Implementation Steps

### 1. Install Dependencies

```bash
pnpm add llamaindex @llamaindex/anthropic
```

### 2. Create LlamaIndex Configuration File

**File:** `src/lib/llamaindex/config.ts`

Create a configuration file that exports three functions:

```typescript
import { Anthropic } from "@llamaindex/anthropic";
import { Settings } from "llamaindex";
import { env } from "~/env";

/**
 * Initialize LlamaIndex with default LLM configuration
 * Call this once on app startup
 */
export function initializeLlamaIndex() {
  Settings.llm = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-sonnet-4-20250514", // Default for summaries
  });
}

/**
 * Get LLM instance for entity extraction
 * Uses Haiku model with low temperature for consistent extraction
 */
export function getEntityExtractionLLM() {
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
 */
export function getDischargeSummaryLLM() {
  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-sonnet-4-20250514",
    temperature: 0.3,
    maxTokens: 4000,
  });
}
```

**Important Notes:**

- Use `env.ANTHROPIC_API_KEY` from `~/env` (not `process.env` directly)
- Match existing model configurations exactly
- Handle case where `ANTHROPIC_API_KEY` might be undefined (check `src/env.js` schema)

### 3. Initialize LlamaIndex on App Startup

**File:** `src/lib/llamaindex/init.ts` (or add to existing initialization)

Create an initialization file that calls `initializeLlamaIndex()`:

```typescript
import { initializeLlamaIndex } from "./config";

// Initialize LlamaIndex on module load (server-side only)
if (typeof window === "undefined") {
  initializeLlamaIndex();
}
```

**Alternative:** If there's an existing app initialization file (e.g., `src/app/layout.tsx` or similar), add the initialization call there instead.

**Check for existing initialization patterns:**

- Look for `src/app/layout.tsx` or similar root layout files
- Check if there's a `src/lib/init.ts` or similar
- Follow existing patterns for server-side initialization

### 4. Update Environment Variables Documentation

**File:** `.env.example` (if it exists)

Add a comment section for AI configuration:

```bash
# AI Configuration (LlamaIndex)
ANTHROPIC_API_KEY=your_api_key_here
```

**Note:** The `ANTHROPIC_API_KEY` is already defined in `src/env.js` as optional, so this is just documentation.

## Success Criteria

- ✅ LlamaIndex packages installed (`llamaindex` and `@llamaindex/anthropic`)
- ✅ Configuration file created at `src/lib/llamaindex/config.ts` with all three functions
- ✅ Model configurations match existing exactly:
  - Entity extraction: Haiku, temp 0.1, maxTokens 4096
  - Discharge summary: Sonnet, temp 0.3, maxTokens 4000
- ✅ Initialization function called on app startup (server-side only)
- ✅ No breaking changes to existing code
- ✅ Proper error handling if API key is missing

## Testing

1. Verify imports work:
   ```typescript
   import {
     getEntityExtractionLLM,
     getDischargeSummaryLLM,
   } from "~/lib/llamaindex/config";
   ```
2. Test that LLM instances can be created (don't need to call API yet):
   ```typescript
   const llm = getEntityExtractionLLM();
   // Should not throw error
   ```
3. Verify initialization runs on server startup (check console/logs)

## Files to Create

- `src/lib/llamaindex/config.ts` - Configuration file
- `src/lib/llamaindex/init.ts` - Initialization file (or add to existing)

## Files to Review

- `src/env.js` - Check ANTHROPIC_API_KEY schema
- `src/lib/ai/normalize-scribe.ts` - Understand current Anthropic usage
- `src/lib/ai/generate-discharge.ts` - Understand current Anthropic usage
- `src/app/layout.tsx` or similar - Check for existing initialization patterns

## Notes

- This task must complete before Tasks 2 and 3 (AI refactoring)
- Keep configuration simple - no RAG features yet
- Focus on establishing the abstraction layer foundation
- Match existing code style and patterns
