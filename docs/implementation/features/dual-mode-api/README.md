# Dual-Mode API Architecture Feature

**Status:** Planning  
**Timeline:** ~5 hours  
**Priority:** High

## Overview

This feature implements a dual-mode API architecture that:

1. **Replaces direct Anthropic SDK calls with LlamaIndex** - Establishes foundation for future RAG integration
2. **Adds orchestration endpoint** - Enables multi-step workflow automation
3. **Maintains backward compatibility** - All existing endpoints continue to work

## Goals

- ✅ Solid Foundation - LlamaIndex abstraction prepares for future RAG
- ✅ Zero Breaking Changes - All existing functionality preserved
- ✅ Better Architecture - Centralized LLM configuration and management
- ✅ Orchestration Flexibility - Full automation or granular control
- ✅ Performance - Parallel execution where possible
- ✅ Future-Ready - Easy to add RAG, vector stores, and advanced features later

## Feature Structure

```
features/dual-mode-api/
├── README.md (this file)
├── PARALLEL_TASKS.md (complete breakdown)
└── tasks/
    ├── TASK_1_LLAMAINDEX_FOUNDATION.md
    ├── TASK_2_REFACTOR_ENTITY_EXTRACTION.md
    ├── TASK_3_REFACTOR_DISCHARGE_SUMMARY.md
    ├── TASK_4_ORCHESTRATION_TYPES.md
    ├── TASK_5_EXECUTION_PLAN.md
    ├── TASK_6_DISCHARGE_ORCHESTRATOR.md
    └── TASK_7_ORCHESTRATION_ENDPOINT.md
```

## Task Breakdown

### Phase 1: Foundation (Must Complete First)

- **[Task 1: LlamaIndex Foundation Setup](./tasks/TASK_1_LLAMAINDEX_FOUNDATION.md)** ⏱️ 30 min
  - Install dependencies
  - Create configuration
  - Initialize on startup

### Phase 2: AI Refactoring (Parallel after Task 1)

- **[Task 2: Refactor Entity Extraction](./tasks/TASK_2_REFACTOR_ENTITY_EXTRACTION.md)** ⏱️ 45 min
  - Replace Anthropic SDK with LlamaIndex
  - Maintain identical functionality
- **[Task 3: Refactor Discharge Summary](./tasks/TASK_3_REFACTOR_DISCHARGE_SUMMARY.md)** ⏱️ 45 min
  - Replace Anthropic SDK with LlamaIndex
  - Maintain identical functionality

- **[Task 4: Create Types & Validators](./tasks/TASK_4_ORCHESTRATION_TYPES.md)** ⏱️ 60 min
  - Zod schemas for orchestration
  - TypeScript types
  - Can start immediately (no dependencies)

### Phase 3: Orchestration Core (Sequential)

- **[Task 5: Execution Plan Builder](./tasks/TASK_5_EXECUTION_PLAN.md)** ⏱️ 90 min
  - Analyze step dependencies
  - Plan execution order
  - Detect parallelization opportunities

- **[Task 6: Discharge Orchestrator](./tasks/TASK_6_DISCHARGE_ORCHESTRATOR.md)** ⏱️ 120 min
  - Execute orchestration workflows
  - Integrate existing services
  - Handle step execution and data flow

### Phase 4: API & Integration (Parallel)

- **[Task 7: Orchestration Endpoint](./tasks/TASK_7_ORCHESTRATION_ENDPOINT.md)** ⏱️ 45 min
  - Create `/api/discharge/orchestrate` route
  - Handle auth, validation, CORS
  - Execute orchestration

## Execution Order

### Recommended Parallel Groups

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

## Quick Start

### For Project Managers / Coordinators

1. **Read the step-by-step guide:** [STEP_BY_STEP_GUIDE.md](../../STEP_BY_STEP_GUIDE.md) - Complete walkthrough
2. **Check status:** [STATUS.md](./STATUS.md) - Current progress
3. **Read execution guide:** [EXECUTION_GUIDE.md](../../EXECUTION_GUIDE.md) - Multi-agent coordination

### For Cursor Agents

1. **Read the step-by-step guide:** [STEP_BY_STEP_GUIDE.md](../../STEP_BY_STEP_GUIDE.md) - Your assigned step
2. **Read your task guide:** `tasks/TASK_X_*.md` - Detailed instructions
3. **Check dependencies:** Verify required tasks are complete
4. **Implement:** Follow the task guide step-by-step
5. **Test:** Verify success criteria
6. **Update STATUS.md:** Mark task complete

## Dependencies Map

```
Task 1 (Foundation)
  ├─> Task 2 (Entity Extraction)
  └─> Task 3 (Discharge Summary)

Task 4 (Types)
  ├─> Task 5 (Execution Plan)
  └─> Task 6 (Orchestrator)

Task 5 (Execution Plan)
  └─> Task 6 (Orchestrator)

Task 6 (Orchestrator)
  └─> Task 7 (Endpoint)
```

## Success Criteria

- ✅ LlamaIndex successfully replaces direct Anthropic SDK calls
- ✅ Entity extraction produces identical results
- ✅ Discharge summary generation produces identical results
- ✅ Orchestration endpoint handles full workflow
- ✅ Orchestration handles partial workflows (skip completed steps)
- ✅ Parallel execution works for email + call scheduling
- ✅ All existing endpoints remain functional (zero breaking changes)
- ✅ IDEXX Extension can use orchestration endpoint
- ✅ Mobile App continues using individual endpoints
- ✅ Error handling works at step level

## Key Principles

1. **Preserve Existing Behavior**: All refactoring must maintain identical functionality
2. **Type Safety**: Use TypeScript strictly, leverage existing types
3. **Error Handling**: Match existing error handling patterns
4. **Code Style**: Follow existing codebase patterns (see `docs/CLAUDE.md`)
5. **Testing**: Test thoroughly, especially backward compatibility
6. **Documentation**: Add JSDoc comments for new functions/classes

## Questions to Resolve During Implementation

1. **Email Storage**: Where should email content be stored? (Check existing patterns)
2. **Email Scheduling**: Does email scheduling use QStash? (Check existing email sending routes)
3. **Dry-Run Mode**: Should dry-run mode be implemented in this phase or later?
4. **Initialization**: Where should LlamaIndex initialization be called? (Check app startup patterns)

## Related Documentation

- **Architecture**: `docs/architecture/` - System design decisions
- **API**: `docs/api/` - API documentation
- **VAPI Integration**: `docs/vapi/` - Voice call integration
- **Daily Notes**: `docs/daily/` - Implementation session notes

---

**Created:** 2025-01-27  
**Last Updated:** 2025-01-27
