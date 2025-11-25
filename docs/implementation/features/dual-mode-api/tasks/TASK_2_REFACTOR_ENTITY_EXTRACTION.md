# Task 2: Refactor Entity Extraction to LlamaIndex

## Objective

Replace direct Anthropic SDK calls in entity extraction with LlamaIndex, maintaining identical functionality. This task depends on Task 1 (LlamaIndex Foundation).

## Context

### Current Implementation

**File:** `src/lib/ai/normalize-scribe.ts` (370 lines)

**Main Function:** `extractEntities()` (lines 145-222)

- Uses: `anthropic.messages.create()` with system prompt and user message
- Response parsing: Extracts text content, cleans JSON, validates with Zod schema
- Current model: `claude-haiku-4-5-20251001`, temperature: 0.1, maxTokens: 4096

**Key Details:**

- System prompt: Lines 49-124 (extensive veterinary entity extraction instructions)
- User prompt: `createUserPrompt()` function (lines 126-136)
- Response format: JSON that must be parsed and validated
- Validation: Uses `NormalizedEntitiesSchema` from `~/lib/validators/scribe`
- Error handling: Handles `Anthropic.APIError`, validation errors, parsing errors
- Retry logic: `extractEntitiesWithRetry()` (lines 279-322) with exponential backoff

**Function Signature:**

```typescript
export async function extractEntities(
  input: string,
  inputType?: string,
): Promise<NormalizedEntities>;
```

**Dependencies:**

- `~/lib/validators/scribe` - NormalizedEntitiesSchema
- `~/env` - ANTHROPIC_API_KEY
- `@anthropic-ai/sdk` - Current Anthropic client

## Implementation Steps

### 1. Update Imports

**File:** `src/lib/ai/normalize-scribe.ts`

**Remove:**

```typescript
import Anthropic from "@anthropic-ai/sdk";
```

**Add:**

```typescript
import { getEntityExtractionLLM } from "~/lib/llamaindex/config";
import type { ChatMessage } from "llamaindex";
```

### 2. Remove Anthropic Client Function

**Remove or comment out:**

- `getAnthropicClient()` function (lines 30-40)
- `ANTHROPIC_MODEL`, `MAX_TOKENS`, `TEMPERATURE` constants (lines 22-24) - these are now in config

### 3. Refactor `extractEntities()` Function

**Replace the Anthropic call (lines 156-169) with LlamaIndex:**

**Current code:**

```typescript
const anthropic = getAnthropicClient();

const response = await anthropic.messages.create({
  model: ANTHROPIC_MODEL,
  max_tokens: MAX_TOKENS,
  temperature: TEMPERATURE,
  system: SYSTEM_PROMPT,
  messages: [
    {
      role: "user",
      content: createUserPrompt(input, inputType),
    },
  ],
});
```

**New code:**

```typescript
const llm = getEntityExtractionLLM();

const messages: ChatMessage[] = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
  {
    role: "user",
    content: createUserPrompt(input, inputType),
  },
];

const response = await llm.chat({ messages });
```

### 4. Update Response Parsing

**Current code (lines 171-190):**

````typescript
const content = response.content[0];
if (!content || content.type !== "text") {
  throw new Error("Unexpected response type from Claude API");
}

// Parse JSON response
let parsedResponse: unknown;
try {
  const cleanedText = content.text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  parsedResponse = JSON.parse(cleanedText);
} catch (parseError) {
  // ... error handling
}
````

**New code:**

````typescript
// LlamaIndex returns response.message.content directly
const responseText = response.message.content;

// Parse JSON response
let parsedResponse: unknown;
try {
  const cleanedText = responseText
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  parsedResponse = JSON.parse(cleanedText);
} catch (parseError) {
  // ... keep existing error handling
}
````

### 5. Update Retry Logic Error Handling

**File:** `extractEntitiesWithRetry()` function (lines 279-322)

**Current error checking:**

```typescript
if (error instanceof Anthropic.APIError) {
  // ... retry logic
}
```

**Update to:**

- Check for LlamaIndex-specific error types if they exist
- Or use generic Error checking with error message matching
- Keep retry conditions: 429, 500, 503 status codes
- Keep exponential backoff logic unchanged

**Note:** You may need to check LlamaIndex error types. If LlamaIndex wraps Anthropic errors, you might need to check `error.cause` or similar.

### 6. Preserve All Existing Behavior

**DO NOT CHANGE:**

- System prompt (lines 49-124) - Keep exactly as is
- User prompt function (lines 126-136) - Keep exactly as is
- JSON parsing and cleaning logic - Keep exactly as is
- Zod validation - Keep exactly as is
- Error messages - Keep exactly as is
- Retry logic behavior - Keep exactly as is
- Function signature - Must remain identical
- Return type - Must remain identical

## Success Criteria

- ✅ Function signature unchanged: `extractEntities(input: string, inputType?: string): Promise<NormalizedEntities>`
- ✅ All existing behavior preserved (prompts, parsing, validation, retry)
- ✅ Response format identical to current implementation
- ✅ Error handling preserved (may need to adapt error type checking)
- ✅ Retry logic works correctly
- ✅ No breaking changes to callers

## Testing

### Test Cases

1. **Basic extraction:**

   ```typescript
   const result = await extractEntities(
     "Patient: Max, Dog, 5 years old. Owner: John Smith",
   );
   // Should return NormalizedEntities with patient and owner info
   ```

2. **With input type:**

   ```typescript
   const result = await extractEntities(text, "soap_note");
   // Should work identically to before
   ```

3. **Error handling:**
   - Test with invalid input (too short)
   - Test with API errors (if possible to simulate)
   - Test retry logic triggers

4. **Response format:**
   - Verify JSON structure matches exactly
   - Verify all fields are present
   - Verify validation passes

### Comparison Test

Run the same input through both old and new implementations (if possible) and compare outputs. They should be identical.

## Files to Modify

- `src/lib/ai/normalize-scribe.ts` - Main refactoring

## Files to Reference

- `src/lib/llamaindex/config.ts` - LlamaIndex configuration (from Task 1)
- `src/lib/validators/scribe.ts` - NormalizedEntitiesSchema
- LlamaIndex documentation for `ChatMessage` type and `llm.chat()` method

## Notes

- **Critical:** This refactoring must produce IDENTICAL results to the current implementation
- If LlamaIndex response format differs, adapt parsing accordingly but maintain output format
- Test thoroughly - entity extraction is a critical function
- Keep all helper functions unchanged (`analyzeExtractionQuality`, `createExtractionSummary`, etc.)

## Potential Issues & Solutions

1. **Error Type Mismatch:**
   - If `Anthropic.APIError` doesn't exist in LlamaIndex, check error structure
   - May need to check `error.cause` or error message patterns

2. **Response Format Differences:**
   - LlamaIndex may return response in different format
   - Check `response.message.content` structure
   - Adapt parsing but maintain output format

3. **Model Configuration:**
   - Verify that `getEntityExtractionLLM()` returns correctly configured instance
   - Temperature, maxTokens should match exactly
