# Baseline Snapshot - Before Nx Refactoring

**Date**: December 23, 2024
**Git Tag**: `baseline-before-refactoring`
**Commit**: a77e469

---

## Executive Summary

This document captures the complete state of the ODIS AI Nx monorepo before beginning the comprehensive refactoring to achieve 95%+ Nx best practices compliance.

**Current State**: 81.3% Nx compliance
**Target State**: 95%+ Nx compliance
**Test Baseline**: 694 tests passing across 25 test files

---

## Test Infrastructure Baseline

### Overall Test Metrics

```
Test Files: 25 passed
Tests: 694 passed
Status: ✅ All tests passing
```

### Test Distribution by Library

- validators: 229 tests
- utils: 159 tests (business-hours, phone, schedule-time, cn)
- vapi: 46 tests
- services-discharge: 33 tests
- Multiple other libraries: 227 tests combined

### Test Coverage Targets

- validators: 95%+ coverage (maintained)
- services: 60%+ coverage baseline
- Overall: Add ~50 new tests during refactoring (target: 740+ tests)

---

## Circular Dependencies

### Count: 1 (Confirmed)

**services-discharge ↔ services-cases**

#### Dynamic Imports in discharge-orchestrator.ts

Six locations calling CasesService methods:

1. Line 474: `executeIngest()` - calls `CasesService.ingest()`
2. Line 742: `executeEntityExtraction()` - calls `CasesService.enrichEntitiesWithPatient()`
3. Line 847: `executeSummaryGeneration()` - calls `CasesService.getCaseWithEntities()`
4. Line 1044: `executeEmailPreparation()` - calls `CasesService.getCaseWithEntities()`
5. Line 1168: `executeEmailScheduling()` - calls `CasesService.getCaseWithEntities()`
6. Line 1535: `executeCallScheduling()` - calls `CasesService.scheduleDischargeCall()`

All use: `const { CasesService } = await import("@odis-ai/services-cases");`

#### Dynamic Imports in cases-service.ts

Two locations calling executeScheduledCall:

1. Line 1514: Test mode execution
2. Line 1600: Test mode execution

Both use: `const { executeScheduledCall } = await import("@odis-ai/services-discharge/call-executor");`

#### Pattern

- All imports are **dynamic** (`await import()`)
- All have ESLint disable comments: `// eslint-disable-next-line @nx/enforce-module-boundaries`
- Runtime works because execution is sequential
- **Root cause**: No interfaces, direct concrete dependencies

---

## Library Tag Violations

### Services Libraries (3 violations)

#### Type Tag Violations

All three service libraries use custom `type:service` tag:

1. **libs/services-cases/project.json**
   - Current: `["type:service", "scope:server", "platform:node"]`
   - Should be: `["type:data-access", "scope:domain", "platform:node"]`

2. **libs/services-discharge/project.json**
   - Current: `["type:service", "scope:server", "platform:node"]`
   - Should be: `["type:data-access", "scope:domain", "platform:node"]`

3. **libs/services-shared/project.json**
   - Current: `["type:service", "scope:server", "platform:node"]`
   - Should be: `["type:util", "scope:domain", "platform:neutral"]`

### Extension Libraries (3 violations)

#### Dual Scope Tag Violations

All three extension libraries have both `scope:extension` AND `scope:shared`:

1. **libs/extension-env/project.json**
   - Current: `["type:config", "scope:extension", "scope:shared", "platform:browser"]`
   - Should be: `["type:config", "scope:extension", "platform:browser"]`

2. **libs/extension-shared/project.json**
   - Current: `["type:util", "scope:extension", "scope:shared", "platform:browser"]`
   - Should be: `["type:util", "scope:extension", "platform:browser"]`

3. **libs/extension-storage/project.json**
   - Current: `["type:util", "scope:extension", "scope:shared", "platform:browser"]`
   - Should be: `["type:util", "scope:extension", "platform:browser"]`

---

## Large Files

### Services Cases

**File**: `libs/services-cases/src/lib/cases-service.ts`

- **Size**: 2,082 lines
- **Target**: <600 lines per file
- **Strategy**: Split into 8 files (validation, creation, scheduling, status management)

### Services Discharge

**File**: `libs/services-discharge/src/lib/discharge-orchestrator.ts`

- **Size**: 1,785 lines
- **Target**: <600 lines per file
- **Strategy**: Split into 4 files (email orchestrator, call orchestrator, summary orchestrator, main coordinator)

### Total Services Code

- **Total lines**: 5,668 lines across all service files
- **Large files**: 2 files exceeding 1500 LOC

---

## Import Pattern Violations

### Lazy-Load Inconsistencies

**Count**: 39 violations (estimated)

**Pattern Issue**: Inconsistent db import patterns

- Some files use dynamic `await import("@odis-ai/db")` in API routes
- Other files use static `import { createClient } from "@odis-ai/db"`

**Target Pattern**:

- API routes: Use dynamic imports
- Components/tRPC/Server Actions: Use static imports

---

## Platform Separation

### Status: ✅ 100% Compliant

**Verification**:

- browser libraries: Only depend on browser/neutral libs
- node libraries: Properly isolated
- neutral libraries: Platform-independent

**No violations found.**

---

## Nx Library Classification

### Current Compliance: 81.3%

#### Compliant Libraries (24 out of 29)

Following Nx 4-type model:

- `type:util`: validators, utils, constants, logger, crypto, email, ai, slack, idexx
- `type:data-access`: db, api-client, auth, vapi, qstash, resend, retell
- `type:ui`: ui, styles
- `type:config`: env, extension-env, clinics
- `type:types`: types
- `type:lib`: hooks, testing

#### Non-Compliant Libraries (5 out of 29)

- services-cases: Uses `type:service` (should be `type:data-access`)
- services-discharge: Uses `type:service` (should be `type:data-access`)
- services-shared: Uses `type:service` (should be `type:util`)
- extension-env: Dual scope tags (remove `scope:shared`)
- extension-shared: Dual scope tags (remove `scope:shared`)
- extension-storage: Dual scope tags (remove `scope:shared`)

---

## ESLint Module Boundaries

### Current Configuration

**File**: `eslint.config.js` (lines 79-212)

**Enforcement Active**: ✅ Yes

**Three Orthogonal Constraint Categories**:

1. **Platform constraints** (lines 87-101)
2. **Type constraints** (lines 103-190)
3. **Scope constraints** (lines 193-209)

### Missing Constraint

**Needed**: `scope:domain` constraint for service libraries

**Add after line 209**:

```typescript
{
  sourceTag: "scope:domain",
  onlyDependOnLibsWithTags: ["scope:domain", "scope:shared"],
},
```

---

## Dependency Graph

### Statistics

- **Projects**: 33 (3 apps, 30 libraries)
- **Dependencies**: 102 edges (81 static, 21 dynamic)
- **Average depth**: 1.7 levels
- **Max depth**: 4 levels
- **Circular dependencies**: 1

### God Libraries (>10 dependents)

- **types**: 11 dependents (borderline)

### High-Impact Libraries (6-10 dependents)

- validators: 9 dependents
- utils: 7 dependents
- env: 7 dependents
- ui: 6 dependents
- db: 6 dependents

---

## Verification Commands

### Test Count

```bash
pnpm test:all 2>&1 | grep "Test Files\|Tests.*passed"
# Expected: 25 test files, 694 tests passing
```

### Circular Dependencies

```bash
pnpm nx graph --file=graph.json
cat graph.json | grep -i "circular"
# Expected: 1 circular dependency
```

### Large Files

```bash
wc -l libs/services-cases/src/lib/cases-service.ts
wc -l libs/services-discharge/src/lib/discharge-orchestrator.ts
# Expected: 2,082 and 1,785 lines
```

### Custom Tags

```bash
find libs/ -name "project.json" -exec jq -r 'select(.tags | contains(["type:service"])) | .name' {} \;
# Expected: services-cases, services-discharge, services-shared
```

---

## Success Metrics After Refactoring

### Target Metrics

- ✅ Zero circular dependencies (from 1)
- ✅ 95%+ Nx compliance (from 81.3%)
- ✅ 740+ tests passing (from 694)
- ✅ All files <600 LOC (from 2 large files)
- ✅ 100% tag compliance (from 89.7%)
- ✅ Zero lazy-load violations (from 39)

### Phase-by-Phase Targets

**Phase 5 Complete**:

- Interfaces created
- Tags updated to Nx 4-type model
- Dual scope tags removed
- TypeScript compiles
- All 694 tests still passing

**Phase 6 Complete**:

- Large files split into 13 total files
- All files <600 LOC
- Backwards compatibility maintained
- All 694 tests still passing

**Phase 7 Complete**:

- Zero circular dependencies
- Interface-based DI implemented
- All dynamic imports removed
- All ESLint disables removed

**Phase 8 Complete**:

- 740+ tests passing
- New DI mock tests added
- Split file tests added
- Coverage maintained

---

## Rollback Reference

### Git Tag

```bash
git tag baseline-before-refactoring a77e469
```

### Rollback Command

```bash
git checkout baseline-before-refactoring
# Or to reset main:
git reset --hard baseline-before-refactoring
```

### Pre-Refactoring State

- Commit: a77e469
- Branch: main
- Date: December 23, 2024
- Tests: 694 passing
- Circular deps: 1
- Large files: 2

---

## Next Steps

1. **PR #3**: Create service interfaces (ICasesService, ICallExecutor)
2. **PR #4**: Reclassify service library tags
3. **PR #5**: Fix dual scope tags on extension libraries
4. **Phase 6**: Execute file splitting and import standardization
5. **Phase 7**: Implement dependency injection to eliminate circular dependency
6. **Phase 8**: Add ~50 new tests
7. **Phase 9**: Final verification and documentation

**Estimated Timeline**: 3-4 weeks @ 15-20 hrs/week
**Expected Result**: 95%+ Nx compliance, 0 circular deps, 740+ tests
