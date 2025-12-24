# ODIS AI Nx Monorepo: Master Refactoring Plan

**Created**: December 23, 2024
**Status**: Ready for Implementation
**Target**: 95%+ Nx Best Practices Compliance (from 81.3%)
**Timeline**: 2-3 weeks @ 15-20 hrs/week

---

## Executive Summary

This document synthesizes findings from a comprehensive 6-agent analysis of the ODIS AI Nx monorepo and provides a complete roadmap for achieving 95%+ compliance with Nx best practices.

### Key Findings

**Current State**:
- ✅ **290+ tests** passing (validators + discharge services)
- ✅ **Platform separation**: 100% compliant (browser/node/neutral)
- ✅ **Completed refactoring**: Router splitting, services extraction, repository pattern
- ⚠️ **Nx compliance**: 81.3% (target: 95%+)
- ⚠️ **Circular dependencies**: 1 found (services-discharge ↔ services-cases)
- ⚠️ **Tag compliance**: 89.7% (3 custom tags, 3 dual tags)
- ⚠️ **Large files**: 2 files exceed 1500 LOC target

**Target State**:
- ✅ Zero circular dependencies through interface-based DI
- ✅ 100% Nx 4-type model compliance
- ✅ 100% tag consistency (type/scope/platform)
- ✅ All files <1500 LOC with clear responsibilities
- ✅ Module boundaries enforced via ESLint
- ✅ All 290+ tests preserved and expanded

### Implementation Overview

**27 Atomic PRs** organized into 9 phases:
1. **Phase 4**: Verification & Cleanup (2 PRs, 2-3h)
2. **Phase 5**: Foundation (3 PRs, 3-5h)
3. **Phase 6**: Parallel Work (11 PRs, 14-18h, 3 concurrent streams)
4. **Phase 7**: DI Implementation (6 PRs, 8-12h)
5. **Phase 8**: Test Updates (4 PRs, 4-6h)
6. **Phase 9**: Final Verification (1 PR, 1-2h)

**Total Effort**: 34-48 hours
**With Parallelization**: 29-40 hours (40% reduction)
**Weekly Commitment**: 15-20 hours
**Duration**: 2-3 weeks

---

## Quick Reference

### Critical Numbers

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Circular Dependencies** | 1 | 0 | 🔴 Fix required |
| **Nx Compliance** | 81.3% | 95%+ | 🟡 Improvement needed |
| **Tag Compliance** | 89.7% | 100% | 🟡 Minor fixes |
| **Platform Separation** | 100% | 100% | ✅ Perfect |
| **Test Coverage** | 290+ tests | 340+ tests | 🟡 Expand coverage |
| **Large Files** | 2 | 0 | 🟡 Split needed |
| **Lazy-Load Issues** | 39 | 0 | 🟡 Standardize pattern |

### Priority Matrix

| Priority | Issue | PRs | Effort | Risk |
|----------|-------|-----|--------|------|
| **P0** | Circular dependency | #17-22 | 8-12h | MEDIUM |
| **P1** | Tag fixes | #4-5 | 1-2h | LOW |
| **P1** | File splitting | #6-12 | 6-8h | LOW |
| **P2** | Lazy-load patterns | #13-16 | 4-5h | LOW |
| **P2** | Test expansion | #23-26 | 4-6h | LOW |

---

## Phase 1: Discovery - What We Found

### Agent 1: Dependency Analysis

**Key Findings**:
- ✅ **Near-zero circular dependencies**: Only 1 found (contradicting "zero" claim)
- ✅ **Perfect platform separation**: 0 violations
- ✅ **Shallow dependency tree**: Average depth 1.7 levels
- ⚠️ **One god library**: `types` (11 dependents, borderline)

**The Circular Dependency**:
```
services-discharge ↔ services-cases
├─ services-discharge/discharge-orchestrator.ts (dynamic import)
└─ services-cases/cases-service.ts (dynamic import)
```

Both files use `import()` for runtime loading, which is technically safe but indicates architectural coupling that should be eliminated.

**Dependency Structure**:
- Total edges: 102 (81 static, 21 dynamic)
- Deepest chain: 4 levels
- Average depth: 1.7 levels (excellent)
- Libraries with >10 dependents: types (11)

### Agent 2: Architecture Assessment

**Compliance Breakdown**:
- Overall: **81.3%** (target: 95%+)
- Library type: **82.8%** (24/29 correct)
- Tag compliance: **89.7%** (26/29 correct)
- Module boundaries: **Active** ✅
- Platform separation: **100%** ✅

**Issues Identified**:

1. **Custom Tags** (3 libs):
   - `services-cases`: type:service → should be type:data-access
   - `services-discharge`: type:service → should be type:data-access
   - `services-shared`: type:service → should be type:util

2. **Dual Scope Tags** (3 libs):
   - `extension-env`: Has both scope:extension + scope:shared
   - `extension-shared`: Has both scope:extension + scope:shared
   - `extension-storage`: Has both scope:extension + scope:shared

3. **Large Files** (2 files):
   - `services-cases/cases-service.ts`: 2,082 LOC (target: <1500)
   - `services-discharge/discharge-orchestrator.ts`: 1,785 LOC (target: <1500)

4. **Lazy-Load Pattern** (39 violations):
   - Inconsistent db import patterns (some dynamic, some static)

### Agent 3: Impact Analysis

**Dependency Fan-Out** (Top 10):
```
Library              | Dependents | Impact  | Risk
---------------------|------------|---------|--------
validators           | 9          | MEDIUM  | MEDIUM
types                | 8          | MEDIUM  | MEDIUM
env                  | 7          | MEDIUM  | LOW
utils                | 7          | MEDIUM  | LOW
ui                   | 6          | MEDIUM  | LOW
db                   | 6          | MEDIUM  | MEDIUM
logger               | 5          | MEDIUM  | LOW
hooks                | 5          | MEDIUM  | LOW
constants            | 5          | MEDIUM  | LOW
services-discharge   | 4          | LOW     | MEDIUM
```

**Risk Assessment**:
- CRITICAL risk: 0 libraries
- HIGH risk: 0 libraries
- MEDIUM risk: 10 libraries (validators, types, env, utils, ui, db, services-discharge, services-cases, vapi, qstash)
- LOW risk: 19 libraries

**Effort Estimation**:
- Foundation work: 3-5 hours
- Interface definitions: 2-3 hours
- File splitting: 6-8 hours
- DI implementation: 8-12 hours
- Test updates: 4-6 hours
- Verification: 1-2 hours
- **Total**: 24-36 hours of implementation
- **With planning/review**: 34-48 hours
- **With parallelization**: 29-40 hours

---

## Phase 2: Design - How We'll Fix It

### Solution Overview

**Circular Dependency Resolution**: Interface-based Dependency Injection

Instead of direct cross-imports between services-discharge and services-cases, we'll:

1. **Define interfaces** in services-shared (shared boundary)
2. **Implement interfaces** in respective services
3. **Inject dependencies** at composition root (application layer)

**Architecture**:
```
Before (circular):
services-discharge → services-cases
services-cases → services-discharge

After (unidirectional):
services-discharge → ICasesService (interface)
services-cases → ICallExecutor (interface)
web app → composes both with DI
```

### Interface Design

**File**: `libs/services-shared/src/lib/interfaces/cases-service.interface.ts`

```typescript
import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { IngestPayload, CaseScheduleOptions, ScheduledDischargeCall } from "@odis-ai/types/services";
import type { NormalizedEntities } from "@odis-ai/validators";

export interface ICasesService {
  ingest(
    supabase: SupabaseClientType,
    userId: string,
    payload: IngestPayload,
  ): Promise<{
    caseId: string;
    entities: NormalizedEntities;
    scheduledCall: ScheduledDischargeCall | null;
  }>;

  scheduleCall(
    supabase: SupabaseClientType,
    userId: string,
    caseId: string,
    options: CaseScheduleOptions,
  ): Promise<ScheduledDischargeCall>;
}
```

**File**: `libs/services-shared/src/lib/interfaces/call-executor.interface.ts`

```typescript
import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { ExecuteDischargeCallOptions, DischargeCallResult } from "@odis-ai/types/services";

export interface ICallExecutor {
  executeDischargeCall(
    supabase: SupabaseClientType,
    options: ExecuteDischargeCallOptions,
  ): Promise<DischargeCallResult>;
}
```

### Library Reclassification

**Changes Required**:

1. `services-cases/project.json`:
   ```diff
   - "tags": ["type:service", "scope:server", "platform:node"]
   + "tags": ["type:data-access", "scope:server", "platform:node"]
   ```

2. `services-discharge/project.json`:
   ```diff
   - "tags": ["type:service", "scope:server", "platform:node"]
   + "tags": ["type:data-access", "scope:server", "platform:node"]
   ```

3. `services-shared/project.json`:
   ```diff
   - "tags": ["type:service", "scope:server", "platform:node"]
   + "tags": ["type:util", "scope:shared", "platform:neutral"]
   ```

4. Extension libraries:
   ```diff
   - "tags": ["type:lib", "scope:extension", "scope:shared", "platform:browser"]
   + "tags": ["type:util", "scope:extension", "platform:browser"]
   ```

### File Splitting Strategy

**1. cases-service.ts** (2,082 LOC → 4 files):

```
libs/services-cases/src/lib/
├── cases-service.ts           (430 LOC) - Main service class
├── cases-ingest.ts            (380 LOC) - Ingest logic
├── cases-schedule.ts          (420 LOC) - Scheduling logic
├── cases-discharge-prep.ts    (550 LOC) - Discharge preparation
└── index.ts                   (exports)
```

**2. discharge-orchestrator.ts** (1,785 LOC → 3 files):

```
libs/services-discharge/src/lib/
├── discharge-orchestrator.ts  (600 LOC) - Main orchestration
├── discharge-execution.ts     (585 LOC) - Call execution
├── discharge-batch.ts         (600 LOC) - Batch processing
└── index.ts                   (exports)
```

**Backwards Compatibility**: All existing imports continue to work via barrel exports in index.ts files.

### Lazy-Load Pattern Standardization

**Rule**: Use dynamic imports in **API routes only**, static imports everywhere else.

**Pattern**:
```typescript
// ✅ API routes (apps/web/src/app/api/**/route.ts)
const { createClient } = await import("@odis-ai/db");

// ✅ Everywhere else (components, tRPC routers, server actions)
import { createClient } from "@odis-ai/db";
```

**Affected Files**: 39 files with db imports

---

## Phase 3: Integration - Putting It Together

### Unified Timeline

**Phase 4: Verification & Cleanup** (2 PRs, 2-3 hours)
- PR #1: Validate baseline
- PR #2: Update documentation

**Phase 5: Foundation** (3 PRs, 3-5 hours)
- PR #3: Create service interfaces
- PR #4: Fix library tags
- PR #5: Remove dual scope tags

**Phase 6: Parallel Work** (11 PRs, 14-18 hours)
- **Stream A** - File Splitting (6 PRs, 6-8 hours)
  - PR #6-8: Split cases-service.ts
  - PR #9-11: Split discharge-orchestrator.ts
  - PR #12: Create barrel exports
- **Stream B** - Pattern Fixes (4 PRs, 4-5 hours)
  - PR #13-16: Fix lazy-load patterns
- **Stream C** - Documentation (1 PR, 4-5 hours)
  - PR #16: Update docs for new structure

**Phase 7: DI Implementation** (6 PRs, 8-12 hours)
- PR #17: Implement ICasesService in services-cases
- PR #18: Implement ICallExecutor in services-discharge
- PR #19: Update discharge-orchestrator DI
- PR #20: Update cases-service DI
- PR #21: Update tRPC routers
- PR #22: Update API routes

**Phase 8: Test Updates** (4 PRs, 4-6 hours)
- PR #23: Add interface mock helpers
- PR #24: Update cases tests
- PR #25: Update discharge tests
- PR #26: Add integration tests

**Phase 9: Final Verification** (1 PR, 1-2 hours)
- PR #27: Run full verification suite

### Parallelization Opportunities

**Phase 6** allows 3 concurrent work streams:
- Developer A: File splitting (PRs #6-12)
- Developer B: Pattern fixes (PRs #13-15)
- Developer C: Documentation (PR #16)

**Time Savings**: 14-18 hours sequential → 6-8 hours parallel (55% reduction)

### Testing Strategy

**Preserve Existing** (290+ tests):
- 236+ validator tests (95%+ coverage)
- 54+ discharge service tests
- Integration tests

**Add New** (~50 tests):
- Interface mock tests (10 tests)
- DI composition tests (15 tests)
- Split file unit tests (15 tests)
- Integration tests for new patterns (10 tests)

**Target**: 340+ total tests, 95%+ coverage maintained

### Risk Mitigation

**For Each PR**:
1. ✅ Create feature branch
2. ✅ Make atomic changes
3. ✅ Run verification:
   ```bash
   pnpm nx affected:lint
   pnpm nx affected:test
   pnpm nx affected:build
   pnpm nx graph --file=graph.json  # Check for circular deps
   ```
4. ✅ Review PR checklist
5. ✅ Merge to main
6. ✅ Monitor production

**Rollback Plan**: Each PR documents exact rollback commands

---

## Phase 4-9: Execution Roadmap

See **EXECUTION_ROADMAP.md** for complete details on all 27 PRs.

### Quick PR Overview

| PR | Title | Effort | Priority | Risk |
|----|-------|--------|----------|------|
| #1 | Validate Baseline | 1h | P0 | LOW |
| #2 | Update Documentation | 1-2h | P1 | LOW |
| #3 | Create Service Interfaces | 2-3h | P0 | LOW |
| #4 | Fix Library Type Tags | 0.5h | P1 | LOW |
| #5 | Remove Dual Scope Tags | 0.5h | P1 | LOW |
| #6 | Extract cases-ingest.ts | 1h | P1 | LOW |
| #7 | Extract cases-schedule.ts | 1h | P1 | LOW |
| #8 | Extract cases-discharge-prep.ts | 1-2h | P1 | LOW |
| #9 | Extract discharge-execution.ts | 1h | P1 | LOW |
| #10 | Extract discharge-batch.ts | 1h | P1 | LOW |
| #11 | Slim Core Service Files | 1-2h | P1 | LOW |
| #12 | Update Barrel Exports | 0.5h | P1 | LOW |
| #13 | Fix API Route Lazy-Loads | 1-2h | P2 | LOW |
| #14 | Fix Component Static Imports | 1-2h | P2 | LOW |
| #15 | Standardize Import Patterns | 1h | P2 | LOW |
| #16 | Update Architecture Docs | 4-5h | P2 | LOW |
| #17 | Implement ICasesService | 2-3h | P0 | MEDIUM |
| #18 | Implement ICallExecutor | 2-3h | P0 | MEDIUM |
| #19 | Update Discharge DI | 1-2h | P0 | MEDIUM |
| #20 | Update Cases DI | 1-2h | P0 | MEDIUM |
| #21 | Update tRPC Routers | 1-2h | P0 | MEDIUM |
| #22 | Update API Routes DI | 1-2h | P0 | MEDIUM |
| #23 | Add Interface Mocks | 1h | P1 | LOW |
| #24 | Update Cases Tests | 1-2h | P1 | LOW |
| #25 | Update Discharge Tests | 1-2h | P1 | LOW |
| #26 | Add Integration Tests | 1-2h | P2 | LOW |
| #27 | Final Verification | 1-2h | P0 | LOW |

### Critical Path

**Total Duration**: 21-31 hours (sequential)
**With Parallelization**: 17-25 hours (Phase 6 overlap)

```
PR #1 → PR #3 → PR #4,5 (parallel) → PR #6-16 (3 streams) →
PR #17-22 (sequential) → PR #23-26 (parallel) → PR #27
```

### Weekly Breakdown

**Week 1** (15-20 hours):
- Complete Phases 4-5 (PRs #1-5)
- Complete Phase 6 Stream A (PRs #6-12)
- Start Phase 6 Stream B (PRs #13-15)

**Week 2** (12-18 hours):
- Complete Phase 6 (PRs #13-16)
- Complete Phase 7 (PRs #17-22)
- Start Phase 8 (PRs #23-24)

**Week 3** (2-4 hours):
- Complete Phase 8 (PRs #25-26)
- Complete Phase 9 (PR #27)
- Final verification and deployment

---

## Success Metrics

### Per-Phase Metrics

**Phase 4 Success**:
- ✅ Nx graph validates with no errors
- ✅ Current architecture documented
- ✅ Baseline metrics captured

**Phase 5 Success**:
- ✅ Service interfaces defined and exported
- ✅ All library tags follow Nx 4-type model
- ✅ No dual scope tags remain

**Phase 6 Success**:
- ✅ No files >1500 LOC
- ✅ All imports follow lazy-load pattern
- ✅ Backwards compatibility maintained
- ✅ All tests passing (290+)

**Phase 7 Success**:
- ✅ Zero circular dependencies
- ✅ All services use interface-based DI
- ✅ Runtime behavior unchanged
- ✅ All tests passing (290+)

**Phase 8 Success**:
- ✅ 340+ tests passing
- ✅ 95%+ coverage maintained
- ✅ Interface mocks available
- ✅ Integration tests cover DI flows

**Phase 9 Success**:
- ✅ Final nx graph shows 0 circular deps
- ✅ All 340+ tests passing
- ✅ All lint checks passing
- ✅ All builds successful
- ✅ Production deployment successful

### Overall Success Criteria

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| **Circular Dependencies** | 1 | 0 | ✅ Target |
| **Nx Compliance** | 81.3% | 95%+ | ✅ Target |
| **Tag Compliance** | 89.7% | 100% | ✅ Target |
| **Platform Separation** | 100% | 100% | ✅ Maintained |
| **Large Files** | 2 | 0 | ✅ Target |
| **Lazy-Load Consistency** | 61% | 100% | ✅ Target |
| **Test Count** | 290+ | 340+ | ✅ Target |
| **Test Coverage** | 95%+ | 95%+ | ✅ Maintained |

---

## Verification Commands

Run these after each PR to ensure quality:

```bash
# Lint all affected projects
pnpm nx affected:lint --base=main

# Test all affected projects
pnpm nx affected:test --base=main

# Build all affected projects
pnpm nx affected:build --base=main

# Type check all affected projects
pnpm nx affected:typecheck --base=main

# Generate dependency graph (check for circular deps)
pnpm nx graph --file=graph.json

# Run full workspace check
pnpm check  # lint + typecheck
```

---

## Rollback Strategy

### Per-PR Rollback

Each PR in EXECUTION_ROADMAP.md includes specific rollback commands.

**General Pattern**:
```bash
# Rollback single PR
git revert <commit-hash>
pnpm install  # Restore dependencies
pnpm check    # Verify clean state

# Rollback multiple PRs
git revert <commit-range>
pnpm install
pnpm check
```

### Phase-Level Rollback

**If Phase 7 (DI) fails**:
1. Revert PRs #17-22 in reverse order
2. Keep PRs #1-16 (foundation work still valuable)
3. Reassess DI strategy

**If Phase 6 (File Splitting) causes issues**:
1. Revert PRs #6-12
2. Keep tag fixes (#4-5) and interfaces (#3)
3. Continue with simplified approach

### Emergency Rollback

**Complete rollback to pre-refactoring state**:
```bash
git checkout main
git reset --hard <pre-refactoring-commit>
git push --force origin main  # DANGER: Only in emergency
```

---

## Risk Assessment

### High-Risk Areas

1. **Circular Dependency Elimination** (PRs #17-22)
   - **Risk**: Breaking runtime behavior
   - **Mitigation**: Comprehensive integration tests, gradual rollout
   - **Fallback**: Keep dynamic imports, defer interface adoption

2. **File Splitting** (PRs #6-12)
   - **Risk**: Import path confusion
   - **Mitigation**: Maintain barrel exports, clear communication
   - **Fallback**: Revert individual splits if issues arise

### Medium-Risk Areas

1. **Tag Changes** (PRs #4-5)
   - **Risk**: Breaking module boundaries
   - **Mitigation**: Verify with `nx lint` after changes
   - **Fallback**: Quick revert, minimal impact

2. **Lazy-Load Pattern** (PRs #13-15)
   - **Risk**: Bundle size changes, SSR issues
   - **Mitigation**: Test in production-like environment
   - **Fallback**: Revert to previous import patterns

### Low-Risk Areas

1. **Documentation** (PRs #2, #16)
   - **Risk**: Minimal
   - **Mitigation**: None needed
   - **Fallback**: N/A

2. **Test Additions** (PRs #23-26)
   - **Risk**: False positives/negatives
   - **Mitigation**: Review test quality
   - **Fallback**: Adjust test assertions

---

## Monitoring & Observability

### During Implementation

**Track Daily**:
- PRs completed vs. planned
- Test count and pass rate
- Build times (watch for regressions)
- Circular dependency count

**Weekly Review**:
- Overall progress vs. timeline
- Risk items encountered
- Blockers and resolutions
- Velocity adjustments

### Post-Implementation

**Monitor for 2 weeks**:
- Production error rates
- API response times
- Build/deploy success rates
- Developer feedback on new patterns

---

## Communication Plan

### Team Communication

**Daily Standup Topics**:
- Which PR currently working on
- Blockers encountered
- PRs ready for review
- Timeline adjustments needed

**Weekly Review**:
- Phase completion status
- Metrics update
- Risk items discussion
- Next week's PRs

### Stakeholder Updates

**Weekly Status Report**:
```
Subject: Nx Refactoring - Week X Progress

Completed This Week:
- PRs #X-Y completed
- Phase Z finished
- Metrics: XX% compliance (target: 95%)

Next Week Plan:
- Complete Phase N
- Start Phase M
- Target: XX% compliance

Risks:
- [Any risks encountered]

Blockers:
- [Any blockers]
```

---

## Documentation Updates

### Files to Update

**During Implementation**:
- `docs/refactoring/STATUS.md` - Daily progress updates
- `docs/architecture/SERVICES_ARCHITECTURE.md` - After Phase 7
- `docs/testing/TESTING_STRATEGY.md` - After Phase 8
- `README.md` - After completion

**At Completion**:
- `docs/refactoring/COMPLETION_REPORT.md` - Final metrics and lessons learned
- `docs/architecture/NX_ARCHITECTURE.md` - Complete architecture documentation
- `CHANGELOG.md` - Document major changes

---

## Lessons Learned (Post-Implementation)

**To be completed after refactoring**:

### What Went Well
- [To be filled]

### What Could Be Improved
- [To be filled]

### Unexpected Challenges
- [To be filled]

### Recommendations for Future
- [To be filled]

---

## Appendices

### A. Complete File Structure

See **EXECUTION_ROADMAP.md** for detailed file structure after all PRs.

### B. Dependency Graph

See **DEPENDENCY_ANALYSIS_REPORT.md** for current state.
Target state: Zero circular dependencies, max depth 4 levels maintained.

### C. Interface Definitions

See **TARGET_ARCHITECTURE_DESIGN.md** Section 3.1 for complete interface code.

### D. Migration Commands

See **EXECUTION_ROADMAP.md** for per-PR commands.

### E. Testing Guide

See **INTEGRATION_PLAN.md** Section 3 for complete testing strategy.

---

## Quick Start Guide

**Ready to begin? Follow these steps**:

1. **Review this document** - Ensure understanding of goals and approach
2. **Read EXECUTION_ROADMAP.md** - Detailed PR-by-PR instructions
3. **Set up environment** - Ensure all dependencies installed
4. **Create tracking board** - Use PR list to create Jira/Linear tickets
5. **Start with PR #1** - Validate baseline before making changes
6. **Follow verification steps** - Run commands after each PR
7. **Communicate progress** - Daily updates to team
8. **Monitor metrics** - Track compliance improvements
9. **Celebrate wins** - Acknowledge phase completions
10. **Document learnings** - Update lessons learned section

**Questions?** Review supporting documents:
- **DEPENDENCY_ANALYSIS_REPORT.md** - Current state details
- **TARGET_ARCHITECTURE_DESIGN.md** - Solution architecture
- **INTEGRATION_PLAN.md** - Timeline and testing strategy
- **EXECUTION_ROADMAP.md** - Detailed PR instructions

---

## Final Checklist

Before beginning implementation:

- [ ] All 7 planning documents reviewed
- [ ] Team alignment on approach
- [ ] Timeline approved by stakeholders
- [ ] Development environment ready
- [ ] Tracking board created
- [ ] Communication plan established
- [ ] Monitoring plan defined
- [ ] Emergency rollback procedure understood
- [ ] All questions answered
- [ ] Ready to execute PR #1

**Status**: ⏳ Ready for Implementation Approval

---

**Document Version**: 1.0
**Last Updated**: December 23, 2024
**Next Review**: After Phase 4 completion
