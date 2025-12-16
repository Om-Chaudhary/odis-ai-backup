# Comprehensive Testing Plan for ODIS AI Nx Monorepo

## Executive Summary

This plan outlines a systematic approach to fix, improve, and extend testing across the ODIS AI Nx monorepo. Based on thorough analysis, all **627 existing tests are passing** across 14 projects. The focus is on expanding coverage to critical business paths and ensuring proper testing infrastructure.

---

## Current State Analysis

### Test Infrastructure Status: Healthy

| Metric | Current State |
|--------|---------------|
| **Test Framework** | Vitest (exclusively) |
| **Total Test Files** | 19 files |
| **Total Test Cases** | 627 tests |
| **All Tests Passing** | Yes |
| **Libraries with Tests** | 10/27 (37%) |
| **Workspace Mode** | Enabled (vitest.workspace.ts) |
| **Coverage Provider** | V8 |
| **Testing Library** | `@odis-ai/testing` with mocks, fixtures, setup |

### Test Distribution by Library

| Library | Test Files | Tests | Coverage | Status |
|---------|------------|-------|----------|--------|
| validators | 6 | 236+ | 95%+ | Complete |
| utils | 4 | ~60 | Good | Partial |
| vapi | 2 | ~50 | Partial | Needs expansion |
| services-shared | 1 | ~40 | Core paths | Needs expansion |
| services-cases | 1 | 15 | Interface only | Needs integration tests |
| services-discharge | 1 | 12 | Core paths | Needs expansion |
| db | 1 | 25 | Good | Complete |
| api | 1 | 33 | Good | Complete |
| ai | 1 | ~30 | Good | Partial |
| qstash | 1 | ~20 | Good | Partial |
| **web (app)** | 0 | 0 | 0% | **Critical gap** |

### Critical Testing Gaps (Priority Order)

1. **P0 - CRITICAL**: VAPI webhook handlers (0% coverage)
2. **P0 - CRITICAL**: Authentication flows (0% coverage)
3. **P0 - CRITICAL**: Call scheduling end-to-end (0% coverage)
4. **P1 - HIGH**: IDEXX data transformer (0% coverage)
5. **P1 - HIGH**: tRPC routers (0% coverage)
6. **P1 - HIGH**: Server actions (0% coverage)
7. **P2 - MEDIUM**: UI components (0% coverage)
8. **P2 - MEDIUM**: React hooks (partial)

---

## Implementation Plan

### Phase 1: Fix Configuration & Enable Coverage Thresholds

#### 1.1 Update Root Vitest Workspace Configuration

**File**: `vitest.workspace.ts`

Add coverage aggregation:
```typescript
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/web/vitest.config.ts",
  "libs/*/vitest.config.ts",
]);
```

#### 1.2 Add Global Coverage Thresholds

**File**: `vitest.config.shared.ts` (NEW)

Create shared configuration with coverage thresholds:
```typescript
import { defineConfig } from "vitest/config";

export const sharedTestConfig = {
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html", "lcov"],
    thresholds: {
      lines: 60,
      functions: 60,
      branches: 50,
      statements: 60,
    },
    exclude: [
      "node_modules/",
      "**/*.d.ts",
      "**/*.config.*",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/index.ts",
      "**/types/**",
      "**/__mocks__/**",
    ],
  },
};
```

#### 1.3 Update nx.json Target Defaults

Add coverage to test target defaults:
```json
{
  "targetDefaults": {
    "test": {
      "cache": true,
      "inputs": ["default", "^production"],
      "outputs": ["{projectRoot}/coverage"]
    }
  }
}
```

#### 1.4 Add CI Test Script with Coverage

**File**: `package.json`

```json
{
  "scripts": {
    "test:ci": "nx run-many -t test --coverage --ci",
    "test:coverage:report": "nx run-many -t test --coverage && npx nyc report --reporter=lcov"
  }
}
```

---

### Phase 2: Critical Path Tests (P0)

#### 2.1 VAPI Webhook Handler Tests

**New File**: `apps/web/src/app/api/webhooks/vapi/__tests__/route.test.ts`

**Test Scenarios**:
- [ ] Signature verification (valid/invalid HMAC)
- [ ] Status update events (queued → ringing → in-progress → ended)
- [ ] End-of-call-report event processing
- [ ] Retry logic for failed calls (dial-busy, dial-no-answer, voicemail)
- [ ] Max retry limit enforcement
- [ ] Hang event handling
- [ ] Non-existent call handling (graceful degradation)
- [ ] startedAt timestamp capture

**Estimated Tests**: 25-30

#### 2.2 Authentication Flow Tests

**New File**: `apps/web/src/server/actions/__tests__/auth.test.ts`

**Test Scenarios**:
- [ ] signUp with valid credentials
- [ ] signUp with duplicate email
- [ ] signIn with correct credentials
- [ ] signIn with incorrect password
- [ ] signOut session clearing
- [ ] getUser when authenticated
- [ ] getUser when not authenticated
- [ ] updateUserProfile validation

**Estimated Tests**: 15-20

#### 2.3 Call Scheduling Tests

**New File**: `apps/web/src/app/api/calls/schedule/__tests__/route.test.ts`

**Test Scenarios**:
- [ ] Valid call scheduling with future time
- [ ] Rejection of past scheduled time
- [ ] Phone number validation (E.164 format)
- [ ] QStash job creation
- [ ] Database rollback on QStash failure
- [ ] Dynamic variable transformation
- [ ] Test mode contact redirect
- [ ] Auto-stagger calculation for concurrent calls

**Estimated Tests**: 20-25

---

### Phase 3: High Priority Tests (P1)

#### 3.1 IDEXX Transformer Tests

**New File**: `libs/idexx/src/__tests__/transformer.test.ts`

**Test Scenarios**:
- [ ] Patient/client data extraction
- [ ] Date formatting for voice ("January 15th, 2025")
- [ ] Phone formatting for voice ("five five five...")
- [ ] Provider selection (first in list)
- [ ] Missing field handling
- [ ] Consultation ID extraction from URL

**Estimated Tests**: 15-20

#### 3.2 tRPC Router Tests

**New Files**:
- `apps/web/src/server/api/routers/__tests__/cases.test.ts`
- `apps/web/src/server/api/routers/__tests__/dashboard.test.ts`

**Test Scenarios**:
- [ ] Protected procedure authentication checks
- [ ] List queries with filters
- [ ] Single record queries
- [ ] Create/update mutations
- [ ] Delete operations
- [ ] Stats calculations
- [ ] Error handling

**Estimated Tests**: 40-50

#### 3.3 Expand Service Layer Tests

**Files to Expand**:
- `libs/services-cases/src/__tests__/cases-service.test.ts`
- `libs/services-discharge/src/__tests__/discharge-orchestrator.test.ts`

**Additional Test Scenarios**:
- [ ] Case deduplication logic (external_id → patient name → 90-day window)
- [ ] Entity enrichment priority chain
- [ ] Parallel execution in orchestrator
- [ ] Rollback on step failure
- [ ] Euthanasia case detection and blocking
- [ ] SOAP note staleness checking

**Estimated Tests**: 30-40

---

### Phase 4: Documentation

#### 4.1 Update Testing Strategy Document

**File**: `docs/testing/TESTING_STRATEGY.md`

Updates:
- [ ] Add coverage threshold requirements
- [ ] Update test count and coverage metrics
- [ ] Add CI/CD workflow documentation
- [ ] Add mocking patterns documentation

#### 4.2 Create Library-Specific Test Guides

**New Files**:
- `libs/services-cases/TESTING.md`
- `libs/services-discharge/TESTING.md`
- `libs/vapi/TESTING.md`
- `apps/web/TESTING.md`

Content:
- How to run tests for the library
- Mocking patterns specific to the library
- Fixture usage examples
- Coverage requirements

#### 4.3 Add Test Examples to Testing Library

**File**: `libs/testing/README.md`

- [ ] Add usage examples for all mocks
- [ ] Document fixture generators
- [ ] Add setup file documentation
- [ ] Include troubleshooting guide

---

### Phase 5: CI/CD Integration

#### 5.1 GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run affected tests with coverage
        run: pnpm nx affected -t test --coverage --ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

#### 5.2 Pre-commit Hook Update

**File**: `.husky/pre-push`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm nx affected -t test --ci
```

---

## Test File Structure

### Recommended Directory Structure

```
apps/web/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── webhooks/
│   │       │   └── vapi/
│   │       │       └── __tests__/
│   │       │           └── route.test.ts (NEW)
│   │       └── calls/
│   │           └── schedule/
│   │               └── __tests__/
│   │                   └── route.test.ts (NEW)
│   ├── server/
│   │   ├── actions/
│   │   │   └── __tests__/
│   │   │       └── auth.test.ts (NEW)
│   │   └── api/
│   │       └── routers/
│   │           └── __tests__/
│   │               ├── cases.test.ts (NEW)
│   │               └── dashboard.test.ts (NEW)
│   └── test/
│       └── setup.ts (EXISTS)

libs/
├── idexx/
│   └── src/
│       └── __tests__/
│           └── transformer.test.ts (NEW)
├── services-cases/
│   └── src/
│       └── __tests__/
│           └── cases-service.test.ts (EXPAND)
└── services-discharge/
    └── src/
        └── __tests__/
            └── discharge-orchestrator.test.ts (NEW)
```

---

## Success Metrics

### Coverage Targets

| Phase | Lines | Functions | Branches | Tests |
|-------|-------|-----------|----------|-------|
| Current | ~35% | ~35% | ~30% | 627 |
| Phase 2 | 50% | 50% | 45% | 750+ |
| Phase 3 | 60% | 60% | 55% | 900+ |
| Phase 4/5 | 70% | 70% | 65% | 1000+ |

### Critical Path Coverage Goals

| Area | Current | Target |
|------|---------|--------|
| VAPI Webhook Flow | 0% | 90%+ |
| Authentication | 0% | 85%+ |
| Call Scheduling | 0% | 85%+ |
| IDEXX Transformer | 0% | 80%+ |
| tRPC Routers | 0% | 70%+ |
| Service Layer | 30% | 80%+ |

---

## Execution Order

### Immediate (Phase 1-2)
1. Update vitest configuration with coverage thresholds
2. Add P0 critical path tests (VAPI, Auth, Scheduling)
3. Run full test suite to validate

### Short-term (Phase 3)
1. Add IDEXX transformer tests
2. Add tRPC router tests
3. Expand service layer tests

### Medium-term (Phase 4-5)
1. Add documentation
2. Set up CI/CD workflow
3. Add pre-push hooks

---

## Estimated Effort

| Phase | Tasks | New Tests | Hours |
|-------|-------|-----------|-------|
| Phase 1 | Config updates | 0 | 2-3 |
| Phase 2 | P0 Critical | 60-75 | 12-15 |
| Phase 3 | P1 High | 85-110 | 16-20 |
| Phase 4 | Documentation | 0 | 4-6 |
| Phase 5 | CI/CD | 0 | 2-3 |
| **Total** | | **145-185** | **36-47** |

---

## Risk Mitigation

### High-Risk Areas to Prioritize

1. **VAPI webhook retry logic** - Failed calls not retried = lost revenue
2. **Call scheduling race conditions** - Duplicate or missed calls
3. **Authentication bypass** - Security vulnerability
4. **Data transformation errors** - Bad calls, angry customers

### Recommended Approach

1. Write tests before fixing bugs (TDD approach)
2. Mock external services at boundaries (VAPI, QStash, Supabase)
3. Use existing `@odis-ai/testing` infrastructure
4. Run tests frequently during development

---

## Next Steps

Upon approval, the implementation will proceed in this order:

1. **Create/update vitest configurations** with coverage thresholds
2. **Add P0 critical tests** (VAPI webhook, auth, call scheduling)
3. **Validate all tests pass** with `pnpm test:all`
4. **Add P1 tests** (IDEXX, tRPC, services)
5. **Update documentation**
6. **Set up CI/CD pipeline**

Ready for approval to begin implementation.
