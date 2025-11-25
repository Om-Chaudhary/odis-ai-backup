# Task 6: Create Discharge Orchestrator Service

## Objective

Create the main `DischargeOrchestrator` service that executes orchestration workflows, calling existing services and managing step execution. This task depends on Tasks 4 and 5 (Types, ExecutionPlan).

## Context

### Existing Services to Integrate

1. **CasesService.ingest()**
   - File: `src/lib/services/cases-service.ts` (lines 46-114)
   - Signature: `ingest(supabase, userId, payload: IngestPayload)`
   - Returns: `{ caseId, entities, scheduledCall }`
   - Payload structure: See `IngestPayloadSchema` in `src/app/api/cases/ingest/route.ts`

2. **Discharge Summary Generation**
   - Function: `generateDischargeSummaryWithRetry()` from `~/lib/ai/generate-discharge`
   - Signature: `generateDischargeSummaryWithRetry(input: GenerateDischargeSummaryInput)`
   - Returns: `string` (summary content)
   - Need to save to database: Insert into `discharge_summaries` table
   - See: `src/app/api/generate/discharge-summary/route.ts` (lines 204-229) for DB save pattern

3. **Email Generation**
   - Logic in: `src/app/api/generate/discharge-email/route.ts` (lines 86-352)
   - Generates HTML/text email from discharge summary
   - Returns: `{ subject, html, text, patientName, ownerName }`
   - May need to extract this logic into a reusable function

4. **Call Scheduling**
   - Function: `CasesService.scheduleDischargeCall()` (lines 328-431)
   - Signature: `scheduleDischargeCall(supabase, userId, caseId, options: CaseScheduleOptions)`
   - Returns: `ScheduledDischargeCall`

### Database Operations

- Save discharge summary: Insert into `discharge_summaries` table
- Email content: May need to store (check if there's an email table or if it's stored in summaries)

### Authentication

- Use `SupabaseClientType` and `User` from auth context

## Implementation Steps

### 1. Create DischargeOrchestrator Class Structure

**File:** `src/lib/services/discharge-orchestrator.ts`

```typescript
import { CasesService } from "./cases-service";
import { ExecutionPlan } from "./execution-plan";
import { generateDischargeSummaryWithRetry } from "~/lib/ai/generate-discharge";
import type {
  OrchestrationRequest,
  OrchestrationResult,
  StepName,
  StepResult,
  ExecutionContext,
} from "~/types/orchestration";
import type { SupabaseClientType } from "~/types/supabase";
import type { User } from "@supabase/supabase-js";
import type { IngestPayload } from "~/types/services";

export class DischargeOrchestrator {
  private plan: ExecutionPlan;
  private results = new Map<StepName, StepResult>();
  private context: ExecutionContext;

  constructor(
    private supabase: SupabaseClientType,
    private user: User,
  ) {
    // Context will be set in orchestrate() method
    this.context = {
      user,
      supabase,
      startTime: Date.now(),
    };
  }

  async orchestrate(
    request: OrchestrationRequest,
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.context.startTime = startTime;
    this.plan = new ExecutionPlan(request);
    this.results.clear();

    try {
      if (request.options?.parallel ?? true) {
        await this.executeParallel();
      } else {
        await this.executeSequential();
      }

      return this.buildResult(startTime);
    } catch (error) {
      return this.buildErrorResult(error, startTime);
    }
  }

  // ... implementation methods below
}
```

### 2. Implement Sequential Execution

```typescript
private async executeSequential() {
  const stepOrder: StepName[] = [
    "ingest",
    "generateSummary",
    "prepareEmail",
    "scheduleEmail",
    "scheduleCall",
  ];

  for (const step of stepOrder) {
    if (!this.plan.shouldExecuteStep(step)) {
      this.results.set(step, {
        step,
        status: "skipped",
        duration: 0,
      });
      continue;
    }

    const result = await this.executeStep(step);
    this.results.set(step, result);

    if (result.status === "completed") {
      this.plan.markCompleted(step);
    } else if (result.status === "failed") {
      this.plan.markFailed(step);
      if (this.request.options?.stopOnError) {
        break;
      }
    }
  }
}
```

### 3. Implement Parallel Execution

```typescript
private async executeParallel() {
  while (this.plan.hasRemainingSteps()) {
    const batch = this.plan.getNextBatch();
    if (batch.length === 0) break;

    const promises = batch.map((step) => this.executeStep(step));
    const batchResults = await Promise.allSettled(promises);

    batchResults.forEach((result, index) => {
      const step = batch[index]!;
      if (result.status === "fulfilled") {
        const stepResult = result.value;
        this.results.set(step, stepResult);
        if (stepResult.status === "completed") {
          this.plan.markCompleted(step);
        } else if (stepResult.status === "failed") {
          this.plan.markFailed(step);
        }
      } else {
        this.results.set(step, {
          step,
          status: "failed",
          duration: 0,
          error: result.reason?.message ?? String(result.reason),
        });
        this.plan.markFailed(step);
      }
    });
  }
}
```

### 4. Implement Step Execution Router

```typescript
private async executeStep(step: StepName): Promise<StepResult> {
  const stepStart = Date.now();

  try {
    switch (step) {
      case "ingest":
        return await this.executeIngestion(stepStart);
      case "generateSummary":
        return await this.executeSummaryGeneration(stepStart);
      case "prepareEmail":
        return await this.executeEmailPreparation(stepStart);
      case "scheduleEmail":
        return await this.executeEmailScheduling(stepStart);
      case "scheduleCall":
        return await this.executeCallScheduling(stepStart);
    }
  } catch (error) {
    return {
      step,
      status: "failed",
      duration: Date.now() - stepStart,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### 5. Implement Individual Step Handlers

#### Ingestion Step

```typescript
private async executeIngestion(startTime: number): Promise<StepResult> {
  const stepConfig = this.plan.getStepConfig("ingest");
  if (!stepConfig?.enabled) {
    return { step: "ingest", status: "skipped", duration: 0 };
  }

  // Extract input data
  const input = this.request.input;
  if ("existingCase" in input) {
    return {
      step: "ingest",
      status: "skipped",
      duration: Date.now() - startTime,
      data: { caseId: input.existingCase.caseId },
    };
  }

  // Build ingest payload
  const payload: IngestPayload = {
    mode: input.rawData.mode,
    source: input.rawData.source,
    ...(input.rawData.mode === "text"
      ? { text: input.rawData.text ?? "" }
      : { data: input.rawData.data ?? {} }),
    options: typeof stepConfig.options === "object" ? stepConfig.options : undefined,
  };

  const result = await CasesService.ingest(
    this.supabase,
    this.user.id,
    payload,
  );

  return {
    step: "ingest",
    status: "completed",
    duration: Date.now() - startTime,
    data: result,
  };
}
```

#### Summary Generation Step

```typescript
private async executeSummaryGeneration(startTime: number): Promise<StepResult> {
  const stepConfig = this.plan.getStepConfig("generateSummary");
  if (!stepConfig?.enabled) {
    return { step: "generateSummary", status: "skipped", duration: 0 };
  }

  // Get caseId from ingest result or existing case
  const caseId = this.getCaseId();
  if (!caseId) {
    throw new Error("Case ID required for summary generation");
  }

  // Get case data
  const caseInfo = await CasesService.getCaseWithEntities(
    this.supabase,
    caseId,
  );
  if (!caseInfo) {
    throw new Error("Case not found");
  }

  // Generate summary
  const summaryContent = await generateDischargeSummaryWithRetry({
    soapContent: null, // Could fetch SOAP note if needed
    entityExtraction: caseInfo.entities ?? null,
    patientData: {
      name: caseInfo.patient?.name,
      species: caseInfo.patient?.species,
      breed: caseInfo.patient?.breed,
      owner_name: caseInfo.patient?.owner_name,
    },
    template: typeof stepConfig.options === "object" ? stepConfig.options.templateId : undefined,
  });

  // Save to database
  const { data: summary, error } = await this.supabase
    .from("discharge_summaries")
    .insert({
      case_id: caseId,
      user_id: this.user.id,
      content: summaryContent,
    })
    .select("id")
    .single();

  if (error || !summary) {
    throw new Error(`Failed to save summary: ${error?.message}`);
  }

  return {
    step: "generateSummary",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      summaryId: summary.id,
      content: summaryContent,
    },
  };
}
```

#### Email Preparation Step

```typescript
private async executeEmailPreparation(startTime: number): Promise<StepResult> {
  // Similar pattern - generate email content
  // Reference: src/app/api/generate/discharge-email/route.ts
  // Extract email generation logic or call existing function
}
```

#### Email Scheduling Step

```typescript
private async executeEmailScheduling(startTime: number): Promise<StepResult> {
  // Get email content from previous step
  // Schedule via QStash or email service
  // Reference email sending patterns
}
```

#### Call Scheduling Step

```typescript
private async executeCallScheduling(startTime: number): Promise<StepResult> {
  const stepConfig = this.plan.getStepConfig("scheduleCall");
  if (!stepConfig?.enabled) {
    return { step: "scheduleCall", status: "skipped", duration: 0 };
  }

  const caseId = this.getCaseId();
  if (!caseId) {
    throw new Error("Case ID required for call scheduling");
  }

  const options =
    typeof stepConfig.options === "object" ? stepConfig.options : {};

  const scheduledCall = await CasesService.scheduleDischargeCall(
    this.supabase,
    this.user.id,
    caseId,
    {
      scheduledAt: options.scheduledFor ?? new Date(),
      ...options,
    },
  );

  return {
    step: "scheduleCall",
    status: "completed",
    duration: Date.now() - startTime,
    data: {
      callId: scheduledCall.id,
      scheduledFor: scheduledCall.scheduled_for,
    },
  };
}
```

### 6. Implement Helper Methods

```typescript
private getCaseId(): string | null {
  // Try to get from ingest result
  const ingestResult = this.results.get("ingest");
  if (ingestResult?.data && typeof ingestResult.data === "object") {
    const data = ingestResult.data as { caseId?: string };
    if (data.caseId) return data.caseId;
  }

  // Try to get from existing case input
  const input = this.request.input;
  if ("existingCase" in input) {
    return input.existingCase.caseId;
  }

  return null;
}

private buildResult(startTime: number): OrchestrationResult {
  const completedSteps: StepName[] = [];
  const skippedSteps: StepName[] = [];
  const failedSteps: StepName[] = [];
  const stepTimings: Record<StepName, number> = {} as Record<StepName, number>;

  for (const [step, result] of this.results.entries()) {
    stepTimings[step] = result.duration;
    if (result.status === "completed") {
      completedSteps.push(step);
    } else if (result.status === "skipped") {
      skippedSteps.push(step);
    } else if (result.status === "failed") {
      failedSteps.push(step);
    }
  }

  return {
    success: failedSteps.length === 0,
    data: {
      completedSteps,
      skippedSteps,
      failedSteps,
      ingestion: this.results.get("ingest")?.data as any,
      summary: this.results.get("generateSummary")?.data as any,
      email: this.results.get("prepareEmail")?.data as any,
      call: this.results.get("scheduleCall")?.data as any,
    },
    metadata: {
      totalProcessingTime: Date.now() - startTime,
      stepTimings,
      errors: failedSteps.map((step) => ({
        step,
        error: this.results.get(step)?.error ?? "Unknown error",
      })),
    },
  };
}

private buildErrorResult(error: unknown, startTime: number): OrchestrationResult {
  const result = this.buildResult(startTime);
  result.success = false;
  result.metadata.errors = [
    ...(result.metadata.errors ?? []),
    {
      step: "orchestration" as StepName,
      error: error instanceof Error ? error.message : String(error),
    },
  ];
  return result;
}
```

## Success Criteria

- ✅ Executes all steps correctly
- ✅ Handles dependencies between steps
- ✅ Supports both sequential and parallel execution
- ✅ Properly aggregates results
- ✅ Error handling at step level
- ✅ Data flows correctly between steps

## Testing

- Test full workflow execution
- Test partial workflow (skip steps)
- Test parallel execution
- Test error handling
- Test with existing case input
- Test with raw data input

## Files to Create

- `src/lib/services/discharge-orchestrator.ts` - DischargeOrchestrator class

## Files to Reference

- `src/lib/services/cases-service.ts` - CasesService methods
- `src/lib/services/execution-plan.ts` - ExecutionPlan class
- `src/lib/ai/generate-discharge.ts` - Summary generation
- `src/app/api/generate/discharge-email/route.ts` - Email generation logic
- `src/app/api/generate/discharge-summary/route.ts` - Summary saving pattern
- `src/types/orchestration.ts` - Types

## Notes

- Extract email generation logic into a reusable function if needed
- Handle dry-run mode if implemented
- Ensure proper error propagation
- Track step timings accurately
