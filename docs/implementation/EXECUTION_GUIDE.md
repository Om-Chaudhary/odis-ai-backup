# Multi-Agent Execution Guide

This guide explains how to execute the Dual-Mode API Architecture implementation plan using multiple Cursor agents in parallel.

## 🎯 Overview

The implementation is broken into **9 tasks** that can be executed in parallel where dependencies allow. This guide helps you coordinate multiple agents effectively.

## 📋 Execution Strategy

### Phase 1: Foundation (Start Here)

**Assign to Agent 1:**

- **Task 1: LlamaIndex Foundation Setup** (30 min)
  - Must complete first - blocks Tasks 2 & 3
  - File: `tasks/TASK_1_LLAMAINDEX_FOUNDATION.md`

**Assign to Agent 2 (can start immediately):**

- **Task 4: Create Types & Validators** (60 min)
  - No dependencies - can start immediately
  - File: `tasks/TASK_4_ORCHESTRATION_TYPES.md`

**Status Tracking:**

- ✅ Task 1 complete → Unblocks Tasks 2 & 3
- ✅ Task 4 complete → Unblocks Tasks 5 & 6

### Phase 2: AI Refactoring (After Task 1)

**Assign to Agent 3:**

- **Task 2: Refactor Entity Extraction** (45 min)
  - Depends on: Task 1
  - File: `tasks/TASK_2_REFACTOR_ENTITY_EXTRACTION.md`

**Assign to Agent 4:**

- **Task 3: Refactor Discharge Summary** (45 min)
  - Depends on: Task 1
  - File: `tasks/TASK_3_REFACTOR_DISCHARGE_SUMMARY.md`

**Note:** Tasks 2 and 3 can run in parallel after Task 1 completes.

### Phase 3: Orchestration Core (After Tasks 4 & 5)

**Assign to Agent 5:**

- **Task 5: Execution Plan Builder** (90 min)
  - Depends on: Task 4
  - File: `tasks/TASK_5_EXECUTION_PLAN.md`

**Assign to Agent 6 (after Task 5):**

- **Task 6: Discharge Orchestrator** (120 min)
  - Depends on: Tasks 4 & 5
  - File: `tasks/TASK_6_DISCHARGE_ORCHESTRATOR.md`

### Phase 4: API & Integration (After Task 6)

**Assign to Agent 7:**

- **Task 7: Orchestration Endpoint** (45 min)
  - Depends on: Task 6
  - File: `tasks/TASK_7_ORCHESTRATION_ENDPOINT.md`

### Phase 5: Testing (Final)

**Assign to Agent 8 (or any available agent):**

- **Task 9: Integration Testing** (60 min)
  - Depends on: All previous tasks
  - See: `PARALLEL_TASKS.md` for details

## 🚀 Quick Start for Each Agent

### Step 1: Read the Task Guide

Each agent should start by reading their assigned task guide:

```bash
# Example for Agent 1 (Task 1)
docs/implementation/features/dual-mode-api/tasks/TASK_1_LLAMAINDEX_FOUNDATION.md
```

### Step 2: Review Context

Each task guide includes:

- ✅ Complete context about current implementation
- ✅ Step-by-step instructions
- ✅ File references
- ✅ Success criteria
- ✅ Testing guidelines

### Step 3: Check Dependencies

Before starting, verify dependencies are complete:

**For Task 2 or 3:**

- ✅ Verify Task 1 is complete
- ✅ Check that `src/lib/llamaindex/config.ts` exists
- ✅ Verify LlamaIndex packages are installed

**For Task 5:**

- ✅ Verify Task 4 is complete
- ✅ Check that `src/lib/validators/orchestration.ts` exists
- ✅ Check that `src/types/orchestration.ts` exists

**For Task 6:**

- ✅ Verify Tasks 4 & 5 are complete
- ✅ Check that `ExecutionPlan` class exists
- ✅ Verify types are available

**For Task 7:**

- ✅ Verify Task 6 is complete
- ✅ Check that `DischargeOrchestrator` class exists

### Step 4: Implement

Follow the task guide step-by-step. Each guide is self-contained.

### Step 5: Test

Verify success criteria from the task guide:

- ✅ Code compiles without errors
- ✅ Tests pass (if applicable)
- ✅ Functionality matches requirements
- ✅ No breaking changes

### Step 6: Update Status

Update the session notes or create a progress file:

```markdown
## Task [X] Status

- ✅ Completed: [Date/Time]
- ✅ Verified: [What was tested]
- ✅ Next: [What unblocks]
```

## 📊 Coordination Strategies

### Strategy 1: Sequential Coordination

**Best for:** Small teams, careful execution

1. **Agent 1** completes Task 1
2. **Agent 1** notifies: "Task 1 complete, Tasks 2 & 3 can start"
3. **Agents 2 & 3** start Tasks 2 & 3 in parallel
4. Continue with dependencies

**Communication:**

- Use session notes: `sessions/YYYY-MM-DD/progress.md`
- Or create a shared status file

### Strategy 2: Parallel Start with Dependency Checks

**Best for:** Larger teams, faster execution

1. **All agents** read their task guides
2. **Agents with no dependencies** start immediately (Tasks 1, 4)
3. **Agents with dependencies** wait and check periodically
4. When dependency completes, start immediately

**Communication:**

- Create a status file: `features/dual-mode-api/STATUS.md`
- Update as tasks complete

### Strategy 3: Branch-Based Coordination

**Best for:** Git workflow, code review

1. Each agent works on a separate branch:
   - `feature/dual-mode-api/task-1-llamaindex-foundation`
   - `feature/dual-mode-api/task-2-entity-extraction`
   - etc.

2. Merge in dependency order:
   - Task 1 → main
   - Tasks 2 & 3 → main (can merge in parallel)
   - Task 4 → main
   - Task 5 → main
   - Task 6 → main
   - Task 7 → main

## 📝 Status Tracking

### Option 1: Session Notes

Create/update: `sessions/YYYY-MM-DD/progress.md`

```markdown
# Implementation Progress

## Task Status

- [x] Task 1: LlamaIndex Foundation (Agent 1) - ✅ Complete
- [x] Task 4: Types & Validators (Agent 2) - ✅ Complete
- [ ] Task 2: Entity Extraction (Agent 3) - 🟡 In Progress
- [ ] Task 3: Discharge Summary (Agent 4) - 🟡 Waiting for Task 1
- [ ] Task 5: Execution Plan (Agent 5) - 🟡 Waiting for Task 4
- [ ] Task 6: Orchestrator (Agent 6) - ⚪ Not Started
- [ ] Task 7: Endpoint (Agent 7) - ⚪ Not Started
```

### Option 2: Feature Status File

Create: `features/dual-mode-api/STATUS.md`

```markdown
# Dual-Mode API Implementation Status

## Phase 1: Foundation

- ✅ Task 1: LlamaIndex Foundation
- ✅ Task 4: Types & Validators

## Phase 2: AI Refactoring

- 🟡 Task 2: Entity Extraction (in progress)
- ⚪ Task 3: Discharge Summary (waiting)

## Phase 3: Orchestration Core

- ⚪ Task 5: Execution Plan (waiting for Task 4)
- ⚪ Task 6: Orchestrator (waiting for Tasks 4 & 5)

## Phase 4: API & Integration

- ⚪ Task 7: Endpoint (waiting for Task 6)
```

## 🔄 Dependency Management

### Critical Path

```
Task 1 (Foundation)
  ↓
Tasks 2 & 3 (AI Refactoring) - Parallel
  ↓
Task 4 (Types) - Can start immediately
  ↓
Task 5 (Execution Plan)
  ↓
Task 6 (Orchestrator)
  ↓
Task 7 (Endpoint)
  ↓
Task 9 (Testing)
```

### Parallel Opportunities

- **Tasks 1 & 4**: Can start simultaneously (no dependencies)
- **Tasks 2 & 3**: Can run in parallel (both depend on Task 1)
- **Tasks 2, 3 & 4**: Can all run in parallel after Task 1 completes

## ✅ Verification Checklist

Before marking a task complete, verify:

- [ ] Code compiles without errors
- [ ] All imports resolve correctly
- [ ] No TypeScript errors
- [ ] Functionality matches requirements
- [ ] Success criteria from task guide met
- [ ] No breaking changes to existing code
- [ ] Tests pass (if applicable)
- [ ] Documentation updated (if needed)

## 🚨 Common Issues & Solutions

### Issue: Dependency Not Ready

**Solution:**

- Check the dependency task's status
- Verify the required files exist
- If blocked, work on another independent task

### Issue: Merge Conflicts

**Solution:**

- Coordinate file changes
- Use feature branches
- Merge dependencies first

### Issue: Agent Waiting

**Solution:**

- Work on documentation
- Review other task guides
- Help with testing completed tasks

## 📚 Agent Assignment Template

Copy this for each agent:

```markdown
# Agent Assignment: Task [X]

## Task

[Task Name] - [Estimated Time]

## Dependencies

- Must complete first: [Tasks]
- Can start after: [Tasks]

## Files to Read

- Task guide: `tasks/TASK_X_*.md`
- Related files: [List from task guide]

## Success Criteria

- [List from task guide]

## Status

- [ ] Not Started
- [ ] In Progress
- [ ] Complete
- [ ] Blocked

## Notes

[Agent notes here]
```

## 🎯 Recommended Execution Order

### Day 1 Morning

1. **Agent 1**: Task 1 (Foundation) - 30 min
2. **Agent 2**: Task 4 (Types) - 60 min

### Day 1 Afternoon

3. **Agent 3**: Task 2 (Entity Extraction) - 45 min
4. **Agent 4**: Task 3 (Discharge Summary) - 45 min
5. **Agent 5**: Task 5 (Execution Plan) - 90 min

### Day 2 Morning

6. **Agent 6**: Task 6 (Orchestrator) - 120 min

### Day 2 Afternoon

7. **Agent 7**: Task 7 (Endpoint) - 45 min
8. **Agent 8**: Task 9 (Testing) - 60 min

**Total Time:** ~5.5 hours (with parallelization)

## 💡 Tips for Success

1. **Read First**: Each agent should read their task guide completely before starting
2. **Check Dependencies**: Verify dependencies are complete before starting
3. **Communicate**: Update status as tasks complete
4. **Test Thoroughly**: Don't skip testing - it catches issues early
5. **Ask Questions**: If unclear, check the task guide or ask for clarification
6. **Stay Focused**: Work on one task at a time for best results

---

**Last Updated:** 2025-01-27
