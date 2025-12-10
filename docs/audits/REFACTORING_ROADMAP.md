# Refactoring Roadmap

> Purpose: Prioritized implementation plan for all identified improvements.

**Generated**: 2024-12-09
**Timeline**: 5+ weeks

---

## Implementation Phases

| Phase   | Focus          | Duration | Priority |
| ------- | -------------- | -------- | -------- |
| Phase 1 | Critical Fixes | Week 1-2 | P0       |
| Phase 2 | Testability    | Week 3-4 | P1       |
| Phase 3 | Enhancement    | Week 5+  | P2       |

---

## Phase 1: Critical Fixes (Week 1-2)

### 1.1 Add Dependency Constraint Rules

**Priority**: P0
**Effort**: 2 hours
**Risk**: LOW

**Steps:**

1. Add to `.eslintrc.json`:

```json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          {
            "sourceTag": "platform:browser",
            "onlyDependOnLibsWithTags": ["platform:browser", "platform:neutral"]
          },
          {
            "sourceTag": "platform:node",
            "onlyDependOnLibsWithTags": ["platform:node", "platform:neutral"]
          },
          {
            "sourceTag": "platform:neutral",
            "onlyDependOnLibsWithTags": ["platform:neutral"]
          }
        ]
      }
    ]
  }
}
```

2. Run `nx lint --all`
3. Fix any violations

**Success Criteria:**

- [ ] Rules configured
- [ ] `nx lint --all` passes
- [ ] No boundary violations

---

### 1.2 Move Web App Code to Shared Libs

**Priority**: P0
**Effort**: 4-6 hours
**Risk**: MEDIUM

#### 1.2.1 Move case-transforms.ts

**Source**: `apps/web/src/lib/transforms/case-transforms.ts`
**Target**: `libs/utils/src/lib/case-transforms.ts`

```bash
# Create file
cp apps/web/src/lib/transforms/case-transforms.ts \
   libs/utils/src/lib/case-transforms.ts

# Update libs/utils/src/index.ts
echo "export * from './lib/case-transforms';" >> libs/utils/src/index.ts

# Update imports in web app
# Find and replace:
# "~/lib/transforms/case-transforms" → "@odis-ai/utils/case-transforms"
```

#### 1.2.2 Move clinic-context.tsx

**Source**: `apps/web/src/lib/clinic-context.tsx`
**Target**: `libs/ui/src/lib/clinic-context.tsx`

```bash
# Create file
cp apps/web/src/lib/clinic-context.tsx \
   libs/ui/src/lib/clinic-context.tsx

# Update libs/ui/src/index.ts
echo "export * from './lib/clinic-context';" >> libs/ui/src/index.ts

# Update imports:
# "~/lib/clinic-context" → "@odis-ai/ui/clinic-context"
```

#### 1.2.3 Move scribe-transactions.ts

**Source**: `apps/web/src/lib/db/scribe-transactions.ts`
**Target**: `libs/db/src/lib/entities/scribe-transactions.ts`

```bash
# Create directory and file
mkdir -p libs/db/src/lib/entities
cp apps/web/src/lib/db/scribe-transactions.ts \
   libs/db/src/lib/entities/scribe-transactions.ts

# Create index
echo "export * from './scribe-transactions';" > libs/db/src/lib/entities/index.ts

# Update libs/db/src/index.ts
echo "export * from './lib/entities';" >> libs/db/src/index.ts
```

#### 1.2.4 Move schedule validators

**Source**: `apps/web/src/lib/schedule/validators.ts`
**Target**: `libs/validators/src/lib/schedule.ts`

```bash
cp apps/web/src/lib/schedule/validators.ts \
   libs/validators/src/lib/schedule.ts

echo "export * from './lib/schedule';" >> libs/validators/src/index.ts
```

**Success Criteria:**

- [ ] All 4 files moved
- [ ] All imports updated
- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes

---

### 1.3 Split Dashboard Router

**Priority**: P0
**Effort**: 4-6 hours
**Risk**: MEDIUM

**Current**: `apps/web/src/server/api/routers/dashboard.ts` (2,029 lines)

**Target Structure:**

```
apps/web/src/server/api/routers/dashboard/
├── index.ts            # Re-exports
├── router.ts           # Router definition
├── procedures/
│   ├── stats.ts        # getStats procedure
│   ├── activity.ts     # getRecentActivity
│   ├── calls.ts        # Call-related procedures
│   ├── emails.ts       # Email-related procedures
│   └── summaries.ts    # Summary procedures
├── helpers/
│   └── date-filters.ts
└── types.ts
```

**Steps:**

1. Create directory structure
2. Extract types to `types.ts`
3. Extract helper functions to `helpers/`
4. Extract each procedure to separate file
5. Create `router.ts` that imports procedures
6. Update `index.ts` to re-export router
7. Update root router import

**Success Criteria:**

- [ ] No file > 300 lines
- [ ] All tests pass
- [ ] Router works identically

---

### 1.4 Split Cases Router

**Priority**: P0
**Effort**: 4-6 hours
**Risk**: MEDIUM

**Current**: `apps/web/src/server/api/routers/cases.ts` (2,003 lines)

**Target Structure:**

```
apps/web/src/server/api/routers/cases/
├── index.ts
├── router.ts
├── procedures/
│   ├── list.ts
│   ├── get.ts
│   ├── create.ts
│   ├── update.ts
│   ├── delete.ts
│   └── bulk.ts
├── helpers/
│   ├── filters.ts
│   └── transforms.ts
├── types.ts
└── schemas.ts
```

**Success Criteria:**

- [ ] No file > 300 lines
- [ ] Schema separated from procedures
- [ ] All tests pass

---

## Phase 2: Testability (Week 3-4)

### 2.1 Introduce Dependency Injection

**Priority**: P1
**Effort**: 8-12 hours
**Risk**: HIGH

#### 2.1.1 Create Repository Interfaces

**Location**: `libs/db/src/interfaces/`

```typescript
// libs/db/src/interfaces/cases-repository.interface.ts
export interface ICasesRepository {
  findById(id: string): Promise<Case | null>;
  findByPatient(patientId: string): Promise<Case[]>;
  create(data: CreateCaseInput): Promise<Case>;
  update(id: string, data: UpdateCaseInput): Promise<Case>;
  delete(id: string): Promise<void>;
}

// libs/db/src/interfaces/call-repository.interface.ts
export interface ICallRepository {
  findById(id: string): Promise<Call | null>;
  findByCase(caseId: string): Promise<Call[]>;
  create(data: CreateCallInput): Promise<Call>;
  updateStatus(id: string, status: CallStatus): Promise<Call>;
}
```

#### 2.1.2 Update Services to Use Interfaces

```typescript
// libs/services/src/cases-service.ts
export class CasesService {
  constructor(
    private casesRepo: ICasesRepository,
    private callRepo: ICallRepository,
    private aiService: IAIService,
    private scheduler: IScheduler
  ) {}

  async ingest(data: IngestInput): Promise<Case> {
    // Now fully testable with mock implementations
    const case = await this.casesRepo.create(data);
    const entities = await this.aiService.extract(data);
    await this.casesRepo.update(case.id, { entities });
    return case;
  }
}
```

#### 2.1.3 Create Service Factory

```typescript
// libs/services/src/factory.ts
export function createCasesService(supabase: SupabaseClient): CasesService {
  return new CasesService(
    new CasesRepository(supabase),
    new CallRepository(supabase),
    new AIService(),
    new QStashScheduler(),
  );
}

// For testing
export function createTestCasesService(
  overrides: Partial<CasesServiceDeps> = {},
): CasesService {
  return new CasesService(
    overrides.casesRepo ?? new MockCasesRepository(),
    overrides.callRepo ?? new MockCallRepository(),
    overrides.aiService ?? new MockAIService(),
    overrides.scheduler ?? new MockScheduler(),
  );
}
```

**Success Criteria:**

- [ ] All services accept dependencies via constructor
- [ ] Mock implementations exist for all interfaces
- [ ] Services testable without real infrastructure

---

### 2.2 Split Services Library

**Priority**: P1
**Effort**: 6-8 hours
**Risk**: MEDIUM

**Current**: `libs/services` (4,037 lines)

**Target:**

```
libs/
├── services-cases/
│   ├── src/
│   │   ├── cases-service.ts
│   │   ├── interfaces.ts
│   │   └── index.ts
│   └── project.json
├── services-discharge/
│   ├── src/
│   │   ├── orchestrator.ts
│   │   ├── batch-processor.ts
│   │   ├── interfaces.ts
│   │   └── index.ts
│   └── project.json
└── services-shared/
    ├── src/
    │   ├── execution-plan.ts
    │   └── index.ts
    └── project.json
```

**Steps:**

1. Generate new libraries:

```bash
nx g @nx/js:lib services-cases \
  --directory=libs/services-cases \
  --importPath=@odis-ai/services/cases

nx g @nx/js:lib services-discharge \
  --directory=libs/services-discharge \
  --importPath=@odis-ai/services/discharge

nx g @nx/js:lib services-shared \
  --directory=libs/services-shared \
  --importPath=@odis-ai/services/shared
```

2. Move files to new libraries
3. Update imports across codebase
4. Update original `libs/services/index.ts` to re-export (temporary)
5. Remove re-exports after verification

**Success Criteria:**

- [ ] Each new lib < 2000 lines
- [ ] Clear single responsibility
- [ ] All imports work

---

### 2.3 Add Critical Path Tests

**Priority**: P1
**Effort**: 16-24 hours
**Risk**: LOW

#### Test Files to Create

| File                             | Target                | Tests                            |
| -------------------------------- | --------------------- | -------------------------------- |
| `cases-service.test.ts`          | CasesService          | ingest, create, update, schedule |
| `discharge-orchestrator.test.ts` | DischargeOrchestrator | orchestrate, each step           |
| `validators/*.test.ts`           | All Zod schemas       | Valid/invalid inputs             |
| `call-manager.test.ts`           | CallManager           | Create, update, webhook handling |

#### Example Test Structure

```typescript
// libs/services-cases/src/__tests__/cases-service.test.ts
describe("CasesService", () => {
  let service: CasesService;
  let mockCasesRepo: MockCasesRepository;
  let mockAIService: MockAIService;
  let mockScheduler: MockScheduler;

  beforeEach(() => {
    mockCasesRepo = new MockCasesRepository();
    mockAIService = new MockAIService();
    mockScheduler = new MockScheduler();
    service = new CasesService(mockCasesRepo, mockAIService, mockScheduler);
  });

  describe("ingest", () => {
    it("creates case with extracted entities", async () => {
      mockAIService.extractResponse = { patient: "Max", owner: "John" };

      const result = await service.ingest(validInput);

      expect(mockCasesRepo.createCalls).toHaveLength(1);
      expect(mockCasesRepo.updateCalls[0].entities).toEqual(
        mockAIService.extractResponse,
      );
    });

    it("schedules discharge call when enabled", async () => {
      const result = await service.ingest({
        ...validInput,
        scheduleCall: true,
      });

      expect(mockScheduler.scheduleCalls).toHaveLength(1);
    });
  });
});
```

**Success Criteria:**

- [ ] CasesService 80%+ coverage
- [ ] DischargeOrchestrator 80%+ coverage
- [ ] All validators 95%+ coverage
- [ ] CI pipeline includes tests

---

## Phase 3: Enhancement (Week 5+)

### 3.1 Consolidate Types

**Priority**: P2
**Effort**: 4-6 hours

**Move from `apps/web/src/types/` to `libs/types/`:**

- dashboard.ts → libs/types/src/dashboard.ts
- case.ts → libs/types/src/case.ts
- services.ts → libs/types/src/services.ts
- patient.ts → libs/types/src/patient.ts

**Keep in web app:**

- case-study.ts (app-specific)

---

### 3.2 Create External API Abstractions

**Priority**: P2
**Effort**: 8-12 hours

**Create interfaces for:**

```typescript
// libs/qstash/src/scheduler.interface.ts
export interface IScheduler {
  schedule(id: string, at: Date, payload: unknown): Promise<string>;
  cancel(messageId: string): Promise<void>;
}

// libs/vapi/src/call-client.interface.ts
export interface ICallClient {
  create(config: CallConfig): Promise<CallResponse>;
  get(id: string): Promise<Call>;
  list(filters: CallFilters): Promise<Call[]>;
}

// libs/resend/src/email-client.interface.ts
export interface IEmailClient {
  send(email: EmailInput): Promise<EmailResponse>;
}
```

---

### 3.3 Multi-App Preparation

**Priority**: P2
**Effort**: 12-16 hours

**Create:**

- `libs/state` - Shared state management (Zustand)
- `libs/sync` - Offline-first data sync
- Expand `libs/api-client` - REST API client

---

## Summary Checklist

### Phase 1 (Week 1-2)

- [ ] Add `@nx/enforce-module-boundaries` rules
- [ ] Move `case-transforms.ts` to libs/utils
- [ ] Move `clinic-context.tsx` to libs/ui
- [ ] Move `scribe-transactions.ts` to libs/db
- [ ] Move `schedule/validators.ts` to libs/validators
- [ ] Split `dashboard.ts` into directory
- [ ] Split `cases.ts` into directory

### Phase 2 (Week 3-4)

- [ ] Create repository interfaces
- [ ] Update services to use DI
- [ ] Create service factory
- [ ] Split libs/services into sub-libraries
- [ ] Add tests for CasesService
- [ ] Add tests for DischargeOrchestrator
- [ ] Add tests for all validators

### Phase 3 (Week 5+)

- [ ] Consolidate types
- [ ] Create IScheduler interface
- [ ] Create ICallClient interface
- [ ] Create IEmailClient interface
- [ ] Create libs/state
- [ ] Expand libs/api-client

---

## Risk Mitigation

### High-Risk Changes

| Change         | Risk              | Mitigation                      |
| -------------- | ----------------- | ------------------------------- |
| Split routers  | Breaking routes   | Test all endpoints before/after |
| Move lib code  | Import errors     | Use temporary re-exports        |
| DI refactor    | Runtime errors    | Incremental migration           |
| Split services | Dependency breaks | Update imports immediately      |

### Rollback Plan

1. **Branch strategy**: Feature branch per phase
2. **Incremental merges**: Small PRs, frequent integration
3. **CI gates**: All tests must pass before merge
4. **Temporary re-exports**: Old paths work during transition

---

## Success Metrics

### After Phase 1

- [ ] `nx lint --all` passes with boundaries
- [ ] No file in routers/ > 300 lines
- [ ] All web app lib code in shared libs

### After Phase 2

- [ ] Test coverage > 50%
- [ ] All services use dependency injection
- [ ] Services library split into focused libs

### After Phase 3

- [ ] Test coverage > 70%
- [ ] External APIs abstracted
- [ ] Ready for Chrome extension/Electron

---

## Related Documents

- [Nx Workspace Audit](./NX_WORKSPACE_AUDIT.md)
- [Testability Audit](./TESTABILITY_AUDIT.md)
- [Code Organization Audit](./CODE_ORGANIZATION_AUDIT.md)
