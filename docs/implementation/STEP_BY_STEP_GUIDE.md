# Step-by-Step Execution Guide

This guide walks you through executing the Dual-Mode API Architecture implementation with multiple Cursor agents.

## 📋 Prerequisites

- [ ] Multiple Cursor agent instances available (or plan to use sequentially)
- [ ] Access to the codebase
- [ ] Understanding of the project structure
- [ ] Git branch for the feature (recommended)

## 🚀 Step-by-Step Process

### Step 1: Preparation (5 minutes)

#### 1.1 Create a Feature Branch

```bash
git checkout -b feature/dual-mode-api-llamaindex-foundation
```

#### 1.2 Review the Plan

Read these files to understand the scope:

- [`features/dual-mode-api/README.md`](./features/dual-mode-api/README.md) - Feature overview
- [`features/dual-mode-api/PARALLEL_TASKS.md`](./features/dual-mode-api/PARALLEL_TASKS.md) - Complete breakdown
- [`features/dual-mode-api/STATUS.md`](./features/dual-mode-api/STATUS.md) - Status tracking

#### 1.3 Open Status File

Open `docs/implementation/features/dual-mode-api/STATUS.md` in your editor. You'll update this as tasks complete.

---

### Step 2: Start First Tasks (Parallel)

#### 2.1 Assign Task 1: LlamaIndex Foundation

**Open a new Cursor agent instance** (or use your current one) and give it this prompt:

```
I need you to implement Task 1: LlamaIndex Foundation Setup.

Please read the task guide at:
docs/implementation/features/dual-mode-api/tasks/TASK_1_LLAMAINDEX_FOUNDATION.md

Follow the guide step-by-step:
1. Install the required dependencies
2. Create the configuration file
3. Set up initialization
4. Test that it works

When complete, let me know and I'll verify.
```

**What Agent 1 should do:**

1. Read `tasks/TASK_1_LLAMAINDEX_FOUNDATION.md`
2. Install: `pnpm add llamaindex @llamaindex/anthropic`
3. Create `src/lib/llamaindex/config.ts`
4. Create `src/lib/llamaindex/init.ts` (or add to existing init)
5. Verify imports work
6. Report completion

**Expected time:** 30 minutes

#### 2.2 Assign Task 4: Types & Validators

**Open another Cursor agent instance** (or wait for Agent 1 to finish) and give it this prompt:

```
I need you to implement Task 4: Create Types & Validators.

Please read the task guide at:
docs/implementation/features/dual-mode-api/tasks/TASK_4_ORCHESTRATION_TYPES.md

Follow the guide step-by-step:
1. Create the validators file with Zod schemas
2. Create the types file with TypeScript types
3. Ensure all types are properly exported
4. Test schema validation

When complete, let me know and I'll verify.
```

**What Agent 2 should do:**

1. Read `tasks/TASK_4_ORCHESTRATION_TYPES.md`
2. Create `src/lib/validators/orchestration.ts`
3. Create `src/types/orchestration.ts`
4. Export all types and schemas
5. Test validation works
6. Report completion

**Expected time:** 60 minutes

**Note:** Tasks 1 and 4 can run in parallel - they don't depend on each other.

---

### Step 3: Verify Task 1 Completion

#### 3.1 Check Task 1 Results

When Agent 1 reports completion, verify:

```bash
# Check files exist
ls -la src/lib/llamaindex/config.ts
ls -la src/lib/llamaindex/init.ts

# Check package.json for new dependencies
grep -A 2 "llamaindex" package.json

# Try importing (should not error)
node -e "require('./src/lib/llamaindex/config.ts')"
```

#### 3.2 Update Status

In `docs/implementation/features/dual-mode-api/STATUS.md`:

```markdown
- [x] **Task 1: LlamaIndex Foundation Setup** (30 min)
  - Status: ✅ Complete
  - Completed: [Date/Time]
  - Verified: [What you checked]
```

#### 3.3 Unblock Dependent Tasks

Tasks 2 and 3 can now start!

---

### Step 4: Start AI Refactoring Tasks (Parallel)

#### 4.1 Assign Task 2: Entity Extraction

**Give Agent 3 this prompt:**

```
I need you to implement Task 2: Refactor Entity Extraction to LlamaIndex.

Please read the task guide at:
docs/implementation/features/dual-mode-api/tasks/TASK_2_REFACTOR_ENTITY_EXTRACTION.md

IMPORTANT: Task 1 must be complete first. Verify that src/lib/llamaindex/config.ts exists.

Follow the guide step-by-step:
1. Update imports in normalize-scribe.ts
2. Replace Anthropic SDK calls with LlamaIndex
3. Update response parsing
4. Test that results are identical to before
5. Verify retry logic still works

When complete, let me know and I'll verify.
```

**What Agent 3 should do:**

1. Verify Task 1 is complete (check for `src/lib/llamaindex/config.ts`)
2. Read `tasks/TASK_2_REFACTOR_ENTITY_EXTRACTION.md`
3. Refactor `src/lib/ai/normalize-scribe.ts`
4. Test with sample input
5. Verify output matches previous implementation
6. Report completion

**Expected time:** 45 minutes

#### 4.2 Assign Task 3: Discharge Summary

**Give Agent 4 this prompt:**

```
I need you to implement Task 3: Refactor Discharge Summary to LlamaIndex.

Please read the task guide at:
docs/implementation/features/dual-mode-api/tasks/TASK_3_REFACTOR_DISCHARGE_SUMMARY.md

IMPORTANT: Task 1 must be complete first. Verify that src/lib/llamaindex/config.ts exists.

Follow the guide step-by-step:
1. Update imports in generate-discharge.ts
2. Replace Anthropic SDK calls with LlamaIndex
3. Update response extraction
4. Test that results are identical to before
5. Verify retry logic still works

When complete, let me know and I'll verify.
```

**What Agent 4 should do:**

1. Verify Task 1 is complete (check for `src/lib/llamaindex/config.ts`)
2. Read `tasks/TASK_3_REFACTOR_DISCHARGE_SUMMARY.md`
3. Refactor `src/lib/ai/generate-discharge.ts`
4. Test with sample input
5. Verify output matches previous implementation
6. Report completion

**Expected time:** 45 minutes

**Note:** Tasks 2 and 3 can run in parallel - they both depend on Task 1 but not each other.

---

### Step 5: Verify Task 4 Completion

#### 5.1 Check Task 4 Results

When Agent 2 reports completion, verify:

```bash
# Check files exist
ls -la src/lib/validators/orchestration.ts
ls -la src/types/orchestration.ts

# Check TypeScript compiles
pnpm typecheck

# Test schema validation (if possible)
```

#### 5.2 Update Status

In `STATUS.md`:

```markdown
- [x] **Task 4: Create Types & Validators** (60 min)
  - Status: ✅ Complete
  - Completed: [Date/Time]
```

#### 5.3 Unblock Dependent Tasks

Task 5 can now start!

---

### Step 6: Start Orchestration Core

#### 6.1 Assign Task 5: Execution Plan

**Give Agent 5 this prompt:**

```
I need you to implement Task 5: Execution Plan Builder.

Please read the task guide at:
docs/implementation/features/dual-mode-api/tasks/TASK_5_EXECUTION_PLAN.md

IMPORTANT: Task 4 must be complete first. Verify that src/lib/validators/orchestration.ts and src/types/orchestration.ts exist.

Follow the guide step-by-step:
1. Create ExecutionPlan class
2. Implement dependency resolution
3. Implement parallel execution detection
4. Test with various step configurations
5. Verify dependency checking works correctly

When complete, let me know and I'll verify.
```

**What Agent 5 should do:**

1. Verify Task 4 is complete
2. Read `tasks/TASK_5_EXECUTION_PLAN.md`
3. Create `src/lib/services/execution-plan.ts`
4. Implement all methods from the guide
5. Test dependency resolution
6. Test parallel execution detection
7. Report completion

**Expected time:** 90 minutes

---

### Step 7: Verify Task 5 Completion

#### 7.1 Check Task 5 Results

```bash
# Check file exists
ls -la src/lib/services/execution-plan.ts

# Check TypeScript compiles
pnpm typecheck

# Verify ExecutionPlan class exists
grep -n "class ExecutionPlan" src/lib/services/execution-plan.ts
```

#### 7.2 Update Status

```markdown
- [x] **Task 5: Execution Plan Builder** (90 min)
  - Status: ✅ Complete
```

#### 7.3 Unblock Task 6

Task 6 can now start!

---

### Step 8: Start Orchestrator

#### 8.1 Assign Task 6: Discharge Orchestrator

**Give Agent 6 this prompt:**

```
I need you to implement Task 6: Discharge Orchestrator Service.

Please read the task guide at:
docs/implementation/features/dual-mode-api/tasks/TASK_6_DISCHARGE_ORCHESTRATOR.md

IMPORTANT: Tasks 4 and 5 must be complete. Verify:
- src/lib/validators/orchestration.ts exists
- src/lib/services/execution-plan.ts exists

Follow the guide step-by-step:
1. Create DischargeOrchestrator class
2. Implement step execution methods
3. Integrate with existing services (CasesService, etc.)
4. Implement result building
5. Test with sample orchestration requests

When complete, let me know and I'll verify.
```

**What Agent 6 should do:**

1. Verify Tasks 4 & 5 are complete
2. Read `tasks/TASK_6_DISCHARGE_ORCHESTRATOR.md`
3. Create `src/lib/services/discharge-orchestrator.ts`
4. Implement all step handlers
5. Integrate with existing services
6. Test orchestration flow
7. Report completion

**Expected time:** 120 minutes

---

### Step 9: Verify Task 6 Completion

#### 9.1 Check Task 6 Results

```bash
# Check file exists
ls -la src/lib/services/discharge-orchestrator.ts

# Check TypeScript compiles
pnpm typecheck

# Verify DischargeOrchestrator class exists
grep -n "class DischargeOrchestrator" src/lib/services/discharge-orchestrator.ts
```

#### 9.2 Update Status

```markdown
- [x] **Task 6: Discharge Orchestrator** (120 min)
  - Status: ✅ Complete
```

#### 9.3 Unblock Task 7

Task 7 can now start!

---

### Step 10: Start API Endpoint

#### 10.1 Assign Task 7: Orchestration Endpoint

**Give Agent 7 this prompt:**

```
I need you to implement Task 7: Orchestration API Endpoint.

Please read the task guide at:
docs/implementation/features/dual-mode-api/tasks/TASK_7_ORCHESTRATION_ENDPOINT.md

IMPORTANT: Task 6 must be complete. Verify that src/lib/services/discharge-orchestrator.ts exists.

Follow the guide step-by-step:
1. Create API route file
2. Implement POST handler with auth
3. Implement validation
4. Integrate with DischargeOrchestrator
5. Add CORS support
6. Test with sample requests

When complete, let me know and I'll verify.
```

**What Agent 7 should do:**

1. Verify Task 6 is complete
2. Read `tasks/TASK_7_ORCHESTRATION_ENDPOINT.md`
3. Create `src/app/api/discharge/orchestrate/route.ts`
4. Implement all handlers (POST, GET, OPTIONS)
5. Add authentication
6. Add CORS support
7. Test endpoint
8. Report completion

**Expected time:** 45 minutes

---

### Step 11: Verify Task 7 Completion

#### 11.1 Check Task 7 Results

```bash
# Check file exists
ls -la src/app/api/discharge/orchestrate/route.ts

# Check TypeScript compiles
pnpm typecheck

# Test endpoint (if server running)
curl http://localhost:3000/api/discharge/orchestrate
```

#### 11.2 Update Status

```markdown
- [x] **Task 7: Orchestration Endpoint** (45 min)
  - Status: ✅ Complete
```

---

### Step 12: Integration Testing

#### 12.1 Assign Task 9: Integration Testing

**Give Agent 8 this prompt:**

```
I need you to implement Task 9: Integration Testing.

All previous tasks should be complete. Please verify:
- Task 1: LlamaIndex foundation
- Task 2: Entity extraction refactored
- Task 3: Discharge summary refactored
- Task 4: Types & validators
- Task 5: Execution plan
- Task 6: Orchestrator
- Task 7: Endpoint

Read the testing section in:
docs/implementation/features/dual-mode-api/PARALLEL_TASKS.md

Test the following:
1. LlamaIndex produces identical results to Anthropic SDK
2. Orchestration endpoint works end-to-end
3. All existing endpoints still work (backward compatibility)
4. Parallel execution works correctly
5. Error handling works at step level

Document any issues found.
```

**What Agent 8 should do:**

1. Verify all previous tasks are complete
2. Read testing section in `PARALLEL_TASKS.md`
3. Test LlamaIndex integration
4. Test orchestration endpoint
5. Test backward compatibility
6. Test error handling
7. Document results
8. Report completion

**Expected time:** 60 minutes

---

### Step 13: Final Verification

#### 13.1 Run Full Test Suite

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build (if applicable)
pnpm build
```

#### 13.2 Update Final Status

In `STATUS.md`, mark all tasks complete:

```markdown
# Dual-Mode API Implementation Status

**Last Updated:** [Date]
**Overall Progress:** 9/9 tasks complete ✅

## Task Status

### Phase 1: Foundation

- [x] **Task 1: LlamaIndex Foundation Setup** ✅ Complete
- [x] **Task 4: Create Types & Validators** ✅ Complete

### Phase 2: AI Refactoring

- [x] **Task 2: Refactor Entity Extraction** ✅ Complete
- [x] **Task 3: Refactor Discharge Summary** ✅ Complete

### Phase 3: Orchestration Core

- [x] **Task 5: Execution Plan Builder** ✅ Complete
- [x] **Task 6: Discharge Orchestrator** ✅ Complete

### Phase 4: API & Integration

- [x] **Task 7: Orchestration Endpoint** ✅ Complete

### Phase 5: Testing

- [x] **Task 9: Integration Testing** ✅ Complete
```

#### 13.3 Create Session Summary

Update `docs/implementation/sessions/YYYY-MM-DD/README.md`:

```markdown
# Implementation Session: [Date]

## Overview

Completed Dual-Mode API Architecture implementation.

## Tasks Completed

- ✅ Task 1: LlamaIndex Foundation
- ✅ Task 2: Entity Extraction Refactoring
- ✅ Task 3: Discharge Summary Refactoring
- ✅ Task 4: Types & Validators
- ✅ Task 5: Execution Plan
- ✅ Task 6: Orchestrator
- ✅ Task 7: Endpoint
- ✅ Task 9: Integration Testing

## Results

- All tasks completed successfully
- Backward compatibility verified
- Ready for code review and merge
```

---

### Step 14: Code Review & Merge

#### 14.1 Commit Changes

```bash
git add .
git commit -m "feat: implement dual-mode API architecture with LlamaIndex

- Replace Anthropic SDK with LlamaIndex abstraction
- Add orchestration endpoint for multi-step workflows
- Maintain backward compatibility with existing endpoints
- Add comprehensive type definitions and validators

Tasks completed:
- Task 1: LlamaIndex foundation setup
- Task 2: Entity extraction refactoring
- Task 3: Discharge summary refactoring
- Task 4: Types & validators
- Task 5: Execution plan builder
- Task 6: Discharge orchestrator
- Task 7: Orchestration endpoint
- Task 9: Integration testing"
```

#### 14.2 Push Branch

```bash
git push origin feature/dual-mode-api-llamaindex-foundation
```

#### 14.3 Create Pull Request

Create a PR with:

- Description of changes
- Link to feature documentation
- Testing results
- Checklist of completed tasks

---

## 📊 Timeline Summary

**With 2 agents:**

- Tasks 1 & 4 start simultaneously (30 min + 60 min = 60 min total)
- Tasks 2 & 3 start after Task 1 (45 min + 45 min = 45 min total)
- Task 5 after Task 4 (90 min)
- Task 6 after Task 5 (120 min)
- Task 7 after Task 6 (45 min)
- Task 9 after all (60 min)
- **Total: ~5.5 hours**

**With 4 agents:**

- Tasks 1, 4 start (60 min)
- Tasks 2, 3 start after Task 1 (45 min)
- Task 5 after Task 4 (90 min)
- Task 6 after Task 5 (120 min)
- Task 7 after Task 6 (45 min)
- Task 9 after all (60 min)
- **Total: ~4 hours**

**With 8 agents:**

- All tasks assigned, but dependencies still apply
- **Total: ~3-4 hours** (accounting for dependencies)

---

## 🚨 Troubleshooting

### Issue: Agent reports dependency not ready

**Solution:**

1. Check `STATUS.md` to verify dependency status
2. Verify the required files exist in the codebase
3. If dependency is complete but agent can't find it, check file paths
4. Have agent wait or work on another independent task

### Issue: Merge conflicts

**Solution:**

1. Coordinate file changes between agents
2. Use feature branches for each task
3. Merge dependencies first, then dependent tasks
4. Resolve conflicts before continuing

### Issue: Tests failing

**Solution:**

1. Check if it's a test issue or implementation issue
2. Verify the implementation matches the task guide
3. Check for TypeScript errors: `pnpm typecheck`
4. Review error messages carefully

### Issue: Agent stuck

**Solution:**

1. Check the task guide for clarity
2. Review referenced files in the codebase
3. Ask agent to explain what it's trying to do
4. Provide more specific guidance if needed

---

## ✅ Success Checklist

Before considering the implementation complete:

- [ ] All 9 tasks marked complete in STATUS.md
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] All existing endpoints still work (backward compatibility)
- [ ] Orchestration endpoint works end-to-end
- [ ] LlamaIndex produces identical results to Anthropic SDK
- [ ] Documentation updated
- [ ] Code committed and pushed
- [ ] Pull request created

---

## 📝 Notes

- **Update STATUS.md frequently** - This helps coordinate multiple agents
- **Test as you go** - Don't wait until the end to test
- **Communicate blockers** - If an agent is stuck, note it in STATUS.md
- **Verify dependencies** - Always check that dependencies are complete before starting

---

**Last Updated:** 2025-01-27
