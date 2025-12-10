# Testability Audit

> Purpose: Comprehensive analysis of test infrastructure, testability patterns, and coverage gaps.

**Generated**: 2024-12-09
**Score**: 2/10 (Critical)

---

## 1. Current Test Infrastructure

### Test Framework

| Component      | Technology                  | Version |
| -------------- | --------------------------- | ------- |
| Test Runner    | Vitest                      | 4.0.13  |
| Coverage       | @vitest/coverage-v8         | 4.0.13  |
| React Testing  | @testing-library/react      | 16.3.0  |
| User Events    | @testing-library/user-event | 14.6.1  |
| DOM Assertions | @testing-library/jest-dom   | 6.9.1   |

### Test Configurations

| Project         | Config File      | Environment |
| --------------- | ---------------- | ----------- |
| apps/web        | vitest.config.ts | happy-dom   |
| libs/api        | vitest.config.ts | node        |
| libs/db         | vitest.config.ts | node        |
| libs/validators | vitest.config.ts | node        |
| libs/services   | vitest.config.ts | node        |
| libs/idexx      | vitest.config.ts | node        |
| libs/vapi       | vitest.config.ts | node        |

### Existing Tests

**Total Test Files**: 2

| File                            | Location      | Tests    | Coverage      |
| ------------------------------- | ------------- | -------- | ------------- |
| llamaindex-integration.test.ts  | libs/ai       | 7 suites | AI extraction |
| discharge-batch-stagger.test.ts | libs/services | 4 suites | Batch timing  |

---

## 2. Test Utilities Library

`libs/testing` provides:

### Mock Factories

```typescript
// Supabase mock
createMockSupabaseClient(responses);

// VAPI mock
createMockVapiClient();

// NextAuth mock
createMockNextAuth();
```

### Fixtures

```typescript
// User fixtures
createUserFixture();
createAdminFixture();

// Case fixtures
createCaseFixture();
createCaseWithPatientFixture();

// Call fixtures
createCallFixture();
createCompletedCallFixture();
```

### React Testing Utilities

```typescript
// Custom render with providers
renderWithProviders(component, options);

// Wait helpers
waitForLoadingToFinish();
```

---

## 3. Testability Issues

### Issue 1: Direct Supabase Calls (CRITICAL)

**Problem**: Services directly instantiate Supabase clients

```typescript
// Current - UNTESTABLE
export class CasesService {
  async getCase(supabase: SupabaseClient, caseId: string) {
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();
    // ...
  }
}
```

**Impact**:

- Cannot mock database calls easily
- Tests require real Supabase or complex mock setup
- No isolation between test cases

**Solution**: Dependency injection with repository pattern

```typescript
// Testable
export class CasesService {
  constructor(private casesRepository: ICasesRepository) {}

  async getCase(caseId: string) {
    return this.casesRepository.findById(caseId);
  }
}

// In tests
const mockRepo = createMockCasesRepository();
const service = new CasesService(mockRepo);
```

### Issue 2: Module-Level Service Imports (HIGH)

**Problem**: External services imported at module level

```typescript
// Current - CAN'T MOCK
import { extractEntitiesWithRetry } from "@odis-ai/ai/normalize-scribe";
import { scheduleCallExecution } from "@odis-ai/qstash/client";

export class CasesService {
  async processCase(caseId: string) {
    const entities = await extractEntitiesWithRetry(data);
    await scheduleCallExecution(callId, scheduledAt);
  }
}
```

**Impact**:

- Cannot swap implementations for testing
- Real API calls during tests
- No control over external service responses

**Solution**: Injectable service interfaces

```typescript
// Testable
interface IAIService {
  extractEntities(data: EntityInput): Promise<Entities>;
}

interface IScheduler {
  scheduleExecution(id: string, at: Date): Promise<string>;
}

export class CasesService {
  constructor(
    private aiService: IAIService,
    private scheduler: IScheduler,
  ) {}
}
```

### Issue 3: Mixed Concerns in Orchestrator (HIGH)

**Problem**: `discharge-orchestrator.ts` mixes multiple concerns

```typescript
// discharge-orchestrator.ts (1,610 lines)
class DischargeOrchestrator {
  async orchestrate() {
    // Database reads
    const caseData = await this.supabase.from("cases")...

    // AI operations
    const entities = await extractEntitiesWithRetry(...);

    // Email rendering (React)
    const html = await prepareEmailContent(
      React.createElement(DischargeEmailTemplate, props)
    );

    // External API calls
    await scheduleCallExecution(...);
    await scheduleEmailDelivery(...);
  }
}
```

**Impact**:

- Cannot test orchestration logic in isolation
- Tests would need to mock 5+ external systems
- No unit testing possible

**Solution**: Extract concerns into injectable services

```typescript
// Testable
class DischargeOrchestrator {
  constructor(
    private caseRepository: ICaseRepository,
    private entityExtractor: IEntityExtractor,
    private emailRenderer: IEmailRenderer,
    private callScheduler: ICallScheduler,
    private emailScheduler: IEmailScheduler,
  ) {}

  async orchestrate() {
    // Each step delegates to injectable service
    const caseData = await this.caseRepository.findById(id);
    const entities = await this.entityExtractor.extract(data);
    // ...
  }
}
```

### Issue 4: No External API Abstraction (HIGH)

**Problem**: Direct calls to external services

| Service  | Current Pattern           | Issue                |
| -------- | ------------------------- | -------------------- |
| QStash   | `scheduleCallExecution()` | Direct function call |
| VAPI     | `createPhoneCall()`       | Direct SDK call      |
| Resend   | `resend.emails.send()`    | Direct SDK call      |
| Supabase | `supabase.from()...`      | Direct client call   |

**Impact**:

- Cannot test failure scenarios
- Cannot test retry logic
- Real API calls in test environment

**Solution**: Wrapper interfaces

```typescript
// libs/qstash/scheduler.interface.ts
interface IScheduler {
  schedule(id: string, at: Date, payload: unknown): Promise<string>;
  cancel(messageId: string): Promise<void>;
}

// libs/qstash/scheduler.ts (implementation)
export class QStashScheduler implements IScheduler {
  async schedule(id: string, at: Date, payload: unknown) {
    return scheduleCallExecution(id, at);
  }
}

// libs/qstash/scheduler.mock.ts (test double)
export class MockScheduler implements IScheduler {
  scheduledCalls: Array<{ id: string; at: Date }> = [];

  async schedule(id: string, at: Date) {
    this.scheduledCalls.push({ id, at });
    return `mock-message-${id}`;
  }
}
```

---

## 4. Coverage Gaps

### Untested Critical Paths

| Component                              | Risk Level | Impact if Broken                    |
| -------------------------------------- | ---------- | ----------------------------------- |
| `CasesService.ingest()`                | CRITICAL   | Data loss, case creation fails      |
| `CasesService.scheduleDischargeCall()` | CRITICAL   | No calls made                       |
| `DischargeOrchestrator.orchestrate()`  | CRITICAL   | Entire discharge workflow fails     |
| All Zod validators                     | HIGH       | Invalid data accepted               |
| VAPI variable building                 | HIGH       | Voice AI fails or says wrong things |
| Email generation                       | HIGH       | Customers get broken emails         |

### Coverage by Library

| Library    | Files | Test Files | Coverage |
| ---------- | ----- | ---------- | -------- |
| services   | 5     | 1          | ~5%      |
| vapi       | 15+   | 0          | 0%       |
| validators | 8     | 0          | 0%       |
| db         | 10+   | 0          | 0%       |
| ai         | 5     | 1          | ~30%     |
| utils      | 10+   | 0          | 0%       |
| clinics    | 4     | 0          | 0%       |
| api        | 4     | 0          | 0%       |
| idexx      | 5     | 0          | 0%       |

### Critical Functions Without Tests

```typescript
// libs/services/src/cases-service.ts
CasesService.ingest()                    // 0% - Core ingestion logic
CasesService.createOrUpdateCase()        // 0% - Case CRUD
CasesService.scheduleDischargeCall()     // 0% - VAPI scheduling
CasesService.enrichEntitiesWithPatient() // 0% - Entity enrichment

// libs/services/src/discharge-orchestrator.ts
DischargeOrchestrator.orchestrate()      // 0% - Main workflow
DischargeOrchestrator.executeEntityExtraction()   // 0%
DischargeOrchestrator.executeSummaryGeneration()  // 0%
DischargeOrchestrator.executeEmailPreparation()   // 0%
DischargeOrchestrator.executeCallScheduling()     // 0%

// libs/validators/src/*.ts
All Zod schemas                          // 0%

// libs/vapi/src/*.ts
buildDynamicVariables()                  // 0% - VAPI input building
extractVapiVariablesFromEntities()       // 0%
vapiWebhookHandler()                     // 0%
```

---

## 5. Testability Scores

| Aspect                   | Score | Notes                               |
| ------------------------ | ----- | ----------------------------------- |
| Test Infrastructure      | 7/10  | Good Vitest + Testing Library setup |
| Dependency Injection     | 3/10  | BaseRepository good, services bad   |
| External API Abstraction | 2/10  | Direct calls everywhere             |
| Test Coverage            | 1/10  | 2 test files, 97% untested          |
| Mocking Capabilities     | 6/10  | Good mocks exist, hard to apply     |
| Pure Functions           | 4/10  | Most mixed with side effects        |
| Error Handling Tests     | 1/10  | Only success paths                  |
| Type Safety              | 8/10  | Strong TypeScript                   |

**Overall Testability Score: 2/10**

---

## 6. Dependency Injection Opportunities

### Where DI Would Help Most

| Component             | Current                          | With DI                                   |
| --------------------- | -------------------------------- | ----------------------------------------- |
| CasesService          | Accepts Supabase client as param | Constructor injection of ICasesRepository |
| DischargeOrchestrator | Accepts Supabase client as param | Constructor injection of all services     |
| API Routes            | Direct imports                   | Service factory injection                 |
| tRPC Procedures       | Direct imports                   | Context-based injection                   |

### Recommended DI Pattern

```typescript
// libs/services/src/di/container.ts
export interface ServiceContainer {
  casesRepository: ICasesRepository;
  callRepository: ICallRepository;
  aiService: IAIService;
  scheduler: IScheduler;
  emailService: IEmailService;
}

// Production container
export function createProductionContainer(
  supabase: SupabaseClient,
): ServiceContainer {
  return {
    casesRepository: new CasesRepository(supabase),
    callRepository: new CallRepository(supabase),
    aiService: new AIService(),
    scheduler: new QStashScheduler(),
    emailService: new ResendEmailService(),
  };
}

// Test container
export function createTestContainer(
  overrides: Partial<ServiceContainer> = {},
): ServiceContainer {
  return {
    casesRepository: new MockCasesRepository(),
    callRepository: new MockCallRepository(),
    aiService: new MockAIService(),
    scheduler: new MockScheduler(),
    emailService: new MockEmailService(),
    ...overrides,
  };
}
```

---

## 7. Recommended Test Structure

### Per-Library Test Organization

```
libs/{lib-name}/
├── src/
│   ├── lib/
│   │   └── {feature}.ts
│   ├── __tests__/
│   │   ├── {feature}.test.ts
│   │   ├── {feature}.integration.test.ts
│   │   └── __fixtures__/
│   │       └── {feature}.fixtures.ts
│   └── index.ts
└── vitest.config.ts
```

### Test File Naming

```
{feature}.test.ts           # Unit tests
{feature}.integration.test.ts # Integration tests (real deps)
{feature}.e2e.test.ts       # End-to-end tests
```

### Test Categories

| Category    | Purpose                    | Dependencies                |
| ----------- | -------------------------- | --------------------------- |
| Unit        | Test single function/class | All mocked                  |
| Integration | Test component interaction | Some real, some mocked      |
| E2E         | Test full flow             | All real (test environment) |

---

## 8. Priority Test Implementation

### Phase 1: Critical (Week 1)

| Test File                      | Target                | Priority |
| ------------------------------ | --------------------- | -------- |
| cases-service.test.ts          | CasesService          | P0       |
| discharge-orchestrator.test.ts | DischargeOrchestrator | P0       |
| webhook-handler.test.ts        | VAPI webhooks         | P0       |

### Phase 2: High (Week 2-3)

| Test File                | Target            | Priority |
| ------------------------ | ----------------- | -------- |
| validators/\*.test.ts    | All Zod schemas   | P1       |
| call-manager.test.ts     | VAPI call manager | P1       |
| variable-builder.test.ts | Dynamic variables | P1       |

### Phase 3: Medium (Week 4+)

| Test File          | Target            | Priority |
| ------------------ | ----------------- | -------- |
| repository.test.ts | BaseRepository    | P2       |
| utils/\*.test.ts   | Utility functions | P2       |
| hooks/\*.test.ts   | React hooks       | P2       |

---

## 9. Test Commands

```bash
# Run all tests
pnpm test:all

# Run specific library tests
pnpm nx test services
pnpm nx test validators

# Run with coverage
pnpm nx test services --coverage

# Watch mode
pnpm nx test services --watch

# Run specific test file
pnpm vitest libs/services/src/__tests__/cases-service.test.ts
```

---

## 10. Success Metrics

### Coverage Targets

| Phase   | Lines | Functions | Branches |
| ------- | ----- | --------- | -------- |
| Current | ~3%   | ~3%       | ~2%      |
| Phase 1 | 30%   | 30%       | 25%      |
| Phase 2 | 50%   | 50%       | 45%      |
| Phase 3 | 70%   | 70%       | 65%      |

### Critical Path Coverage

| Path                    | Current | Target |
| ----------------------- | ------- | ------ |
| Case ingestion          | 0%      | 100%   |
| Discharge orchestration | 0%      | 100%   |
| VAPI webhooks           | 0%      | 100%   |
| Validators              | 0%      | 95%    |
| Dynamic variables       | 0%      | 90%    |

---

## Related Documents

- [Nx Workspace Audit](./NX_WORKSPACE_AUDIT.md)
- [Code Organization Audit](./CODE_ORGANIZATION_AUDIT.md)
- [Refactoring Roadmap](./REFACTORING_ROADMAP.md)
- [Testing Strategy](../testing/TESTING_STRATEGY.md)
