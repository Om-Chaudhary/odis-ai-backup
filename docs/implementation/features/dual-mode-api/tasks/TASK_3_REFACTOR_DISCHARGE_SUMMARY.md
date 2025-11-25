# Task 3: Refactor Discharge Summary Generation to LlamaIndex

## Objective

Replace direct Anthropic SDK calls in discharge summary generation with LlamaIndex, maintaining identical functionality. This task depends on Task 1 (LlamaIndex Foundation) and can run in parallel with Task 2.

## Context

### Current Implementation

**File:** `src/lib/ai/generate-discharge.ts` (367 lines)

**Main Function:** `generateDischargeSummary()` (lines 256-319)

- Uses: `anthropic.messages.create()` with system prompt and user message
- Response: Plain text discharge summary (trimmed)
- Current model: `claude-sonnet-4-20250514`, temperature: 0.3, maxTokens: 4000

**Key Details:**

- System prompt: Lines 41-65 (OdisAI veterinary discharge instruction generator)
- User prompt: `createUserPrompt()` function (lines 198-243)
  - Handles SOAP content OR entity extraction
  - Includes patient data
  - Includes optional template instructions
- Input interface: `GenerateDischargeSummaryInput` (lines 249-254)
- Response: Plain text (not JSON), trimmed
- Retry logic: `generateDischargeSummaryWithRetry()` (lines 325-366)

**Function Signature:**

```typescript
export async function generateDischargeSummary(
  input: GenerateDischargeSummaryInput,
): Promise<string>;
```

**Input Interface:**

```typescript
export interface GenerateDischargeSummaryInput {
  soapContent?: string | null;
  entityExtraction?: NormalizedEntities | null;
  patientData?: PatientData | null;
  template?: string;
}
```

**Dependencies:**

- `~/lib/validators/scribe` - NormalizedEntities type
- `~/env` - ANTHROPIC_API_KEY
- `@anthropic-ai/sdk` - Current Anthropic client

## Implementation Steps

### 1. Update Imports

**File:** `src/lib/ai/generate-discharge.ts`

**Remove:**

```typescript
import Anthropic from "@anthropic-ai/sdk";
```

**Add:**

```typescript
import { getDischargeSummaryLLM } from "~/lib/llamaindex/config";
import type { ChatMessage } from "llamaindex";
```

### 2. Remove Anthropic Client Function

**Remove or comment out:**

- `getAnthropicClient()` function (lines 25-35)
- `ANTHROPIC_MODEL`, `MAX_TOKENS`, `TEMPERATURE` constants (lines 17-19) - these are now in config

### 3. Refactor `generateDischargeSummary()` Function

**Replace the Anthropic call (lines 269-293) with LlamaIndex:**

**Current code:**

```typescript
const anthropic = getAnthropicClient();

console.log("[DISCHARGE_AI] Generating discharge summary", {
  hasSoapContent: !!soapContent,
  hasEntityExtraction: !!entityExtraction,
  hasTemplate: !!template,
});

const response = await anthropic.messages.create({
  model: ANTHROPIC_MODEL,
  max_tokens: MAX_TOKENS,
  temperature: TEMPERATURE,
  system: SYSTEM_PROMPT,
  messages: [
    {
      role: "user",
      content: createUserPrompt(
        soapContent ?? null,
        entityExtraction ?? null,
        patientData ?? null,
        template,
      ),
    },
  ],
});
```

**New code:**

```typescript
const llm = getDischargeSummaryLLM();

console.log("[DISCHARGE_AI] Generating discharge summary", {
  hasSoapContent: !!soapContent,
  hasEntityExtraction: !!entityExtraction,
  hasTemplate: !!template,
});

const messages: ChatMessage[] = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
  {
    role: "user",
    content: createUserPrompt(
      soapContent ?? null,
      entityExtraction ?? null,
      patientData ?? null,
      template,
    ),
  },
];

const response = await llm.chat({ messages });
```

### 4. Update Response Extraction

**Current code (lines 295-304):**

```typescript
const content = response.content[0];
if (!content || content.type !== "text") {
  throw new Error("Unexpected response type from Claude API");
}

console.log("[DISCHARGE_AI] Successfully generated discharge summary", {
  contentLength: content.text.length,
});

return content.text.trim();
```

**New code:**

```typescript
// LlamaIndex returns response.message.content directly
const summaryText = response.message.content;

console.log("[DISCHARGE_AI] Successfully generated discharge summary", {
  contentLength: summaryText.length,
});

return summaryText.trim();
```

### 5. Update Retry Logic Error Handling

**File:** `generateDischargeSummaryWithRetry()` function (lines 325-366)

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

- System prompt (lines 41-65) - Keep exactly as is
- User prompt function (lines 198-243) - Keep exactly as is
- Input validation (lines 262-266) - Keep exactly as is
- Error messages - Keep exactly as is
- Retry logic behavior - Keep exactly as is
- Function signature - Must remain identical
- Return type - Must remain identical (plain string)

## Success Criteria

- ✅ Function signature unchanged: `generateDischargeSummary(input: GenerateDischargeSummaryInput): Promise<string>`
- ✅ All existing behavior preserved (prompts, validation, retry)
- ✅ Response format identical (plain text discharge summary)
- ✅ Error handling preserved (may need to adapt error type checking)
- ✅ Retry logic works correctly
- ✅ No breaking changes to callers

## Testing

### Test Cases

1. **With SOAP content:**

   ```typescript
   const result = await generateDischargeSummary({
     soapContent: "S: Patient presents with...",
     patientData: { name: "Max", species: "dog" },
   });
   // Should return plain text discharge summary
   ```

2. **With entity extraction:**

   ```typescript
   const result = await generateDischargeSummary({
     entityExtraction: normalizedEntities,
     patientData: { name: "Max", species: "dog" },
   });
   // Should return plain text discharge summary
   ```

3. **With template:**

   ```typescript
   const result = await generateDischargeSummary({
     soapContent: "...",
     template: "Use this format: ...",
   });
   // Should follow template instructions
   ```

4. **Error handling:**
   - Test with no data sources (should throw error)
   - Test with API errors (if possible to simulate)
   - Test retry logic triggers

5. **Response format:**
   - Verify plain text output (not JSON)
   - Verify content is trimmed
   - Verify content matches expected format

### Comparison Test

Run the same input through both old and new implementations (if possible) and compare outputs. They should be identical.

## Files to Modify

- `src/lib/ai/generate-discharge.ts` - Main refactoring

## Files to Reference

- `src/lib/llamaindex/config.ts` - LlamaIndex configuration (from Task 1)
- `src/lib/validators/scribe.ts` - NormalizedEntities type
- LlamaIndex documentation for `ChatMessage` type and `llm.chat()` method

## Notes

- **Critical:** This refactoring must produce IDENTICAL results to the current implementation
- Response is plain text, not JSON - simpler than entity extraction
- Test thoroughly - discharge summary generation is a critical function
- Keep all helper functions unchanged

## Potential Issues & Solutions

1. **Error Type Mismatch:**
   - If `Anthropic.APIError` doesn't exist in LlamaIndex, check error structure
   - May need to check `error.cause` or error message patterns

2. **Response Format Differences:**
   - LlamaIndex may return response in different format
   - Check `response.message.content` structure
   - Should be plain text string

3. **Model Configuration:**
   - Verify that `getDischargeSummaryLLM()` returns correctly configured instance
   - Temperature, maxTokens should match exactly (Sonnet, temp 0.3, maxTokens 4000)

4. **Input Validation:**
   - Keep the check that requires either `soapContent` or `entityExtraction`
   - This validation is important for preventing errors
