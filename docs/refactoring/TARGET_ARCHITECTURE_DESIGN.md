
# TARGET ARCHITECTURE DESIGN

Based on my comprehensive analysis of the Phase 1 reports, current codebase structure, and existing patterns, here is the complete target architecture design document:

---

# Target Architecture Design: ODIS AI Nx Monorepo

**Date:** 2025-12-23  
**Workspace:** `/Users/taylorallen/Development/odis-ai-web`  
**Phase:** 2 - Architecture Design  
**Status:** Complete Design for Implementation

---

## Executive Summary

This document provides a comprehensive target architecture that addresses all issues discovered in Phase 1 while preserving the completed refactoring work from Phases 1-3. The design achieves:

- **Zero circular dependencies** through interface-based dependency injection
- **100% Nx 4-type compliance** by reclassifying service libraries
- **100% tag compliance** by fixing dual scope tags
- **Manageable file sizes** (<1500 LOC per file) through strategic splitting
- **Overall compliance: 95%+** (up from current 81.3%)

**Implementation Complexity:** Medium  
**Estimated Effort:** 43-59 hours (~3-4 weeks @ 15 hrs/week)  
**Breaking Changes:** Minimal (backwards compatible via re-exports)  
**Risk Level:** Low-Medium (comprehensive testing required)

---

## 1. Target Architecture Overview

### 1.1 Architectural Vision

The target architecture maintains the current strengths while addressing specific compliance issues:

**Core Principles:**
1. **Dependency Inversion:** Services depend on interfaces, not concrete implementations
2. **Single Responsibility:** Files focused on one concern (<1500 LOC)
3. **Nx Convention Alignment:** Strict adherence to Nx 4-type model
4. **Platform Separation:** Maintain 100% browser/node isolation
5. **Testability First:** All changes support existing test infrastructure (290+ tests)
6. **Backwards Compatibility:** Existing imports continue working via re-exports

### 1.2 Before/After Comparison

#### Current State (81.3% Compliance)
```
Issues:
- 1 circular dependency (services-discharge ↔ services-cases)
- 3 libraries with custom type:service tag
- 3 libraries with dual scope tags
- 2 files >1500 LOC (cases-service: 2,082, discharge-orchestrator: 1,785)
- 39 lazy-load violations in web app

Strengths:
✓ Platform separation: 100%
✓ Module boundaries: Enforced
✓ Dependency depth: 1.7 avg
✓ 290+ tests maintained
```

#### Target State (95%+ Compliance)
```
Improvements:
✓ 0 circular dependencies (interface-based DI)
✓ All libraries use Nx 4 types (feature, data-access, ui, util)
✓ Single scope tag per library
✓ All files <1500 LOC
✓ 0 lazy-load violations

Maintained Strengths:
✓ Platform separation: 100%
✓ Module boundaries: Enforced
✓ Dependency depth: 1.7 avg
✓ 290+ tests maintained
✓ Backwards compatible imports
```

### 1.3 Key Design Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Interface-based DI for services | Breaks circular dependency, enables testing | Low risk, high benefit |
| services-cases → type:data-access | Orchestrates with I/O operations | Aligns with Nx conventions |
| services-discharge → type:data-access | Orchestrates with I/O operations | Aligns with Nx conventions |
| services-shared → type:util | Pure functions, no I/O | Aligns with Nx conventions |
| Split cases-service into 4 files | Single responsibility principle | Improved maintainability |
| Split discharge-orchestrator into 3 files | Logical sub-orchestrator boundaries | Improved testability |
| Standardize db imports (lazy-load in API routes) | Consistent bundle optimization | Smaller bundle sizes |

---

## 2. Circular Dependency Elimination Plan

### 2.1 Root Cause Analysis

**Current Cycle:**
```
services-discharge → services-cases (7 dynamic imports)
services-cases → services-discharge/call-executor (2 dynamic imports)
```

**Why it exists:**
- `DischargeOrchestrator` needs `CasesService.scheduleCall()` to create scheduled calls
- `CasesService` needs `CallExecutor.executeScheduledCall()` for deferred execution

**Why it's problematic:**
- Tight coupling between business logic layers
- Difficult to test in isolation
- Complex dependency graph
- Future refactoring becomes harder

### 2.2 Solution Strategy: Interface-Based Dependency Injection

**Approach:** Extract interfaces to `services-shared`, implement dependency injection pattern

**Benefits:**
- Clean separation of concerns
- Both services depend on abstractions, not concrete implementations
- Enables mocking for tests
- Aligns with existing repository pattern (ICasesRepository, etc.)
- No breaking changes to public APIs

### 2.3 Interface Design

Create new interfaces in `libs/services-shared/src/lib/interfaces/`:

```typescript
// libs/services-shared/src/lib/interfaces/cases-service.interface.ts

import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { 
  IngestPayload, 
  CaseScheduleOptions, 
  ScheduledDischargeCall 
} from "@odis-ai/types/services";
import type { NormalizedEntities } from "@odis-ai/validators";

/**
 * Interface for case management operations
 * 
 * Implemented by: @odis-ai/services-cases/CasesService
 * Used by: @odis-ai/services-discharge
 */
export interface ICasesService {
  /**
   * Ingest case data and optionally schedule a discharge call
   */
  ingest(
    supabase: SupabaseClientType,
    userId: string,
    payload: IngestPayload,
  ): Promise<{
    caseId: string;
    entities: NormalizedEntities;
    scheduledCall: ScheduledDischargeCall | null;
  }>;

  /**
   * Schedule a discharge call for an existing case
   */
  scheduleCall(
    supabase: SupabaseClientType,
    userId: string,
    caseId: string,
    options: CaseScheduleOptions,
  ): Promise<ScheduledDischargeCall>;
  
  /**
   * Update case status
   */
  updateStatus(
    supabase: SupabaseClientType,
    caseId: string,
    status: string,
  ): Promise<void>;
}
```

```typescript
// libs/services-shared/src/lib/interfaces/call-executor.interface.ts

import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { CallExecutionResult } from "@odis-ai/types/services";

/**
 * Interface for call execution operations
 * 
 * Implemented by: @odis-ai/services-discharge/CallExecutor
 * Used by: @odis-ai/services-cases
 */
export interface ICallExecutor {
  /**
   * Execute a scheduled discharge call
   */
  executeScheduledCall(
    callId: string,
    supabase: SupabaseClientType,
  ): Promise<CallExecutionResult>;
}
```

```typescript
// libs/services-shared/src/index.ts

export * from "./lib/execution-plan";
export * from "./lib/interfaces/cases-service.interface";
export * from "./lib/interfaces/call-executor.interface";
```

### 2.4 Implementation Pattern

**Concrete Implementations:**

```typescript
// libs/services-cases/src/lib/cases-service.ts

import type { ICasesService } from "@odis-ai/services-shared";

export const CasesService: ICasesService = {
  async ingest(supabase, userId, payload) {
    // Implementation (existing code, no changes needed)
  },
  
  async scheduleCall(supabase, userId, caseId, options) {
    // Implementation (existing code, no changes needed)
  },
  
  async updateStatus(supabase, caseId, status) {
    // Implementation (existing code, no changes needed)
  },
};
```

```typescript
// libs/services-discharge/src/lib/call-executor.ts

import type { ICallExecutor } from "@odis-ai/services-shared";

export const CallExecutor: ICallExecutor = {
  async executeScheduledCall(callId, supabase) {
    // Implementation (existing code, no changes needed)
  },
};
```

**Dependency Injection:**

```typescript
// libs/services-discharge/src/lib/discharge-orchestrator.ts

import type { ICasesService } from "@odis-ai/services-shared";

/**
 * Create orchestrator with injected dependencies
 */
export function createDischargeOrchestrator(
  casesService: ICasesService
) {
  return {
    async orchestrate(/* ... */) {
      // Use injected casesService instead of dynamic import
      const result = await casesService.ingest(/* ... */);
    }
  };
}

// For backwards compatibility, provide default instance
export const DischargeOrchestrator = createDischargeOrchestrator(
  // Lazy-load only for default instance
  new Proxy({} as ICasesService, {
    get(target, prop) {
      if (!target[prop]) {
        // Load on first access
        const { CasesService } = await import("@odis-ai/services-cases");
        return CasesService[prop];
      }
      return target[prop];
    }
  })
);
```

### 2.5 Migration Steps

**Phase A: Create Interfaces (2-3 hours)**
1. Create `libs/services-shared/src/lib/interfaces/` directory
2. Add `cases-service.interface.ts` with `ICasesService`
3. Add `call-executor.interface.ts` with `ICallExecutor`
4. Export from `services-shared/index.ts`
5. Run tests to ensure no breakage

**Phase B: Update CasesService (2-3 hours)**
1. Import `ICasesService` interface
2. Add type annotation: `export const CasesService: ICasesService = { ... }`
3. Remove dynamic import of `CallExecutor` (7 locations in discharge-orchestrator)
4. Replace with injected dependency
5. Run tests to verify behavior

**Phase C: Update DischargeOrchestrator (3-4 hours)**
1. Import `ICasesService` interface
2. Implement `createDischargeOrchestrator(casesService: ICasesService)`
3. Replace 7 dynamic imports with injected `casesService` calls
4. Provide backwards-compatible default export with lazy-loading
5. Run tests to verify behavior

**Phase D: Update CallExecutor (1-2 hours)**
1. Import `ICallExecutor` interface
2. Add type annotation: `export const CallExecutor: ICallExecutor = { ... }`
3. Update 2 locations in cases-service to use interface
4. Run tests to verify behavior

**Total Effort: 8-12 hours**

### 2.6 Testing Strategy

**Unit Tests:**
```typescript
// libs/services-discharge/src/lib/discharge-orchestrator.test.ts

import { describe, it, expect, vi } from "vitest";
import { createDischargeOrchestrator } from "./discharge-orchestrator";
import type { ICasesService } from "@odis-ai/services-shared";

describe("DischargeOrchestrator with DI", () => {
  it("should use injected CasesService", async () => {
    // Create mock
    const mockCasesService: ICasesService = {
      ingest: vi.fn().mockResolvedValue({ 
        caseId: "123", 
        entities: {}, 
        scheduledCall: null 
      }),
      scheduleCall: vi.fn(),
      updateStatus: vi.fn(),
    };

    // Create orchestrator with mock
    const orchestrator = createDischargeOrchestrator(mockCasesService);

    // Execute
    await orchestrator.orchestrate(/* ... */);

    // Verify mock was called
    expect(mockCasesService.ingest).toHaveBeenCalledWith(/* ... */);
  });
});
```

**Integration Tests:**
- Verify default export still works with lazy-loading
- Verify all 290+ existing tests pass
- Verify no runtime errors in production

**Verification Checklist:**
- [ ] All tests pass
- [ ] No circular dependency warnings in Nx
- [ ] No dynamic imports between services-cases and services-discharge
- [ ] Backwards compatibility maintained (existing imports work)
- [ ] TypeScript compiles without errors

---

## 3. Library Classification Strategy

### 3.1 Nx 4-Type Model Overview

Nx defines 4 standard library types:

| Type | Purpose | Can Depend On | Examples |
|------|---------|---------------|----------|
| **feature** | Smart components with business logic | data-access, ui, util | Dashboard features, flows |
| **data-access** | Data fetching, state management, I/O | data-access, util, config, types | API clients, repositories, services |
| **ui** | Presentational components | ui, util, types | Button, Modal, Card |
| **util** | Pure utility functions | util, config, types | Date helpers, validators |

**Additional Supported Types:**
- **config** - Configuration and environment (foundation layer)
- **types** - Type definitions (foundation layer)
- **integration** - External API wrappers (custom type, widely used)
- **testing** - Test utilities (special case)

**Custom Types:** Should be avoided unless there's strong justification and community consensus.

### 3.2 Current Misclassifications

**Issue:** 3 libraries use custom `type:service` tag not in Nx standard model

```
❌ services-cases: type:service
❌ services-discharge: type:service  
❌ services-shared: type:service
```

**Why this matters:**
- ESLint module boundary rules don't recognize `type:service`
- Prevents proper dependency flow enforcement
- Not aligned with Nx conventions
- Creates confusion for developers

### 3.3 Reclassification Decisions

#### Services-Cases → type:data-access

**Rationale:**
- Orchestrates business logic with I/O operations
- Fetches/writes data to Supabase
- Manages external API calls (VAPI, QStash)
- Similar to a repository or API client layer

**Evidence:**
```typescript
// CasesService performs I/O operations:
- supabase.from("cases").insert()
- supabase.from("patients").upsert()
- scheduleCallExecution() (external API)
- createPhoneCall() (external API)
```

**Nx Guidance:** "Data-access libraries contain services and utilities to interact with APIs and manage state."

#### Services-Discharge → type:data-access

**Rationale:**
- Orchestrates complex workflows with I/O operations
- Coordinates multiple external services (email, calls, database)
- Manages state transitions in database
- Similar pattern to services-cases

**Evidence:**
```typescript
// DischargeOrchestrator performs I/O operations:
- supabase.from("discharge_summaries").insert()
- scheduleEmailExecution() (external API)
- CasesService.scheduleCall() (delegates to I/O)
- Email template generation and sending
```

**Nx Guidance:** "Data-access libraries are responsible for interacting with a specific back-end system."

#### Services-Shared → type:util

**Rationale:**
- Contains only pure utility functions (ExecutionPlan)
- No I/O operations
- No external dependencies (only types, validators)
- Reusable logic across multiple libraries

**Evidence:**
```typescript
// ExecutionPlan is pure logic:
- Manages execution state (in-memory)
- No database operations
- No API calls
- Pure functional helpers
```

**Nx Guidance:** "Util libraries contain low-level utilities used by many libraries and applications."

### 3.4 Complete Library Classification Matrix

**Target State: 29/29 Correctly Classified (100%)**

| Library | Current Type | Target Type | Justification |
|---------|--------------|-------------|---------------|
| **Services** ||||
| services-cases | ❌ service | ✅ data-access | Orchestrates with I/O |
| services-discharge | ❌ service | ✅ data-access | Orchestrates with I/O |
| services-shared | ❌ service | ✅ util | Pure functions, no I/O |
| **Data Access** ||||
| api | ✅ data-access | ✅ data-access | API helpers |
| db | ✅ data-access | ✅ data-access | Supabase clients |
| **Integrations** ||||
| idexx | ✅ integration | ✅ integration | IDEXX API |
| qstash | ✅ integration | ✅ integration | QStash API |
| resend | ✅ integration | ✅ integration | Resend API |
| retell | ✅ integration | ✅ integration | Retell API |
| slack | ✅ integration | ✅ integration | Slack API |
| vapi | ✅ integration | ✅ integration | VAPI API |
| **UI** ||||
| styles | ✅ ui | ✅ ui | Global styles |
| ui | ✅ ui | ✅ ui | Component library |
| **Utilities** ||||
| ai | ✅ util | ✅ util | AI helpers |
| auth | ✅ util | ✅ util | Auth utilities |
| clinics | ✅ util | ✅ util | Clinic helpers |
| crypto | ✅ util | ✅ util | Encryption |
| email | ✅ util | ✅ util | Email templates |
| extension-env | ✅ config | ✅ config | Extension config |
| extension-shared | ✅ util | ✅ util | Extension utils |
| extension-storage | ✅ util | ✅ util | Extension storage |
| hooks | ✅ util | ✅ util | React hooks |
| logger | ✅ util | ✅ util | Logging |
| utils | ✅ util | ✅ util | General utilities |
| validators | ✅ util | ✅ util | Zod schemas |
| **Config** ||||
| constants | ✅ config | ✅ config | Constants |
| env | ✅ config | ✅ config | Environment vars |
| **Types** ||||
| types | ✅ types | ✅ types | Type definitions |
| **Testing** ||||
| testing | ✅ util | ✅ util | Test utilities |

### 3.5 ESLint Rule Updates

**Current State:**
```javascript
// eslint.config.js lines 120-130
{
  sourceTag: "type:service",
  onlyDependOnLibsWithTags: [
    "type:service",
    "type:integration",
    "type:data-access",
    "type:util",
    "type:config",
    "type:types",
  ],
},
```

**Target State:**
```javascript
// eslint.config.js lines 120-130
// Remove type:service constraints (no longer needed)
// services-cases and services-discharge now follow type:data-access rules
// services-shared now follows type:util rules

// Existing data-access rule covers reclassified services:
{
  sourceTag: "type:data-access",
  onlyDependOnLibsWithTags: [
    "type:data-access",
    "type:util",
    "type:config",
    "type:types",
  ],
},
```

**Changes Required:**
1. Remove `type:service` constraint block (lines 120-130)
2. Update `type:app` allowed dependencies to remove `type:service`
3. Verify all other rules remain unchanged

### 3.6 Implementation Steps

**Phase A: Update Project Tags (30 minutes)**
```bash
# Update project.json files
libs/services-cases/project.json:
  "tags": ["type:data-access", "scope:server", "platform:node"]

libs/services-discharge/project.json:
  "tags": ["type:data-access", "scope:server", "platform:node"]

libs/services-shared/project.json:
  "tags": ["type:util", "scope:server", "platform:node"]
```

**Phase B: Update ESLint Config (15 minutes)**
```bash
# Remove type:service block from eslint.config.js
# Update type:app dependencies list
```

**Phase C: Verification (30 minutes)**
```bash
# Run linting to verify no new violations
pnpm lint:all

# Verify dependency constraints are enforced
nx graph

# Run tests to ensure no breakage
pnpm test:all
```

**Total Effort: 1-2 hours**

### 3.7 Validation Approach

**Success Criteria:**
- [ ] All 3 service libraries have Nx 4-compliant type tags
- [ ] ESLint config no longer references `type:service`
- [ ] `pnpm lint:all` passes with no new violations
- [ ] All 290+ tests pass
- [ ] Nx graph shows correct dependency relationships
- [ ] Module boundary rules enforce correctly

**Rollback Plan:**
If issues arise, revert project.json changes and restore ESLint config. No code changes required, only configuration.

---

## 4. Tag Strategy

### 4.1 Current Tag Violations

**Issue:** 3 extension libraries have dual scope tags

```
❌ extension-env: ["type:config", "scope:extension", "scope:shared", "platform:browser"]
❌ extension-shared: ["type:util", "scope:extension", "scope:shared", "platform:browser"]
❌ extension-storage: ["type:util", "scope:extension", "scope:shared", "platform:browser"]
```

**Why this matters:**
- Violates "one primary scope" principle
- Makes dependency rules ambiguous
- `scope:extension` + `platform:browser` already provides sufficient constraint
- Could allow unintended cross-scope dependencies

### 4.2 Tag Design Principles

**Principle 1: Single Scope Tag**
- Each library should have exactly ONE scope tag
- Scope defines domain boundary (extension, server, shared)
- Platform tag provides runtime constraint (browser, node, neutral)

**Principle 2: Tag Hierarchy**
```
Type Tag (REQUIRED)     - Architectural layer (data-access, util, ui, etc.)
Scope Tag (REQUIRED)    - Domain boundary (extension, server, shared)
Platform Tag (REQUIRED) - Runtime environment (browser, node, neutral)
```

**Principle 3: Tag Combination Rules**
```
scope:extension + platform:browser  → Extension-specific, browser code
scope:server    + platform:node     → Server-only code
scope:shared    + platform:neutral  → Cross-cutting, platform-agnostic
```

### 4.3 Extension Libraries Tag Strategy

**Decision: Remove `scope:shared` from all extension libraries**

**Rationale:**
- These libraries ARE extension-specific (not truly shared across domains)
- They are shared WITHIN the extension domain (between extension components)
- `scope:extension` accurately reflects their domain
- `platform:browser` accurately reflects their runtime
- Combination is sufficient and unambiguous

**Evidence:**
```typescript
// extension-env: Extension-specific environment configuration
// extension-shared: Utilities shared WITHIN extension
// extension-storage: Chrome storage API wrappers (extension-only)
```

### 4.4 Complete Tag Matrix

**Target State: 29/29 Correct (100% Compliance)**

| Library | Type | Scope | Platform | Notes |
|---------|------|-------|----------|-------|
| **Services** |||||
| services-cases | data-access | server | node | Changed from type:service |
| services-discharge | data-access | server | node | Changed from type:service |
| services-shared | util | server | node | Changed from type:service |
| **Data Access** |||||
| api | data-access | server | node | ✓ Correct |
| db | data-access | server | node | ✓ Correct |
| **Integrations** |||||
| idexx | integration | server | node | ✓ Correct |
| qstash | integration | server | node | ✓ Correct |
| resend | integration | server | node | ✓ Correct |
| retell | integration | server | node | ✓ Correct |
| slack | integration | server | node | ✓ Correct |
| vapi | integration | server | node | ✓ Correct |
| **UI** |||||
| styles | ui | shared | browser | ✓ Correct |
| ui | ui | shared | browser | ✓ Correct |
| **Utilities** |||||
| ai | util | server | node | ✓ Correct |
| auth | util | shared | neutral | ✓ Correct |
| clinics | util | server | node | ✓ Correct |
| crypto | util | shared | neutral | ✓ Correct |
| email | util | server | node | ✓ Correct |
| extension-env | config | extension | browser | Removed scope:shared |
| extension-shared | util | extension | browser | Removed scope:shared |
| extension-storage | util | extension | browser | Removed scope:shared |
| hooks | util | shared | browser | ✓ Correct |
| logger | util | shared | neutral | ✓ Correct |
| utils | util | shared | neutral | ✓ Correct |
| validators | util | shared | neutral | ✓ Correct |
| **Config** |||||
| constants | config | shared | neutral | ✓ Correct |
| env | config | shared | neutral | ✓ Correct |
| **Types** |||||
| types | types | shared | neutral | ✓ Correct |
| **Testing** |||||
| testing | util | shared | neutral | ✓ Correct |

### 4.5 ESLint Scope Constraint Verification

**Current Rules (Correct, No Changes Needed):**
```javascript
// Scope constraints in eslint.config.js (lines 195-209)
{
  sourceTag: "scope:extension",
  onlyDependOnLibsWithTags: ["scope:extension", "scope:shared"],
},
{
  sourceTag: "scope:server",
  onlyDependOnLibsWithTags: ["scope:server", "scope:shared"],
},
{
  sourceTag: "scope:shared",
  onlyDependOnLibsWithTags: ["scope:shared"],
},
```

**After Tag Fixes:**
- extension-env: `scope:extension` → Can import from extension or shared libs ✓
- extension-shared: `scope:extension` → Can import from extension or shared libs ✓
- extension-storage: `scope:extension` → Can import from extension or shared libs ✓

**Verification:** These libraries currently import from `@odis-ai/types` (scope:shared), which will still be allowed. No breaking changes.

### 4.6 Implementation Steps

**Phase A: Update Extension Library Tags (15 minutes)**
```bash
# libs/extension-env/project.json
"tags": [
  "type:config",
  "scope:extension",  # Keep
  # "scope:shared"    # Remove
  "platform:browser"
]

# libs/extension-shared/project.json
"tags": [
  "type:util",
  "scope:extension",  # Keep
  # "scope:shared"    # Remove
  "platform:browser"
]

# libs/extension-storage/project.json
"tags": [
  "type:util",
  "scope:extension",  # Keep
  # "scope:shared"    # Remove
  "platform:browser"
]
```

**Phase B: Verification (15 minutes)**
```bash
# Verify no ESLint violations
pnpm lint:all

# Verify Nx graph
nx graph

# Verify tests pass
pnpm test:all
```

**Total Effort: 30 minutes - 1 hour**

### 4.7 Validation Checklist

**Success Criteria:**
- [ ] All 29 libraries have exactly 3 tags (type, scope, platform)
- [ ] No libraries have duplicate scope tags
- [ ] ESLint scope constraints enforce correctly
- [ ] Extension libraries can still import shared utilities
- [ ] All 290+ tests pass
- [ ] Nx graph visualization shows correct relationships

**Rollback Plan:**
Revert project.json changes for the 3 extension libraries. No code changes needed.

---

## 5. File Splitting Design

### 5.1 Overview

**Issue:** 2 service files exceed target size of 1500 LOC

```
❌ cases-service.ts: 2,082 LOC (target: <500 LOC per file)
❌ discharge-orchestrator.ts: 1,785 LOC (target: <600 LOC per file)
✓ database.types.ts: 3,043 LOC (auto-generated, acceptable)
```

**Why this matters:**
- Monolithic files are harder to test in isolation
- Poor separation of concerns
- Difficult to review in PRs
- Increases cognitive load for developers
- Makes refactoring riskier

**Approach:** Split along natural responsibility boundaries, maintain backwards compatibility via barrel exports

### 5.2 Cases-Service Splitting Plan

#### Current Structure Analysis

**Cases-Service Responsibilities (2,082 LOC):**
```typescript
// Lines 1-250: Imports, types, helpers
// Lines 251-600: Data validation and normalization
// Lines 601-1100: Case creation logic
// Lines 1101-1500: Call scheduling orchestration
// Lines 1501-2082: Status updates and utilities
```

**Natural Boundaries Identified:**
1. **Validation & Normalization** - Entity extraction, data validation
2. **Case Creation** - Patient/case record creation, metadata management
3. **Call Scheduling** - Schedule orchestration, VAPI integration
4. **Status Management** - Status updates, state transitions

#### Target File Structure

```
libs/services-cases/src/lib/
├── cases-service.ts              # Main service class (200 LOC)
│   └── Facade pattern, coordinates sub-services
├── validation/
│   ├── entity-validator.ts       # Entity validation logic (400 LOC)
│   ├── idexx-extractor.ts        # IDEXX data extraction (300 LOC)
│   └── index.ts                  # Barrel export
├── creation/
│   ├── case-creator.ts           # Case creation orchestration (450 LOC)
│   ├── patient-handler.ts        # Patient upsert logic (300 LOC)
│   └── index.ts                  # Barrel export
├── scheduling/
│   ├── call-scheduler.ts         # Call scheduling logic (400 LOC)
│   └── index.ts                  # Barrel export
├── status/
│   ├── status-manager.ts         # Status updates (200 LOC)
│   └── index.ts                  # Barrel export
└── index.ts                      # Main barrel export (backwards compatibility)
```

#### Detailed File Design

**1. cases-service.ts (Main Facade - 200 LOC)**
```typescript
/**
 * Cases Service - Main Facade
 * 
 * Coordinates validation, creation, scheduling, and status management.
 * Provides backwards-compatible API for existing consumers.
 */

import { EntityValidator } from "./validation";
import { CaseCreator } from "./creation";
import { CallScheduler } from "./scheduling";
import { StatusManager } from "./status";
import type { ICasesService } from "@odis-ai/services-shared";

export const CasesService: ICasesService = {
  async ingest(supabase, userId, payload) {
    // 1. Validate/normalize entities
    const entities = await EntityValidator.extractEntities(payload);
    
    // 2. Create case and patient records
    const caseId = await CaseCreator.createCase(supabase, userId, entities, payload);
    
    // 3. Schedule call if requested
    const scheduledCall = payload.scheduleCall
      ? await CallScheduler.scheduleCall(supabase, userId, caseId, payload.scheduleOptions)
      : null;
    
    return { caseId, entities, scheduledCall };
  },
  
  async scheduleCall(supabase, userId, caseId, options) {
    return CallScheduler.scheduleCall(supabase, userId, caseId, options);
  },
  
  async updateStatus(supabase, caseId, status) {
    return StatusManager.updateStatus(supabase, caseId, status);
  },
};
```

**2. validation/entity-validator.ts (400 LOC)**
```typescript
/**
 * Entity Validator
 * 
 * Handles entity extraction and validation from various sources:
 * - Text (AI extraction)
 * - IDEXX data (structured)
 * - Manual input
 */

import type { NormalizedEntities } from "@odis-ai/validators";
import type { IngestPayload } from "@odis-ai/types/services";

export class EntityValidator {
  static async extractEntities(payload: IngestPayload): Promise<NormalizedEntities> {
    if (payload.mode === "text") {
      return this.extractFromText(payload.text, payload.options?.inputType);
    } else {
      return this.extractFromStructured(payload.data, payload.source);
    }
  }
  
  private static async extractFromText(text: string, inputType?: string) {
    // AI extraction logic (moved from lines 68-76)
  }
  
  private static async extractFromStructured(data: unknown, source: string) {
    // IDEXX extraction or fallback logic (moved from lines 78-120)
  }
}
```

**3. validation/idexx-extractor.ts (300 LOC)**
```typescript
/**
 * IDEXX Extractor
 * 
 * Specialized logic for extracting entities from IDEXX data.
 * Handles both Neo and extension sources.
 */

import type { NormalizedEntities } from "@odis-ai/validators";

export class IdexxExtractor {
  static async extractFromIdexx(rawData: Record<string, unknown>): Promise<NormalizedEntities | null> {
    // AI extraction from consultation notes (moved from lines 88-120)
  }
  
  static fallbackToBasicMapping(rawData: Record<string, unknown>): NormalizedEntities {
    // Basic field mapping (moved from lines 121-180)
  }
}
```

**4. creation/case-creator.ts (450 LOC)**
```typescript
/**
 * Case Creator
 * 
 * Orchestrates case and patient record creation.
 * Handles metadata preparation and database operations.
 */

import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { NormalizedEntities } from "@odis-ai/validators";
import type { IngestPayload } from "@odis-ai/types/services";

export class CaseCreator {
  static async createCase(
    supabase: SupabaseClientType,
    userId: string,
    entities: NormalizedEntities,
    payload: IngestPayload,
  ): Promise<string> {
    // 1. Handle patient record
    const patientId = await this.upsertPatient(supabase, userId, entities);
    
    // 2. Prepare case metadata
    const metadata = this.prepareCaseMetadata(entities, payload);
    
    // 3. Insert case record
    const caseId = await this.insertCase(supabase, userId, patientId, metadata);
    
    // 4. Store transcription if applicable
    if (payload.mode === "text") {
      await this.storeTranscription(supabase, caseId, payload.text);
    }
    
    return caseId;
  }
  
  private static async upsertPatient(supabase, userId, entities) {
    // Patient upsert logic (moved from lines 200-350)
  }
  
  private static prepareCaseMetadata(entities, payload) {
    // Metadata preparation (moved from lines 351-500)
  }
  
  private static async insertCase(supabase, userId, patientId, metadata) {
    // Case insertion (moved from lines 501-600)
  }
  
  private static async storeTranscription(supabase, caseId, text) {
    // Transcription storage (moved from lines 601-650)
  }
}
```

**5. creation/patient-handler.ts (300 LOC)**
```typescript
/**
 * Patient Handler
 * 
 * Specialized logic for patient record management.
 * Handles upsert logic, deduplication, and validation.
 */

import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { PatientInfo } from "@odis-ai/types";

export class PatientHandler {
  static async upsertPatient(
    supabase: SupabaseClientType,
    userId: string,
    patientInfo: PatientInfo,
  ): Promise<string> {
    // Check for existing patient
    const existing = await this.findExistingPatient(supabase, userId, patientInfo);
    
    if (existing) {
      // Update existing
      await this.updatePatient(supabase, existing.id, patientInfo);
      return existing.id;
    } else {
      // Create new
      return this.createPatient(supabase, userId, patientInfo);
    }
  }
  
  private static async findExistingPatient(supabase, userId, patientInfo) {
    // Deduplication logic (moved from lines 200-280)
  }
  
  private static async updatePatient(supabase, patientId, patientInfo) {
    // Update logic (moved from lines 281-320)
  }
  
  private static async createPatient(supabase, userId, patientInfo) {
    // Create logic (moved from lines 321-350)
  }
}
```

**6. scheduling/call-scheduler.ts (400 LOC)**
```typescript
/**
 * Call Scheduler
 * 
 * Orchestrates discharge call scheduling.
 * Integrates with VAPI and QStash for call execution.
 */

import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { CaseScheduleOptions, ScheduledDischargeCall } from "@odis-ai/types/services";
import { scheduleCallExecution } from "@odis-ai/qstash/client";

export class CallScheduler {
  static async scheduleCall(
    supabase: SupabaseClientType,
    userId: string,
    caseId: string,
    options: CaseScheduleOptions,
  ): Promise<ScheduledDischargeCall> {
    // 1. Validate schedule options
    this.validateScheduleOptions(options);
    
    // 2. Prepare call metadata
    const metadata = await this.prepareCallMetadata(supabase, caseId, options);
    
    // 3. Create scheduled call record
    const scheduledCall = await this.createScheduledCall(supabase, caseId, userId, metadata);
    
    // 4. Schedule with QStash
    await scheduleCallExecution(scheduledCall.id, options.scheduledFor);
    
    return scheduledCall;
  }
  
  private static validateScheduleOptions(options) {
    // Validation logic (moved from lines 1101-1200)
  }
  
  private static async prepareCallMetadata(supabase, caseId, options) {
    // Metadata preparation (moved from lines 1201-1350)
  }
  
  private static async createScheduledCall(supabase, caseId, userId, metadata) {
    // DB insertion (moved from lines 1351-1450)
  }
}
```

**7. status/status-manager.ts (200 LOC)**
```typescript
/**
 * Status Manager
 * 
 * Manages case status updates and state transitions.
 * Validates allowed transitions and updates metadata.
 */

import type { SupabaseClientType } from "@odis-ai/types/supabase";

export class StatusManager {
  static async updateStatus(
    supabase: SupabaseClientType,
    caseId: string,
    status: string,
  ): Promise<void> {
    // 1. Validate status transition
    this.validateStatus(status);
    
    // 2. Update case record
    await supabase
      .from("cases")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", caseId);
  }
  
  private static validateStatus(status: string) {
    const allowedStatuses = ["pending", "scheduled", "completed", "failed"];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
  }
}
```

**8. index.ts (Main Barrel - Backwards Compatibility)**
```typescript
/**
 * @odis-ai/services-cases
 * 
 * Main entry point - provides backwards compatibility
 */

// Re-export main service (primary API)
export { CasesService } from "./lib/cases-service";

// Re-export sub-services (for advanced usage)
export { EntityValidator, IdexxExtractor } from "./lib/validation";
export { CaseCreator, PatientHandler } from "./lib/creation";
export { CallScheduler } from "./lib/scheduling";
export { StatusManager } from "./lib/status";

// Re-export types (convenience)
export type {
  CaseScheduleOptions,
  IngestPayload,
  ScheduledDischargeCall,
} from "@odis-ai/types/services";
```

#### Migration Strategy

**Phase 1: Create Directory Structure (30 minutes)**
```bash
mkdir -p libs/services-cases/src/lib/{validation,creation,scheduling,status}
touch libs/services-cases/src/lib/validation/{entity-validator,idexx-extractor,index}.ts
touch libs/services-cases/src/lib/creation/{case-creator,patient-handler,index}.ts
touch libs/services-cases/src/lib/scheduling/{call-scheduler,index}.ts
touch libs/services-cases/src/lib/status/{status-manager,index}.ts
```

**Phase 2: Extract Validation Logic (2-3 hours)**
1. Copy validation logic to new files
2. Update imports
3. Test extraction works
4. Update main service to use new files

**Phase 3: Extract Creation Logic (3-4 hours)**
1. Copy creation logic to new files
2. Update imports
3. Test creation works
4. Update main service to use new files

**Phase 4: Extract Scheduling Logic (2-3 hours)**
1. Copy scheduling logic to new file
2. Update imports
3. Test scheduling works
4. Update main service to use new file

**Phase 5: Extract Status Logic (1-2 hours)**
1. Copy status logic to new file
2. Update imports
3. Test status updates work
4. Update main service to use new file

**Phase 6: Refactor Main Service (1-2 hours)**
1. Reduce main service to facade pattern
2. Ensure all tests pass
3. Update barrel exports

**Total Effort: 9-15 hours**

#### Testing Strategy

**Unit Tests per File:**
```typescript
// entity-validator.test.ts
describe("EntityValidator", () => {
  it("extracts entities from text", async () => { /* ... */ });
  it("extracts entities from IDEXX", async () => { /* ... */ });
  it("handles validation errors", async () => { /* ... */ });
});

// case-creator.test.ts
describe("CaseCreator", () => {
  it("creates case with patient", async () => { /* ... */ });
  it("upserts existing patient", async () => { /* ... */ });
  it("stores transcription", async () => { /* ... */ });
});

// call-scheduler.test.ts
describe("CallScheduler", () => {
  it("schedules call with QStash", async () => { /* ... */ });
  it("validates schedule options", async () => { /* ... */ });
  it("prepares call metadata", async () => { /* ... */ });
});
```

**Integration Tests:**
```typescript
// cases-service.integration.test.ts
describe("CasesService (Integration)", () => {
  it("ingests case end-to-end", async () => {
    // Full workflow test across all sub-services
  });
});
```

**Backwards Compatibility Tests:**
```typescript
// Verify existing imports still work
import { CasesService } from "@odis-ai/services-cases";

expect(CasesService.ingest).toBeDefined();
expect(CasesService.scheduleCall).toBeDefined();
expect(CasesService.updateStatus).toBeDefined();
```

### 5.3 Discharge-Orchestrator Splitting Plan

#### Current Structure Analysis

**Discharge-Orchestrator Responsibilities (1,785 LOC):**
```typescript
// Lines 1-100: Imports, types, constants
// Lines 101-400: Email generation logic
// Lines 401-800: Call scheduling logic
// Lines 801-1200: Summary generation logic
// Lines 1201-1500: Report generation logic
// Lines 1501-1785: Main orchestration logic
```

**Natural Boundaries Identified:**
1. **Email Orchestration** - Email generation, preparation, scheduling
2. **Call Orchestration** - Call scheduling, execution coordination
3. **Summary Generation** - AI summary generation, formatting
4. **Main Orchestration** - Overall workflow coordination, ExecutionPlan management

#### Target File Structure

```
libs/services-discharge/src/lib/
├── discharge-orchestrator.ts     # Main orchestrator (300 LOC)
│   └── Coordinates sub-orchestrators
├── orchestrators/
│   ├── email-orchestrator.ts     # Email workflow (500 LOC)
│   ├── call-orchestrator.ts      # Call workflow (400 LOC)
│   ├── summary-orchestrator.ts   # Summary generation (400 LOC)
│   └── index.ts                  # Barrel export
├── call-executor.ts              # Existing file (keep as-is)
├── types.ts                      # Type definitions
└── index.ts                      # Main barrel export (backwards compatibility)
```

#### Detailed File Design

**1. discharge-orchestrator.ts (Main Orchestrator - 300 LOC)**
```typescript
/**
 * Discharge Orchestrator - Main Coordinator
 * 
 * Coordinates email, call, and summary sub-orchestrators.
 * Manages ExecutionPlan and overall workflow state.
 */

import { ExecutionPlan } from "@odis-ai/services-shared";
import { EmailOrchestrator } from "./orchestrators/email-orchestrator";
import { CallOrchestrator } from "./orchestrators/call-orchestrator";
import { SummaryOrchestrator } from "./orchestrators/summary-orchestrator";
import type { ICasesService } from "@odis-ai/services-shared";

export function createDischargeOrchestrator(casesService: ICasesService) {
  return {
    async orchestrate(request: OrchestrationRequest, context: ExecutionContext) {
      const plan = new ExecutionPlan(request.steps);
      
      // Execute steps according to mode
      if (request.mode === "parallel") {
        await this.executeParallel(plan, request, context, casesService);
      } else {
        await this.executeSequential(plan, request, context, casesService);
      }
      
      return plan.getResults();
    },
    
    async executeSequential(plan, request, context, casesService) {
      // Ingest
      if (plan.shouldExecute("ingest")) {
        const result = await casesService.ingest(/* ... */);
        plan.complete("ingest", result);
      }
      
      // Extract entities (if needed)
      if (plan.shouldExecute("extractEntities")) {
        const result = await SummaryOrchestrator.extractEntities(/* ... */);
        plan.complete("extractEntities", result);
      }
      
      // Generate summary
      if (plan.shouldExecute("generateSummary")) {
        const result = await SummaryOrchestrator.generateSummary(/* ... */);
        plan.complete("generateSummary", result);
      }
      
      // Prepare email
      if (plan.shouldExecute("prepareEmail")) {
        const result = await EmailOrchestrator.prepareEmail(/* ... */);
        plan.complete("prepareEmail", result);
      }
      
      // Schedule email
      if (plan.shouldExecute("scheduleEmail")) {
        const result = await EmailOrchestrator.scheduleEmail(/* ... */);
        plan.complete("scheduleEmail", result);
      }
      
      // Schedule call
      if (plan.shouldExecute("scheduleCall")) {
        const result = await CallOrchestrator.scheduleCall(/* ... */);
        plan.complete("scheduleCall", result);
      }
    },
    
    async executeParallel(plan, request, context, casesService) {
      // Parallel execution logic (simplified main orchestrator)
    },
  };
}

// Default export with lazy-loaded CasesService for backwards compatibility
export const DischargeOrchestrator = createDischargeOrchestrator(
  new Proxy({} as ICasesService, {
    get(target, prop) {
      if (!target[prop]) {
        const { CasesService } = await import("@odis-ai/services-cases");
        return CasesService[prop];
      }
      return target[prop];
    }
  })
);
```

**2. orchestrators/email-orchestrator.ts (500 LOC)**
```typescript
/**
 * Email Orchestrator
 * 
 * Handles email generation, preparation, and scheduling.
 * Coordinates with Resend and QStash for delivery.
 */

import { scheduleEmailExecution } from "@odis-ai/qstash/client";
import { isValidEmail } from "@odis-ai/resend/utils";
import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { EmailResult, EmailScheduleResult } from "@odis-ai/types/orchestration";

export class EmailOrchestrator {
  static async prepareEmail(
    supabase: SupabaseClientType,
    caseId: string,
    patientId: string,
    dischargeSummary: string,
    structuredContent: StructuredDischargeSummary | null,
    branding: ClinicBranding,
  ): Promise<EmailResult> {
    // 1. Get patient data
    const patient = await this.getPatient(supabase, patientId);
    
    // 2. Generate email content
    const emailContent = await this.generateEmailContent(
      dischargeSummary,
      patient,
      structuredContent,
      branding,
    );
    
    // 3. Validate email address
    if (!isValidEmail(patient.owner_email)) {
      return { success: false, error: "Invalid email address" };
    }
    
    return {
      success: true,
      recipient: patient.owner_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    };
  }
  
  static async scheduleEmail(
    supabase: SupabaseClientType,
    caseId: string,
    recipient: string,
    subject: string,
    html: string,
    text: string,
    scheduledFor: Date,
  ): Promise<EmailScheduleResult> {
    // 1. Store email in database
    const emailId = await this.storeEmailRecord(supabase, caseId, recipient, subject);
    
    // 2. Schedule with QStash
    const scheduleId = await scheduleEmailExecution({
      emailId,
      recipient,
      subject,
      html,
      text,
      scheduledFor,
    });
    
    return {
      success: true,
      emailId,
      scheduleId,
      scheduledFor,
    };
  }
  
  private static async getPatient(supabase, patientId) {
    // Patient retrieval (moved from lines 400-450)
  }
  
  private static async generateEmailContent(dischargeSummary, patient, structuredContent, branding) {
    // Email template generation (moved from lines 84-350)
  }
  
  private static async storeEmailRecord(supabase, caseId, recipient, subject) {
    // Database storage (moved from lines 700-750)
  }
}
```

**3. orchestrators/call-orchestrator.ts (400 LOC)**
```typescript
/**
 * Call Orchestrator
 * 
 * Handles discharge call scheduling.
 * Coordinates with CasesService for call setup.
 */

import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { ICasesService } from "@odis-ai/services-shared";
import type { CallResult } from "@odis-ai/types/orchestration";

export class CallOrchestrator {
  static async scheduleCall(
    supabase: SupabaseClientType,
    casesService: ICasesService,
    userId: string,
    caseId: string,
    patientId: string,
    scheduledFor: Date,
  ): Promise<CallResult> {
    // 1. Get patient and case data
    const [patient, caseData] = await Promise.all([
      this.getPatient(supabase, patientId),
      this.getCase(supabase, caseId),
    ]);
    
    // 2. Validate phone number
    if (!this.isValidPhone(patient.owner_phone)) {
      return { success: false, error: "Invalid phone number" };
    }
    
    // 3. Schedule call via CasesService
    const scheduledCall = await casesService.scheduleCall(
      supabase,
      userId,
      caseId,
      {
        scheduledFor,
        phoneNumber: patient.owner_phone,
        metadata: {
          patient_name: patient.name,
          owner_name: patient.owner_name,
          species: patient.species,
        },
      },
    );
    
    return {
      success: true,
      callId: scheduledCall.id,
      scheduledFor,
    };
  }
  
  private static async getPatient(supabase, patientId) {
    // Patient retrieval (moved from lines 800-850)
  }
  
  private static async getCase(supabase, caseId) {
    // Case retrieval (moved from lines 851-900)
  }
  
  private static isValidPhone(phone: string): boolean {
    // Phone validation (moved from lines 901-950)
  }
}
```

**4. orchestrators/summary-orchestrator.ts (400 LOC)**
```typescript
/**
 * Summary Orchestrator
 * 
 * Handles discharge summary generation using AI.
 * Manages entity extraction and summary formatting.
 */

import type { SupabaseClientType } from "@odis-ai/types/supabase";
import type { NormalizedEntities } from "@odis-ai/validators";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";
import type { ExtractEntitiesResult, SummaryResult } from "@odis-ai/types/orchestration";

export class SummaryOrchestrator {
  static async extractEntities(
    supabase: SupabaseClientType,
    caseId: string,
  ): Promise<ExtractEntitiesResult> {
    // 1. Get transcription
    const transcription = await this.getTranscription(supabase, caseId);
    
    if (!transcription) {
      return { success: false, error: "No transcription found" };
    }
    
    // 2. Extract entities with AI (dynamic import)
    const { extractEntitiesWithRetry } = 
      await import("@odis-ai/ai/normalize-scribe");
    
    const entities = await extractEntitiesWithRetry(transcription.text);
    
    return {
      success: true,
      entities,
    };
  }
  
  static async generateSummary(
    supabase: SupabaseClientType,
    caseId: string,
    entities: NormalizedEntities,
  ): Promise<SummaryResult> {
    // 1. Get case data
    const caseData = await this.getCase(supabase, caseId);
    
    // 2. Generate summary with AI (dynamic import)
    const { generateDischargeSummary } = 
      await import("@odis-ai/ai/discharge-summary");
    
    const summary = await generateDischargeSummary(entities, caseData);
    
    // 3. Store summary in database
    const summaryId = await this.storeSummary(supabase, caseId, summary);
    
    return {
      success: true,
      summaryId,
      content: summary.content,
      structuredContent: summary.structuredContent,
    };
  }
  
  private static async getTranscription(supabase, caseId) {
    // Transcription retrieval (moved from lines 1000-1050)
  }
  
  private static async getCase(supabase, caseId) {
    // Case retrieval (moved from lines 1051-1100)
  }
  
  private static async storeSummary(supabase, caseId, summary) {
    // Summary storage (moved from lines 1101-1200)
  }
}
```

**5. index.ts (Main Barrel - Backwards Compatibility)**
```typescript
/**
 * @odis-ai/services-discharge
 * 
 * Main entry point - provides backwards compatibility
 */

// Re-export main orchestrator (primary API)
export { 
  DischargeOrchestrator,
  createDischargeOrchestrator,
} from "./lib/discharge-orchestrator";

// Re-export sub-orchestrators (for advanced usage)
export { 
  EmailOrchestrator,
  CallOrchestrator,
  SummaryOrchestrator,
} from "./lib/orchestrators";

// Re-export call executor (existing)
export { executeScheduledCall } from "./lib/call-executor";

// Re-export types
export type {
  OrchestrationRequest,
  OrchestrationResult,
  CallExecutionResult,
} from "./lib/types";
```

#### Migration Strategy

**Phase 1: Create Directory Structure (15 minutes)**
```bash
mkdir -p libs/services-discharge/src/lib/orchestrators
touch libs/services-discharge/src/lib/orchestrators/{email,call,summary}-orchestrator.ts
touch libs/services-discharge/src/lib/orchestrators/index.ts
```

**Phase 2: Extract Email Logic (2-3 hours)**
1. Copy email logic to email-orchestrator.ts
2. Update imports
3. Test email preparation and scheduling
4. Update main orchestrator to use EmailOrchestrator

**Phase 3: Extract Call Logic (2-3 hours)**
1. Copy call logic to call-orchestrator.ts
2. Update imports
3. Test call scheduling
4. Update main orchestrator to use CallOrchestrator

**Phase 4: Extract Summary Logic (2-3 hours)**
1. Copy summary logic to summary-orchestrator.ts
2. Update imports
3. Test summary generation
4. Update main orchestrator to use SummaryOrchestrator

**Phase 5: Refactor Main Orchestrator (1-2 hours)**
1. Reduce main orchestrator to coordination logic
2. Ensure all tests pass
3. Update barrel exports

**Total Effort: 7-12 hours**

#### Testing Strategy

**Unit Tests per Orchestrator:**
```typescript
// email-orchestrator.test.ts
describe("EmailOrchestrator", () => {
  it("prepares email with valid data", async () => { /* ... */ });
  it("schedules email with QStash", async () => { /* ... */ });
  it("validates email address", async () => { /* ... */ });
});

// call-orchestrator.test.ts
describe("CallOrchestrator", () => {
  it("schedules call via CasesService", async () => { /* ... */ });
  it("validates phone number", async () => { /* ... */ });
  it("handles missing patient data", async () => { /* ... */ });
});

// summary-orchestrator.test.ts
describe("SummaryOrchestrator", () => {
  it("extracts entities from transcription", async () => { /* ... */ });
  it("generates summary with AI", async () => { /* ... */ });
  it("stores summary in database", async () => { /* ... */ });
});
```

**Integration Tests:**
```typescript
// discharge-orchestrator.integration.test.ts
describe("DischargeOrchestrator (Integration)", () => {
  it("orchestrates full workflow", async () => {
    // Full workflow test across all sub-orchestrators
  });
});
```

**Backwards Compatibility Tests:**
```typescript
// Verify existing imports still work
import { DischargeOrchestrator } from "@odis-ai/services-discharge";

expect(DischargeOrchestrator.orchestrate).toBeDefined();
```

### 5.4 Summary of File Splitting

| File | Current LOC | Target Files | Target LOC | Effort |
|------|-------------|--------------|------------|--------|
| cases-service.ts | 2,082 | 8 files | 200-450 each | 9-15 hours |
| discharge-orchestrator.ts | 1,785 | 5 files | 300-500 each | 7-12 hours |
| **Total** | **3,867** | **13 files** | **<500 avg** | **16-27 hours** |

**Success Criteria:**
- [ ] All files <600 LOC
- [ ] Clear single responsibility per file
- [ ] All 290+ tests pass
- [ ] Backwards compatible imports
- [ ] Improved test coverage per file
- [ ] Better separation of concerns

---

## 6. Import Standardization

### 6.1 Current Issue

**Problem:** 39 lint errors for inconsistent `db` library imports in web app

```
Error: Static imports of lazy-loaded libraries are forbidden.
Library "db" is lazy-loaded in these files:
- apps/web/src/app/api/calls/execute/route.ts
- apps/web/src/app/api/calls/schedule/route.ts
- ... (37 more files)
```

**Root Cause:**
- `db` library is lazy-loaded in some API routes (dynamic import)
- But static-imported in other components/routes
- Creates inconsistent bundle patterns
- Violates Nx module boundary rules

### 6.2 Analysis of Import Patterns

**Where `db` is Used:**

1. **API Routes** (webhooks, external endpoints)
   - Need lazy-loading for optimal bundle splitting
   - External requests, not part of main bundle
   - Examples: `/api/webhooks/vapi`, `/api/calls/execute`

2. **Server Actions** (form handlers, mutations)
   - Should use static imports (part of page bundle)
   - Collocated with page components
   - Examples: `src/server/actions/auth.ts`

3. **tRPC Procedures** (type-safe API)
   - Should use static imports (part of API bundle)
   - Type safety critical
   - Examples: `src/server/api/routers/*`

4. **Page Components** (SSR, data fetching)
   - Should use static imports (part of page bundle)
   - Server-side rendering
   - Examples: `src/app/dashboard/*/page.tsx`

### 6.3 Strategy: Context-Based Import Pattern

**Rule:** Lazy-load in API routes, static import elsewhere

| Context | Import Pattern | Rationale |
|---------|---------------|-----------|
| API Routes (`/api/*`) | Dynamic (lazy) | External endpoints, separate bundles |
| Server Actions | Static | Collocated with pages, part of page bundle |
| tRPC Procedures | Static | Type safety, API bundle |
| Page Components | Static | SSR, page bundle |
| Middleware | Static | Always loaded, no benefit to lazy-load |

### 6.4 Implementation Pattern

**API Routes (Lazy-Load):**
```typescript
// apps/web/src/app/api/webhooks/vapi/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Dynamic import for optimal bundle splitting
  const { createServiceClient } = await import("@odis-ai/db");
  const supabase = await createServiceClient();
  
  // ... webhook logic
}
```

**Server Actions (Static):**
```typescript
// apps/web/src/server/actions/auth.ts

"use server";

import { createClient } from "@odis-ai/db"; // Static import

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
```

**tRPC Procedures (Static):**
```typescript
// apps/web/src/server/api/routers/cases/router.ts

import { createClient } from "@odis-ai/db"; // Static import
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const casesRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async () => {
    const supabase = await createClient();
    return supabase.from("cases").select("*");
  }),
});
```

**Page Components (Static):**
```typescript
// apps/web/src/app/dashboard/cases/page.tsx

import { createClient } from "@odis-ai/db"; // Static import

export default async function CasesPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase.from("cases").select("*");
  
  return <CasesList cases={cases} />;
}
```

### 6.5 Migration Steps

**Phase A: Identify Violations (1 hour)**
```bash
# Get list of all files with violations
pnpm lint 2>&1 | grep -B2 "Static imports of lazy-loaded" | grep "error" | cut -d':' -f1 | sort -u > violations.txt

# Categorize by context (API routes vs others)
grep "/api/" violations.txt > api-routes.txt
grep -v "/api/" violations.txt > non-api.txt
```

**Phase B: Fix API Routes (1-2 hours)**
For each file in `api-routes.txt`:
1. Replace `import { createServiceClient } from "@odis-ai/db";`
2. With `const { createServiceClient } = await import("@odis-ai/db");`
3. Move to inside request handler function
4. Test endpoint still works

**Phase C: Fix Non-API Files (2-3 hours)**
For each file in `non-api.txt`:
1. Keep `import { createClient } from "@odis-ai/db";` (static)
2. Verify it's not in an API route context
3. If it is, move to lazy-load pattern
4. Test functionality

**Phase D: Verification (30 minutes)**
```bash
# Verify no more violations
pnpm lint:all

# Verify bundle sizes didn't increase
pnpm build
# Check .next/analyze or bundle report
```

**Total Effort: 4-6 hours**

### 6.6 Documentation Update

Create import guide: `docs/architecture/DB_IMPORT_PATTERNS.md`

```markdown
# Database Client Import Patterns

## Rules

1. **API Routes** (`/api/*`): Always use dynamic imports
2. **Server Actions**: Always use static imports
3. **tRPC Procedures**: Always use static imports
4. **Page Components**: Always use static imports

## Examples

### API Route (Lazy-Load)
```typescript
export async function POST(request: NextRequest) {
  const { createServiceClient } = await import("@odis-ai/db");
  const supabase = await createServiceClient();
}
```

### Server Action (Static)
```typescript
"use server";
import { createClient } from "@odis-ai/db";
```

### tRPC Procedure (Static)
```typescript
import { createClient } from "@odis-ai/db";
```

### Page Component (Static)
```typescript
import { createClient } from "@odis-ai/db";
```

## Rationale

- **API Routes**: External endpoints benefit from code splitting
- **Everything Else**: Part of main/page bundle, static imports enable better tree-shaking
```

### 6.7 Bundle Size Considerations

**Expected Impact:**
- API routes: Smaller initial bundle (db loaded on-demand)
- Server actions/pages: No change (db already in bundle)
- Overall: 5-10% reduction in initial JS bundle size

**Verification:**
```bash
# Before changes
pnpm build
du -sh apps/web/.next

# After changes
pnpm build
du -sh apps/web/.next

# Compare bundle analysis
```

### 6.8 Success Criteria

- [ ] Zero lazy-load lint violations
- [ ] API routes use dynamic imports
- [ ] Server actions use static imports
- [ ] tRPC procedures use static imports
- [ ] Page components use static imports
- [ ] Documentation created
- [ ] Bundle size reduced or stable
- [ ] All tests pass

---

## 7. Migration Strategy

### 7.1 Overview

**Total Estimated Effort: 43-59 hours (~3-4 weeks @ 15 hrs/week)**

**Approach:** Incremental migration with continuous testing and backwards compatibility

**Parallelization:** Some phases can run in parallel, others must be sequential

### 7.2 Phase Breakdown

#### Phase 1: Foundation (4-6 hours) - MUST COMPLETE FIRST

**Priority: P0 (Blocker for other phases)**

**Tasks:**
1. Create interface definitions in `services-shared` (2-3 hours)
   - `ICasesService` interface
   - `ICallExecutor` interface
   - Export from barrel file
   - TypeScript compilation verification

2. Reclassify service library tags (1-2 hours)
   - Update 3 project.json files
   - Update ESLint config
   - Run lint verification

3. Fix dual scope tags (30 minutes - 1 hour)
   - Remove `scope:shared` from 3 extension libs
   - Verify module boundaries still work

**Deliverables:**
- [ ] `libs/services-shared/src/lib/interfaces/` created with interfaces
- [ ] All 3 service libs have correct Nx 4-type tags
- [ ] All 3 extension libs have single scope tag
- [ ] Zero lint violations related to tags
- [ ] TypeScript compiles successfully

**Risk Level:** LOW - Configuration changes only, no code logic changes

**Verification:**
```bash
pnpm lint:all  # Must pass
pnpm typecheck:all  # Must pass
nx graph  # Visual inspection of boundaries
```

---

#### Phase 2A: Cases-Service Refactoring (9-15 hours) - CAN RUN IN PARALLEL WITH 2B

**Priority: P1 (High impact)**

**Dependencies:** Phase 1 complete

**Tasks:**
1. Create directory structure (30 minutes)
2. Extract validation logic (2-3 hours)
3. Extract creation logic (3-4 hours)
4. Extract scheduling logic (2-3 hours)
5. Extract status logic (1-2 hours)
6. Refactor main service to facade (1-2 hours)
7. Update barrel exports (30 minutes)
8. Test thoroughly (1-2 hours)

**Deliverables:**
- [ ] 8 new files in `services-cases` library
- [ ] Main service <200 LOC
- [ ] All new files <500 LOC
- [ ] Backwards compatible exports
- [ ] All existing tests pass
- [ ] New unit tests for sub-services

**Risk Level:** MEDIUM - Large refactoring but isolated to one library

**Verification:**
```bash
# Run all cases-related tests
pnpm nx test services-cases

# Verify imports work
grep -r "from \"@odis-ai/services-cases\"" apps/ libs/

# Run integration tests
pnpm nx test web --grep "cases"
```

---

#### Phase 2B: Discharge-Orchestrator Refactoring (7-12 hours) - CAN RUN IN PARALLEL WITH 2A

**Priority: P1 (High impact)**

**Dependencies:** Phase 1 complete

**Tasks:**
1. Create directory structure (15 minutes)
2. Extract email orchestration (2-3 hours)
3. Extract call orchestration (2-3 hours)
4. Extract summary orchestration (2-3 hours)
5. Refactor main orchestrator (1-2 hours)
6. Update barrel exports (15 minutes)
7. Test thoroughly (1-2 hours)

**Deliverables:**
- [ ] 5 new files in `services-discharge` library
- [ ] Main orchestrator <300 LOC
- [ ] All new files <500 LOC
- [ ] Backwards compatible exports
- [ ] All existing tests pass
- [ ] New unit tests for sub-orchestrators

**Risk Level:** MEDIUM - Large refactoring but isolated to one library

**Verification:**
```bash
# Run all discharge-related tests
pnpm nx test services-discharge

# Verify imports work
grep -r "from \"@odis-ai/services-discharge\"" apps/ libs/

# Run integration tests
pnpm nx test web --grep "discharge"
```

---

#### Phase 3: Circular Dependency Elimination (8-12 hours) - REQUIRES 2A & 2B COMPLETE

**Priority: P1 (High impact)**

**Dependencies:** Phase 1, Phase 2A, Phase 2B complete

**Tasks:**
1. Implement DI in CasesService (2-3 hours)
   - Add interface type annotations
   - Update method signatures
   - Test with interface mocks

2. Implement DI in DischargeOrchestrator (3-4 hours)
   - Create factory function with injected deps
   - Replace 7 dynamic imports with injected service
   - Provide backwards-compatible default export
   - Test with interface mocks

3. Update CallExecutor (1-2 hours)
   - Add interface type annotations
   - Update cases-service callsites
   - Test with interface mocks

4. Integration testing (2-3 hours)
   - Test full workflow with real implementations
   - Test with mocked implementations
   - Performance verification

**Deliverables:**
- [ ] Zero circular dependencies in Nx graph
- [ ] Both services use interface-based DI
- [ ] Backwards compatible default exports
- [ ] All 290+ tests pass
- [ ] New DI-based tests added

**Risk Level:** MEDIUM-HIGH - Core architectural change, but well-defined pattern

**Verification:**
```bash
# Verify no circular dependencies
nx graph --file=graph.json
cat graph.json | grep -i "circular"  # Should be empty

# Run full test suite
pnpm test:all

# Verify TypeScript compilation
pnpm typecheck:all
```

---

#### Phase 4: Import Standardization (4-6 hours) - CAN RUN ANYTIME AFTER PHASE 1

**Priority: P2 (Medium impact)**

**Dependencies:** Phase 1 complete (optional: can run earlier)

**Tasks:**
1. Identify all violations (1 hour)
   - Categorize by context (API routes vs others)
   - Create fix list

2. Fix API routes (1-2 hours)
   - Convert 20-25 files to lazy-load pattern
   - Test each endpoint

3. Fix non-API files (2-3 hours)
   - Verify static imports are correct
   - Move any misplaced lazy-loads to static
   - Test functionality

4. Verification (30 minutes - 1 hour)
   - Run lint
   - Check bundle sizes
   - Run tests

**Deliverables:**
- [ ] Zero lazy-load lint violations
- [ ] API routes use dynamic imports
- [ ] Non-API code uses static imports
- [ ] Bundle size documentation
- [ ] Import pattern guide created

**Risk Level:** LOW - Mechanical changes, easy to verify

**Verification:**
```bash
# Verify no violations
pnpm lint:all | grep "lazy-loaded"  # Should be empty

# Check bundle sizes
pnpm build
ls -lh apps/web/.next/static/chunks/
```

---

### 7.3 Parallel vs Sequential Execution

**Can Run in Parallel:**
- Phase 2A (Cases-Service) + Phase 2B (Discharge-Orchestrator)
- Phase 4 (Import Standardization) can start after Phase 1

**Must Run Sequential:**
1. Phase 1 (Foundation) - MUST complete first
2. Phase 2A & 2B together (can be parallel)
3. Phase 3 (Circular Dependency) - REQUIRES 2A & 2B complete
4. Phase 4 (Import Standardization) - Independent

**Critical Path:**
```
Phase 1 (4-6h)
    ↓
Phase 2A (9-15h) || Phase 2B (7-12h)
    ↓
Phase 3 (8-12h)

Phase 4 (4-6h) - Can start after Phase 1
```

**Minimum Timeline:**
- Week 1: Phase 1 + start Phase 2A/2B
- Week 2: Complete Phase 2A/2B, start Phase 3
- Week 3: Complete Phase 3, Phase 4
- Week 4: Testing, documentation, cleanup

### 7.4 Risk Mitigation

#### Risk 1: Breaking Existing Tests

**Mitigation:**
- Run full test suite after each phase
- Use backwards-compatible exports during transition
- Keep dynamic imports as fallback in default exports
- Incremental changes with continuous verification

**Rollback Plan:**
- Each phase is self-contained
- Revert project.json changes (Phase 1)
- Revert file splits (Phase 2A/2B)
- Revert DI changes (Phase 3)

#### Risk 2: Performance Regression

**Mitigation:**
- Benchmark before/after each phase
- Monitor bundle sizes
- Use lazy-loading where appropriate
- Profile critical paths

**Rollback Plan:**
- Revert to previous import patterns
- Re-enable dynamic imports if needed

#### Risk 3: Type Safety Issues

**Mitigation:**
- Strict TypeScript compilation
- Run `pnpm typecheck:all` after each change
- Use interfaces consistently
- Comprehensive type tests

**Rollback Plan:**
- Remove interface constraints
- Restore concrete type references

#### Risk 4: Merge Conflicts

**Mitigation:**
- Work in isolated feature branches
- Merge Phase 1 before starting Phase 2/3
- Coordinate with team on active development areas
- Use clear branch naming (e.g., `refactor/phase-1-foundation`)

**Rollback Plan:**
- Discard feature branch
- Cherry-pick successful phases if partial completion

### 7.5 Testing Strategy Per Phase

#### Phase 1 Testing:
```bash
# After tag changes
pnpm lint:all
pnpm typecheck:all
nx graph

# Verify no new violations
git diff --stat
```

#### Phase 2A/2B Testing:
```bash
# After file splitting
pnpm nx test services-cases
pnpm nx test services-discharge

# Integration tests
pnpm nx test web

# Verify imports still work
grep -r "@odis-ai/services-cases" apps/web/src/ | wc -l
grep -r "@odis-ai/services-discharge" apps/web/src/ | wc -l
```

#### Phase 3 Testing:
```bash
# After DI implementation
pnpm test:all

# Verify no circular deps
nx graph --file=graph.json
cat graph.json | grep -i "circular"

# Performance testing
pnpm build
# Check build times and bundle sizes
```

#### Phase 4 Testing:
```bash
# After import standardization
pnpm lint:all | grep "lazy-loaded"

# Bundle analysis
pnpm build --analyze
# Compare bundle sizes before/after

# Smoke tests
pnpm preview
# Manual testing of key flows
```

### 7.6 Rollback Plans Per Phase

#### Phase 1 Rollback:
```bash
# Revert project.json changes
git checkout HEAD -- libs/services-*/project.json
git checkout HEAD -- libs/extension-*/project.json

# Revert ESLint config
git checkout HEAD -- eslint.config.js

# Verify
pnpm lint:all
```

#### Phase 2A/2B Rollback:
```bash
# Revert file splits
git checkout HEAD -- libs/services-cases/src/
git checkout HEAD -- libs/services-discharge/src/

# Verify
pnpm test:all
```

#### Phase 3 Rollback:
```bash
# Revert DI changes
git checkout HEAD -- libs/services-cases/src/lib/cases-service.ts
git checkout HEAD -- libs/services-discharge/src/lib/discharge-orchestrator.ts

# Verify
pnpm test:all
nx graph
```

#### Phase 4 Rollback:
```bash
# Revert import changes
git checkout HEAD -- apps/web/src/

# Verify
pnpm lint:all
pnpm build
```

### 7.7 Success Metrics Per Phase

#### Phase 1 Success:
- [ ] All service libs have Nx 4-compliant tags
- [ ] All extension libs have single scope tag
- [ ] Zero new lint violations
- [ ] TypeScript compiles
- [ ] Nx graph renders correctly

#### Phase 2A/2B Success:
- [ ] All files <600 LOC
- [ ] Backwards compatible exports
- [ ] All tests pass (290+)
- [ ] New unit tests added
- [ ] Clear separation of concerns

#### Phase 3 Success:
- [ ] Zero circular dependencies
- [ ] Interface-based DI working
- [ ] All tests pass (290+)
- [ ] Performance unchanged
- [ ] Mocking tests added

#### Phase 4 Success:
- [ ] Zero lazy-load violations
- [ ] Correct import patterns
- [ ] Bundle size improved or stable
- [ ] All tests pass
- [ ] Documentation created

---

## 8. Success Criteria

### 8.1 Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Circular Dependencies | 1 | 0 | `nx graph --file=graph.json && cat graph.json \| grep -i "circular"` |
| Library Classification Compliance | 82.8% (24/29) | 100% (29/29) | Count of Nx 4-compliant type tags |
| Tag Compliance | 89.7% (26/29) | 100% (29/29) | Count of single-scope-tagged libs |
| Module Boundary Violations | 39 | 0 | `pnpm lint:all \| grep "lazy-loaded"` |
| Large Files (>1500 LOC) | 3 | 1 | Count of files excluding auto-generated |
| Average File Size (services) | 1,933 LOC | <500 LOC | `wc -l` on service files |
| Overall Compliance | 81.3% | 95%+ | Weighted average of all metrics |
| Test Pass Rate | 100% (290+ tests) | 100% (290+ tests) | `pnpm test:all` |

### 8.2 Qualitative Metrics

#### Code Quality:
- [ ] Clear single responsibility per file
- [ ] Consistent naming conventions
- [ ] Proper separation of concerns
- [ ] Improved testability
- [ ] Better code discoverability

#### Developer Experience:
- [ ] Easier to onboard new developers
- [ ] Clearer architecture documentation
- [ ] Faster PR reviews (smaller files)
- [ ] Reduced cognitive load
- [ ] Better IDE performance

#### Maintainability:
- [ ] Easier to refactor incrementally
- [ ] Clearer dependency graph
- [ ] Better test isolation
- [ ] Reduced coupling
- [ ] Improved modularity

### 8.3 Verification Procedures

#### 1. Circular Dependency Verification

**Command:**
```bash
nx graph --file=graph.json
cat graph.json | jq '.graph.dependencies' | grep -A5 -B5 "services-cases\|services-discharge"
```

**Expected Result:**
- No bidirectional edges between services-cases and services-discharge
- Clean dependency flow (services-discharge → ICasesService interface → services-cases implements)

**Manual Verification:**
```bash
# Check for dynamic imports between services
grep -r "await import.*services-cases" libs/services-discharge/
# Should return: 0 results

grep -r "await import.*services-discharge" libs/services-cases/
# Should return: 0 results
```

#### 2. Library Classification Verification

**Command:**
```bash
# Extract all library tags
find libs/ -name "project.json" -exec jq -r '.name + " -> " + (.tags | join(", "))' {} \;

# Filter for service libraries
find libs/ -name "project.json" -exec jq -r 'select(.tags | contains(["type:service"])) | .name' {} \;
# Should return: 0 results (no more type:service)
```

**Expected Result:**
- services-cases: type:data-access
- services-discharge: type:data-access
- services-shared: type:util
- All 29 libraries have Nx 4-compliant types

#### 3. Tag Compliance Verification

**Command:**
```bash
# Check for dual scope tags
find libs/ -name "project.json" -exec jq -r 'select(.tags | map(select(startswith("scope:"))) | length > 1) | .name' {} \;
# Should return: 0 results
```

**Expected Result:**
- All 29 libraries have exactly one scope tag
- No libraries with both scope:extension and scope:shared

#### 4. Module Boundary Violations Verification

**Command:**
```bash
pnpm lint:all 2>&1 | grep "lazy-loaded"
# Should return: 0 results

pnpm lint:all 2>&1 | grep "Static imports of lazy-loaded libraries"
# Should return: 0 results
```

**Expected Result:**
- Zero lazy-load violations
- All API routes use dynamic imports
- All non-API code uses static imports

#### 5. File Size Verification

**Command:**
```bash
# Check service file sizes
wc -l libs/services-cases/src/lib/**/*.ts | sort -rn | head -20
wc -l libs/services-discharge/src/lib/**/*.ts | sort -rn | head -20

# Identify any files >1500 LOC (excluding auto-generated)
find libs/ -name "*.ts" ! -name "database.types.ts" -exec wc -l {} \; | awk '$1 > 1500' | sort -rn
# Should return: 0 results
```

**Expected Result:**
- All files <600 LOC (except database.types.ts which is auto-generated)
- Average file size in services libs <500 LOC
- No monolithic files remaining

#### 6. Test Coverage Verification

**Command:**
```bash
# Run full test suite
pnpm test:all

# Count total tests
pnpm test:all 2>&1 | grep "Test Files" | awk '{print $3}'
# Should be: ≥290

# Check for test failures
pnpm test:all 2>&1 | grep "FAILED"
# Should return: 0 results
```

**Expected Result:**
- All 290+ existing tests pass
- New tests added for split files
- No test regressions
- Test coverage maintained or improved

#### 7. Bundle Size Verification

**Command:**
```bash
# Build and analyze
pnpm build

# Check main bundle size
ls -lh apps/web/.next/static/chunks/pages/_app*.js

# Compare with baseline (before changes)
git checkout main
pnpm build
ls -lh apps/web/.next/static/chunks/pages/_app*.js

# Should be: Similar or smaller
```

**Expected Result:**
- Bundle size stable or reduced (target: 5-10% reduction)
- No unexpected bundle increases
- Optimal code splitting maintained

#### 8. TypeScript Compilation Verification

**Command:**
```bash
# Run typecheck on all projects
pnpm typecheck:all

# Check for type errors
pnpm typecheck:all 2>&1 | grep "error TS"
# Should return: 0 results
```

**Expected Result:**
- All projects compile without errors
- No type safety regressions
- Strict mode maintained

#### 9. Nx Graph Visualization Verification

**Command:**
```bash
# Generate graph
nx graph

# Open in browser and verify:
# - No circular dependencies
# - Clear layering (foundation → domain → feature)
# - Proper platform separation
```

**Expected Result:**
- Clean dependency graph
- No circular arrows
- Clear architectural layers
- Platform boundaries visible

#### 10. Integration Testing Verification

**Manual Testing Checklist:**
- [ ] Case ingestion flow works end-to-end
- [ ] Discharge orchestration completes successfully
- [ ] Call scheduling functions correctly
- [ ] Email preparation works
- [ ] Status updates persist
- [ ] API routes respond correctly
- [ ] Server actions execute successfully
- [ ] tRPC procedures function properly

**Automated Integration Tests:**
```bash
# Run integration tests
pnpm nx test web --grep "integration"

# Run E2E tests (if available)
pnpm nx e2e web-e2e
```

### 8.4 Compliance Targets

**Phase 1 Complete:**
- Library Classification: 100% (29/29)
- Tag Compliance: 100% (29/29)
- Module Boundaries: Still 39 violations (fixed in Phase 4)
- Overall: ~85%

**Phase 2A/2B Complete:**
- Large Files: 33% (1/3, only database.types.ts remains)
- Average Service File Size: <500 LOC
- Overall: ~90%

**Phase 3 Complete:**
- Circular Dependencies: 0
- Overall: ~93%

**Phase 4 Complete:**
- Module Boundary Violations: 0
- Overall: **95%+** ✅

### 8.5 Acceptance Criteria

**Definition of Done:**

All of the following must be true:

1. **Zero Circular Dependencies**
   - [ ] `nx graph` shows no circular arrows
   - [ ] No dynamic imports between services-cases and services-discharge
   - [ ] Interface-based DI implemented and tested

2. **100% Nx 4-Type Compliance**
   - [ ] All 29 libraries use standard Nx types
   - [ ] No custom `type:service` tags remain
   - [ ] ESLint config updated and verified

3. **100% Tag Compliance**
   - [ ] All 29 libraries have single scope tag
   - [ ] No dual scope tags on extension libs
   - [ ] Platform tags correctly applied

4. **All Files <1500 LOC**
   - [ ] cases-service split into 8 files (<500 LOC each)
   - [ ] discharge-orchestrator split into 5 files (<600 LOC each)
   - [ ] Only database.types.ts exceeds limit (auto-generated)

5. **Zero Module Boundary Violations**
   - [ ] API routes use dynamic imports
   - [ ] Non-API code uses static imports
   - [ ] `pnpm lint:all` passes with no lazy-load errors

6. **All Tests Pass**
   - [ ] 290+ existing tests pass
   - [ ] New tests added for split files
   - [ ] Integration tests pass
   - [ ] No test regressions

7. **Backwards Compatibility**
   - [ ] Existing imports continue working
   - [ ] Public APIs unchanged
   - [ ] No breaking changes to consumers

8. **Documentation Complete**
   - [ ] Target architecture design documented
   - [ ] Import patterns guide created
   - [ ] Migration steps recorded
   - [ ] Architectural decisions recorded

9. **Performance Maintained**
   - [ ] Bundle size stable or reduced
   - [ ] Build times unchanged or faster
   - [ ] Runtime performance unchanged
   - [ ] No performance regressions

10. **Code Quality Improved**
    - [ ] Clear separation of concerns
    - [ ] Improved testability
    - [ ] Better code discoverability
    - [ ] Reduced cognitive load

**Final Sign-Off Required:**
- [ ] All verification procedures passed
- [ ] All acceptance criteria met
- [ ] Code review completed
- [ ] Documentation reviewed
- [ ] Team walkthrough conducted
- [ ] Stakeholder approval obtained

---

## 9. Conclusion

This target architecture design provides a comprehensive roadmap to achieve 95%+ compliance with Nx best practices while maintaining the strengths of the current implementation. The design prioritizes:

1. **Minimal Breaking Changes** - Backwards compatibility via re-exports
2. **Incremental Migration** - Phase-by-phase implementation with rollback plans
3. **Continuous Testing** - 290+ tests maintained throughout
4. **Clear Success Criteria** - Quantitative and qualitative metrics
5. **Risk Mitigation** - Detailed testing and rollback strategies

**Key Achievements:**
- Zero circular dependencies through interface-based DI
- 100% Nx convention alignment
- Manageable file sizes for improved maintainability
- Consistent import patterns for optimal bundling
- Comprehensive testing strategy

**Timeline:** 3-4 weeks @ 15 hours/week  
**Risk Level:** Low-Medium (well-defined patterns, comprehensive testing)  
**Impact:** High (significant improvement in architecture quality)

**Next Steps:**
1. Review and approve this design
2. Create feature branches for each phase
3. Begin Phase 1 (Foundation)
4. Execute phases according to migration strategy
5. Verify success criteria at each phase
6. Document lessons learned

---

**Document Status:** Complete  
**Ready for Implementation:** Yes  
**Requires Approval:** Yes (before Phase 1 begins)

---

## Critical Files for Implementation

Based on this comprehensive design, here are the 5 most critical files for implementing this plan:

- `/Users/taylorallen/Development/odis-ai-web/libs/services-shared/src/lib/interfaces/cases-service.interface.ts` - Core interface to break circular dependency, enables DI pattern
- `/Users/taylorallen/Development/odis-ai-web/libs/services-cases/src/lib/cases-service.ts` - Main service requiring split into 8 files, largest refactoring effort
- `/Users/taylorallen/Development/odis-ai-web/libs/services-discharge/src/lib/discharge-orchestrator.ts` - Second-largest file requiring split, 7 dynamic imports to replace
- `/Users/taylorallen/Development/odis-ai-web/eslint.config.js` - Module boundary rules to update for type reclassification
- `/Users/taylorallen/Development/odis-ai-web/libs/services-cases/project.json` - Tag configuration changes needed for all 3 service libs (example)
