# Code Organization Audit

> Purpose: Detailed analysis of file placement, code clutter, and organization improvements.

**Generated**: 2024-12-09
**Score**: 5/10

---

## 1. Web App Internal Code Analysis

### apps/web/src/lib/ Directory

**Current Structure:**

```
apps/web/src/lib/
├── clinic-context.tsx         (111 lines)
├── utils.ts                   (14 lines)
├── mock-data.ts               (250+ lines)
├── posthog.ts                 (12 lines)
├── db/
│   └── scribe-transactions.ts (446 lines)
├── llamaindex/
│   └── *.ts
├── schedule/
│   └── validators.ts
└── transforms/
    └── case-transforms.ts
```

### Code to Move to Shared Libs

| File                            | Lines | Target             | Priority | Reason                            |
| ------------------------------- | ----- | ------------------ | -------- | --------------------------------- |
| `transforms/case-transforms.ts` | ~200  | `libs/utils/`      | HIGH     | Pure transformations, no app deps |
| `clinic-context.tsx`            | 111   | `libs/ui/`         | HIGH     | Reusable React context            |
| `db/scribe-transactions.ts`     | 446   | `libs/db/`         | HIGH     | Database operations               |
| `schedule/validators.ts`        | ~100  | `libs/validators/` | HIGH     | Zod schemas                       |
| `llamaindex/*.ts`               | ~150  | `libs/llm/` (new)  | MEDIUM   | LLM configuration                 |

### Code to Keep in Web App

| File           | Lines | Reason                                      |
| -------------- | ----- | ------------------------------------------- |
| `mock-data.ts` | 250+  | Development/testing only                    |
| `posthog.ts`   | 12    | App-specific initialization                 |
| `utils.ts`     | 14    | App-specific utils (`cn`, `formatDuration`) |

---

## 2. Oversized Router Files

### Critical Files

| File                              | Lines | Issue                          |
| --------------------------------- | ----- | ------------------------------ |
| `server/api/routers/dashboard.ts` | 2,029 | Single file, multiple concerns |
| `server/api/routers/cases.ts`     | 2,003 | Single file, embedded types    |

### dashboard.ts Analysis

**Current Structure (2,029 lines):**

```typescript
// Embedded type definitions (lines 1-50)
type SupabasePatient = {...}
type DynamicVariables = {...}
type CallAnalysis = {...}

// Procedures mixed together
getStats()           // ~300 lines
getRecentActivity()  // ~200 lines
getCalls()           // ~250 lines
getEmails()          // ~200 lines
getSummaries()       // ~150 lines
// ... many more
```

**Recommended Refactor:**

```
server/api/routers/dashboard/
├── index.ts              # Re-exports router
├── router.ts             # Main router definition
├── procedures/
│   ├── stats.ts          # getStats
│   ├── activity.ts       # getRecentActivity
│   ├── calls.ts          # getCalls, getCall
│   ├── emails.ts         # getEmails, getEmail
│   └── summaries.ts      # getSummaries
├── helpers/
│   ├── date-filters.ts
│   └── aggregations.ts
└── types.ts              # Dashboard-specific types
```

### cases.ts Analysis

**Current Structure (2,003 lines):**

```typescript
// Embedded schema (lines 1-30)
const caseSchema = z.object({...})

// Procedures
listCases()           // ~400 lines
getCase()             // ~200 lines
createCase()          // ~300 lines
updateCase()          // ~200 lines
deleteCase()          // ~100 lines
bulkCreateCases()     // ~400 lines
// ...
```

**Recommended Refactor:**

```
server/api/routers/cases/
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

---

## 3. Large API Routes

### Route File Analysis

| Route                             | Lines | Concerns                               |
| --------------------------------- | ----- | -------------------------------------- |
| `/api/schedule/sync`              | 504   | Auth + validation + IDEXX + scheduling |
| `/api/webhooks/execute-call`      | 501   | Auth + VAPI + DB + retry logic         |
| `/api/calls/schedule`             | 385   | Auth + validation + QStash             |
| `/api/generate/discharge-email`   | 364   | Template + branding + rendering        |
| `/api/generate/discharge-summary` | 339   | LLM + template                         |
| `/api/cases/find-by-patient`      | 294   | Query + deduplication                  |

### Recommended Pattern

**Current (monolithic):**

```typescript
// route.ts (500+ lines)
export async function POST(request: Request) {
  // Auth check (50 lines)
  // Validation (50 lines)
  // Business logic (300 lines)
  // Response handling (100 lines)
}
```

**Recommended (layered):**

```typescript
// route.ts (~50 lines)
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.success) return auth.response;

  const validation = await validateScheduleRequest(request);
  if (!validation.success) return validation.response;

  const result = await scheduleService.schedule(validation.data);
  return formatResponse(result);
}

// services/schedule-service.ts (in libs)
export class ScheduleService {
  async schedule(data: ScheduleRequest): Promise<ScheduleResult> {
    // Business logic here
  }
}
```

---

## 4. Types Duplication

### Web App Types Directory

**Current: `apps/web/src/types/`**

```
types/
├── dashboard.ts       (512 lines)
├── case.ts            (46 lines)
├── services.ts        (109 lines)
├── clinic-branding.ts
├── patient.ts
├── supabase.ts
├── orchestration.ts
└── case-study.ts
```

### Overlap with libs/types

| File             | Web App   | libs/types | Overlap |
| ---------------- | --------- | ---------- | ------- |
| dashboard.ts     | 512 lines | Partial    | HIGH    |
| case.ts          | 46 lines  | Exists     | HIGH    |
| services.ts      | 109 lines | Partial    | MEDIUM  |
| patient.ts       | Exists    | Exists     | HIGH    |
| orchestration.ts | Exists    | Exists     | HIGH    |

### Consolidation Plan

**Move to libs/types:**

```typescript
// libs/types/src/dashboard.ts
export interface DashboardCase {...}
export interface DashboardCall {...}
export interface DashboardStats {...}

// libs/types/src/services.ts
export interface ServiceResult {...}
export interface OrchestrationStep {...}
```

**Keep in Web App:**

```typescript
// apps/web/src/types/case-study.ts (app-specific)
export interface CaseStudy {...}
```

---

## 5. Hooks Analysis

### Web App Hooks

**Current: `apps/web/src/hooks/`**

```
hooks/
├── use-debounce.ts
├── use-event-listener.ts
├── use-mobile.ts
├── use-media-query.ts
├── use-toast.ts
├── useDeviceDetection.ts
├── useScrollTracking.ts
├── use-isomorphic-layout-effect.tsx
└── use-on-click-outside.tsx
```

### Categorization

| Hook                             | Category  | Action             |
| -------------------------------- | --------- | ------------------ |
| use-debounce.ts                  | Generic   | Move to libs/hooks |
| use-event-listener.ts            | Generic   | Move to libs/hooks |
| use-mobile.ts                    | Generic   | Move to libs/hooks |
| use-media-query.ts               | Generic   | Move to libs/hooks |
| use-on-click-outside.tsx         | Generic   | Move to libs/hooks |
| use-isomorphic-layout-effect.tsx | Generic   | Move to libs/hooks |
| use-toast.ts                     | shadcn/ui | Move to libs/ui    |
| useDeviceDetection.ts            | Analytics | Keep in web app    |
| useScrollTracking.ts             | Analytics | Keep in web app    |

### Note on libs/hooks

`libs/hooks` already exists with some hooks. Merge would add:

- useDebounce
- useEventListener
- useMobile
- useMediaQuery
- useOnClickOutside
- useIsomorphicLayoutEffect

---

## 6. Server Actions

### Current State

**Location: `apps/web/src/server/actions/`**

```
actions/
├── auth.ts        (146 lines)
├── patients.ts    (263 lines)
├── retell.ts      (403 lines)  # Legacy?
└── ...
```

### Issues

| File        | Lines | Issue                        |
| ----------- | ----- | ---------------------------- |
| retell.ts   | 403   | Legacy code? Should use VAPI |
| patients.ts | 263   | Mixed CRUD + validation      |

### Recommendations

1. **retell.ts**: Evaluate if still needed. If VAPI replaced Retell, remove.
2. **patients.ts**: Extract validation to libs/validators

---

## 7. Component Organization

### Current Structure

```
components/
├── admin/          # Admin UI
├── blocks/         # Content blocks
├── calls/          # Call components
├── dashboard/      # Dashboard UI (10+ subdirs)
├── layout/         # Layout components
├── legal/          # Legal pages
├── marketing/      # Marketing pages
├── onboarding/     # Onboarding flows
├── profile-page/   # Profile UI
├── providers/      # Context providers
└── ui/             # shadcn/ui components
```

### Assessment

**Good:**

- Clear domain separation
- shadcn/ui in dedicated folder
- Feature-based organization

**Improvements:**

- `components/ui/` duplicates `libs/ui/` - consolidate
- Some providers could move to libs

---

## 8. File Movement Plan

### High Priority Moves

```bash
# Case transforms
mv apps/web/src/lib/transforms/case-transforms.ts \
   libs/utils/src/lib/case-transforms.ts

# Clinic context
mv apps/web/src/lib/clinic-context.tsx \
   libs/ui/src/lib/clinic-context.tsx

# Scribe transactions
mv apps/web/src/lib/db/scribe-transactions.ts \
   libs/db/src/lib/entities/scribe-transactions.ts

# Schedule validators
mv apps/web/src/lib/schedule/validators.ts \
   libs/validators/src/lib/schedule.ts
```

### Import Updates Required

After moves, update imports:

```typescript
// Before
import { transformBackendCaseToDashboardCase } from "~/lib/transforms/case-transforms";
import { ClinicProvider } from "~/lib/clinic-context";
import { storeNormalizedEntities } from "~/lib/db/scribe-transactions";
import { ScheduleSyncRequestSchema } from "~/lib/schedule/validators";

// After
import { transformBackendCaseToDashboardCase } from "@odis-ai/utils/case-transforms";
import { ClinicProvider } from "@odis-ai/ui/clinic-context";
import { storeNormalizedEntities } from "@odis-ai/db/entities";
import { ScheduleSyncRequestSchema } from "@odis-ai/validators/schedule";
```

---

## 9. Directory Structure Recommendations

### Current vs. Recommended

**Current:**

```
apps/web/src/
├── app/
├── components/
├── hooks/          # 10 hooks (mix of generic/specific)
├── lib/            # Utilities that should be in libs
├── server/
│   ├── actions/
│   └── api/
│       └── routers/   # 2000+ line files
├── types/          # Duplicates libs/types
└── styles/
```

**Recommended:**

```
apps/web/src/
├── app/
├── components/
├── hooks/          # Only app-specific hooks (2-3)
├── lib/            # Only app-specific utilities
│   ├── posthog.ts
│   ├── utils.ts
│   └── mock-data.ts
├── server/
│   ├── actions/
│   └── api/
│       └── routers/
│           ├── dashboard/   # Directory, not file
│           ├── cases/       # Directory, not file
│           └── ...
├── types/          # Only app-specific types
│   └── case-study.ts
└── styles/
```

---

## 10. Impact Analysis

### Files Affected by Reorganization

| Change                   | Files Impacted | Risk   |
| ------------------------ | -------------- | ------ |
| Move case-transforms     | ~15            | LOW    |
| Move clinic-context      | ~30            | MEDIUM |
| Move scribe-transactions | ~8             | LOW    |
| Move schedule validators | ~5             | LOW    |
| Split dashboard router   | ~20            | MEDIUM |
| Split cases router       | ~15            | MEDIUM |
| Consolidate types        | ~50            | HIGH   |

### Migration Strategy

1. **Create target files** in libs with same exports
2. **Update imports** one domain at a time
3. **Add re-exports** in old location (temporary)
4. **Remove re-exports** after verification
5. **Delete old files**

---

## Related Documents

- [Nx Workspace Audit](./NX_WORKSPACE_AUDIT.md)
- [Testability Audit](./TESTABILITY_AUDIT.md)
- [Refactoring Roadmap](./REFACTORING_ROADMAP.md)
