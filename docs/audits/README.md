# Codebase Audit Reports

> Purpose: Comprehensive analysis and improvement recommendations for the ODIS AI Nx monorepo.

**Generated**: 2024-12-09
**Audit Type**: Full Monorepo Analysis

---

## Executive Summary

| Area                 | Score  | Status                         |
| -------------------- | ------ | ------------------------------ |
| Nx Configuration     | 8.5/10 | Excellent foundations          |
| Library Organization | 7/10   | Good with some oversized libs  |
| Code Placement       | 5/10   | Significant clutter in web app |
| Testability          | 2/10   | Critical - only 2 test files   |
| DI Patterns          | 3/10   | Major refactoring needed       |

---

## Audit Documents

| Document                                                   | Purpose                                  |
| ---------------------------------------------------------- | ---------------------------------------- |
| [NX_WORKSPACE_AUDIT.md](./NX_WORKSPACE_AUDIT.md)           | Nx configuration, tagging, boundaries    |
| [TESTABILITY_AUDIT.md](./TESTABILITY_AUDIT.md)             | Test infrastructure & testability issues |
| [CODE_ORGANIZATION_AUDIT.md](./CODE_ORGANIZATION_AUDIT.md) | File placement & structure improvements  |
| [REFACTORING_ROADMAP.md](./REFACTORING_ROADMAP.md)         | Prioritized implementation plan          |

---

## Key Findings

### Strengths

- Zero circular dependencies
- Proper tagging on all 24 libs
- Clean platform separation (browser/node)
- Good module resolution (`@odis-ai/*` namespace)
- `libs/ui` ready for multi-app (excludes Next.js APIs)

### Critical Issues

1. **Only 2 test files exist** - 97% of code untested
2. **Two 2000+ line router files** (`dashboard.ts`, `cases.ts`)
3. **Services lack dependency injection** - direct Supabase calls
4. **Web app `lib/` has code that should be in shared libs**
5. **Missing `@nx/enforce-module-boundaries` rules**

---

## Quick Reference

### Files Requiring Immediate Attention

```
# Oversized Files (refactor into directories)
apps/web/src/server/api/routers/dashboard.ts  (2,029 lines)
apps/web/src/server/api/routers/cases.ts      (2,003 lines)
libs/services/src/cases-service.ts            (1,482 lines)
libs/services/src/discharge-orchestrator.ts   (1,610 lines)

# Code to Move to Shared Libs
apps/web/src/lib/transforms/case-transforms.ts → libs/utils/
apps/web/src/lib/clinic-context.tsx           → libs/ui/
apps/web/src/lib/db/scribe-transactions.ts    → libs/db/
apps/web/src/lib/schedule/validators.ts       → libs/validators/

# Priority Test Files Needed
libs/services/src/cases-service.ts         # 0% coverage
libs/services/src/discharge-orchestrator.ts # 0% coverage
libs/validators/src/*                      # 0% coverage
libs/vapi/src/call-manager.ts              # 0% coverage
```

---

## Implementation Phases

### Phase 1: Critical (Week 1-2)

- Move web app lib code to shared libs
- Add dependency constraint rules
- Split massive router files

### Phase 2: Important (Week 3-4)

- Introduce dependency injection in services
- Split `libs/services`
- Add test coverage for critical paths

### Phase 3: Enhancement (Week 5+)

- Consolidate types
- Create external API abstractions
- Prepare multi-app infrastructure

See [REFACTORING_ROADMAP.md](./REFACTORING_ROADMAP.md) for detailed steps.
