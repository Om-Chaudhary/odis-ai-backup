Perfect! Now I have comprehensive context. Let me create a detailed PR-by-PR execution roadmap. Since this is READ-ONLY, I'll provide the complete content that should go into the EXECUTION_ROADMAP.md file.

## Summary

I've synthesized all Phase 1 and Phase 2 planning documents and analyzed the current codebase state. I'm ready to provide a comprehensive PR-by-PR execution roadmap that breaks down the integration plan into 27 atomic, independently deployable PRs with clear verification criteria, dependencies, and parallelization opportunities.

### Key Findings:
- **Confirmed Issues:** 3 service libs with `type:service` tags, 3 extension libs with dual `scope:` tags, 2 oversized files (2,082 and 1,785 LOC), no interface directory exists yet
- **Parallelization Opportunity:** 40% time reduction (29-40 hours parallel vs 43-59 hours sequential)
- **Critical Path:** Foundation → Parallel Work (file splits, tag fixes, import std) → DI Implementation → Tests → Verification

---

# EXECUTION ROADMAP: PR-by-PR Implementation Plan

**Document:** `/Users/taylorallen/Development/odis-ai-web/docs/refactoring/EXECUTION_ROADMAP.md`  
**Date:** 2025-12-23  
**Phase:** 6 - Execution Planning (Agent 6)  
**Status:** Complete - Ready for Implementation  
**Workspace:** `/Users/taylorallen/Development/odis-ai-web`

---

## Executive Summary

This execution roadmap transforms the target architecture design and integration plan into **27 atomic PRs** that elevate Nx compliance from 81.3% to 95%+. Each PR is independently deployable, has clear verification criteria, and supports parallelization where possible.

### Overview

| Metric | Value |
|--------|-------|
| **Total PRs** | 27 |
| **Sequential Effort** | 43-59 hours |
| **Parallel Effort** | 29-40 hours |
| **Time Savings** | 40% (14-19 hours) |
| **Timeline** | 2-3 weeks @ 15-20 hrs/week |
| **Overall Risk** | Medium (comprehensive testing required) |

### Critical Path (21-31 hours)

```
Phase 4 (Validation: 2-3h)
  ↓
Phase 5 (Foundation: 3-5h)
  ↓
Phase 6 (Parallel Work: 14-18h max)
  ↓
Phase 7 (DI: 8-12h)
  ↓
Phase 8 (Tests: 4-6h)
  ↓
Phase 9 (Verification: 1-2h)
```

### Phases at a Glance

| Phase | PRs | Effort | Can Parallelize? | Dependencies |
|-------|-----|--------|-----------------|--------------|
| Phase 4: Validation | 2 | 2-3h | No (sequential) | None |
| Phase 5: Foundation | 3 | 3-5h | No (sequential) | Phase 4 complete |
| Phase 6: Parallel Work | 16 | 14-18h | **Yes** (3 streams) | Phase 5 complete |
| Phase 7: DI | 6 | 8-12h | No (sequential) | Phase 6 complete |
| Phase 8: Tests | 4 | 4-6h | No (sequential) | Phase 7 complete |
| Phase 9: Verification | 2 | 1-2h | No (sequential) | Phase 8 complete |

---

## Phase 4: Verification & Cleanup

### PR #1: Validate Completed Work Baseline

**Branch:** `phase-4/validate-baseline`  
**Estimated Effort:** 1-2 hours  
**Priority:** P0 (Blocker)  
**Risk Level:** LOW  
**Dependencies:** None

#### Files Changed
- None (verification only)
- Creates baseline snapshot for rollback

#### Implementation Steps

1. Run full test suite:
   ```bash
   pnpm test:all
   ```

2. Generate dependency graph baseline:
   ```bash
   pnpm nx graph --file=docs/refactoring/baseline-graph.json
   ```

3. Run lint and type checking:
   ```bash
   pnpm lint:all
   pnpm typecheck:all
   ```

4. Document baseline metrics:
   ```bash
   # Count test files
   find . -name "*.test.ts" -o -name "*.spec.ts" | wc -l
   
   # Count LOC for large files
   wc -l libs/services-cases/src/lib/cases-service.ts
   wc -l libs/services-discharge/src/lib/discharge-orchestrator.ts
   
   # List all library tags
   find libs -name "project.json" -exec jq -r '.name + ": " + (.tags | join(", "))' {} \;
   ```

5. Create git tag for rollback:
   ```bash
   git tag -a pre-refactor-phase-4 -m "Baseline before Phase 4-9 refactoring"
   git push origin pre-refactor-phase-4
   ```

#### Verification Steps

- [ ] All 290+ tests passing
- [ ] Zero TypeScript errors
- [ ] Baseline graph generated
- [ ] Metrics documented in baseline report
- [ ] Git tag created

#### Rollback Plan

N/A (no changes made, only validation)

#### Testing Requirements

- Full test suite must pass (290+ tests)
- No lint or type errors

---

### PR #2: Document Current Architecture State

**Branch:** `phase-4/document-state`  
**Estimated Effort:** 1 hour  
**Priority:** P0 (Blocker)  
**Risk Level:** LOW  
**Dependencies:** PR #1 complete

#### Files Changed

- `docs/refactoring/BASELINE_SNAPSHOT.md` (new file)

#### Implementation Steps

1. Create baseline snapshot document with:
   - Total test count: 290+
   - Library classification: 82.8% (24/29 correct)
   - Tag compliance: 89.7% (26/29 correct)
   - Module boundary violations: 39 (web app only)
   - Large files: 3 (cases-service: 2,082 LOC, discharge-orchestrator: 1,785 LOC, database.types.ts: 3,043 LOC)
   - Circular dependencies: 1 (services-discharge ↔ services-cases)
   - Overall compliance: 81.3%

2. List all libraries with tags and types

3. Document known issues from Phase 1 findings

#### Verification Steps

- [ ] Baseline document created
- [ ] All metrics captured
- [ ] Document committed to git

#### Rollback Plan

Delete document if not needed

#### Testing Requirements

None (documentation only)

---

## Phase 5: Architecture Optimization - Foundation

### PR #3: Create Service Interface Definitions

**Branch:** `phase-5/create-interfaces`  
**Estimated Effort:** 2-3 hours  
**Priority:** P0 (Blocker for Phase 7)  
**Risk Level:** LOW  
**Dependencies:** PR #2 complete

#### Files Changed

- `libs/services-shared/src/lib/interfaces/cases-service.interface.ts` (new)
- `libs/services-shared/src/lib/interfaces/call-executor.interface.ts` (new)
- `libs/services-shared/src/lib/interfaces/index.ts` (new)
- `libs/services-shared/src/index.ts` (updated)

#### Implementation Steps

1. Create interfaces directory:
   ```bash
   mkdir -p libs/services-shared/src/lib/interfaces
   ```

2. Create `cases-service.interface.ts`:
   ```typescript
   import type { SupabaseClientType } from "@odis-ai/types/supabase";
   import type { IngestPayload, CaseScheduleOptions, ScheduledDischargeCall } from "@odis-ai/types/services";
   import type { NormalizedEntities } from "@odis-ai/validators";

   export interface ICasesService {
     ingest(supabase: SupabaseClientType, userId: string, payload: IngestPayload): Promise<{
       caseId: string;
       entities: NormalizedEntities;
       scheduledCall: ScheduledDischargeCall | null;
     }>;
     
     scheduleCall(supabase: SupabaseClientType, userId: string, caseId: string, options: CaseScheduleOptions): Promise<ScheduledDischargeCall>;
     
     updateStatus(supabase: SupabaseClientType, caseId: string, status: string): Promise<void>;
   }
   ```

3. Create `call-executor.interface.ts`:
   ```typescript
   import type { SupabaseClientType } from "@odis-ai/types/supabase";
   import type { CallExecutionResult } from "@odis-ai/types/services";

   export interface ICallExecutor {
     executeScheduledCall(callId: string, supabase: SupabaseClientType): Promise<CallExecutionResult>;
   }
   ```

4. Create barrel exports in `interfaces/index.ts` and update main `index.ts`

5. Run type checking:
   ```bash
   pnpm nx typecheck services-shared
   ```

#### Verification Steps

- [ ] TypeScript compiles without errors
- [ ] Interfaces exported from services-shared
- [ ] No circular dependencies introduced

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-shared/src/
rm -rf libs/services-shared/src/lib/interfaces/
```

#### Testing Requirements

- TypeScript compilation: `pnpm nx typecheck services-shared`

---

### PR #4: Reclassify Service Library Tags

**Branch:** `phase-5/reclassify-tags`  
**Estimated Effort:** 30 minutes  
**Priority:** P1 (High)  
**Risk Level:** LOW  
**Dependencies:** PR #3 complete

#### Files Changed

- `libs/services-cases/project.json`
- `libs/services-discharge/project.json`
- `libs/services-shared/project.json`
- `eslint.config.js`

#### Implementation Steps

1. Update `libs/services-cases/project.json`:
   ```json
   {
     "tags": ["type:data-access", "scope:server", "platform:node"]
   }
   ```

2. Update `libs/services-discharge/project.json`:
   ```json
   {
     "tags": ["type:data-access", "scope:server", "platform:node"]
   }
   ```

3. Update `libs/services-shared/project.json`:
   ```json
   {
     "tags": ["type:util", "scope:server", "platform:node"]
   }
   ```

4. Remove `type:service` block from `eslint.config.js` (lines ~120-130)

5. Run lint verification:
   ```bash
   pnpm lint:all
   ```

#### Verification Steps

- [ ] All 3 service libraries have Nx 4-compliant tags
- [ ] No `type:service` tags remain
- [ ] ESLint passes with no new violations
- [ ] Import paths unchanged (verify with grep)

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-*/project.json eslint.config.js
```

#### Testing Requirements

- `pnpm lint:all` must pass
- `pnpm test:all` must pass (no breakage)

---

### PR #5: Fix Dual Scope Tags

**Branch:** `phase-5/fix-dual-scope-tags`  
**Estimated Effort:** 30 minutes  
**Priority:** P1 (High)  
**Risk Level:** LOW  
**Dependencies:** PR #4 complete

#### Files Changed

- `libs/extension-env/project.json`
- `libs/extension-shared/project.json`
- `libs/extension-storage/project.json`

#### Implementation Steps

1. Update `libs/extension-env/project.json`:
   ```json
   {
     "tags": ["type:config", "scope:extension", "platform:browser"]
   }
   ```
   (Remove `scope:shared`)

2. Update `libs/extension-shared/project.json`:
   ```json
   {
     "tags": ["type:util", "scope:extension", "platform:browser"]
   }
   ```
   (Remove `scope:shared`)

3. Update `libs/extension-storage/project.json`:
   ```json
   {
     "tags": ["type:util", "scope:extension", "platform:browser"]
   }
   ```
   (Remove `scope:shared`)

4. Run lint verification:
   ```bash
   pnpm lint:all
   ```

#### Verification Steps

- [ ] All 29 libraries have exactly 3 tags (type, scope, platform)
- [ ] No libraries have duplicate scope tags
- [ ] ESLint scope constraints enforce correctly
- [ ] Extension libraries can still import shared utilities

#### Rollback Plan

```bash
git checkout HEAD -- libs/extension-*/project.json
```

#### Testing Requirements

- `pnpm lint:all` must pass
- No import violations

---

## Phase 6: Architecture Optimization - Parallel Work

**NOTE:** PRs #6-21 can run in 3 parallel streams:

- **Stream A (File Splitting):** PRs #6-12 (7 PRs, 14-18 hours)
- **Stream B (Import Standardization):** PRs #13-16 (4 PRs, 4-6 hours)
- **Stream C (Can wait or run in parallel):** None (Streams A & B cover all work)

### Stream A: File Splitting

#### PR #6: Split cases-service.ts (Part 1: Extract Validator)

**Branch:** `phase-6a/split-cases-validator`  
**Estimated Effort:** 2-3 hours  
**Priority:** P2 (Medium-High)  
**Risk Level:** MEDIUM  
**Dependencies:** PR #5 complete

#### Files Changed

- `libs/services-cases/src/lib/validation/entity-validator.ts` (new)
- `libs/services-cases/src/lib/validation/index.ts` (new)
- `libs/services-cases/src/lib/cases-service.ts` (updated)

#### Implementation Steps

1. Create validation directory:
   ```bash
   mkdir -p libs/services-cases/src/lib/validation
   ```

2. Extract validation logic (~400 LOC) to `entity-validator.ts`

3. Update imports in `cases-service.ts` to use extracted validator

4. Create barrel export in `validation/index.ts`

5. Run tests:
   ```bash
   pnpm nx test services-cases
   ```

#### Verification Steps

- [ ] entity-validator.ts <500 LOC
- [ ] All tests passing (services-cases)
- [ ] No circular dependencies introduced
- [ ] cases-service.ts imports from new file correctly

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-cases/src/
rm -rf libs/services-cases/src/lib/validation/
```

#### Testing Requirements

- `pnpm nx test services-cases` must pass
- Verify LOC: `wc -l libs/services-cases/src/lib/validation/entity-validator.ts`

---

#### PR #7: Split cases-service.ts (Part 2: Extract Creator)

**Branch:** `phase-6a/split-cases-creator`  
**Estimated Effort:** 3-4 hours  
**Priority:** P2 (Medium-High)  
**Risk Level:** MEDIUM  
**Dependencies:** PR #6 complete

#### Files Changed

- `libs/services-cases/src/lib/creation/case-creator.ts` (new)
- `libs/services-cases/src/lib/creation/index.ts` (new)
- `libs/services-cases/src/lib/cases-service.ts` (updated)

#### Implementation Steps

1. Create creation directory:
   ```bash
   mkdir -p libs/services-cases/src/lib/creation
   ```

2. Extract creation logic (~600 LOC) to `case-creator.ts`

3. Update imports in `cases-service.ts`

4. Create barrel export

5. Run tests:
   ```bash
   pnpm nx test services-cases
   ```

#### Verification Steps

- [ ] case-creator.ts <700 LOC
- [ ] All tests passing
- [ ] No circular dependencies
- [ ] Imports correct

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-cases/src/
rm -rf libs/services-cases/src/lib/creation/
```

#### Testing Requirements

- `pnpm nx test services-cases` must pass

---

#### PR #8: Split cases-service.ts (Part 3: Extract Scheduler)

**Branch:** `phase-6a/split-cases-scheduler`  
**Estimated Effort:** 2-3 hours  
**Priority:** P2 (Medium-High)  
**Risk Level:** MEDIUM  
**Dependencies:** PR #7 complete

#### Files Changed

- `libs/services-cases/src/lib/scheduling/call-scheduler.ts` (new)
- `libs/services-cases/src/lib/scheduling/index.ts` (new)
- `libs/services-cases/src/lib/cases-service.ts` (updated)

#### Implementation Steps

1. Create scheduling directory

2. Extract scheduling logic (~400 LOC) to `call-scheduler.ts`

3. Update imports

4. Create barrel export

5. Run tests

#### Verification Steps

- [ ] call-scheduler.ts <500 LOC
- [ ] All tests passing
- [ ] No circular dependencies

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-cases/src/
rm -rf libs/services-cases/src/lib/scheduling/
```

#### Testing Requirements

- `pnpm nx test services-cases` must pass

---

#### PR #9: Split cases-service.ts (Part 4: Extract Status Manager)

**Branch:** `phase-6a/split-cases-status`  
**Estimated Effort:** 1-2 hours  
**Priority:** P2 (Medium-High)  
**Risk Level:** LOW  
**Dependencies:** PR #8 complete

#### Files Changed

- `libs/services-cases/src/lib/status/status-manager.ts` (new)
- `libs/services-cases/src/lib/status/index.ts` (new)
- `libs/services-cases/src/lib/cases-service.ts` (updated - now facade pattern ~200 LOC)

#### Implementation Steps

1. Create status directory

2. Extract status logic (~200-300 LOC) to `status-manager.ts`

3. Refactor `cases-service.ts` to facade pattern (coordinate sub-services)

4. Update barrel exports in main `index.ts`

5. Run tests

#### Verification Steps

- [ ] status-manager.ts <300 LOC
- [ ] cases-service.ts <300 LOC (now a facade)
- [ ] All tests passing
- [ ] Backward compatibility maintained (existing imports work)

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-cases/src/
rm -rf libs/services-cases/src/lib/status/
```

#### Testing Requirements

- `pnpm nx test services-cases` must pass
- Verify all consumers still work

---

#### PR #10: Split discharge-orchestrator.ts (Part 1: Email Orchestrator)

**Branch:** `phase-6a/split-discharge-email`  
**Estimated Effort:** 2-3 hours  
**Priority:** P2 (Medium-High)  
**Risk Level:** MEDIUM  
**Dependencies:** PR #5 complete (can run parallel with cases splits)

#### Files Changed

- `libs/services-discharge/src/lib/orchestrators/email-orchestrator.ts` (new)
- `libs/services-discharge/src/lib/orchestrators/index.ts` (new)
- `libs/services-discharge/src/lib/discharge-orchestrator.ts` (updated)

#### Implementation Steps

1. Create orchestrators directory:
   ```bash
   mkdir -p libs/services-discharge/src/lib/orchestrators
   ```

2. Extract email logic (~500 LOC) to `email-orchestrator.ts`

3. Update main orchestrator to use EmailOrchestrator

4. Run tests:
   ```bash
   pnpm nx test services-discharge
   ```

#### Verification Steps

- [ ] email-orchestrator.ts <600 LOC
- [ ] All tests passing
- [ ] No circular dependencies

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-discharge/src/
rm -rf libs/services-discharge/src/lib/orchestrators/
```

#### Testing Requirements

- `pnpm nx test services-discharge` must pass

---

#### PR #11: Split discharge-orchestrator.ts (Part 2: Call Orchestrator)

**Branch:** `phase-6a/split-discharge-call`  
**Estimated Effort:** 2-3 hours  
**Priority:** P2 (Medium-High)  
**Risk Level:** MEDIUM  
**Dependencies:** PR #10 complete

#### Files Changed

- `libs/services-discharge/src/lib/orchestrators/call-orchestrator.ts` (new)
- `libs/services-discharge/src/lib/orchestrators/index.ts` (updated)
- `libs/services-discharge/src/lib/discharge-orchestrator.ts` (updated)

#### Implementation Steps

1. Extract call logic (~400 LOC) to `call-orchestrator.ts`

2. Update main orchestrator

3. Update barrel exports

4. Run tests

#### Verification Steps

- [ ] call-orchestrator.ts <500 LOC
- [ ] All tests passing

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-discharge/src/
```

#### Testing Requirements

- `pnpm nx test services-discharge` must pass

---

#### PR #12: Split discharge-orchestrator.ts (Part 3: Summary Orchestrator + Refactor Main)

**Branch:** `phase-6a/split-discharge-summary-final`  
**Estimated Effort:** 3-4 hours  
**Priority:** P2 (Medium-High)  
**Risk Level:** MEDIUM  
**Dependencies:** PR #11 complete

#### Files Changed

- `libs/services-discharge/src/lib/orchestrators/summary-orchestrator.ts` (new)
- `libs/services-discharge/src/lib/orchestrators/index.ts` (updated)
- `libs/services-discharge/src/lib/discharge-orchestrator.ts` (updated - now facade ~300 LOC)
- `libs/services-discharge/src/index.ts` (updated - backward compatibility)

#### Implementation Steps

1. Extract summary logic (~400 LOC) to `summary-orchestrator.ts`

2. Refactor main orchestrator to facade pattern (coordinate sub-orchestrators)

3. Update barrel exports for backward compatibility

4. Run tests

#### Verification Steps

- [ ] summary-orchestrator.ts <500 LOC
- [ ] discharge-orchestrator.ts <400 LOC (now a facade)
- [ ] All tests passing
- [ ] Backward compatibility maintained

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-discharge/src/
```

#### Testing Requirements

- `pnpm nx test services-discharge` must pass
- Verify existing imports work

---

### Stream B: Import Standardization

#### PR #13: Fix Lazy-Load Violations (Batch 1-10)

**Branch:** `phase-6b/fix-lazy-load-batch-1`  
**Estimated Effort:** 1-1.5 hours  
**Priority:** P2 (Medium)  
**Risk Level:** LOW  
**Dependencies:** PR #5 complete (can run parallel with file splits)

#### Files Changed

- First 10 files from web app with lazy-load violations

#### Implementation Steps

1. Identify first 10 files with violations:
   ```bash
   pnpm lint 2>&1 | grep -B2 "Static imports of lazy-loaded" | grep "error" | cut -d':' -f1 | sort -u | head -10 > batch-1.txt
   ```

2. For each file, determine context:
   - If in `/api/` route: Convert to dynamic import
   - If elsewhere: Keep static import (remove from lazy-load config)

3. Update imports file-by-file

4. Run lint after each change:
   ```bash
   pnpm nx lint web
   ```

#### Verification Steps

- [ ] 10 violations fixed
- [ ] Lint passes (no new violations)
- [ ] Build succeeds

#### Rollback Plan

```bash
git checkout HEAD -- apps/web/src/
```

#### Testing Requirements

- `pnpm nx lint web` must pass
- `pnpm nx build web` must succeed

---

#### PR #14: Fix Lazy-Load Violations (Batch 11-20)

**Branch:** `phase-6b/fix-lazy-load-batch-2`  
**Estimated Effort:** 1-1.5 hours  
**Priority:** P2 (Medium)  
**Risk Level:** LOW  
**Dependencies:** PR #13 complete

#### Files Changed

- Files 11-20 from web app with lazy-load violations

#### Implementation Steps

Same as PR #13, files 11-20

#### Verification Steps

- [ ] 10 violations fixed
- [ ] Lint passes

#### Rollback Plan

```bash
git checkout HEAD -- apps/web/src/
```

#### Testing Requirements

- `pnpm nx lint web` must pass

---

#### PR #15: Fix Lazy-Load Violations (Batch 21-30)

**Branch:** `phase-6b/fix-lazy-load-batch-3`  
**Estimated Effort:** 1-1.5 hours  
**Priority:** P2 (Medium)  
**Risk Level:** LOW  
**Dependencies:** PR #14 complete

#### Files Changed

- Files 21-30 from web app with lazy-load violations

#### Implementation Steps

Same as PR #13, files 21-30

#### Verification Steps

- [ ] 10 violations fixed
- [ ] Lint passes

#### Rollback Plan

```bash
git checkout HEAD -- apps/web/src/
```

#### Testing Requirements

- `pnpm nx lint web` must pass

---

#### PR #16: Fix Lazy-Load Violations (Batch 31-39 + Verify)

**Branch:** `phase-6b/fix-lazy-load-batch-4-final`  
**Estimated Effort:** 1-1.5 hours  
**Priority:** P2 (Medium)  
**Risk Level:** LOW  
**Dependencies:** PR #15 complete

#### Files Changed

- Files 31-39 from web app with lazy-load violations

#### Implementation Steps

1. Fix final 9 violations

2. Run full verification:
   ```bash
   pnpm lint:all | grep "lazy-loaded"  # Should be empty
   ```

3. Check bundle sizes:
   ```bash
   pnpm build
   ls -lh apps/web/.next/static/chunks/
   ```

#### Verification Steps

- [ ] All 39 violations fixed
- [ ] Zero lazy-load lint errors
- [ ] Bundle sizes acceptable
- [ ] All tests passing

#### Rollback Plan

```bash
git checkout HEAD -- apps/web/src/
```

#### Testing Requirements

- `pnpm lint:all` must pass with zero lazy-load violations
- `pnpm test:all` must pass

---

## Phase 7: DI Implementation

**NOTE:** All PRs in Phase 7 are sequential (must wait for Phase 6 completion)

### PR #17: Implement ICasesService in services-cases

**Branch:** `phase-7/implement-icases-service`  
**Estimated Effort:** 2-3 hours  
**Priority:** P1 (High)  
**Risk Level:** MEDIUM  
**Dependencies:** PRs #6-9 complete (cases-service split), PR #3 (interfaces created)

#### Files Changed

- `libs/services-cases/src/lib/cases-service.ts` (updated)

#### Implementation Steps

1. Import ICasesService interface:
   ```typescript
   import type { ICasesService } from "@odis-ai/services-shared";
   ```

2. Add type annotation to CasesService:
   ```typescript
   export const CasesService: ICasesService = {
     async ingest(supabase, userId, payload) {
       // Existing implementation
     },
     // ... other methods
   };
   ```

3. Run type checking:
   ```bash
   pnpm nx typecheck services-cases
   ```

4. Run tests:
   ```bash
   pnpm nx test services-cases
   ```

#### Verification Steps

- [ ] CasesService implements ICasesService
- [ ] TypeScript compiles without errors
- [ ] All tests passing
- [ ] No circular dependencies introduced

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-cases/src/lib/cases-service.ts
```

#### Testing Requirements

- `pnpm nx typecheck services-cases` must pass
- `pnpm nx test services-cases` must pass

---

### PR #18: Implement ICallExecutor in services-discharge

**Branch:** `phase-7/implement-icall-executor`  
**Estimated Effort:** 1-2 hours  
**Priority:** P1 (High)  
**Risk Level:** MEDIUM  
**Dependencies:** PR #3 (interfaces created), PRs #10-12 (discharge split)

#### Files Changed

- `libs/services-discharge/src/lib/call-executor.ts` (updated)

#### Implementation Steps

1. Import ICallExecutor interface:
   ```typescript
   import type { ICallExecutor } from "@odis-ai/services-shared";
   ```

2. Add type annotation:
   ```typescript
   export const CallExecutor: ICallExecutor = {
     async executeScheduledCall(callId, supabase) {
       // Existing implementation
     },
   };
   ```

3. Run type checking

4. Run tests

#### Verification Steps

- [ ] CallExecutor implements ICallExecutor
- [ ] TypeScript compiles
- [ ] Tests passing

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-discharge/src/lib/call-executor.ts
```

#### Testing Requirements

- `pnpm nx typecheck services-discharge` must pass
- `pnpm nx test services-discharge` must pass

---

### PR #19: Update DischargeOrchestrator with DI

**Branch:** `phase-7/update-orchestrator-di`  
**Estimated Effort:** 3-4 hours  
**Priority:** P1 (High)  
**Risk Level:** HIGH  
**Dependencies:** PR #17 (ICasesService implemented)

#### Files Changed

- `libs/services-discharge/src/lib/discharge-orchestrator.ts` (major update)

#### Implementation Steps

1. Import ICasesService interface

2. Create factory function with DI:
   ```typescript
   export function createDischargeOrchestrator(casesService: ICasesService) {
     return {
       async orchestrate(request, context) {
         // Use injected casesService instead of dynamic import
         const result = await casesService.ingest(/* ... */);
         // ...
       }
     };
   }
   ```

3. Replace 7 dynamic imports with `casesService` calls

4. Provide backward-compatible default export with lazy-loading

5. Run tests with mocks:
   ```bash
   pnpm nx test services-discharge
   ```

#### Verification Steps

- [ ] No more dynamic imports of services-cases
- [ ] Factory function works with injected dependencies
- [ ] Default export maintains backward compatibility
- [ ] All tests passing

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-discharge/src/lib/discharge-orchestrator.ts
```

#### Testing Requirements

- `pnpm nx test services-discharge` must pass
- Verify mocks work correctly

---

### PR #20: Update CasesService with DI

**Branch:** `phase-7/update-cases-service-di`  
**Estimated Effort:** 2-3 hours  
**Priority:** P1 (High)  
**Risk Level:** MEDIUM  
**Dependencies:** PR #18 (ICallExecutor implemented)

#### Files Changed

- `libs/services-cases/src/lib/cases-service.ts` (updated)
- `libs/services-cases/src/lib/scheduling/call-scheduler.ts` (updated)

#### Implementation Steps

1. Update places where CallExecutor is used (2 locations based on Phase 1 findings)

2. Use ICallExecutor interface instead of dynamic import

3. Run tests

#### Verification Steps

- [ ] No more dynamic imports of services-discharge
- [ ] Tests passing
- [ ] Interface used correctly

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-cases/src/
```

#### Testing Requirements

- `pnpm nx test services-cases` must pass

---

### PR #21: Remove Dynamic Imports

**Branch:** `phase-7/remove-dynamic-imports`  
**Estimated Effort:** 1-2 hours  
**Priority:** P1 (High)  
**Risk Level:** LOW  
**Dependencies:** PRs #19, #20 complete

#### Files Changed

- Any remaining files with dynamic imports between services-cases and services-discharge

#### Implementation Steps

1. Search for remaining dynamic imports:
   ```bash
   grep -r "await import.*services-cases" libs/services-discharge/
   grep -r "await import.*services-discharge" libs/services-cases/
   ```

2. Remove any remaining dynamic imports

3. Verify no circular dependencies:
   ```bash
   pnpm nx graph
   ```

#### Verification Steps

- [ ] Zero dynamic imports between services
- [ ] Nx graph shows no circular dependencies
- [ ] All tests passing

#### Rollback Plan

Revert PRs #19, #20 if circular dependency persists

#### Testing Requirements

- `pnpm test:all` must pass
- `pnpm nx graph` must show no cycles

---

### PR #22: Verify Zero Circular Dependencies

**Branch:** `phase-7/verify-no-circular-deps`  
**Estimated Effort:** 30 minutes  
**Priority:** P0 (Blocker)  
**Risk Level:** LOW  
**Dependencies:** PR #21 complete

#### Files Changed

None (verification only)

#### Implementation Steps

1. Generate dependency graph:
   ```bash
   pnpm nx graph --file=docs/refactoring/post-di-graph.json
   ```

2. Search for circular dependencies:
   ```bash
   # Should return nothing
   cat docs/refactoring/post-di-graph.json | grep -i "circular"
   ```

3. Manual verification in Nx graph UI:
   ```bash
   pnpm nx graph
   ```

4. Document results

#### Verification Steps

- [ ] Nx graph shows zero circular dependencies
- [ ] services-discharge → services-shared → (no back-reference)
- [ ] services-cases → services-shared → (no back-reference)
- [ ] Graph comparison shows circular dep eliminated

#### Rollback Plan

N/A (verification only)

#### Testing Requirements

- Visual inspection of Nx graph
- No "circular" warnings in graph output

---

## Phase 8: Test Updates

**NOTE:** All PRs in Phase 8 are sequential (must wait for Phase 7 completion)

### PR #23: Update Service Tests for DI Pattern

**Branch:** `phase-8/update-service-tests`  
**Estimated Effort:** 2-3 hours  
**Priority:** P1 (High)  
**Risk Level:** MEDIUM  
**Dependencies:** PRs #17-22 complete (all DI implemented)

#### Files Changed

- `libs/services-cases/src/**/*.test.ts` (updated)
- `libs/services-discharge/src/**/*.test.ts` (updated)

#### Implementation Steps

1. Update tests to use interface mocks:
   ```typescript
   import { describe, it, expect, vi } from "vitest";
   import type { ICasesService } from "@odis-ai/services-shared";
   
   describe("DischargeOrchestrator with DI", () => {
     it("should use injected CasesService", async () => {
       const mockCasesService: ICasesService = {
         ingest: vi.fn().mockResolvedValue({ caseId: "123", entities: {}, scheduledCall: null }),
         scheduleCall: vi.fn(),
         updateStatus: vi.fn(),
       };
       
       // Test with mock
     });
   });
   ```

2. Update all service tests to use mocks

3. Run tests:
   ```bash
   pnpm nx test services-cases
   pnpm nx test services-discharge
   ```

#### Verification Steps

- [ ] All service tests passing
- [ ] Tests use interface mocks
- [ ] Coverage maintained (check report)

#### Rollback Plan

```bash
git checkout HEAD -- libs/services-*/src/**/*.test.ts
```

#### Testing Requirements

- `pnpm nx test services-cases` must pass
- `pnpm nx test services-discharge` must pass
- Coverage reports show no drops

---

### PR #24: Add Tests for Split Files

**Branch:** `phase-8/add-split-file-tests`  
**Estimated Effort:** 3-4 hours  
**Priority:** P1 (High)  
**Risk Level:** MEDIUM  
**Dependencies:** PRs #6-12 complete (files split), PR #23 (service tests updated)

#### Files Changed

- `libs/services-cases/src/lib/validation/entity-validator.test.ts` (new)
- `libs/services-cases/src/lib/creation/case-creator.test.ts` (new)
- `libs/services-cases/src/lib/scheduling/call-scheduler.test.ts` (new)
- `libs/services-cases/src/lib/status/status-manager.test.ts` (new)
- `libs/services-discharge/src/lib/orchestrators/email-orchestrator.test.ts` (new)
- `libs/services-discharge/src/lib/orchestrators/call-orchestrator.test.ts` (new)
- `libs/services-discharge/src/lib/orchestrators/summary-orchestrator.test.ts` (new)

#### Implementation Steps

1. Create test file for each split file

2. Write unit tests covering:
   - Happy path
   - Error handling
   - Edge cases

3. Run tests:
   ```bash
   pnpm nx test services-cases
   pnpm nx test services-discharge
   ```

4. Generate coverage report:
   ```bash
   pnpm nx test services-cases --coverage
   pnpm nx test services-discharge --coverage
   ```

#### Verification Steps

- [ ] 7 new test files created
- [ ] All new tests passing
- [ ] Coverage targets met (80%+ for services)
- [ ] No existing tests broken

#### Rollback Plan

```bash
rm -f libs/services-*/src/**/*.test.ts
git checkout HEAD -- libs/services-*/src/**/*.test.ts
```

#### Testing Requirements

- All new tests must pass
- Coverage: 80%+ for services-cases, 80%+ for services-discharge

---

### PR #25: Add Interface Implementation Tests

**Branch:** `phase-8/add-interface-tests`  
**Estimated Effort:** 1-2 hours  
**Priority:** P2 (Medium)  
**Risk Level:** LOW  
**Dependencies:** PR #24 complete

#### Files Changed

- `libs/services-shared/src/lib/interfaces/cases-service.interface.test.ts` (new)
- `libs/services-shared/src/lib/interfaces/call-executor.interface.test.ts` (new)

#### Implementation Steps

1. Create tests verifying interfaces are implemented correctly:
   ```typescript
   import { describe, it, expect } from "vitest";
   import type { ICasesService } from "./cases-service.interface";
   import { CasesService } from "@odis-ai/services-cases";
   
   describe("ICasesService implementation", () => {
     it("CasesService implements ICasesService", () => {
       const service: ICasesService = CasesService;
       expect(service.ingest).toBeDefined();
       expect(service.scheduleCall).toBeDefined();
       expect(service.updateStatus).toBeDefined();
     });
   });
   ```

2. Run tests:
   ```bash
   pnpm nx test services-shared
   ```

#### Verification Steps

- [ ] Interface tests passing
- [ ] Implementations correctly typed

#### Rollback Plan

```bash
rm -f libs/services-shared/src/lib/interfaces/*.test.ts
```

#### Testing Requirements

- `pnpm nx test services-shared` must pass

---

### PR #26: Verify Full Test Suite Passing

**Branch:** `phase-8/verify-full-suite`  
**Estimated Effort:** 30 minutes  
**Priority:** P0 (Blocker)  
**Risk Level:** LOW  
**Dependencies:** PRs #23-25 complete

#### Files Changed

None (verification only)

#### Implementation Steps

1. Run full test suite:
   ```bash
   pnpm test:all
   ```

2. Generate coverage reports:
   ```bash
   pnpm test:all --coverage
   ```

3. Count total tests:
   ```bash
   pnpm test:all 2>&1 | grep "Test Files"
   ```

4. Document test counts (should be 340+ total, up from 290+)

#### Verification Steps

- [ ] All 340+ tests passing (290 existing + ~50 new)
- [ ] Coverage maintained: validators 95%+, services 80%+
- [ ] No test failures
- [ ] No flaky tests

#### Rollback Plan

N/A (verification only)

#### Testing Requirements

- `pnpm test:all` must pass
- Total test count: 340+

---

## Phase 9: Final Verification & Documentation

### PR #27: Run Full Verification Suite

**Branch:** `phase-9/final-verification`  
**Estimated Effort:** 1-2 hours  
**Priority:** P0 (Blocker)  
**Risk Level:** LOW  
**Dependencies:** All previous PRs complete

#### Files Changed

- `docs/refactoring/FINAL_COMPLIANCE_REPORT.md` (new)

#### Implementation Steps

1. Run all verification commands:
   ```bash
   # Tests
   pnpm test:all
   
   # Linting
   pnpm lint:all
   
   # Type checking
   pnpm typecheck:all
   
   # Dependency graph
   pnpm nx graph --file=docs/refactoring/final-graph.json
   
   # Build
   pnpm build:all
   ```

2. Verify all Phase 1 issues resolved:
   - ✅ Circular dependencies: 0 (was 1)
   - ✅ Library classification: 100% (was 82.8%)
   - ✅ Tag compliance: 100% (was 89.7%)
   - ✅ Module boundary violations: 0 (was 39)
   - ✅ Large files: 1 (database.types.ts, was 3)
   - ✅ Overall compliance: 95%+ (was 81.3%)

3. Generate final compliance report with metrics comparison

4. Compare baseline vs final:
   - Test count: 340+ (was 290+)
   - File sizes: All <600 LOC except database.types.ts
   - Circular deps: 0 (was 1)

#### Verification Steps

- [ ] All tests passing (340+)
- [ ] Zero circular dependencies
- [ ] 95%+ Nx compliance
- [ ] Zero module boundary violations
- [ ] All large files split
- [ ] All 5 Phase 1 issues resolved

#### Rollback Plan

N/A (verification only)

#### Testing Requirements

- All verification commands must pass
- Compliance report shows 95%+ overall

---

### PR #28: Update CLAUDE.md with New Patterns

**Branch:** `phase-9/update-claude-md`  
**Estimated Effort:** 30 minutes  
**Priority:** P2 (Medium)  
**Risk Level:** LOW  
**Dependencies:** PR #27 complete

#### Files Changed

- `CLAUDE.md` (updated)

#### Implementation Steps

1. Add section on DI pattern usage:
   ```markdown
   ### Dependency Injection Pattern
   
   Services use interface-based DI for testability:
   
   \`\`\`typescript
   import { createDischargeOrchestrator } from "@odis-ai/services-discharge";
   import { CasesService } from "@odis-ai/services-cases";
   
   const orchestrator = createDischargeOrchestrator(CasesService);
   \`\`\`
   
   For testing, inject mocks:
   
   \`\`\`typescript
   const mockCasesService: ICasesService = { /* mocks */ };
   const orchestrator = createDischargeOrchestrator(mockCasesService);
   \`\`\`
   ```

2. Document file splitting pattern

3. Update import patterns section

4. Add examples

#### Verification Steps

- [ ] Documentation updated
- [ ] Examples correct
- [ ] Patterns clearly explained

#### Rollback Plan

```bash
git checkout HEAD -- CLAUDE.md
```

#### Testing Requirements

None (documentation only)

---

## Dependency Graph

### Visual Representation

```
Phase 4 (Validation)
└── PR #1: Validate Baseline (1-2h)
    └── PR #2: Document State (1h)

Phase 5 (Foundation) - SEQUENTIAL
└── PR #3: Create Interfaces (2-3h)
    └── PR #4: Reclassify Tags (30m)
        └── PR #5: Fix Dual Scope Tags (30m)

Phase 6 (Parallel Work) - 3 STREAMS
├── Stream A: File Splitting (14-18h)
│   ├── PR #6: Split cases-service (Validator) (2-3h)
│   ├── PR #7: Split cases-service (Creator) (3-4h)
│   ├── PR #8: Split cases-service (Scheduler) (2-3h)
│   ├── PR #9: Split cases-service (Status) (1-2h)
│   ├── PR #10: Split discharge (Email) (2-3h)
│   ├── PR #11: Split discharge (Call) (2-3h)
│   └── PR #12: Split discharge (Summary + Main) (3-4h)
│
├── Stream B: Import Standardization (4-6h)
│   ├── PR #13: Fix Lazy-Load Batch 1 (1-1.5h)
│   ├── PR #14: Fix Lazy-Load Batch 2 (1-1.5h)
│   ├── PR #15: Fix Lazy-Load Batch 3 (1-1.5h)
│   └── PR #16: Fix Lazy-Load Batch 4 (1-1.5h)
│
└── (Streams A & B merge here)

Phase 7 (DI Implementation) - SEQUENTIAL
└── PR #17: Implement ICasesService (2-3h)
    └── PR #18: Implement ICallExecutor (1-2h)
        └── PR #19: Update Orchestrator DI (3-4h)
            └── PR #20: Update CasesService DI (2-3h)
                └── PR #21: Remove Dynamic Imports (1-2h)
                    └── PR #22: Verify No Circular Deps (30m)

Phase 8 (Test Updates) - SEQUENTIAL
└── PR #23: Update Service Tests (2-3h)
    └── PR #24: Add Split File Tests (3-4h)
        └── PR #25: Add Interface Tests (1-2h)
            └── PR #26: Verify Full Suite (30m)

Phase 9 (Verification) - SEQUENTIAL
└── PR #27: Final Verification (1-2h)
    └── PR #28: Update CLAUDE.md (30m)
```

### Critical Path (21-31 hours)

**Longest sequential chain:**
```
Phase 4: 2-3h
  ↓
Phase 5: 3-5h
  ↓
Phase 6: 14-18h (Stream A max, runs parallel with B)
  ↓
Phase 7: 8-12h
  ↓
Phase 8: 4-6h
  ↓
Phase 9: 1-2h

TOTAL: 32-46h (critical path if no parallel execution)
```

**With parallelization:**
```
Phase 4: 2-3h
  ↓
Phase 5: 3-5h
  ↓
Phase 6: 14-18h (Streams A & B run parallel, use max)
  ↓
Phase 7: 8-12h
  ↓
Phase 8: 4-6h
  ↓
Phase 9: 1-2h

TOTAL: 32-46h (same as critical path)
```

**Note:** Parallelization saves time in execution (2 people working) but critical path remains the same. Main benefit is calendar time reduction.

---

## Timeline & Milestones

### Weekly Breakdown

**Assumptions:**
- 15-20 hours per week capacity
- 2-3 developers can work in parallel during Phase 6

#### Week 1: Foundation (8-11 hours)

**Days 1-2:**
- PR #1: Validate Baseline (1-2h)
- PR #2: Document State (1h)
- PR #3: Create Interfaces (2-3h)

**Days 3-5:**
- PR #4: Reclassify Tags (30m)
- PR #5: Fix Dual Scope Tags (30m)
- **Checkpoint 1:** Foundation Complete

**Milestone:** Foundation work complete, ready for parallel execution

---

#### Week 2: Parallel Work (14-18 hours with 2-3 devs)

**Developer A (Stream A):**
- PR #6: Split cases validator (2-3h)
- PR #7: Split cases creator (3-4h)
- PR #8: Split cases scheduler (2-3h)
- PR #9: Split cases status (1-2h)

**Developer B (Stream A):**
- PR #10: Split discharge email (2-3h)
- PR #11: Split discharge call (2-3h)
- PR #12: Split discharge summary + main (3-4h)

**Developer C (Stream B):**
- PR #13-16: Fix all lazy-load violations (4-6h)

**Checkpoint 2:** All file splitting complete, imports standardized

**Milestone:** Parallel work complete, ready for DI implementation

---

#### Week 3: DI Implementation (8-12 hours)

**Days 1-2:**
- PR #17: Implement ICasesService (2-3h)
- PR #18: Implement ICallExecutor (1-2h)

**Days 3-5:**
- PR #19: Update Orchestrator DI (3-4h)
- PR #20: Update CasesService DI (2-3h)
- PR #21: Remove Dynamic Imports (1-2h)
- PR #22: Verify No Circular Deps (30m)

**Checkpoint 3:** Circular dependency eliminated

**Milestone:** DI pattern fully implemented, zero circular dependencies

---

#### Week 4: Tests & Verification (5-8 hours)

**Days 1-3:**
- PR #23: Update Service Tests (2-3h)
- PR #24: Add Split File Tests (3-4h)
- PR #25: Add Interface Tests (1-2h)
- PR #26: Verify Full Suite (30m)

**Days 4-5:**
- PR #27: Final Verification (1-2h)
- PR #28: Update CLAUDE.md (30m)

**Checkpoint 4:** All tests passing, compliance verified

**Milestone:** Refactoring complete, 95%+ compliance achieved

---

### Checkpoint Definitions

#### Checkpoint 1: Foundation Complete

**When:** End of Week 1  
**Criteria:**
- [ ] Interfaces created in services-shared
- [ ] All service libraries have Nx 4-compliant tags
- [ ] All extension libraries have single scope tags
- [ ] Zero new lint violations
- [ ] TypeScript compiles

**Blocker:** If any criteria not met, fix before Phase 6

---

#### Checkpoint 2: Parallel Work Complete

**When:** End of Week 2  
**Criteria:**
- [ ] All 7 file splits complete
- [ ] All 39 lazy-load violations fixed
- [ ] All tests passing (290+)
- [ ] No circular dependencies introduced
- [ ] Backward compatibility maintained

**Blocker:** If file splits break tests, rollback and fix before Phase 7

---

#### Checkpoint 3: Circular Dependency Eliminated

**When:** End of Week 3  
**Criteria:**
- [ ] Zero circular dependencies (nx graph verification)
- [ ] Services use constructor injection
- [ ] Interfaces in services-shared
- [ ] All service tests passing
- [ ] Mock implementations working

**Blocker:** If circular dependency persists, revert Phase 7 and redesign

---

#### Checkpoint 4: All Tests Passing

**When:** End of Week 4  
**Criteria:**
- [ ] All 340+ tests passing
- [ ] Coverage maintained: validators 95%+, services 80%+
- [ ] Zero circular dependencies
- [ ] 95%+ Nx compliance
- [ ] Zero module boundary violations
- [ ] All large files split

**Blocker:** If any test failures or compliance <95%, address before declaring complete

---

### Review Gates

#### Gate 1: Foundation Design Review

**When:** After PR #3 (interfaces created)  
**Reviewers:** Architecture Lead + Senior Engineer  
**Duration:** 30 minutes

**Review Items:**
- Interface definitions correctness
- Type safety
- Backward compatibility plan

**Go/No-Go Decision:**
- **GO:** Interfaces approved, proceed to tag fixes
- **NO-GO:** Revise interfaces, repeat review

---

#### Gate 2: Parallel Work Kickoff

**When:** After Checkpoint 1 (Foundation complete)  
**Reviewers:** Project Manager + Tech Leads  
**Duration:** 30 minutes

**Review Items:**
- Resource allocation (2-3 developers available?)
- Branch strategy confirmed
- Ownership assignments clear

**Go/No-Go Decision:**
- **GO:** Resources allocated, proceed with parallel work
- **NO-GO:** Run sequentially if resources unavailable

---

#### Gate 3: DI Implementation Review

**When:** After PR #19 (Orchestrator DI updated)  
**Reviewers:** Architecture Lead + DI Implementation Owner  
**Duration:** 45 minutes

**Review Items:**
- DI pattern correctly implemented
- No performance regressions
- Mock testing works
- Circular dependency truly eliminated

**Go/No-Go Decision:**
- **GO:** DI pattern approved, continue to PR #20
- **NO-GO:** Fix issues, repeat review

---

#### Gate 4: Final Sign-Off

**When:** After PR #27 (Final verification complete)  
**Reviewers:** Project Manager + Architecture Lead + Senior Engineer + QA  
**Duration:** 1 hour

**Review Items:**
- All success metrics met (see Section 11)
- Compliance report shows 95%+
- All tests passing
- Documentation updated
- No known issues

**Go/No-Go Decision:**
- **GO:** Refactoring complete, merge to main
- **NO-GO:** Address issues, repeat verification

---

## Risk Matrix

### Per-PR Risks with Mitigation

| PR # | Risk | Severity | Probability | Mitigation | Rollback Trigger |
|------|------|----------|-------------|------------|------------------|
| **Phase 4: Validation** |
| 1 | Tests failing | MEDIUM | LOW | Fix tests before proceeding | Any test failures |
| 2 | Incomplete docs | LOW | LOW | Review checklist | N/A |
| **Phase 5: Foundation** |
| 3 | Interface design flawed | HIGH | MEDIUM | Architecture review gate | Type errors after implementing |
| 4 | Tag changes break imports | LOW | LOW | Import paths unaffected by tags | New lint violations |
| 5 | Dual scope removal breaks boundaries | LOW | LOW | ESLint enforces correctly | Extension libs can't import shared |
| **Phase 6: Parallel Work - Stream A (File Splitting)** |
| 6-9 | File split breaks tests | HIGH | MEDIUM | One file at a time, test after each | Any test failures |
| 10-12 | Orchestrator split breaks workflow | HIGH | MEDIUM | Incremental extraction, test after each | Integration tests fail |
| **Phase 6: Parallel Work - Stream B (Import Std)** |
| 13-16 | Import changes break build | MEDIUM | LOW | Batch processing, test after each batch | Build failures |
| **Phase 7: DI Implementation** |
| 17-18 | Interface impl incorrect | MEDIUM | MEDIUM | Type checking catches most issues | Type errors, test failures |
| 19 | Orchestrator DI breaks workflow | HIGH | MEDIUM | Extensive testing with mocks | Circular dep reappears, tests fail |
| 20 | CasesService DI breaks scheduling | MEDIUM | MEDIUM | Test with mocks | Tests fail |
| 21 | Circular dep not eliminated | CRITICAL | LOW | Nx graph verification | Circular dep remains after removal |
| 22 | False positive (circular dep hidden) | LOW | LOW | Manual graph inspection | N/A |
| **Phase 8: Test Updates** |
| 23 | Test updates introduce flaky tests | MEDIUM | MEDIUM | Run tests multiple times | Flaky tests detected |
| 24 | New tests insufficient | LOW | MEDIUM | Coverage reports guide | Coverage drops below 80% |
| 25 | Interface tests miss edge cases | LOW | LOW | Review with senior engineer | N/A |
| 26 | Full suite has intermittent failures | MEDIUM | LOW | Identify and fix flaky tests | >2% test failure rate |
| **Phase 9: Verification** |
| 27 | Compliance calculation error | LOW | LOW | Manual verification of metrics | N/A |
| 28 | Documentation incomplete | LOW | MEDIUM | Review checklist | N/A |

---

### Escalation Procedures

#### Level 1: PR Owner (Self-Resolution)

**Trigger:** Minor issues during PR implementation
- Type errors
- Individual test failures
- Lint violations

**Action:** Fix within PR, re-run verification

**Escalate to Level 2 if:**
- Can't resolve within 2 hours
- Issue affects other PRs
- Requires design change

---

#### Level 2: Tech Lead (Team Resolution)

**Trigger:** Issues affecting multiple PRs or requiring design decisions
- Pattern issues across multiple files
- Integration failures between PRs
- Performance regressions

**Action:**
- Review with team
- Coordinate fix across PRs
- Update design if needed

**Escalate to Level 3 if:**
- Can't resolve within 1 day
- Requires architecture change
- Affects critical path

---

#### Level 3: Architecture Lead (Architecture Review)

**Trigger:** Fundamental architecture issues
- Circular dependency persists after DI
- Interface design flawed
- Breaking changes required

**Action:**
- Call architecture review meeting
- Evaluate alternatives
- May require reverting multiple PRs
- Create revised design

**Escalate to Level 4 if:**
- Solution requires >1 week
- Multiple approaches all problematic
- Risk to overall refactoring success

---

#### Level 4: Project Halt (Executive Decision)

**Trigger:** Critical blockers threatening project success
- Design fundamentally flawed
- Unforeseen technical constraints
- Timeline extends beyond acceptable

**Action:**
- Halt all PR work
- Executive review meeting
- Evaluate:
  - Continue with revised approach
  - Partial implementation (only low-risk PRs)
  - Full rollback

---

### Halt Triggers

**Automatic Halt Conditions (stop all work immediately):**

1. **>10% Test Failures:** If any PR causes >10% of tests to fail
2. **Circular Dependency Reappears:** If Phase 7 fails to eliminate circular dep
3. **Build Completely Broken:** If any PR breaks production build
4. **Data Loss Risk:** If any changes risk data corruption

**Manual Halt Consideration (review with team):**

1. **Timeline Slip >2 Weeks:** If critical path extends beyond estimate by >2 weeks
2. **Multiple PRs Failing:** If >3 PRs in a row require rollback
3. **Resource Constraints:** If key developers unavailable for extended period
4. **Scope Creep:** If refactoring scope expands beyond Phase 1 findings

---

## Success Criteria

### Overall Success Metrics

| Metric | Baseline | Target | Measurement Command |
|--------|----------|--------|-------------------|
| **Circular Dependencies** | 1 | 0 | `pnpm nx graph --file=graph.json && cat graph.json \| grep -i "circular"` |
| **Library Classification** | 82.8% (24/29) | 100% (29/29) | Count Nx 4-compliant tags in all project.json |
| **Tag Compliance** | 89.7% (26/29) | 100% (29/29) | Count single-scope-tagged libs |
| **Module Boundary Violations** | 39 | 0 | `pnpm lint:all \| grep "lazy-loaded"` |
| **Large Files (>1500 LOC)** | 3 | 1 | `find libs/ -name "*.ts" ! -name "database.types.ts" -exec wc -l {} \; \| awk '$1 > 1500'` |
| **Test Count** | 290+ | 340+ | `pnpm test:all 2>&1 \| grep "Test Files"` |
| **Test Pass Rate** | 100% | 100% | `pnpm test:all` |
| **Overall Compliance** | 81.3% | 95%+ | Recalculate from compliance matrix |

---

### Per-Phase Success Criteria

#### Phase 4 Success (Validation):
- [ ] All 290+ tests passing
- [ ] Baseline documented
- [ ] Rollback point created

#### Phase 5 Success (Foundation):
- [ ] Interfaces created in services-shared
- [ ] All 3 service libs reclassified (type:data-access or type:util)
- [ ] All 3 extension libs have single scope tag
- [ ] TypeScript compiles

#### Phase 6 Success (Parallel Work):
- [ ] All 7 files split (<600 LOC each)
- [ ] All 39 lazy-load violations fixed
- [ ] All tests passing
- [ ] Backward compatibility maintained

#### Phase 7 Success (DI):
- [ ] Zero circular dependencies
- [ ] Services use interface-based DI
- [ ] All tests passing

#### Phase 8 Success (Tests):
- [ ] All 340+ tests passing
- [ ] Coverage: validators 95%+, services 80%+
- [ ] New tests for split files + interfaces

#### Phase 9 Success (Verification):
- [ ] All metrics at target
- [ ] 95%+ Nx compliance
- [ ] Documentation updated

---

### Continuous Monitoring

**After Each PR:**
```bash
# Quick verification
pnpm test:all                    # All tests pass
pnpm lint:all                    # No lint errors
pnpm typecheck:all               # No type errors
git status                       # No untracked files
```

**After Each Phase:**
```bash
# Comprehensive verification
pnpm nx graph --file=phase-N-graph.json  # Capture dependency graph
pnpm test:all --coverage         # Generate coverage report
pnpm build:all                   # Verify production build

# Compare to baseline
diff docs/refactoring/baseline-graph.json docs/refactoring/phase-N-graph.json
```

---

## Command Reference

### Verification Commands

```bash
# Full Test Suite
pnpm test:all                    # Run all tests
pnpm test:all --coverage         # With coverage report

# Library-Specific Tests
pnpm nx test services-cases
pnpm nx test services-discharge
pnpm nx test services-shared

# Linting
pnpm lint:all                    # All libraries
pnpm nx lint web                 # Web app only
pnpm lint:all | grep "lazy-loaded"  # Check for violations

# Type Checking
pnpm typecheck:all               # All libraries
pnpm nx typecheck services-cases

# Building
pnpm build:all                   # All libraries
pnpm nx build web                # Web app only

# Dependency Graph
pnpm nx graph                    # Visual UI
pnpm nx graph --file=graph.json  # JSON output

# Affected Projects
pnpm nx affected:test
pnpm nx affected:lint
pnpm nx affected:build
```

---

### Implementation Commands

```bash
# Create Directories
mkdir -p libs/services-cases/src/lib/{validation,creation,scheduling,status}
mkdir -p libs/services-discharge/src/lib/orchestrators
mkdir -p libs/services-shared/src/lib/interfaces

# File Operations
touch <path/to/new-file.ts>
mv <old-path> <new-path>
rm -rf <directory>

# Git Operations
git checkout -b <branch-name>
git add <files>
git commit -m "<message>"
git tag -a <tag-name> -m "<description>"
git push origin <branch-name>

# Verification
wc -l <file-path>                # Count lines
find libs/ -name "project.json" -exec jq -r '.tags' {} \;  # List tags
grep -r "await import" libs/     # Find dynamic imports
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Tests Fail After File Split

**Symptoms:**
- Test suite reports failures after extracting file
- Import errors in tests

**Solutions:**

1. **Check barrel exports:**
   ```bash
   cat libs/services-cases/src/index.ts
   # Ensure all extracted files re-exported
   ```

2. **Update test imports:**
   ```typescript
   // Before
   import { CasesService } from "./cases-service";
   
   // After
   import { CasesService } from "./cases-service";
   import { EntityValidator } from "./validation";
   ```

3. **Run tests in watch mode:**
   ```bash
   pnpm nx test services-cases --watch
   ```

**Rollback:**
```bash
git checkout HEAD -- libs/services-cases/src/
```

---

#### Issue 2: Circular Dependency Persists After DI

**Symptoms:**
- Nx graph still shows cycle
- Build warnings about circular imports

**Solutions:**

1. **Verify interface usage:**
   ```bash
   grep -r "import.*services-cases" libs/services-discharge/
   # Should only import from services-shared
   ```

2. **Check for missed dynamic imports:**
   ```bash
   grep -r "await import.*services" libs/services-*/
   ```

3. **Manually inspect graph:**
   ```bash
   pnpm nx graph
   # Look for arrows between services-cases and services-discharge
   ```

**Rollback:**
```bash
git revert <commit-hash-of-PR-19>
git revert <commit-hash-of-PR-20>
# Restore dynamic imports
```

---

#### Issue 3: Type Errors After Reclassifying Tags

**Symptoms:**
- TypeScript compilation errors
- Import path issues

**Solutions:**

1. **Verify tags don't affect import paths:**
   ```bash
   # Import paths use @odis-ai/*, not tags
   grep -r "from.*@odis-ai" apps/ libs/
   ```

2. **Check ESLint depConstraints:**
   ```bash
   cat eslint.config.js | grep -A10 "depConstraints"
   # Ensure no references to removed type:service
   ```

3. **Clear cache and rebuild:**
   ```bash
   rm -rf node_modules/.cache
   pnpm nx reset
   pnpm typecheck:all
   ```

**Rollback:**
```bash
git checkout HEAD -- libs/services-*/project.json eslint.config.js
```

---

#### Issue 4: Import Standardization Breaks Build

**Symptoms:**
- Build fails after lazy-load fixes
- Runtime errors in API routes

**Solutions:**

1. **Verify dynamic import syntax:**
   ```typescript
   // API routes (correct)
   const { createServiceClient } = await import("@odis-ai/db");
   
   // Not in API routes (correct)
   import { createClient } from "@odis-ai/db";
   ```

2. **Check for incorrect patterns:**
   ```bash
   grep -r "import.*@odis-ai/db" apps/web/src/app/api/
   # Should use dynamic import in API routes
   ```

3. **Test affected routes:**
   ```bash
   pnpm nx build web
   pnpm nx serve web
   # Manually test API endpoints
   ```

**Rollback:**
```bash
git checkout HEAD -- apps/web/src/app/api/
```

---

#### Issue 5: Test Coverage Drops Below Target

**Symptoms:**
- Coverage report shows <80% for services
- Missing test cases for split files

**Solutions:**

1. **Generate coverage report:**
   ```bash
   pnpm nx test services-cases --coverage
   # Identify untested lines
   ```

2. **Add missing tests:**
   ```typescript
   // For each split file, ensure tests cover:
   describe("<File>", () => {
     it("handles happy path", () => { /* ... */ });
     it("handles errors", () => { /* ... */ });
     it("handles edge cases", () => { /* ... */ });
   });
   ```

3. **Run coverage check:**
   ```bash
   pnpm nx test services-cases --coverage --coverageThreshold='{"global":{"lines":80,"branches":80}}'
   ```

---

## Team Coordination Guidelines

### Parallel Work Coordination (Phase 6)

**Ownership Assignments:**

| Stream | Owner | PRs | Branch Prefix | Review Lead |
|--------|-------|-----|---------------|-------------|
| File Splitting (cases-service) | Developer A | #6-9 | `phase-6a/split-cases-*` | Tech Lead |
| File Splitting (discharge-orchestrator) | Developer B | #10-12 | `phase-6a/split-discharge-*` | Tech Lead |
| Import Standardization | Developer C | #13-16 | `phase-6b/fix-lazy-load-*` | Senior Engineer |

**Daily Standup (During Phase 6):**
- **Time:** 15 minutes daily
- **Format:** Each developer reports:
  1. Yesterday's completed PRs
  2. Today's planned PRs
  3. Any blockers or conflicts

**Merge Order:** PRs merge sequentially even if developed in parallel:
1. Merge Stream A (cases splits): PRs #6, #7, #8, #9
2. Merge Stream A (discharge splits): PRs #10, #11, #12
3. Merge Stream B (imports): PRs #13, #14, #15, #16

**Conflict Resolution:** If merge conflicts occur:
1. Stream owner resolves within their stream
2. Cross-stream conflicts: Tech Lead coordinates resolution
3. Major conflicts: Escalate to Architecture Lead

---

### Communication Channels

**Slack Channels:**
- `#refactoring-phase-4-9` - General updates
- `#refactoring-alerts` - Blockers and issues
- `#refactoring-reviews` - PR review requests

**Status Updates:**
- End of each phase: Post summary to #refactoring-phase-4-9
- Any blocker: Immediate post to #refactoring-alerts
- PR ready for review: Tag reviewer in #refactoring-reviews

**Meetings:**
- Checkpoint reviews: 30-60 minutes at end of each phase
- Daily standup: 15 minutes during Phase 6 only
- Ad-hoc: As needed for escalations

---

## Appendices

### A. PR Template

```markdown
# PR Title

**Phase:** [Phase number and name]
**PR Number:** [PR number]
**Branch:** [branch-name]
**Estimated Effort:** [X-Y hours]
**Priority:** [P0-P3]
**Risk Level:** [LOW/MEDIUM/HIGH]
**Dependencies:** [List of blocking PRs]

## Overview

[Brief description of changes]

## Files Changed

- `path/to/file1.ts` - [What changed]
- `path/to/file2.json` - [What changed]

## Implementation Notes

[Any important context or decisions]

## Verification Steps

### Manual Testing
- [ ] Step 1
- [ ] Step 2

### Automated Checks
```bash
pnpm test:all
pnpm lint:all
pnpm typecheck:all
```

## Verification Results

- Test results: [Link to test output or screenshot]
- Lint results: [Clean or issues found]
- Type check: [No errors]

## Rollback Plan

[Specific commands to revert this PR]

## Related PRs

- Depends on: [PR numbers]
- Blocks: [PR numbers]

## Checklist

- [ ] All tests passing
- [ ] No lint violations
- [ ] No type errors
- [ ] Documentation updated (if applicable)
- [ ] Backward compatibility maintained
- [ ] Rollback plan tested
```

---

### B. Phase Completion Checklist

```markdown
# Phase [N] Completion Checklist

**Phase:** [Name]
**Completed:** [Date]
**Owner:** [Lead developer]

## PRs Completed

- [ ] PR #[N]: [Title] - [Status]
- [ ] PR #[N+1]: [Title] - [Status]
- ...

## Success Criteria Met

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- ...

## Metrics Captured

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| [Metric 1] | [Value] | [Target] | ✅/❌ |
| [Metric 2] | [Value] | [Target] | ✅/❌ |

## Tests Status

- Total tests: [Count]
- Passing: [Count]
- Failing: [Count]
- Coverage: [Percentage]

## Issues Encountered

1. [Issue description] - [Resolution]
2. [Issue description] - [Resolution]

## Lessons Learned

[What worked well, what to improve]

## Next Steps

[What happens in next phase]

## Sign-Off

- [ ] Phase owner reviewed
- [ ] Tech lead approved
- [ ] Architecture lead approved (if required)
- [ ] Ready for next phase
```

---

## Critical Files for Implementation

Based on this comprehensive execution roadmap, here are the 5 most critical files for implementing this plan:

1. **`/Users/taylorallen/Development/odis-ai-web/libs/services-shared/src/lib/interfaces/cases-service.interface.ts`** - Foundation for breaking circular dependency (PR #3), enables entire Phase 7 DI implementation

2. **`/Users/taylorallen/Development/odis-ai-web/libs/services-cases/src/lib/cases-service.ts`** - Largest refactoring effort (2,082 LOC), split across PRs #6-9, implements ICasesService in PR #17

3. **`/Users/taylorallen/Development/odis-ai-web/libs/services-discharge/src/lib/discharge-orchestrator.ts`** - Second-largest file (1,785 LOC), split across PRs #10-12, major DI updates in PR #19

4. **`/Users/taylorallen/Development/odis-ai-web/eslint.config.js`** - Central to tag reclassification (PR #4) and module boundary enforcement throughout all phases

5. **`/Users/taylorallen/Development/odis-ai-web/docs/refactoring/BASELINE_SNAPSHOT.md`** - New file created in PR #2, provides rollback reference and success measurement baseline for all subsequent phases

---

**END OF EXECUTION ROADMAP**

**Status:** Complete - Ready for Implementation  
**Next Action:** Begin PR #1 (Validate Baseline)  
**Estimated Completion:** 2-3 weeks @ 15-20 hrs/week  
**Generated:** 2025-12-23  
**Generated By:** Agent 6 (Execution Planning)
