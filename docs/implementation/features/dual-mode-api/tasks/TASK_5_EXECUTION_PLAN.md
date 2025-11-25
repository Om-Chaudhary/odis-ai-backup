# Task 5: Create Execution Plan Builder

## Objective

Create the `ExecutionPlan` class that analyzes orchestration requests and determines step execution order and parallelization opportunities. This task depends on Task 4 (Types & Validators).

## Context

### Step Dependencies

From the plan, the dependency graph is:

- `ingest` → no dependencies
- `generateSummary` → depends on `ingest` (needs caseId)
- `prepareEmail` → depends on `generateSummary` (needs summaryId)
- `scheduleEmail` → depends on `prepareEmail` (needs email content)
- `scheduleCall` → depends on `ingest` (needs caseId, can run parallel with email steps)

### Parallelization Rules

- `scheduleEmail` and `scheduleCall` can run in parallel (both depend on earlier steps, but not each other)
- Other steps must run sequentially

### Existing Patterns

- Service classes: `CasesService` in `src/lib/services/cases-service.ts`
- Class-based architecture is acceptable

## Implementation Steps

### 1. Create ExecutionPlan Class

**File:** `src/lib/services/execution-plan.ts`

Create the class structure:

```typescript
import type { OrchestrationRequest, StepName } from "~/types/orchestration";

interface StepConfig {
  name: StepName;
  enabled: boolean;
  options?: unknown;
  dependencies: StepName[];
}

export class ExecutionPlan {
  private steps = new Map<StepName, StepConfig>();
  private completedSteps = new Set<StepName>();
  private failedSteps = new Set<StepName>();

  constructor(private request: OrchestrationRequest) {
    this.buildPlan();
  }

  // ... methods below
}
```

### 2. Implement `buildPlan()` Method

Analyze the request and build step configurations:

```typescript
private buildPlan() {
  const stepOrder: StepName[] = [
    "ingest",
    "generateSummary",
    "prepareEmail",
    "scheduleEmail",
    "scheduleCall",
  ];

  // Define dependencies for each step
  const dependencies: Record<StepName, StepName[]> = {
    ingest: [],
    generateSummary: ["ingest"],
    prepareEmail: ["generateSummary"],
    scheduleEmail: ["prepareEmail"],
    scheduleCall: ["ingest"], // Can run parallel with email steps
  };

  // Process each step
  for (const stepName of stepOrder) {
    const stepConfig = this.request.steps[stepName];

    // Determine if step is enabled
    const enabled = this.isStepEnabled(stepConfig);

    // Get step options
    const options = typeof stepConfig === "object" ? stepConfig : undefined;

    this.steps.set(stepName, {
      name: stepName,
      enabled,
      options,
      dependencies: dependencies[stepName] ?? [],
    });
  }
}

private isStepEnabled(stepConfig: boolean | object | undefined): boolean {
  if (stepConfig === undefined) return false;
  if (typeof stepConfig === "boolean") return stepConfig;
  return true; // Object means enabled with options
}
```

### 3. Implement `shouldExecuteStep()` Method

Check if a step should execute based on dependencies:

```typescript
shouldExecuteStep(stepName: StepName): boolean {
  const config = this.steps.get(stepName);
  if (!config?.enabled) return false;

  // Check if already completed or failed
  if (this.completedSteps.has(stepName)) return false;
  if (this.failedSteps.has(stepName)) return false;

  // Check if dependencies are met
  return config.dependencies.every((dep) =>
    this.completedSteps.has(dep)
  );
}
```

### 4. Implement `canRunInParallel()` Method

Check if multiple steps can run in parallel:

```typescript
canRunInParallel(steps: StepName[]): boolean {
  // Check if steps have interdependencies
  for (const step of steps) {
    const config = this.steps.get(step);
    if (!config) return false;

    // Check if this step depends on any other step in the list
    const hasDependency = config.dependencies.some((dep) =>
      steps.includes(dep)
    );
    if (hasDependency) return false;
  }

  return true;
}
```

### 5. Implement `getNextBatch()` Method

Get the next group of steps that can execute in parallel:

```typescript
getNextBatch(): StepName[] {
  const batch: StepName[] = [];

  // Find all steps that are ready to execute
  const stepOrder: StepName[] = [
    "ingest",
    "generateSummary",
    "prepareEmail",
    "scheduleEmail",
    "scheduleCall",
  ];

  for (const stepName of stepOrder) {
    if (this.shouldExecuteStep(stepName)) {
      batch.push(stepName);
    }
  }

  // If multiple steps are ready, check if they can run in parallel
  if (batch.length > 1 && this.canRunInParallel(batch)) {
    return batch;
  }

  // Otherwise, return first ready step (sequential)
  return batch.length > 0 ? [batch[0]!] : [];
}
```

### 6. Implement State Management Methods

```typescript
markCompleted(step: StepName) {
  this.completedSteps.add(step);
}

markFailed(step: StepName) {
  this.failedSteps.add(step);
}

hasRemainingSteps(): boolean {
  for (const [stepName, config] of this.steps.entries()) {
    if (config.enabled) {
      if (
        !this.completedSteps.has(stepName) &&
        !this.failedSteps.has(stepName)
      ) {
        return true;
      }
    }
  }
  return false;
}

getStepConfig(stepName: StepName): StepConfig | undefined {
  return this.steps.get(stepName);
}
```

## Success Criteria

- ✅ Correctly identifies step dependencies
- ✅ Groups parallelizable steps correctly (`scheduleEmail` and `scheduleCall` can run together)
- ✅ Tracks step completion state
- ✅ Returns correct execution batches
- ✅ Handles disabled steps correctly
- ✅ Handles step options correctly

## Testing

### Test Cases

1. **Full workflow (all steps enabled):**

   ```typescript
   const request = {
     input: {
       rawData: { mode: "text", source: "idexx_extension", text: "..." },
     },
     steps: {
       ingest: true,
       generateSummary: true,
       prepareEmail: true,
       scheduleEmail: true,
       scheduleCall: true,
     },
   };
   const plan = new ExecutionPlan(request);
   // First batch should be ["ingest"]
   // After ingest completes, next batch should be ["generateSummary"]
   // etc.
   ```

2. **Partial workflow (skip some steps):**

   ```typescript
   const request = {
     input: { existingCase: { caseId: "..." } },
     steps: {
       generateSummary: false, // Skip
       prepareEmail: true,
       scheduleEmail: true,
     },
   };
   // Should skip generateSummary and go straight to prepareEmail
   ```

3. **Parallel execution detection:**

   ```typescript
   // After ingest and prepareEmail complete
   // scheduleEmail and scheduleCall should be in same batch
   const batch = plan.getNextBatch();
   // Should return ["scheduleEmail", "scheduleCall"]
   ```

4. **Dependency checking:**
   ```typescript
   // generateSummary should not execute until ingest completes
   plan.shouldExecuteStep("generateSummary"); // Should return false
   plan.markCompleted("ingest");
   plan.shouldExecuteStep("generateSummary"); // Should return true
   ```

## Files to Create

- `src/lib/services/execution-plan.ts` - ExecutionPlan class

## Files to Reference

- `src/types/orchestration.ts` - StepName, OrchestrationRequest types
- `src/lib/services/cases-service.ts` - Service class pattern

## Notes

- Keep the class simple and focused on execution planning
- Don't execute steps - just plan them
- Track state (completed/failed) for dependency resolution
- Support both sequential and parallel execution modes

## Potential Issues & Solutions

1. **Step options handling:**
   - Steps can be `true`, `false`, or object with options
   - Extract options correctly for later use

2. **Dependency resolution:**
   - Ensure dependencies are checked correctly
   - Handle circular dependencies (shouldn't exist, but good to check)

3. **Parallel execution:**
   - Correctly identify that `scheduleEmail` and `scheduleCall` can run together
   - They both depend on earlier steps but not each other
