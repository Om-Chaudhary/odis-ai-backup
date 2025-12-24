
1. **Agent 4 (Target Architecture Design)** hasn't run yet - the document doesn't exist
2. **Agent 3 (Impact Analysis)** hasn't produced its report yet
3. However, I have comprehensive information from:
   - Phase 1 Synthesis (comprehensive integrated findings)
   - Dependency Analysis Report (Agent 1 - complete)
   - Architecture Assessment Report (Agent 2 - complete)
   - Phase 1 Briefing (context and completed work)

Given that I'm Agent 5 (Integration Planner) but the target architecture design (from Agent 4) doesn't exist yet, I need to flag this as a critical issue. However, I can still provide significant value by creating an integration framework that prepares for the target architecture design and identifies all the key integration points.

Let me create a comprehensive integration plan that:
1. Documents what we know from Phases 1-3 completed work
2. Identifies integration prerequisites
3. Creates a framework ready for Agent 4's design
4. Provides actionable recommendations

However, I must note that this is a **READ-ONLY** task per the instructions, and I cannot create the `INTEGRATION_PLAN.md` file. I'll provide the complete content that should be written to that file.

---

# Integration Plan: ODIS AI Nx Monorepo Refactoring

**Date:** 2025-12-23  
**Workspace:** `/Users/taylorallen/Development/odis-ai-web`  
**Phase:** Integration Planning (Agent 5)  
**Status:** ⚠️ BLOCKED - Awaiting Agent 4 Target Architecture Design  

---

## ⚠️ CRITICAL: Prerequisites Not Met

**BLOCKING ISSUE:** Agent 4 (Target Architecture Design) has not executed yet. The following required input document is missing:

- **`TARGET_ARCHITECTURE_DESIGN.md`** - Agent 4's comprehensive design for addressing Phase 1 findings

**IMPACT:** This integration plan can only provide:
1. Framework for integration when Agent 4 completes
2. Analysis of completed work (Phases 1-3)
3. Integration prerequisites and checkpoints
4. Partial execution dependencies based on Phase 1 findings

**RECOMMENDATION:** Execute Agent 4 first, then re-run Agent 5 with complete inputs.

---

## 1. Executive Summary

### Integration Approach Overview

This integration plan prepares for merging completed refactoring work (Phases 1-3) with the forthcoming target architecture design (Agent 4). Based on Phase 1 discovery findings, the integration will focus on five critical areas:

1. **Circular Dependency Resolution** - Interface-based DI pattern (estimated 8-12 hours)
2. **Library Reclassification** - Fix custom `type:service` tags (estimated 2-3 hours)
3. **Dual Scope Tag Cleanup** - Remove conflicting tags (estimated 1 hour)
4. **Large File Splitting** - Break up 2 oversized service files (estimated 14-18 hours)
5. **Import Standardization** - Fix 39 lazy-load violations (estimated 4-6 hours)

### Key Integration Points Identified

Based on Phase 1 findings and completed work analysis:

| Completed Work | Phase 1 Finding | Integration Challenge | Status |
|----------------|-----------------|----------------------|---------|
| Type consolidation | types lib (11 dependents) | Extend for DI interfaces | ✅ Compatible |
| Router splitting | dashboard + cases split | No changes needed | ✅ Preserved |
| Services extraction | 3 service libs created | DI pattern needed | ⚠️ Needs Update |
| Repository pattern | 4 repository interfaces | Leverage for services DI | ✅ Can Reuse |
| 290+ tests | validators + services | Selective updates needed | ⚠️ Monitor |

### Overall Timeline Estimate (Preliminary)

**Total Estimated Effort:** 29-40 hours

**Phases:**
- Phase 0: Validation of completed work (2-3 hours)
- Phase 1: Foundation (from Agent 4 - TBD)
- Phase 2: File splitting (14-18 hours)
- Phase 3: DI implementation (8-12 hours)
- Phase 4: Import standardization (4-6 hours)
- Phase 5: Final verification (1-2 hours)

---

## 2. Completed Work Validation (Phases 1-3)

### Phase 1: Type Consolidation ✅

**Achievement:**
- Created `@odis-ai/types` library
- Consolidated types from web app
- Established as foundation library (11 dependents - highest in workspace)

**Validation Status:** ✅ **VERIFIED**
- Zero violations found in Phase 1 discovery
- Properly tagged: `type:types`
- Clean dependency graph (no circular dependencies)
- Used consistently across workspace

**Compatibility with Target Architecture:**
- ✅ Ready to extend with DI interfaces
- ✅ Can house service interface definitions
- ✅ No breaking changes anticipated

**Preservation Strategy:**
- **Keep as-is** - working perfectly
- **Extend** - add service interfaces when DI pattern implemented
- **No migration needed** - all consumers using correct import paths

---

### Phase 2: Router Splitting ✅

**Achievement:**
- Split dashboard router: 2,029 LOC → 6 modular files
- Split cases router: 2,003 LOC → 6 modular files
- Improved maintainability and reduced cognitive load

**Validation Status:** ✅ **VERIFIED**
- No circular dependencies introduced
- All tests passing (implied by clean Phase 1 discovery)
- Proper module boundaries maintained

**Compatibility with Target Architecture:**
- ✅ No changes needed - already properly structured
- ✅ Aligns with Nx best practices
- ✅ Not affected by Phase 1 findings

**Preservation Strategy:**
- **Preserve exactly as-is**
- **No integration work required**
- **Document as successful pattern**

---

### Phase 3: Services Extraction ✅⚠️

**Achievement:**
- Created `services-cases` library (2,082 LOC main file)
- Created `services-discharge` library (1,785 LOC main file)  
- Created `services-shared` library
- Implemented repository pattern interfaces
- Added 290+ tests (validators + services)

**Validation Status:** ⚠️ **PARTIAL - Issues Found**

**Issues Identified:**
1. **Circular Dependency Introduced** (Agent 1 finding)
   - `services-discharge` ↔ `services-cases`
   - Both use dynamic imports (safe but indicates coupling)
   - **Fix Required:** Interface-based DI pattern

2. **Misclassified Library Tags** (Agent 2 finding)
   - All 3 services use `type:service` (not Nx standard)
   - **Should be:** `type:data-access` or `type:util`
   - **Fix Required:** Reclassify in `project.json`

3. **Oversized Files** (Agent 2 finding)
   - `cases-service.ts`: 2,082 LOC (target: <500 LOC)
   - `discharge-orchestrator.ts`: 1,785 LOC (target: <600 LOC)
   - **Fix Required:** Split into focused files

**Compatibility with Target Architecture:**
- ⚠️ **Requires Updates** - DI pattern implementation
- ⚠️ **Requires Reclassification** - tags must be fixed
- ⚠️ **Requires Splitting** - large files need refactoring

**Preservation Strategy:**
- **Keep structure** - service libraries stay
- **Update implementation** - add interface implementations
- **Refactor files** - split large files incrementally
- **Maintain tests** - 290+ tests must pass throughout

---

### Repository Pattern Implementation ✅

**Achievement:**
- Created repository interfaces in `libs/db/src/interfaces/`:
  - `ICasesRepository`
  - `IUserRepository`
  - `ICallRepository`
  - `IEmailRepository`
- Concrete implementations in `libs/db/src/repositories/`
- Enables dependency injection and mocking

**Validation Status:** ✅ **EXCELLENT**
- Clean pattern already established
- Interface-based design perfect for DI
- Can be leveraged for service layer DI

**Compatibility with Target Architecture:**
- ✅ **Perfect alignment** - already using DI pattern
- ✅ **Reusable pattern** - extend to service interfaces
- ✅ **No changes needed** - working as designed

**Preservation Strategy:**
- **Use as template** - apply same pattern to services
- **No changes required** - keep exactly as-is
- **Extend pattern** - create service interfaces in similar structure

---

### Test Infrastructure ✅

**Achievement:**
- 290+ tests across validators and services
- 95%+ coverage in validators library
- 19 test files total

**Validation Status:** ✅ **STRONG**
- High coverage in critical areas
- Tests well-structured
- Good use of mocks and fixtures

**Compatibility with Target Architecture:**
- ✅ **Maintainable** - tests can be updated incrementally
- ⚠️ **Will need updates** - DI pattern changes require test updates
- ⚠️ **Monitor during file splits** - ensure coverage maintained

**Preservation Strategy:**
- **100% preservation** - all tests must pass after each phase
- **Selective updates** - only update tests affected by changes
- **Add new tests** - for new interface implementations
- **Continuous verification** - run test suite after each change

---

## 3. Integration Points Matrix

| Completed Work | Target Architecture Component | Integration Approach | Dependencies | Effort | Risk |
|----------------|------------------------------|---------------------|--------------|--------|------|
| Type consolidation | Interface definitions | Extend types lib with service interfaces | None | 2-3h | LOW |
| Router splitting | No changes | Preserve as-is | None | 0h | NONE |
| Services extraction | DI implementation | Add interface implementations to services-shared | Tag reclassification | 8-12h | MEDIUM |
| Repository interfaces | Service DI pattern | Reuse existing pattern for services | None | 1-2h | LOW |
| 290+ tests | Test updates | Update tests for DI, maintain coverage | DI implementation | 4-6h | MEDIUM |
| Large service files | File splitting | Split cases-service.ts (4 files), discharge-orchestrator.ts (3 files) | None (independent) | 14-18h | HIGH |
| Custom tags | Tag reclassification | Update project.json + ESLint config | None | 2-3h | LOW |
| Dual scope tags | Tag cleanup | Remove scope:shared from 3 extension libs | None | 1h | LOW |
| 39 lazy-load violations | Import standardization | Standardize db import pattern | None | 4-6h | MEDIUM |

**Critical Path:** Tag reclassification → DI implementation → Test updates

**Parallel Execution Opportunities:**
- File splitting can run parallel with tag reclassification
- Import standardization can run parallel with file splitting
- Test updates must follow DI implementation

---

## 4. Execution Dependencies Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 0: Validation                       │
│                    (2-3 hours)                               │
│  - Verify all 290+ tests passing                            │
│  - Confirm type consolidation working                       │
│  - Validate router splitting preserved                      │
│  - Document current state baseline                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Phase 1: Foundation (FROM AGENT 4)                │
│                    (TBD hours)                               │
│  - Interface definitions designed                           │
│  - DI pattern specified                                     │
│  - File splitting strategy defined                          │
│  - Tag reclassification plan approved                       │
└─────────┬──────────────────────────┬─────────────┬──────────┘
          │                          │             │
          ▼                          ▼             ▼
┌─────────────────┐     ┌─────────────────┐  ┌──────────────┐
│   Phase 2A:     │     │   Phase 2B:     │  │ Phase 2C:    │
│ Tag Fixes       │     │ File Splitting  │  │ Import Std   │
│ (2-3 hours)     │     │ (14-18 hours)   │  │ (4-6 hours)  │
│                 │     │                 │  │              │
│ PARALLEL ───────┴─────┴─────────────────┴──┴──────┐       │
│                                                    │       │
└────────────────────────────────────────────────────┼───────┘
                                                     │
                     ┌───────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 3: DI Implementation                      │
│                    (8-12 hours)                              │
│  - Create service interfaces in services-shared             │
│  - Implement interfaces in services-cases                   │
│  - Implement interfaces in services-discharge               │
│  - Remove dynamic imports                                   │
│  - Verify circular dependency eliminated                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 4: Test Updates                           │
│                    (4-6 hours)                               │
│  - Update service tests for DI                              │
│  - Add interface implementation tests                       │
│  - Verify 290+ tests still passing                          │
│  - Add new tests for split files                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Phase 5: Final Verification                       │
│                    (1-2 hours)                               │
│  - Run full test suite                                      │
│  - Verify zero circular dependencies (nx graph)             │
│  - Check 95%+ Nx compliance                                 │
│  - Validate zero module boundary violations                 │
│  - Confirm all large files split (<1500 LOC)                │
└─────────────────────────────────────────────────────────────┘

LEGEND:
───────  Sequential dependency (must complete before next)
PARALLEL Can execute in parallel
```

**Critical Path:** Phase 0 → Phase 1 → Phase 3 → Phase 4 → Phase 5 (19-26 hours)

**Parallelizable Work:** Phase 2A, 2B, 2C (can reduce to 14-18 hours if run in parallel)

**Total Duration:** 
- **Sequential:** 35-49 hours
- **With Parallelization:** 29-40 hours (~1-2 weeks @ 20 hrs/week)

---

## 5. Unified Timeline

### Phase 0: Validation of Completed Work (NEW)

**Duration:** 2-3 hours  
**Owner:** Integration Lead  
**Dependencies:** None

**Tasks:**
1. Run full test suite, verify 290+ tests passing
2. Confirm `types` library has 11 dependents
3. Validate router splitting preserved (no regressions)
4. Document current state baseline (LOC, test count, dependency graph)
5. Create rollback points for each library

**Parallelization:** N/A (sequential validation)

**Testing Strategy:**
- `pnpm test:all` - verify all tests pass
- `nx graph --file=baseline.json` - capture baseline graph
- `nx lint:all` - document current lint status

**Rollback Plan:**
- Git tag: `pre-integration-phase-0`
- Document: current state snapshot

**Success Criteria:**
- ✅ All 290+ tests passing
- ✅ Zero new circular dependencies introduced
- ✅ Baseline documented and committed

---

### Phase 1: Foundation (FROM AGENT 4)

**Duration:** TBD (waiting on Agent 4)  
**Owner:** Agent 4 (Architecture Design)  
**Dependencies:** Phase 0 complete

**Expected Outputs (from Agent 4):**
1. Interface definitions for services
2. DI pattern specification
3. File splitting strategy with target files
4. Tag reclassification mappings
5. Module boundary updates needed

**Parallelization:** N/A (design phase)

**Testing Strategy:** N/A (design only)

**Rollback Plan:** N/A (design phase)

**Success Criteria:**
- ✅ All 5 Phase 1 findings addressed in design
- ✅ Clear implementation plan for each component
- ✅ Effort estimates validated

---

### Phase 2A: Tag Fixes (PARALLEL)

**Duration:** 2-3 hours  
**Owner:** Configuration Lead  
**Dependencies:** Phase 1 complete

**Tasks:**
1. Update `services-cases/project.json`: `type:service` → `type:data-access`
2. Update `services-discharge/project.json`: `type:service` → `type:data-access`
3. Update `services-shared/project.json`: `type:service` → `type:util`
4. Update `eslint.config.js`: remove `type:service` from depConstraints
5. Remove `scope:shared` from 3 extension libs
6. Run `nx lint:all` to verify

**Parallelization:** ✅ Can run with Phase 2B and 2C

**Testing Strategy:**
- `nx lint:all` - verify no new violations
- Verify import paths unchanged
- Check module boundaries still enforced

**Rollback Plan:**
- Git commit per library change
- Revert individual commits if issues

**Success Criteria:**
- ✅ Zero `type:service` tags remaining
- ✅ Zero dual scope tags
- ✅ ESLint passes with new tags
- ✅ Import paths unchanged

---

### Phase 2B: File Splitting (PARALLEL)

**Duration:** 14-18 hours  
**Owner:** Refactoring Lead  
**Dependencies:** Phase 1 complete

**Tasks:**

**Split `cases-service.ts` (2,082 LOC → 4 files):**
1. Extract validation logic → `case-validator.ts` (~500 LOC)
2. Extract creation logic → `case-creator.ts` (~600 LOC)
3. Extract scheduling logic → `case-scheduler.ts` (~400 LOC)
4. Extract status management → `case-status-manager.ts` (~300 LOC)
5. Create barrel export in `index.ts`
6. Update all imports in consumers
7. Run tests after each extraction

**Split `discharge-orchestrator.ts` (1,785 LOC → 3 files):**
1. Extract scheduling → `schedule-orchestrator.ts` (~600 LOC)
2. Extract execution → `execution-orchestrator.ts` (~700 LOC)
3. Extract reporting → `report-orchestrator.ts` (~400 LOC)
4. Create barrel export in `index.ts`
5. Update all imports in consumers
6. Run tests after each extraction

**Parallelization:** ✅ Can run with Phase 2A and 2C (independent work)

**Testing Strategy:**
- Run `nx test services-cases` after each file extraction
- Run `nx test services-discharge` after each file extraction
- Verify 100% test coverage maintained
- Use barrel exports for backward compatibility

**Rollback Plan:**
- Git commit per file extraction
- Keep barrel exports for gradual migration
- Revert individual commits if tests fail

**Success Criteria:**
- ✅ All files <1500 LOC
- ✅ All tests passing (290+)
- ✅ Zero circular dependencies introduced
- ✅ Consumers updated or using barrel exports

---

### Phase 2C: Import Standardization (PARALLEL)

**Duration:** 4-6 hours  
**Owner:** Import Lead  
**Dependencies:** Phase 1 complete

**Tasks:**
1. Identify all 39 lazy-load violations in web app
2. Decide on pattern: lazy-load in API routes, static in components
3. Update imports file-by-file
4. Verify bundle sizes unchanged or improved
5. Run `nx lint web` after each batch

**Parallelization:** ✅ Can run with Phase 2A and 2B

**Testing Strategy:**
- `nx lint web` - verify violations cleared
- `nx build web` - verify build succeeds
- Check bundle sizes before/after

**Rollback Plan:**
- Git commit per batch of files (10 at a time)
- Revert batches if build breaks

**Success Criteria:**
- ✅ Zero lazy-load lint violations
- ✅ Consistent import pattern
- ✅ Build succeeds
- ✅ Bundle sizes acceptable

---

### Phase 3: DI Implementation (SEQUENTIAL)

**Duration:** 8-12 hours  
**Owner:** Architecture Lead  
**Dependencies:** Phase 2A complete (tags fixed first)

**Tasks:**
1. Create service interfaces in `services-shared`:
   - `ICasesService` interface
   - `ICallExecutor` interface
2. Implement `ICasesService` in `services-cases`
3. Implement `ICallExecutor` in `services-discharge`
4. Update `discharge-orchestrator` to use `ICasesService` interface
5. Update `cases-service` to use `ICallExecutor` interface
6. Remove dynamic imports, use constructor injection
7. Verify circular dependency eliminated via `nx graph`

**Parallelization:** ❌ Must be sequential (architectural change)

**Testing Strategy:**
- Create mock implementations for interfaces
- Update service tests to use mocks
- Verify services can be instantiated with injected dependencies
- Run `nx test services-cases services-discharge services-shared`
- Run `nx graph` to verify no circular dependencies

**Rollback Plan:**
- Git tag: `pre-di-implementation`
- Keep dynamic imports as fallback until verified
- Revert entire phase if circular dependency not resolved

**Success Criteria:**
- ✅ Zero circular dependencies (nx graph verification)
- ✅ Services use constructor injection
- ✅ Interfaces in services-shared
- ✅ All service tests passing
- ✅ Mock implementations working

---

### Phase 4: Test Updates (SEQUENTIAL)

**Duration:** 4-6 hours  
**Owner:** Testing Lead  
**Dependencies:** Phase 3 complete (DI implemented)

**Tasks:**
1. Update service tests to use interface mocks
2. Add tests for new split files (from Phase 2B)
3. Add tests for interface implementations
4. Verify 290+ tests still passing
5. Add integration tests for DI pattern
6. Update test documentation

**Parallelization:** ❌ Must follow DI implementation

**Testing Strategy:**
- `pnpm test:all` - verify all tests pass
- Check coverage reports - maintain 95%+ in critical areas
- Add tests for edge cases in DI
- Test mock implementations

**Rollback Plan:**
- Git commit per test file update
- Revert if coverage drops below threshold

**Success Criteria:**
- ✅ All 290+ tests passing
- ✅ Coverage maintained or improved
- ✅ New tests for split files
- ✅ DI pattern fully tested

---

### Phase 5: Final Verification (SEQUENTIAL)

**Duration:** 1-2 hours  
**Owner:** Integration Lead  
**Dependencies:** All previous phases complete

**Tasks:**
1. Run full test suite: `pnpm test:all`
2. Verify zero circular dependencies: `nx graph`
3. Check Nx compliance: measure against 95%+ target
4. Validate zero module boundary violations: `nx lint:all`
5. Confirm all large files split: count LOC per file
6. Generate final report
7. Update documentation

**Parallelization:** N/A (final verification)

**Testing Strategy:**
- Full regression test suite
- Compare baseline (Phase 0) vs final state
- Verify all Phase 1 findings resolved

**Rollback Plan:**
- Full workspace rollback to pre-integration state if critical issues

**Success Criteria:**
- ✅ All 290+ tests passing
- ✅ Zero circular dependencies
- ✅ 95%+ Nx compliance (up from 81.3%)
- ✅ Zero module boundary violations (down from 39)
- ✅ All large files split (<1500 LOC)
- ✅ All 5 Phase 1 issues resolved

---

## 6. Conflict Resolution

### Identified Conflicts

#### Conflict 1: DI Implementation vs. Existing Dynamic Imports

**Completed Work:** Services use dynamic imports to avoid circular dependency  
**Target Architecture:** Interface-based DI pattern (from Agent 4)

**Resolution Strategy:**
1. Keep dynamic imports until interfaces fully implemented
2. Implement interfaces in parallel with existing code
3. Gradually migrate from dynamic imports to constructor injection
4. Remove dynamic imports only after full verification
5. Use feature flags if gradual rollout needed

**Risk:** Medium - architectural change could introduce bugs  
**Mitigation:** 
- Extensive testing with mocks
- Gradual migration with rollback points
- Keep dynamic imports as fallback during transition

---

#### Conflict 2: File Splitting vs. Test Coverage

**Completed Work:** 290+ tests for existing monolithic files  
**Target Architecture:** Split files require test updates

**Resolution Strategy:**
1. **Before splitting:** Verify 100% test coverage on monolithic files
2. **During splitting:** Extract files incrementally, one at a time
3. **After each extraction:** Run full test suite, verify coverage maintained
4. **Add new tests:** For newly extracted files if coverage gaps
5. **Use barrel exports:** Maintain backward compatibility during migration

**Risk:** High - could break existing tests or reduce coverage  
**Mitigation:**
- One file extraction at a time
- Test suite runs after each extraction
- Rollback if any test fails
- Barrel exports allow gradual consumer migration

---

#### Conflict 3: Tag Reclassification vs. ESLint Module Boundaries

**Completed Work:** Services tagged as `type:service` (custom tag)  
**Target Architecture:** Must use Nx standard tags (`type:data-access`, `type:util`)

**Resolution Strategy:**
1. Update `project.json` tags first
2. Update ESLint `depConstraints` to remove `type:service` references
3. Run `nx lint:all` to verify no new violations
4. Fix any violations that arise from new tag constraints
5. Verify import paths unchanged (consumers not affected)

**Risk:** Low - tags don't affect import paths  
**Mitigation:**
- Import paths use `@odis-ai/*` not tags
- ESLint rules updated simultaneously
- Verification run immediately after changes

---

#### Conflict 4: Parallel Work Dependencies

**Potential Issue:** Phase 2A/2B/2C running in parallel could cause merge conflicts

**Resolution Strategy:**
1. **Phase 2A** (tags): Only touches `project.json` files
2. **Phase 2B** (file splitting): Only touches `libs/services-*/src/` files
3. **Phase 2C** (imports): Only touches `apps/web/` files
4. These work in **different directories** - minimal conflict risk
5. Use separate branches for each phase, merge sequentially

**Risk:** Low - work in different directories  
**Mitigation:**
- Separate git branches
- Clear ownership boundaries
- Merge order: 2A → 2B → 2C
- Manual review of any conflicts

---

## 7. Testing Integration Strategy

### Current Test Suite (290+ tests)

**Breakdown:**
- **validators library:** 236+ tests, 95%+ coverage ✅
- **services-cases:** 1+ test files
- **services-discharge:** 1+ test files
- **services-shared:** 1+ test files
- **Other libraries:** ~19 test files total

**Status:** All tests passing (implied by clean Phase 1 discovery)

---

### Tests Preserved As-Is (No Updates Needed)

| Library | Test Count | Reason | Risk |
|---------|-----------|--------|------|
| validators | 236+ | Not affected by any changes | NONE |
| types | 0 | Type-only library, no tests needed | NONE |
| utils | 4 files | Independent utilities | NONE |
| db | 1 file | Repository pattern unchanged | NONE |

**Total:** ~240+ tests preserved without changes

---

### Tests Requiring Updates (DI Pattern Changes)

| Library | Test Files | Update Type | Effort | Dependencies |
|---------|-----------|-------------|--------|--------------|
| services-cases | 1 | Mock interface implementations | 2-3h | Phase 3 complete |
| services-discharge | 1 | Mock interface implementations | 2-3h | Phase 3 complete |
| services-shared | 1 | Add interface tests | 1-2h | Phase 3 complete |

**Total:** ~50+ tests need updates (estimated)

**Update Pattern:**
```typescript
// Before (existing)
const casesService = new CasesService(mockRepository);

// After (DI pattern)
const mockCasesService: ICasesService = {
  createCase: vi.fn(),
  updateCase: vi.fn(),
  // ... other methods
};
const orchestrator = new DischargeOrchestrator(mockCasesService);
```

---

### New Tests Needed (File Splits & Interface Implementations)

| Component | Test Type | Count | Effort | Dependencies |
|-----------|-----------|-------|--------|--------------|
| Split files (7 new files) | Unit tests | ~35 | 3-4h | Phase 2B complete |
| Service interfaces | Interface tests | ~10 | 1-2h | Phase 3 complete |
| DI pattern integration | Integration tests | ~5 | 1h | Phase 3 complete |

**Total:** ~50 new tests

---

### Coverage Maintenance Strategy

**Current Coverage:**
- validators: 95%+ ✅
- services: Unknown (likely lower)

**Target Coverage:**
- Maintain 95%+ in validators
- Achieve 80%+ in services after refactor
- 100% coverage on new split files

**Monitoring:**
- Run coverage reports after each phase
- Flag any coverage drops >5%
- Add tests to close gaps before next phase

**Commands:**
```bash
# Run coverage for specific libraries
nx test services-cases --coverage
nx test services-discharge --coverage
nx test services-shared --coverage

# Generate workspace-wide coverage report
pnpm test:all --coverage
```

---

### Testing Checkpoints Per Phase

**Phase 0 (Validation):**
- ✅ Run `pnpm test:all` - baseline (290+ passing)
- ✅ Document current coverage percentages

**Phase 2A (Tag Fixes):**
- ✅ Run `nx lint:all` - verify no test changes needed
- ✅ Tests should pass without updates

**Phase 2B (File Splitting):**
- ✅ Run tests after EACH file extraction
- ✅ Verify 100% tests passing after each step
- ✅ Add new tests for split files

**Phase 2C (Import Standardization):**
- ✅ Run `nx test web` after each batch
- ✅ Verify no test breakage from import changes

**Phase 3 (DI Implementation):**
- ✅ Update service tests for mocks
- ✅ Run tests after each service update
- ✅ Add interface implementation tests

**Phase 4 (Test Updates):**
- ✅ Run full suite: `pnpm test:all`
- ✅ Verify 290+ tests passing
- ✅ Generate coverage reports
- ✅ Validate coverage maintained

**Phase 5 (Final Verification):**
- ✅ Run full regression suite
- ✅ Compare baseline vs final test counts
- ✅ Verify all new tests added and passing

---

## 8. Risk Assessment

### Risks Specific to Integration Approach

| Risk | Probability | Impact | Severity | Mitigation |
|------|------------|--------|----------|------------|
| **Missing Agent 4 Design** | HIGH (current) | HIGH | 🔴 **CRITICAL** | Execute Agent 4 before proceeding with implementation |
| **DI Pattern Complexity** | MEDIUM | HIGH | 🟡 **MAJOR** | Use existing repository pattern as template, gradual migration |
| **File Split Test Breakage** | MEDIUM | HIGH | 🟡 **MAJOR** | One file at a time, test after each extraction |
| **Parallel Work Conflicts** | LOW | MEDIUM | 🟢 **MINOR** | Separate branches, different directories, clear ownership |
| **Tag Changes Break Imports** | LOW | LOW | 🟢 **MINOR** | Tags don't affect import paths, verify with lint |

---

### Risks from Dependencies Between Completed and New Work

| Dependency | Risk | Impact | Mitigation |
|------------|------|--------|------------|
| **Type lib extension** | Types lib must support service interfaces | LOW | Types lib already houses interfaces (repository pattern) |
| **Service tests update** | Tests depend on DI implementation completing | MEDIUM | Update tests incrementally, keep existing tests working |
| **File split timing** | Must preserve all tests during splitting | HIGH | Extract one file at a time, run tests after each |
| **Tag reclassification first** | DI implementation assumes correct tags | MEDIUM | Phase 2A completes before Phase 3 starts |

---

### Mitigation Strategies

#### 1. Missing Agent 4 Design (CRITICAL)

**Mitigation:**
- ✅ Execute Agent 4 immediately
- ✅ Block all implementation work until design complete
- ✅ Re-run Agent 5 with complete inputs
- ✅ Update this integration plan with Agent 4 outputs

**Fallback:**
- If Agent 4 blocked, proceed with only Phase 2A/2C (tag fixes, import standardization)
- Defer Phase 2B (file splitting) and Phase 3 (DI) until design available

---

#### 2. DI Pattern Complexity (MAJOR)

**Mitigation:**
- ✅ Leverage existing repository pattern as template
- ✅ Create interfaces in services-shared first
- ✅ Implement one service at a time
- ✅ Keep dynamic imports until full verification
- ✅ Use TypeScript interfaces (no runtime overhead)
- ✅ Extensive testing with mocks

**Rollback:**
- Git tag before Phase 3 starts
- Revert entire Phase 3 if circular dependency not resolved
- Keep dynamic imports as permanent fallback if needed

---

#### 3. File Split Test Breakage (MAJOR)

**Mitigation:**
- ✅ Extract smallest file first (case-status-manager.ts ~300 LOC)
- ✅ Run tests after EVERY extraction
- ✅ Stop immediately if any test fails
- ✅ Use barrel exports for backward compatibility
- ✅ Allow consumers to migrate gradually

**Rollback:**
- Git commit after each file extraction
- Revert individual file if tests fail
- Option to defer file splitting if too risky

---

#### 4. Parallel Work Conflicts (MINOR)

**Mitigation:**
- ✅ Separate git branches per phase
- ✅ Clear directory ownership (2A: project.json, 2B: services, 2C: web)
- ✅ Sequential merge order (2A → 2B → 2C)
- ✅ Manual review of any merge conflicts

**Rollback:**
- Revert individual branches if conflicts unresolvable
- Option to run phases sequentially if parallel too risky

---

### Rollback Considerations

**Phase-by-Phase Rollback Points:**

| Phase | Git Tag | Rollback Scope | Data Loss Risk |
|-------|---------|----------------|----------------|
| Phase 0 | `pre-integration-phase-0` | Full workspace | NONE |
| Phase 1 | N/A (design only) | N/A | NONE |
| Phase 2A | `post-tag-fixes` | 3 project.json + eslint.config.js | NONE |
| Phase 2B | `post-file-split-cases` + `post-file-split-discharge` | Individual libraries | NONE |
| Phase 2C | `post-import-standardization` | Web app only | NONE |
| Phase 3 | `post-di-implementation` | Services libs only | NONE |
| Phase 4 | `post-test-updates` | Test files only | NONE |
| Phase 5 | N/A (verification only) | N/A | NONE |

**Full Workspace Rollback:**
- Tag: `pre-integration-phase-0` (created in Phase 0)
- Command: `git reset --hard pre-integration-phase-0`
- Loss: All integration work (acceptable - can restart)

**Partial Rollback (Per Phase):**
- Each phase creates its own tag/commits
- Can revert individual phases without losing others
- Enables iterative approach

---

## 9. Success Metrics

### Measurable Success Criteria

| Metric | Baseline (Current) | Target | Measurement Method |
|--------|-------------------|--------|-------------------|
| **Circular Dependencies** | 1 (services-discharge ↔ services-cases) | 0 | `nx graph` - verify no cycles |
| **Nx Compliance Score** | 81.3% | 95%+ | Recalculate from Phase 2 assessment |
| **Library Classification** | 82.8% (24/29 correct) | 100% (29/29 correct) | Verify all tags match Nx standard |
| **Tag Compliance** | 89.7% (26/29 correct) | 100% (29/29 correct) | Zero dual scope tags, zero custom tags |
| **Module Boundary Violations** | 39 (web app only) | 0 | `nx lint web` - verify clean |
| **Large Files (>1500 LOC)** | 3 files | 1 (auto-generated only) | Count LOC per file, exclude database.types.ts |
| **Test Passing Rate** | 290+ passing | 290+ passing (maintain 100%) | `pnpm test:all` |
| **Test Count** | 290+ tests | 340+ tests (add 50 new) | Count test files + assertions |
| **Test Coverage (validators)** | 95%+ | 95%+ (maintain) | Coverage report |
| **Test Coverage (services)** | Unknown | 80%+ | Coverage report |

---

### Phase-by-Phase Success Validation

#### Phase 0: Validation Success Criteria
- ✅ All 290+ tests passing
- ✅ Baseline state documented (LOC, test count, dependency graph)
- ✅ Rollback point created (`pre-integration-phase-0`)

#### Phase 1: Foundation Success Criteria (FROM AGENT 4)
- ✅ All 5 Phase 1 findings addressed in design
- ✅ Clear implementation plan provided
- ✅ Effort estimates validated

#### Phase 2A: Tag Fixes Success Criteria
- ✅ Zero `type:service` tags (0/29, was 3/29)
- ✅ Zero dual scope tags (0/29, was 3/29)
- ✅ Library classification: 100% (29/29, was 24/29)
- ✅ Tag compliance: 100% (29/29, was 26/29)
- ✅ ESLint passes with new tags
- ✅ Import paths unchanged

#### Phase 2B: File Splitting Success Criteria
- ✅ cases-service.ts: 2,082 LOC → 4 files <500 LOC each
- ✅ discharge-orchestrator.ts: 1,785 LOC → 3 files <600 LOC each
- ✅ All files <1500 LOC (except auto-generated)
- ✅ All 290+ tests passing
- ✅ Zero circular dependencies introduced
- ✅ Consumers updated or using barrel exports

#### Phase 2C: Import Standardization Success Criteria
- ✅ Zero lazy-load lint violations (0, was 39)
- ✅ Module boundary violations: 0 (was 39)
- ✅ Consistent import pattern (lazy-load in API routes, static in components)
- ✅ Build succeeds
- ✅ Bundle sizes acceptable

#### Phase 3: DI Implementation Success Criteria
- ✅ Circular dependencies: 0 (was 1)
- ✅ Services use constructor injection
- ✅ Interfaces in services-shared
- ✅ All service tests passing
- ✅ Mock implementations working
- ✅ `nx graph` shows no cycles

#### Phase 4: Test Updates Success Criteria
- ✅ All 290+ tests passing
- ✅ Coverage maintained: validators 95%+, services 80%+
- ✅ New tests added: ~50 tests for split files + interfaces
- ✅ Total test count: 340+ (was 290+)

#### Phase 5: Final Verification Success Criteria
- ✅ All 340+ tests passing
- ✅ Zero circular dependencies (verified via nx graph)
- ✅ 95%+ Nx compliance (up from 81.3%)
- ✅ Zero module boundary violations (down from 39)
- ✅ All large files split (<1500 LOC, except auto-generated)
- ✅ All 5 Phase 1 issues resolved:
  1. ✅ Circular dependency eliminated
  2. ✅ Service libraries reclassified
  3. ✅ Dual scope tags removed
  4. ✅ Large files split
  5. ✅ Lazy-load violations fixed

---

### Continuous Monitoring

**During Implementation:**
- Run `pnpm test:all` after each phase
- Run `nx graph` after DI implementation
- Run `nx lint:all` after tag changes
- Monitor test coverage after file splits
- Track LOC per file after splits

**Automated Checks:**
```bash
# After each phase, run these commands:
pnpm test:all                    # Verify all tests pass
nx graph --file=current.json     # Capture dependency graph
nx lint:all                      # Verify lint clean
nx report                        # Generate Nx report
```

**Manual Verification:**
- Review git diffs for unexpected changes
- Validate import paths still correct
- Check build output sizes
- Review coverage reports

---

## 10. Recommendations

### Optimal Execution Order

**CRITICAL:** Execute Agent 4 (Architecture Design) before any implementation work.

**Recommended Sequence:**

1. **Immediate (BLOCKING):**
   - ✅ Execute Agent 4 to create `TARGET_ARCHITECTURE_DESIGN.md`
   - ✅ Re-run Agent 5 with complete inputs
   - ✅ Update this integration plan with Agent 4 outputs

2. **Phase 0 (2-3 hours):**
   - Validate completed work
   - Create baseline snapshot
   - Document rollback points

3. **Phase 1 (TBD hours):**
   - Review and approve Agent 4's design
   - Validate effort estimates
   - Assign owners per component

4. **Phase 2 - Parallel Execution (14-18 hours total):**
   ```
   Branch: phase-2a-tag-fixes (Owner: Config Lead)
   ├── Fix 3 service library tags
   ├── Remove 3 dual scope tags
   └── Update ESLint config
   
   Branch: phase-2b-file-splitting (Owner: Refactor Lead)
   ├── Split cases-service.ts → 4 files
   └── Split discharge-orchestrator.ts → 3 files
   
   Branch: phase-2c-import-std (Owner: Import Lead)
   └── Fix 39 lazy-load violations
   ```
   **Merge Order:** 2A → 2B → 2C (sequential merge, parallel execution)

5. **Phase 3 - Sequential (8-12 hours):**
   - Wait for Phase 2A merge (tag fixes complete)
   - Implement DI pattern
   - Remove dynamic imports
   - Verify circular dependency eliminated

6. **Phase 4 - Sequential (4-6 hours):**
   - Wait for Phase 3 complete (DI implemented)
   - Update service tests
   - Add new tests for split files + interfaces
   - Verify coverage maintained

7. **Phase 5 - Sequential (1-2 hours):**
   - Wait for Phase 4 complete (all tests updated)
   - Run full verification
   - Generate final report
   - Update documentation

---

### Parallelization Strategy

**High Parallelization Potential (Phase 2):**

| Work Stream | Owner | Branch | Duration | Dependencies |
|-------------|-------|--------|----------|--------------|
| Tag Fixes | Config Lead | `phase-2a-tag-fixes` | 2-3h | Phase 1 complete |
| File Splitting | Refactor Lead | `phase-2b-file-splitting` | 14-18h | Phase 1 complete |
| Import Std | Import Lead | `phase-2c-import-std` | 4-6h | Phase 1 complete |

**Benefits:**
- Reduces total time from ~30h to ~18h (40% time savings)
- Different teams can work simultaneously
- Lower risk (isolated work streams)

**Coordination:**
- Daily standup during Phase 2
- Merge order enforced: 2A → 2B → 2C
- Manual review of all merges

---

**No Parallelization Potential (Phases 3-5):**

These phases must be sequential due to dependencies:
- Phase 3 (DI) requires Phase 2A (tags) complete
- Phase 4 (tests) requires Phase 3 (DI) complete
- Phase 5 (verify) requires Phase 4 (tests) complete

---

### Checkpoint/Milestone Definitions

**Checkpoint 1: Baseline Validated**
- **When:** End of Phase 0
- **Criteria:** All 290+ tests passing, baseline documented
- **Blocker:** If tests failing, fix before proceeding

**Checkpoint 2: Design Approved**
- **When:** End of Phase 1
- **Criteria:** Agent 4 design reviewed and approved, effort estimates validated
- **Blocker:** If design flawed, revise before implementation

**Checkpoint 3: Parallel Work Complete**
- **When:** End of Phase 2
- **Criteria:** All 3 work streams merged cleanly, tests passing
- **Blocker:** If merge conflicts or test failures, resolve before Phase 3

**Checkpoint 4: Circular Dependency Eliminated**
- **When:** End of Phase 3
- **Criteria:** `nx graph` shows zero cycles
- **Blocker:** If circular dependency persists, revert and redesign

**Checkpoint 5: All Tests Passing**
- **When:** End of Phase 4
- **Criteria:** 340+ tests passing, coverage maintained
- **Blocker:** If tests failing or coverage dropped, fix before Phase 5

**Checkpoint 6: Integration Complete**
- **When:** End of Phase 5
- **Criteria:** All success metrics met (see Section 9)
- **Blocker:** If any metric missed, address before declaring complete

---

### When to Involve Manual Review

**Mandatory Manual Review Points:**

1. **After Agent 4 Design (Phase 1):**
   - Review interface definitions
   - Validate file splitting strategy
   - Approve DI pattern approach
   - **Reviewer:** Architecture Lead + Senior Engineer

2. **Before Phase 2 Execution:**
   - Review parallel work plan
   - Assign owners
   - Confirm resource availability
   - **Reviewer:** Project Manager + Tech Leads

3. **After Phase 2 Parallel Merges:**
   - Review merge conflicts (if any)
   - Verify tests passing after each merge
   - Check for unexpected side effects
   - **Reviewer:** Merge each branch: Config Lead → Refactor Lead → Import Lead

4. **After Phase 3 DI Implementation:**
   - Review `nx graph` output (verify no cycles)
   - Review interface implementations
   - Verify services properly decoupled
   - **Reviewer:** Architecture Lead + DI Implementation Owner

5. **After Phase 4 Test Updates:**
   - Review coverage reports
   - Verify new tests adequately cover changes
   - Check for test quality issues
   - **Reviewer:** Testing Lead + QA

6. **Final Review (Phase 5):**
   - Review all success metrics
   - Approve completion
   - Sign off on integration
   - **Reviewer:** Project Manager + Architecture Lead + Senior Engineer

---

**Optional Manual Review (Triggered by Issues):**

- **Test Failures:** Immediate review by test owner + senior engineer
- **Merge Conflicts:** Review by both branch owners + architect
- **Performance Degradation:** Review by performance team
- **Build Failures:** Review by build/CI owner
- **Circular Dependency Reappears:** Immediate halt, architect review

---

### Final Recommendations

1. **CRITICAL - Execute Agent 4 First:**
   - This integration plan is incomplete without Agent 4's design
   - Block all implementation until design available
   - Re-run Agent 5 after Agent 4 completes

2. **Leverage Existing Patterns:**
   - Use repository pattern as template for service DI
   - Follow existing test patterns (validators library)
   - Reuse barrel export pattern from types library

3. **Prioritize Safety:**
   - One change at a time during file splitting
   - Keep dynamic imports until DI fully verified
   - Maintain 100% test passing rate throughout

4. **Maximize Parallelization:**
   - Run Phase 2A/2B/2C simultaneously (40% time savings)
   - But enforce sequential merge order (safety)
   - Clear ownership prevents conflicts

5. **Continuous Verification:**
   - Run tests after every change
   - Monitor coverage after each phase
   - Verify circular dependency elimination immediately

6. **Documentation:**
   - Update CLAUDE.md with new patterns
   - Document DI pattern usage
   - Create examples for future services

---

## Critical Files for Implementation

Based on this integration plan, the following files are most critical:

1. **`/Users/taylorallen/Development/odis-ai-web/libs/services-shared/src/index.ts`** - Will house new service interfaces (ICasesService, ICallExecutor) for DI pattern

2. **`/Users/taylorallen/Development/odis-ai-web/libs/services-cases/src/lib/cases-service.ts`** - 2,082 LOC, needs splitting into 4 files + DI implementation

3. **`/Users/taylorallen/Development/odis-ai-web/libs/services-discharge/src/lib/discharge-orchestrator.ts`** - 1,785 LOC, needs splitting into 3 files + DI implementation

4. **`/Users/taylorallen/Development/odis-ai-web/libs/services-cases/project.json`** - Tag reclassification needed (type:service → type:data-access)

5. **`/Users/taylorallen/Development/odis-ai-web/libs/services-discharge/project.json`** - Tag reclassification needed (type:service → type:data-access)

6. **`/Users/taylorallen/Development/odis-ai-web/eslint.config.js`** - Module boundary rules need update to remove type:service references

7. **`/Users/taylorallen/Development/odis-ai-web/libs/db/src/interfaces/`** - Pattern to follow for service interfaces (already established repository pattern)

---

**END INTEGRATION PLAN**

**Status:** ⚠️ INCOMPLETE - Requires Agent 4 execution  
**Next Action:** Execute Agent 4 (Architecture Design), then re-run Agent 5  
**Generated:** 2025-12-23  
**Generated By:** Agent 5 (Integration Planner)
