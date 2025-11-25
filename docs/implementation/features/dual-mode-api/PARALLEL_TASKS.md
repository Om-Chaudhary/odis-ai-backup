# Parallel Implementation Tasks for Dual-Mode API Architecture

This document breaks down the implementation plan into parallelizable tasks that can be assigned to different Cursor agents.

## Overview

The plan implements:

1. **LlamaIndex Foundation** - Replace direct Anthropic SDK with LlamaIndex abstraction
2. **Orchestration Architecture** - New unified endpoint for multi-step workflows
3. **Backward Compatibility** - All existing endpoints remain functional

---

## Task 1: LlamaIndex Foundation Setup

**Priority:** HIGH (blocks other tasks)  
**Estimated Time:** 30 minutes  
**Dependencies:** None  
**Can Run In Parallel With:** None (must complete first)

### Objective

Install LlamaIndex dependencies and create central configuration for LLM abstraction layer.

### Context

**Current Implementation:**

- Direct Anthropic SDK calls in:
  - `src/lib/ai/normalize-scribe.ts` (entity extraction)
  - `src/lib/ai/generate-discharge.ts` (discharge summary generation)
- Environment variables managed via `src/env.js` (t3-oss/env-nextjs)
- Current models:
  - Entity extraction: `claude-haiku-4-5-20251001` (temperature: 0.1, maxTokens: 4096)
  - Discharge summary: `claude-sonnet-4-20250514` (temperature: 0.3, maxTokens: 4000)

**Key Files:**

- `src/env.js` - Environment variable schema (ANTHROPIC_API_KEY is optional)
- `src/lib/ai/normalize-scribe.ts` - Entity extraction (lines 11-40 show current Anthropic client setup)
- `src/lib/ai/generate-discharge.ts` - Discharge generation (lines 9-35 show current Anthropic client setup)

### Implementation Steps

1. **Install Dependencies**

   ```bash
   pnpm add llamaindex @llamaindex/anthropic
   ```

2. **Create LlamaIndex Configuration**
   - File: `src/lib/llamaindex/config.ts`
   - Export functions:
     - `initializeLlamaIndex()` - Sets up default LLM (Sonnet for summaries)
     - `getEntityExtractionLLM()` - Returns Haiku instance for entity extraction
     - `getDischargeSummaryLLM()` - Returns Sonnet instance for discharge summaries
   - Use `env.ANTHROPIC_API_KEY` from `~/env`
   - Match existing model configurations exactly

3. **Initialize on App Startup**
   - File: `src/lib/llamaindex/init.ts` (or add to existing initialization)
   - Call `initializeLlamaIndex()` once on server startup
   - Check if there's an existing app initialization file

4. **Update Environment Variables**
   - File: `.env.example` (if exists)
   - Add comment: `# AI Configuration (LlamaIndex)`
   - Note: `ANTHROPIC_API_KEY` already exists in `src/env.js`

### Success Criteria

- ✅ LlamaIndex packages installed
- ✅ Configuration file created with all three functions
- ✅ Model configurations match existing (Haiku for entities, Sonnet for summaries)
- ✅ Initialization function called on app startup
- ✅ No breaking changes to existing code

### Testing

- Verify imports work: `import { getEntityExtractionLLM } from "~/lib/llamaindex/config"`
- Test that LLM instances can be created (don't need to call API yet)

---

## Task 2: Refactor Entity Extraction to LlamaIndex

**Priority:** HIGH  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 1 (LlamaIndex Foundation)  
**Can Run In Parallel With:** Task 3

### Objective

Replace direct Anthropic SDK calls in entity extraction with LlamaIndex, maintaining identical functionality.

### Context

**Current Implementation:**

- File: `src/lib/ai/normalize-scribe.ts` (370 lines)
- Main function: `extractEntities()` (lines 145-222)
- Uses: `anthropic.messages.create()` with system prompt and user message
- Response parsing: Extracts text content, cleans JSON, validates with Zod schema
- Retry logic: `extractEntitiesWithRetry()` (lines 279-322) with exponential backoff
- Current model: `claude-haiku-4-5-20251001`, temperature: 0.1, maxTokens: 4096

**Key Details:**

- System prompt: Lines 49-124 (extensive veterinary entity extraction instructions)
- User prompt: `createUserPrompt()` function (lines 126-136)
- Response format: JSON that must be parsed and validated
- Validation: Uses `NormalizedEntitiesSchema` from `~/lib/validators/scribe`
- Error handling: Handles Anthropic.APIError, validation errors, parsing errors

**Dependencies:**

- `~/lib/validators/scribe` - NormalizedEntitiesSchema
- `~/env` - ANTHROPIC_API_KEY

### Implementation Steps

1. **Update Imports**
   - Replace `import Anthropic from "@anthropic-ai/sdk"`
   - Add `import { getEntityExtractionLLM } from "~/lib/llamaindex/config"`
   - Add `import type { ChatMessage } from "llamaindex"`

2. **Refactor `extractEntities()` Function**
   - Remove `getAnthropicClient()` function (lines 30-40)
   - Replace `anthropic.messages.create()` with `llm.chat({ messages })`
   - Convert messages to LlamaIndex `ChatMessage[]` format:
     ```typescript
     const messages: ChatMessage[] = [
       { role: "system", content: SYSTEM_PROMPT },
       { role: "user", content: createUserPrompt(input, inputType) },
     ];
     ```
   - Access response: `response.message.content` (instead of `response.content[0].text`)
   - Keep all existing parsing, validation, and error handling logic unchanged

3. **Update Retry Logic**
   - `extractEntitiesWithRetry()` should work unchanged
   - Update error type checking if needed (LlamaIndex may have different error types)

4. **Preserve All Existing Behavior**
   - Same system prompt
   - Same user prompt formatting
   - Same JSON parsing and cleaning logic
   - Same Zod validation
   - Same retry behavior
   - Same error messages

### Success Criteria

- ✅ Function signature unchanged: `extractEntities(input: string, inputType?: string): Promise<NormalizedEntities>`
- ✅ All existing tests pass (if any)
- ✅ Response format identical to current implementation
- ✅ Error handling preserved
- ✅ Retry logic works correctly

### Testing

- Test with sample veterinary text input
- Verify JSON response structure matches exactly
- Test error cases (invalid input, API errors)
- Verify retry logic triggers on retryable errors

### Files to Modify

- `src/lib/ai/normalize-scribe.ts` - Main refactoring

---

## Task 3: Refactor Discharge Summary Generation to LlamaIndex

**Priority:** HIGH  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 1 (LlamaIndex Foundation)  
**Can Run In Parallel With:** Task 2

### Objective

Replace direct Anthropic SDK calls in discharge summary generation with LlamaIndex, maintaining identical functionality.

### Context

**Current Implementation:**

- File: `src/lib/ai/generate-discharge.ts` (367 lines)
- Main function: `generateDischargeSummary()` (lines 256-319)
- Uses: `anthropic.messages.create()` with system prompt and user message
- Response: Plain text discharge summary (trimmed)
- Retry logic: `generateDischargeSummaryWithRetry()` (lines 325-366)
- Current model: `claude-sonnet-4-20250514`, temperature: 0.3, maxTokens: 4000

**Key Details:**

- System prompt: Lines 41-65 (OdisAI veterinary discharge instruction generator)
- User prompt: `createUserPrompt()` function (lines 198-243)
  - Handles SOAP content OR entity extraction
  - Includes patient data
  - Includes optional template instructions
- Input interface: `GenerateDischargeSummaryInput` (lines 249-254)
- Response: Plain text (not JSON), trimmed

**Dependencies:**

- `~/lib/validators/scribe` - NormalizedEntities type
- `~/env` - ANTHROPIC_API_KEY

### Implementation Steps

1. **Update Imports**
   - Replace `import Anthropic from "@anthropic-ai/sdk"`
   - Add `import { getDischargeSummaryLLM } from "~/lib/llamaindex/config"`
   - Add `import type { ChatMessage } from "llamaindex"`

2. **Refactor `generateDischargeSummary()` Function**
   - Remove `getAnthropicClient()` function (lines 25-35)
   - Replace `anthropic.messages.create()` with `llm.chat({ messages })`
   - Convert messages to LlamaIndex format:
     ```typescript
     const messages: ChatMessage[] = [
       { role: "system", content: SYSTEM_PROMPT },
       { role: "user", content: createUserPrompt(...) }
     ];
     ```
   - Access response: `response.message.content.trim()` (instead of `content.text.trim()`)
   - Keep all existing validation and error handling

3. **Update Retry Logic**
   - `generateDischargeSummaryWithRetry()` should work unchanged
   - Update error type checking if needed

4. **Preserve All Existing Behavior**
   - Same system prompt
   - Same user prompt logic (SOAP vs entity extraction handling)
   - Same input validation
   - Same retry behavior
   - Same error messages

### Success Criteria

- ✅ Function signature unchanged: `generateDischargeSummary(input: GenerateDischargeSummaryInput): Promise<string>`
- ✅ All existing tests pass (if any)
- ✅ Response format identical (plain text discharge summary)
- ✅ Error handling preserved
- ✅ Retry logic works correctly

### Testing

- Test with SOAP content input
- Test with entity extraction input
- Test with both inputs
- Test with template instructions
- Verify output format matches exactly

### Files to Modify

- `src/lib/ai/generate-discharge.ts` - Main refactoring

---

## Task 4: Create Orchestration Types & Validators

**Priority:** MEDIUM  
**Estimated Time:** 60 minutes  
**Dependencies:** None (can start immediately)  
**Can Run In Parallel With:** Tasks 1, 2, 3

### Objective

Create TypeScript types and Zod validators for the orchestration request/response system.

### Context

**Existing Patterns:**

- Validators: `src/lib/validators/` directory (e.g., `scribe.ts`, `discharge.ts`)
- Types: `src/types/` directory
- Zod schemas used throughout (e.g., `IngestPayloadSchema` in `src/app/api/cases/ingest/route.ts`)

**Related Services:**

- `CasesService.ingest()` - Returns `{ caseId, entities, scheduledCall }`
- Discharge summary generation - Returns summary ID
- Email generation - Returns email content (subject, html, text)
- Call scheduling - Returns scheduled call ID

**Database Tables (inferred):**

- `cases` - Case records
- `discharge_summaries` - Summary records
- `scheduled_discharge_calls` - Call scheduling
- Email likely stored in `discharge_summaries` or separate table

### Implementation Steps

1. **Create Orchestration Validators**
   - File: `src/lib/validators/orchestration.ts`
   - Create `OrchestrationRequestSchema` with Zod:
     - `input`: Union of `rawData` (with mode, source, data/text) OR `existingCase` (with caseId, optional summaryId, optional emailContent)
     - `steps`: Object with optional step configs:
       - `ingest`: boolean or object with options
       - `generateSummary`: boolean or object with templateId, useLatestEntities
       - `prepareEmail`: boolean or object with templateId
       - `scheduleEmail`: boolean or object with recipientEmail, scheduledFor
       - `scheduleCall`: boolean or object with phoneNumber, scheduledFor
     - `options`: Optional object with stopOnError, parallel, dryRun

2. **Create Orchestration Types**
   - File: `src/types/orchestration.ts`
   - Export types:
     - `StepName` - Union type: "ingest" | "generateSummary" | "prepareEmail" | "scheduleEmail" | "scheduleCall"
     - `ExecutionContext` - Interface with user, supabase, startTime
     - `StepResult` - Interface with step, status, duration, data?, error?
     - `OrchestrationResult` - Interface with success, data (completed/skipped/failed steps, results), metadata (timings, warnings, errors)
   - Infer types from schema: `export type OrchestrationRequest = z.infer<typeof OrchestrationRequestSchema>`

3. **Reference Existing Types**
   - Import `NormalizedEntities` from `~/lib/validators/scribe`
   - Import `User` from `@supabase/supabase-js`
   - Import `SupabaseClientType` from `~/types/supabase` (if exists)

### Success Criteria

- ✅ All schemas validate correctly
- ✅ Types are properly exported and inferred
- ✅ Schema matches plan specification exactly
- ✅ Types are compatible with existing codebase patterns

### Testing

- Test schema validation with valid requests
- Test schema validation with invalid requests
- Verify type inference works correctly

### Files to Create

- `src/lib/validators/orchestration.ts` - Zod schemas
- `src/types/orchestration.ts` - TypeScript types

---

## Task 5: Create Execution Plan Builder

**Priority:** MEDIUM  
**Estimated Time:** 90 minutes  
**Dependencies:** Task 4 (Types & Validators)  
**Can Run In Parallel With:** Task 6 (after Task 4 completes)

### Objective

Create the `ExecutionPlan` class that analyzes orchestration requests and determines step execution order and parallelization opportunities.

### Context

**Step Dependencies (from plan):**

- `ingest` → no dependencies
- `generateSummary` → depends on `ingest` (needs caseId)
- `prepareEmail` → depends on `generateSummary` (needs summaryId)
- `scheduleEmail` → depends on `prepareEmail` (needs email content)
- `scheduleCall` → depends on `ingest` (needs caseId, can run parallel with email steps)

**Parallelization Rules:**

- `scheduleEmail` and `scheduleCall` can run in parallel (both depend on earlier steps, but not each other)
- Other steps must run sequentially

**Existing Patterns:**

- Service classes: `CasesService` in `src/lib/services/cases-service.ts`
- Class-based architecture is acceptable

### Implementation Steps

1. **Create ExecutionPlan Class**
   - File: `src/lib/services/execution-plan.ts`
   - Constructor: Takes `OrchestrationRequest`
   - Private properties:
     - `steps: Map<StepName, StepConfig>`
     - `completedSteps: Set<StepName>`
     - `failedSteps: Set<StepName>`
   - Interface `StepConfig`:
     ```typescript
     interface StepConfig {
       name: StepName;
       enabled: boolean;
       options?: any;
       dependencies: StepName[];
     }
     ```

2. **Implement `buildPlan()` Method**
   - Analyze request.steps to determine which steps are enabled
   - Set dependencies for each step:
     - `ingest`: []
     - `generateSummary`: ["ingest"]
     - `prepareEmail`: ["generateSummary"]
     - `scheduleEmail`: ["prepareEmail"]
     - `scheduleCall`: ["ingest"] (can run parallel with email steps)
   - Store step configs in Map

3. **Implement `shouldExecuteStep()` Method**
   - Check if step is enabled
   - Check if all dependencies are completed
   - Return boolean

4. **Implement `canRunInParallel()` Method**
   - Check if given steps have interdependencies
   - Return false if any step depends on another in the list
   - Return true if steps are independent

5. **Implement `getNextBatch()` Method**
   - Find all steps that:
     - Are enabled
     - Have dependencies met
     - Haven't been completed or failed
   - Group steps that can run in parallel
   - Return array of StepName[]

6. **Implement State Management Methods**
   - `markCompleted(step: StepName)` - Add to completedSteps
   - `markFailed(step: StepName)` - Add to failedSteps
   - `hasRemainingSteps()` - Check if any enabled steps remain

### Success Criteria

- ✅ Correctly identifies step dependencies
- ✅ Groups parallelizable steps correctly
- ✅ Tracks step completion state
- ✅ Returns correct execution batches

### Testing

- Test with full workflow (all steps enabled)
- Test with partial workflow (skip some steps)
- Test parallel execution detection
- Test dependency resolution

### Files to Create

- `src/lib/services/execution-plan.ts` - ExecutionPlan class

---

## Task 6: Create Discharge Orchestrator Service

**Priority:** HIGH  
**Estimated Time:** 120 minutes  
**Dependencies:** Tasks 4, 5 (Types, ExecutionPlan)  
**Can Run In Parallel With:** None (needs ExecutionPlan)

### Objective

Create the main `DischargeOrchestrator` service that executes orchestration workflows, calling existing services and managing step execution.

### Context

**Existing Services to Integrate:**

- `CasesService.ingest()` - `src/lib/services/cases-service.ts` (lines 46-114)
  - Takes: `supabase, userId, payload: IngestPayload`
  - Returns: `{ caseId, entities, scheduledCall }`
- Discharge summary generation - `generateDischargeSummaryWithRetry()` from `~/lib/ai/generate-discharge`
  - Takes: `GenerateDischargeSummaryInput`
  - Returns: `string` (summary content)
- Email generation - Logic in `src/app/api/generate/discharge-email/route.ts` (lines 86-352)
  - Generates HTML/text email from discharge summary
- Call scheduling - `CasesService.scheduleDischargeCall()` (lines 328-431)
  - Takes: `supabase, userId, caseId, options: CaseScheduleOptions`
  - Returns: `ScheduledDischargeCall`

**Database Operations:**

- Save discharge summary: Insert into `discharge_summaries` table
- Save email content: May need to store email content (check existing patterns)

**Authentication:**

- Use `SupabaseClientType` and `User` from auth context

### Implementation Steps

1. **Create DischargeOrchestrator Class**
   - File: `src/lib/services/discharge-orchestrator.ts`
   - Constructor: Takes `supabase: SupabaseClientType, user: User`
   - Main method: `orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult>`

2. **Implement Main Orchestration Flow**
   - Create ExecutionPlan from request
   - Initialize results Map
   - Call `executeParallel()` or `executeSequential()` based on request.options.parallel
   - Build and return OrchestrationResult

3. **Implement Sequential Execution**
   - `executeSequential()` method
   - Iterate through steps in order: ["ingest", "generateSummary", "prepareEmail", "scheduleEmail", "scheduleCall"]
   - For each step: check if should execute, execute, store result, mark completed/failed
   - Stop on error if `stopOnError` is true

4. **Implement Parallel Execution**
   - `executeParallel()` method
   - While plan has remaining steps:
     - Get next batch of parallelizable steps
     - Execute all in batch with `Promise.allSettled()`
     - Process results, mark completed/failed
   - Continue until all steps done

5. **Implement Step Execution Methods**
   - `executeStep()` - Routes to specific step handler
   - `executeIngestion()` - Call `CasesService.ingest()`
   - `executeSummaryGeneration()` - Call AI generation, save to DB
   - `executeEmailPreparation()` - Generate email content
   - `executeEmailScheduling()` - Schedule email (may need QStash integration)
   - `executeCallScheduling()` - Call `CasesService.scheduleDischargeCall()`

6. **Implement Result Building**
   - `buildResult()` - Aggregate StepResults into OrchestrationResult
   - `buildErrorResult()` - Build error result with partial data

7. **Handle Data Flow Between Steps**
   - Extract caseId from ingest result
   - Extract summaryId from summary generation result
   - Extract email content from email preparation result
   - Pass data between steps via previousResults Map

### Success Criteria

- ✅ Executes all steps correctly
- ✅ Handles dependencies between steps
- ✅ Supports both sequential and parallel execution
- ✅ Properly aggregates results
- ✅ Error handling at step level
- ✅ Dry-run mode support (if implemented)

### Testing

- Test full workflow execution
- Test partial workflow (skip steps)
- Test parallel execution
- Test error handling
- Test dry-run mode

### Files to Create

- `src/lib/services/discharge-orchestrator.ts` - DischargeOrchestrator class

### Files to Reference

- `src/lib/services/cases-service.ts` - CasesService methods
- `src/lib/ai/generate-discharge.ts` - Summary generation
- `src/app/api/generate/discharge-email/route.ts` - Email generation logic
- `src/app/api/generate/discharge-summary/route.ts` - Summary saving logic

---

## Task 7: Create Orchestration API Endpoint

**Priority:** HIGH  
**Estimated Time:** 45 minutes  
**Dependencies:** Tasks 4, 6 (Types, Orchestrator)  
**Can Run In Parallel With:** Task 8

### Objective

Create the `/api/discharge/orchestrate` endpoint that handles orchestration requests.

### Context

**Existing API Route Patterns:**

- `src/app/api/cases/ingest/route.ts` - Shows auth pattern (lines 47-85)
- `src/app/api/generate/discharge-summary/route.ts` - Shows CORS pattern (lines 8-9, 79-85, 326-328)
- `src/lib/api/auth.ts` - Has `authenticateUser()` helper (can use instead of inline auth)
- `src/lib/api/cors.ts` - Has `withCorsHeaders()`, `handleCorsPreflightRequest()`

**Authentication:**

- Use existing `authenticateUser()` from `~/lib/api/auth` OR inline pattern from ingest route
- Supports both cookie-based (web app) and Bearer token (extension)

**CORS:**

- Use `withCorsHeaders()` for responses
- Use `handleCorsPreflightRequest()` for OPTIONS

### Implementation Steps

1. **Create API Route**
   - File: `src/app/api/discharge/orchestrate/route.ts`
   - Export: `POST`, `GET`, `OPTIONS` handlers

2. **Implement POST Handler**
   - Authenticate request (use `authenticateUser()` or inline pattern)
   - Parse and validate body with `OrchestrationRequestSchema`
   - Create `DischargeOrchestrator` instance
   - Call `orchestrate()` method
   - Return result with CORS headers

3. **Implement GET Handler**
   - Health check endpoint
   - Return status info with CORS headers

4. **Implement OPTIONS Handler**
   - CORS preflight handler
   - Use `handleCorsPreflightRequest()`

5. **Error Handling**
   - Validation errors: 400 with details
   - Auth errors: 401
   - Server errors: 500 with error message
   - Use consistent error response format

### Success Criteria

- ✅ Handles authentication correctly (cookies and Bearer token)
- ✅ Validates request body
- ✅ Executes orchestration
- ✅ Returns proper CORS headers
- ✅ Error handling is consistent

### Testing

- Test with valid orchestration request
- Test with invalid request (validation errors)
- Test authentication (both methods)
- Test CORS preflight

### Files to Create

- `src/app/api/discharge/orchestrate/route.ts` - API endpoint

### Files to Reference

- `src/lib/api/auth.ts` - Authentication utilities
- `src/lib/api/cors.ts` - CORS utilities
- `src/lib/validators/orchestration.ts` - Request validation
- `src/lib/services/discharge-orchestrator.ts` - Orchestrator service

---

## Task 8: Create Auth Helper Utility (Optional Refactor)

**Priority:** LOW (optional)  
**Estimated Time:** 30 minutes  
**Dependencies:** None  
**Can Run In Parallel With:** Any task

### Objective

Extract common authentication pattern into reusable helper (if not already exists).

### Context

**Current State:**

- `src/lib/api/auth.ts` already exists with `authenticateUser()` function
- Some routes use inline `authenticateRequest()` pattern (e.g., `src/app/api/cases/ingest/route.ts`)
- Plan mentions creating `src/lib/api/auth-helper.ts` but this may be redundant

**Decision:**

- If `authenticateUser()` from `src/lib/api/auth.ts` works for orchestration endpoint, skip this task
- If we need a simpler helper that matches the inline pattern, create it

### Implementation Steps

1. **Check if Existing Helper is Sufficient**
   - Review `authenticateUser()` from `src/lib/api/auth.ts`
   - If it works for orchestration endpoint, skip this task

2. **If Needed: Create Simple Helper**
   - File: `src/lib/api/auth-helper.ts`
   - Function: `authenticateRequest(request: NextRequest): Promise<{ user: User | null, supabase: SupabaseClientType | null }>`
   - Match the inline pattern from ingest route
   - Return null values on failure (caller handles 401 response)

### Success Criteria

- ✅ Helper function works for orchestration endpoint
- ✅ Matches existing authentication patterns
- ✅ Or: Confirmed that existing `authenticateUser()` is sufficient

### Testing

- Test authentication with cookies
- Test authentication with Bearer token
- Test unauthenticated requests

### Files to Create (if needed)

- `src/lib/api/auth-helper.ts` - Simple auth helper

---

## Task 9: Integration Testing & Validation

**Priority:** HIGH  
**Estimated Time:** 60 minutes  
**Dependencies:** All previous tasks  
**Can Run In Parallel With:** None (final task)

### Objective

Test the complete orchestration system end-to-end and verify backward compatibility.

### Context

**Test Scenarios:**

1. Full orchestration (all steps enabled)
2. Partial orchestration (skip completed steps)
3. Sequential execution
4. Parallel execution
5. Error handling at each step
6. Dry-run mode (if implemented)
7. Backward compatibility (existing endpoints still work)

**Existing Endpoints to Verify:**

- `POST /api/cases/ingest` - Should still work
- `POST /api/generate/discharge-summary` - Should still work
- `POST /api/generate/discharge-email` - Should still work
- `POST /api/calls/schedule` - Should still work

### Implementation Steps

1. **Test LlamaIndex Integration**
   - Verify entity extraction produces identical results
   - Verify discharge summary generation produces identical results
   - Test error handling

2. **Test Orchestration Endpoint**
   - Test full workflow
   - Test partial workflow
   - Test parallel vs sequential
   - Test error scenarios
   - Test validation errors

3. **Test Backward Compatibility**
   - Test all existing endpoints still work
   - Verify no breaking changes
   - Test with IDEXX extension (if possible)
   - Test with mobile app patterns (if possible)

4. **Performance Testing**
   - Compare orchestration vs individual endpoint calls
   - Verify parallel execution improves performance

5. **Documentation**
   - Update API documentation if needed
   - Document orchestration endpoint usage

### Success Criteria

- ✅ All tests pass
- ✅ LlamaIndex produces identical results
- ✅ Orchestration works correctly
- ✅ All existing endpoints still functional
- ✅ No breaking changes

### Testing Checklist

- [ ] Entity extraction with LlamaIndex
- [ ] Discharge summary with LlamaIndex
- [ ] Full orchestration workflow
- [ ] Partial orchestration workflow
- [ ] Parallel execution
- [ ] Sequential execution
- [ ] Error handling
- [ ] Existing endpoints (ingest)
- [ ] Existing endpoints (generate summary)
- [ ] Existing endpoints (generate email)
- [ ] Existing endpoints (schedule call)

---

## Execution Order & Parallelization

### Phase 1: Foundation (Sequential)

1. **Task 1** - LlamaIndex Foundation Setup (MUST COMPLETE FIRST)

### Phase 2: AI Refactoring (Parallel)

2. **Task 2** - Refactor Entity Extraction (after Task 1)
3. **Task 3** - Refactor Discharge Summary (after Task 1)
4. **Task 4** - Create Types & Validators (can start immediately)

### Phase 3: Orchestration Core (Sequential)

5. **Task 5** - Execution Plan Builder (after Task 4)
6. **Task 6** - Discharge Orchestrator (after Tasks 4, 5)

### Phase 4: API & Integration (Parallel)

7. **Task 7** - Orchestration Endpoint (after Tasks 4, 6)
8. **Task 8** - Auth Helper (optional, can be done anytime)

### Phase 5: Testing (Final)

9. **Task 9** - Integration Testing (after all tasks)

### Recommended Parallel Execution Groups

**Group 1 (Start Immediately):**

- Task 1 (blocks others)
- Task 4 (independent)

**Group 2 (After Task 1):**

- Task 2 (entity extraction)
- Task 3 (discharge summary)
- Task 4 (if not done)

**Group 3 (After Tasks 4, 5):**

- Task 6 (orchestrator)

**Group 4 (After Task 6):**

- Task 7 (endpoint)
- Task 8 (optional helper)

**Group 5 (Final):**

- Task 9 (testing)

---

## Notes for Cursor Agents

1. **Preserve Existing Behavior**: All refactoring must maintain identical functionality
2. **Type Safety**: Use TypeScript strictly, leverage existing types
3. **Error Handling**: Match existing error handling patterns
4. **Code Style**: Follow existing codebase patterns (see CLAUDE.md)
5. **Testing**: Test thoroughly, especially backward compatibility
6. **Documentation**: Add JSDoc comments for new functions/classes
7. **Environment**: Use `~/env` for environment variables (not `process.env` directly)

## Questions to Resolve During Implementation

1. **Email Storage**: Where should email content be stored? (Check existing patterns)
2. **Email Scheduling**: Does email scheduling use QStash? (Check existing email sending routes)
3. **Dry-Run Mode**: Should dry-run mode be implemented in this phase or later?
4. **Initialization**: Where should LlamaIndex initialization be called? (Check app startup patterns)
