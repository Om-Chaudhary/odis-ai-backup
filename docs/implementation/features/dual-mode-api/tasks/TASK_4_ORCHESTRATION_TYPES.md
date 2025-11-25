# Task 4: Create Orchestration Types & Validators

## Objective

Create TypeScript types and Zod validators for the orchestration request/response system. This task can start immediately and run in parallel with Tasks 1-3.

## Context

### Existing Patterns

- Validators: `src/lib/validators/` directory (e.g., `scribe.ts`, `discharge.ts`)
- Types: `src/types/` directory
- Zod schemas used throughout (e.g., `IngestPayloadSchema` in `src/app/api/cases/ingest/route.ts`)

### Related Services

- `CasesService.ingest()` - Returns `{ caseId, entities, scheduledCall }`
- Discharge summary generation - Returns summary ID
- Email generation - Returns email content (subject, html, text)
- Call scheduling - Returns scheduled call ID

### Database Tables (inferred from codebase)

- `cases` - Case records
- `discharge_summaries` - Summary records
- `scheduled_discharge_calls` - Call scheduling
- Email likely stored in `discharge_summaries` or separate table

## Implementation Steps

### 1. Create Orchestration Validators

**File:** `src/lib/validators/orchestration.ts`

Create comprehensive Zod schemas for orchestration requests:

```typescript
import { z } from "zod";

/**
 * Schema for raw data input (text or structured)
 */
const RawDataInputSchema = z.object({
  rawData: z.object({
    mode: z.enum(["text", "structured"]),
    source: z.enum([
      "mobile_app",
      "web_dashboard",
      "idexx_extension",
      "ezyvet_api",
    ]),
    data: z.record(z.any()).optional(),
    text: z.string().optional(),
  }),
});

/**
 * Schema for existing case input
 */
const ExistingCaseInputSchema = z.object({
  existingCase: z.object({
    caseId: z.string().uuid(),
    summaryId: z.string().uuid().optional(),
    emailContent: z
      .object({
        subject: z.string(),
        html: z.string(),
        text: z.string(),
      })
      .optional(),
  }),
});

/**
 * Schema for step configuration
 */
const IngestStepSchema = z.union([
  z.boolean(),
  z.object({
    options: z
      .object({
        extractEntities: z.boolean().optional(),
        skipDuplicateCheck: z.boolean().optional(),
      })
      .optional(),
  }),
]);

const GenerateSummaryStepSchema = z.union([
  z.boolean(),
  z.object({
    templateId: z.string().uuid().optional(),
    useLatestEntities: z.boolean().optional(),
  }),
]);

const PrepareEmailStepSchema = z.union([
  z.boolean(),
  z.object({
    templateId: z.string().uuid().optional(),
  }),
]);

const ScheduleEmailStepSchema = z.union([
  z.boolean(),
  z.object({
    recipientEmail: z.string().email(),
    scheduledFor: z.coerce.date().optional(),
  }),
]);

const ScheduleCallStepSchema = z.union([
  z.boolean(),
  z.object({
    phoneNumber: z.string(),
    scheduledFor: z.coerce.date().optional(),
  }),
]);

/**
 * Main orchestration request schema
 */
export const OrchestrationRequestSchema = z.object({
  input: z.union([RawDataInputSchema, ExistingCaseInputSchema]),
  steps: z.object({
    ingest: IngestStepSchema.optional(),
    generateSummary: GenerateSummaryStepSchema.optional(),
    prepareEmail: PrepareEmailStepSchema.optional(),
    scheduleEmail: ScheduleEmailStepSchema.optional(),
    scheduleCall: ScheduleCallStepSchema.optional(),
  }),
  options: z
    .object({
      stopOnError: z.boolean().optional().default(false),
      parallel: z.boolean().optional().default(true),
      dryRun: z.boolean().optional().default(false),
    })
    .optional(),
});

export type OrchestrationRequest = z.infer<typeof OrchestrationRequestSchema>;
```

### 2. Create Orchestration Types

**File:** `src/types/orchestration.ts`

Create TypeScript types for orchestration system:

```typescript
import type { User } from "@supabase/supabase-js";
import type { SupabaseClientType } from "~/types/supabase";
import type { NormalizedEntities } from "~/lib/validators/scribe";

/**
 * Step names in the orchestration workflow
 */
export type StepName =
  | "ingest"
  | "generateSummary"
  | "prepareEmail"
  | "scheduleEmail"
  | "scheduleCall";

/**
 * Execution context passed to step handlers
 */
export interface ExecutionContext {
  user: User;
  supabase: SupabaseClientType;
  startTime: number;
}

/**
 * Result of a single step execution
 */
export interface StepResult {
  step: StepName;
  status: "completed" | "skipped" | "failed";
  duration: number;
  data?: unknown;
  error?: string;
}

/**
 * Result data for ingestion step
 */
export interface IngestResult {
  caseId: string;
  entities: NormalizedEntities;
  scheduledCall?: {
    id: string;
    scheduledFor: string;
  } | null;
}

/**
 * Result data for summary generation step
 */
export interface SummaryResult {
  summaryId: string;
  content: string;
}

/**
 * Result data for email preparation step
 */
export interface EmailResult {
  subject: string;
  html: string;
  text: string;
}

/**
 * Result data for call scheduling step
 */
export interface CallResult {
  callId: string;
  scheduledFor: string;
}

/**
 * Complete orchestration result
 */
export interface OrchestrationResult {
  success: boolean;
  data: {
    completedSteps: StepName[];
    skippedSteps: StepName[];
    failedSteps: StepName[];
    ingestion?: IngestResult;
    summary?: SummaryResult;
    email?: EmailResult;
    call?: CallResult;
  };
  metadata: {
    totalProcessingTime: number;
    stepTimings: Record<StepName, number>;
    warnings?: string[];
    errors?: Array<{ step: StepName; error: string }>;
  };
}
```

### 3. Reference Existing Types

**Check and import:**

- `NormalizedEntities` from `~/lib/validators/scribe`
- `User` from `@supabase/supabase-js`
- `SupabaseClientType` from `~/types/supabase` (check if this exists, or use the actual type)

**If `SupabaseClientType` doesn't exist:**

- Check `src/lib/supabase/server.ts` for the return type of `createClient()`
- Or use: `Awaited<ReturnType<typeof createClient>>` from `~/lib/supabase/server`

## Success Criteria

- ✅ All schemas validate correctly
- ✅ Types are properly exported and inferred
- ✅ Schema matches plan specification exactly
- ✅ Types are compatible with existing codebase patterns
- ✅ No TypeScript errors
- ✅ Proper JSDoc comments

## Testing

### Schema Validation Tests

```typescript
// Valid request with raw data
const validRequest1 = {
  input: {
    rawData: {
      mode: "text",
      source: "idexx_extension",
      text: "Patient: Max, Dog...",
    },
  },
  steps: {
    ingest: true,
    generateSummary: { templateId: "uuid-here" },
  },
};

// Valid request with existing case
const validRequest2 = {
  input: {
    existingCase: {
      caseId: "123e4567-e89b-12d3-a456-426614174000",
      summaryId: "123e4567-e89b-12d3-a456-426614174001",
    },
  },
  steps: {
    prepareEmail: true,
    scheduleEmail: {
      recipientEmail: "owner@example.com",
      scheduledFor: new Date(),
    },
  },
};

// Invalid request (should fail validation)
const invalidRequest = {
  input: {
    rawData: {
      mode: "invalid", // Invalid enum value
    },
  },
};
```

## Files to Create

- `src/lib/validators/orchestration.ts` - Zod schemas
- `src/types/orchestration.ts` - TypeScript types

## Files to Reference

- `src/lib/validators/scribe.ts` - NormalizedEntities type
- `src/app/api/cases/ingest/route.ts` - IngestPayloadSchema pattern
- `src/lib/services/cases-service.ts` - Service return types
- `src/types/supabase.ts` - SupabaseClientType (if exists)

## Notes

- Follow existing Zod schema patterns in the codebase
- Use `z.coerce.date()` for date fields that may come as strings
- Use `z.union()` for step configs that can be boolean or object
- Make optional fields truly optional (use `.optional()`)
- Provide sensible defaults in `options` object
- Export types using `z.infer<>` for type safety

## Potential Issues & Solutions

1. **SupabaseClientType not found:**
   - Check `src/types/supabase.ts`
   - Or use: `Awaited<ReturnType<typeof createClient>>`
   - Or check `src/lib/supabase/server.ts` for actual type

2. **UUID validation:**
   - Use `z.string().uuid()` for UUID fields
   - Consider if caseId/summaryId might be non-UUID in some cases

3. **Date handling:**
   - Use `z.coerce.date()` to handle both Date objects and ISO strings
   - Consider timezone handling if needed

4. **Step configuration:**
   - Steps can be `true` (enabled with defaults), `false` (disabled), or object (enabled with options)
   - Use `z.union([z.boolean(), z.object(...)])` pattern
