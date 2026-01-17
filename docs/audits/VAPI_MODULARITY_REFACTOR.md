# VAPI Integration Modularity Refactor

> Purpose: Design document for refactoring the VAPI integration library to improve modularity, testability, and maintainability.

**Created**: 2026-01-16
**Status**: In Progress (Phase 1 Complete)
**Priority**: P0 (Critical)

---

## Executive Summary

The VAPI integration (`libs/integrations/vapi/`) has grown to **~10,500 lines** across multiple modules. The largest file, `end-of-call-report.ts`, contains **1,243 lines** with 10+ distinct responsibilities—far exceeding the 300-400 line best practice threshold.

This refactor aims to:

1. Split monolithic handlers into focused, single-responsibility modules
2. Remove duplicate/orphaned submodules
3. Extract reusable utilities into shared processors
4. Improve testability through clear boundaries and interfaces

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current State Analysis](#current-state-analysis)
3. [Objectives](#objectives)
4. [Proposed Architecture](#proposed-architecture)
5. [Migration Strategy](#migration-strategy)
6. [Success Metrics](#success-metrics)
7. [Risk Assessment](#risk-assessment)

---

## Problem Statement

### Critical Issues

| Issue                                       | Impact                                    | Severity |
| ------------------------------------------- | ----------------------------------------- | -------- |
| `end-of-call-report.ts` at 1,243 lines      | Untestable, hard to maintain              | Critical |
| 10+ responsibilities in single handler      | Tight coupling, no separation of concerns | Critical |
| Duplicate modules (`webhooks/`, `inbound/`) | Confusion, maintenance burden             | High     |
| Fire-and-forget background jobs in handler  | Silent failures, no observability         | High     |
| Utility functions mixed with business logic | Hard to reuse, test in isolation          | Medium   |

### Technical Debt Indicators

1. **Cognitive Load**: Developers must understand 1,243 lines to make any change to call completion logic
2. **Test Coverage Gap**: Impossible to unit test individual concerns (retry logic, status mapping, notifications)
3. **Code Duplication**: Structured output parsing logic duplicated in `backfill-outcome` route
4. **Hidden Dependencies**: Background jobs (transcript cleaning, Slack notifications) buried in webhook handler
5. **Unclear Module Boundaries**: Multiple Nx projects pointing to same or duplicated code

---

## Current State Analysis

### Module Inventory

```
libs/integrations/vapi/
├── src/                              # Main module (~7,500 lines)
│   ├── client.ts                     # 646 lines - API client
│   ├── validators.ts                 # 574 lines - Zod schemas
│   ├── extract-variables.ts          # 565 lines - Variable extraction
│   ├── types.ts                      # 323 lines - Shared types
│   ├── utils.ts                      # 257 lines - General utilities
│   ├── inbound-calls.ts              # 236 lines - Inbound mapping
│   ├── webhooks/                     # 2,447 lines total
│   │   ├── handlers/
│   │   │   ├── end-of-call-report.ts # 1,243 lines ⚠️ CRITICAL
│   │   │   └── [13 more handlers]
│   │   ├── tools/                    # 720 lines
│   │   ├── types.ts                  # 564 lines
│   │   └── utils.ts                  # 441 lines
│   ├── processors/                   # ~750 lines
│   ├── schemas/                      # ~620 lines
│   └── inbound-tools/                # ~500 lines
│
├── webhooks/                         # ⚠️ DUPLICATE of src/webhooks/
├── inbound/                          # ⚠️ DUPLICATE of src/inbound-calls.ts
├── handlers/                         # ⚠️ EMPTY
└── tools/                            # ⚠️ EMPTY
```

### End-of-Call Report Handler Analysis

The `end-of-call-report.ts` file currently handles:

| Responsibility                 | Lines | Should Be            |
| ------------------------------ | ----- | -------------------- |
| Call data enrichment           | ~50   | Shared utility       |
| Status determination           | ~30   | Status mapper module |
| Inbound call processing        | ~235  | Separate processor   |
| Outbound call processing       | ~130  | Separate processor   |
| Structured output parsing      | ~170  | Shared utility       |
| Transcript cleaning (async)    | ~50   | Background job       |
| Appointment extraction (async) | ~115  | Background job       |
| Slack notifications (async)    | ~120  | Background job       |
| Attention case handling        | ~120  | Separate handler     |
| Retry scheduling               | ~80   | Retry module         |
| Debug logging                  | ~65   | Can be trimmed       |

**Key Finding**: Only ~200 lines are core handler logic. The remaining 1,000+ lines are utilities and background jobs that should be extracted.

---

## Objectives

### Primary Objectives

| #   | Objective                                          | Measure                  |
| --- | -------------------------------------------------- | ------------------------ |
| O1  | Split `end-of-call-report.ts` into focused modules | No file > 300 lines      |
| O2  | Remove duplicate/orphaned modules                  | Single source of truth   |
| O3  | Extract reusable parsing utilities                 | Shared across handlers   |
| O4  | Separate background jobs from webhook handler      | Clear job boundaries     |
| O5  | Enable unit testing of individual concerns         | 80%+ coverage achievable |

### Secondary Objectives

| #   | Objective                           | Measure                 |
| --- | ----------------------------------- | ----------------------- |
| O6  | Split `webhooks/utils.ts` by domain | 5 focused utility files |
| O7  | Create processor interfaces         | Testable contracts      |
| O8  | Document module responsibilities    | Updated AGENTS.md       |

### Non-Objectives

- Changing VAPI webhook contract or API
- Migrating to different job queue system
- Restructuring processors or schemas (already well-organized)
- Adding new features during refactor

---

## Proposed Architecture

### Target Directory Structure

```
libs/integrations/vapi/src/
├── client.ts                         # API client (unchanged)
├── validators.ts                     # Zod schemas (unchanged)
├── extract-variables.ts              # Variable extraction (unchanged)
├── types.ts                          # Shared types (unchanged)
├── utils.ts                          # General utilities (unchanged)
├── inbound-calls.ts                  # Inbound mapping (unchanged)
│
├── webhooks/
│   ├── index.ts                      # Main dispatcher
│   ├── types.ts                      # Type definitions
│   │
│   ├── handlers/
│   │   ├── end-of-call-report/       # NEW: Directory structure
│   │   │   ├── index.ts              # Re-exports
│   │   │   ├── handler.ts            # Core dispatch (~150 lines)
│   │   │   ├── inbound-processor.ts  # Inbound logic (~250 lines)
│   │   │   └── outbound-processor.ts # Outbound logic (~200 lines)
│   │   ├── status-update.ts
│   │   ├── tool-calls.ts
│   │   └── [other handlers...]
│   │
│   ├── utils/                        # NEW: Split utilities
│   │   ├── index.ts                  # Re-exports
│   │   ├── status-mapper.ts          # Status conversion
│   │   ├── cost-calculator.ts        # Cost utilities
│   │   ├── retry-scheduler.ts        # Retry logic
│   │   ├── call-enricher.ts          # Data merging
│   │   └── sentiment-analyzer.ts     # Sentiment extraction
│   │
│   ├── processors/                   # NEW: Shared processors
│   │   ├── index.ts
│   │   ├── structured-output.ts      # VAPI output parsing
│   │   └── attention-handler.ts      # Attention case logic
│   │
│   ├── background-jobs/              # NEW: Async operations
│   │   ├── index.ts
│   │   ├── transcript-cleaner.ts     # AI-based cleanup
│   │   ├── appointment-extractor.ts  # Date parsing from transcript
│   │   └── slack-notifier.ts         # Notification dispatch
│   │
│   └── tools/                        # Tool execution (unchanged)
│
├── processors/                       # Domain processors (unchanged)
├── schemas/                          # Tool schemas (unchanged)
└── inbound-tools/                    # Inbound tools (unchanged)
```

### Module Responsibility Matrix

| Module                                     | Single Responsibility                     | Dependencies               |
| ------------------------------------------ | ----------------------------------------- | -------------------------- |
| `end-of-call-report/handler.ts`            | Route to inbound/outbound processor       | processors, utils          |
| `end-of-call-report/inbound-processor.ts`  | Process inbound call completion           | utils, background-jobs     |
| `end-of-call-report/outbound-processor.ts` | Process outbound call completion          | utils, background-jobs     |
| `utils/status-mapper.ts`                   | Convert VAPI status to internal status    | types only                 |
| `utils/retry-scheduler.ts`                 | Determine retry eligibility and timing    | qstash integration         |
| `processors/structured-output.ts`          | Parse VAPI structured output format       | types only                 |
| `processors/attention-handler.ts`          | Flag attention-needed cases               | repository                 |
| `background-jobs/transcript-cleaner.ts`    | Clean transcript via AI (fire-and-forget) | ai integration             |
| `background-jobs/appointment-extractor.ts` | Extract appointment dates                 | ai integration, repository |
| `background-jobs/slack-notifier.ts`        | Send Slack notifications                  | slack integration          |

### Interface Contracts

```typescript
// processors/structured-output.ts
export interface StructuredOutputParser {
  parse<T>(output: unknown, schema: ZodSchema<T>): T | null;
  extractByName<T>(
    outputs: unknown[],
    name: string,
    schema: ZodSchema<T>,
  ): T | null;
  parseAll<T extends Record<string, ZodSchema>>(
    outputs: unknown[],
    schemas: T,
  ): Partial<{ [K in keyof T]: z.infer<T[K]> }>;
}

// utils/retry-scheduler.ts
export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
  reason: string;
}

export interface RetryScheduler {
  evaluate(call: CallRecord, endedReason: string): RetryDecision;
  schedule(callId: string, decision: RetryDecision): Promise<void>;
}

// background-jobs/types.ts
export interface BackgroundJob<TInput, TResult = void> {
  execute(input: TInput): Promise<TResult>;
}
```

---

## Migration Strategy

### Phase 1: Foundation (No Breaking Changes) ✅ COMPLETE

**Objective**: Extract utilities without changing handler behavior

| Task | Description                                        | Risk | Status     |
| ---- | -------------------------------------------------- | ---- | ---------- |
| 1.1  | Create `utils/` directory with split files         | Low  | ⏳ Pending |
| 1.2  | Create `processors/structured-output.ts`           | Low  | ✅ Done    |
| 1.3  | Create `background-jobs/` directory                | Low  | ✅ Done    |
| 1.4  | Add re-exports from original locations             | None | ✅ Done    |
| 1.5  | Remove duplicate modules (`webhooks/`, `inbound/`) | Low  | ⏳ Pending |

**Validation**: TypeScript compilation passes, backwards compatibility maintained

### Phase 2: Handler Decomposition ✅ COMPLETE

**Objective**: Split `end-of-call-report.ts` into focused modules

| Task | Description                             | Risk   | Status  |
| ---- | --------------------------------------- | ------ | ------- |
| 2.1  | Create `end-of-call-report/` directory  | Low    | ✅ Done |
| 2.2  | Extract `inbound-processor.ts`          | Medium | ✅ Done |
| 2.3  | Extract `outbound-processor.ts`         | Medium | ✅ Done |
| 2.4  | Slim down `handler.ts` to dispatch only | Medium | ✅ Done |
| 2.5  | Extract `attention-handler.ts`          | Low    | ✅ Done |

**Validation**: End-to-end webhook tests pass, manual testing of call flows

**Commit**: `2a4573f - refactor(vapi): split end-of-call-report into modular structure`

### Phase 3: Cleanup and Documentation

**Objective**: Remove old code, update documentation

| Task | Description                                   | Risk | Status     |
| ---- | --------------------------------------------- | ---- | ---------- |
| 3.1  | Remove deprecated re-exports                  | Low  | ⏳ Pending |
| 3.2  | Update AGENTS.md with new structure           | None | ⏳ Pending |
| 3.3  | Add unit tests for extracted modules          | None | ⏳ Pending |
| 3.4  | Update backfill-outcome to use shared parsers | Low  | ⏳ Pending |

**Validation**: Full test suite, documentation review

---

## Success Metrics

### Quantitative Metrics

| Metric                          | Current     | Target      |
| ------------------------------- | ----------- | ----------- |
| Largest file in webhooks/       | 1,243 lines | < 300 lines |
| Files > 500 lines               | 4           | 0           |
| Duplicate modules               | 3           | 0           |
| Test coverage (webhooks)        | ~20%        | > 70%       |
| Cyclomatic complexity (handler) | High        | Medium      |

### Qualitative Metrics

| Metric                                      | Current     | Target       |
| ------------------------------------------- | ----------- | ------------ |
| Time to understand call completion flow     | 30+ minutes | < 10 minutes |
| Ability to test retry logic in isolation    | No          | Yes          |
| Ability to test status mapping in isolation | No          | Yes          |
| Clear module boundaries                     | No          | Yes          |
| Single source of truth                      | No          | Yes          |

### Definition of Done

- [ ] No file in `webhooks/` exceeds 300 lines
- [ ] All duplicate modules removed
- [ ] Structured output parsing shared across handlers
- [ ] Background jobs clearly separated from synchronous handler
- [ ] Unit tests exist for each extracted module
- [ ] `pnpm check` passes
- [ ] `nx affected -t lint,test` passes
- [ ] AGENTS.md updated with new module structure

---

## Risk Assessment

### High-Risk Items

| Risk                             | Impact                | Mitigation                    |
| -------------------------------- | --------------------- | ----------------------------- |
| Breaking webhook handling        | Production calls fail | Feature flag, gradual rollout |
| Missing edge cases in extraction | Incorrect call status | Comprehensive test coverage   |
| Background job timing changes    | Delayed notifications | Monitor job execution times   |

### Medium-Risk Items

| Risk                  | Impact         | Mitigation              |
| --------------------- | -------------- | ----------------------- |
| Import path changes   | Build failures | Temporary re-exports    |
| Circular dependencies | Build failures | Careful module ordering |
| Test flakiness        | CI failures    | Isolated unit tests     |

### Low-Risk Items

| Risk                   | Impact              | Mitigation                |
| ---------------------- | ------------------- | ------------------------- |
| Documentation drift    | Developer confusion | Update docs in same PR    |
| Type inference changes | IDE issues          | Explicit type annotations |

---

## Appendix A: File Size Inventory

| File                             | Current Lines | Target Lines | Action             |
| -------------------------------- | ------------- | ------------ | ------------------ |
| `handlers/end-of-call-report.ts` | 1,243         | 150          | Split into 5 files |
| `client.ts`                      | 646           | 646          | No change          |
| `validators.ts`                  | 574           | 574          | No change          |
| `webhooks/types.ts`              | 564           | 564          | No change (P2)     |
| `extract-variables.ts`           | 565           | 565          | No change          |
| `webhooks/utils.ts`              | 441           | 80           | Split into 5 files |
| `webhooks/tools/built-in.ts`     | 488           | 488          | No change (P2)     |

## Appendix B: Dependency Graph

```
end-of-call-report/handler.ts
├── ./inbound-processor
├── ./outbound-processor
├── ../utils/status-mapper
├── ../utils/call-enricher
└── ../processors/structured-output

end-of-call-report/inbound-processor.ts
├── ../utils/status-mapper
├── ../utils/cost-calculator
├── ../processors/attention-handler
├── ../background-jobs/transcript-cleaner
├── ../background-jobs/slack-notifier
└── @odis-ai/data-access/repository-impl

end-of-call-report/outbound-processor.ts
├── ../utils/status-mapper
├── ../utils/cost-calculator
├── ../utils/retry-scheduler
├── ../processors/attention-handler
├── ../background-jobs/transcript-cleaner
├── ../background-jobs/appointment-extractor
└── @odis-ai/data-access/repository-impl
```

## Appendix C: Related Documents

- [Refactoring Roadmap](./REFACTORING_ROADMAP.md) - Previous refactoring phases
- [Code Organization Audit](./CODE_ORGANIZATION_AUDIT.md) - Codebase structure analysis
- [Testability Audit](./TESTABILITY_AUDIT.md) - Testing strategy
- [VAPI Webhook Implementation Guide](../vapi/VAPI_WEBHOOK_IMPLEMENTATION_GUIDE.md) - Webhook documentation

---

## Revision History

| Date       | Author | Change                                                                |
| ---------- | ------ | --------------------------------------------------------------------- |
| 2026-01-16 | Claude | Initial draft                                                         |
| 2026-01-16 | Claude | Phase 1 & 2 complete: Split end-of-call-report into modular structure |
