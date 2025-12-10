# Code Organization Audit

> Purpose: Detailed analysis of file placement, code clutter, and organization improvements.

**Generated**: 2024-12-09  
**Updated**: 2025-12-10  
**Original Score**: 5/10  
**Current Score**: 9/10 ✅

## Status Summary

✅ **REFACTORING COMPLETE** - All critical organizational improvements have been implemented across 7 commits. This document is preserved for historical reference.

### Completed Actions

1. ✅ **Router Splitting** - dashboard.ts (2,029→6 files) and cases.ts (2,003→6 files)
2. ✅ **Shared Code Migration** - case-transforms, scribe-transactions, validators moved to libs
3. ✅ **Type Consolidation** - 4 type files moved to libs/types (512+ lines)
4. ✅ **Services Split** - libs/services split into 3 focused libraries
5. ✅ **Import Updates** - 42+ import paths updated across web app
6. ✅ **Repository Interfaces** - 4 repository + 3 external API interfaces created
7. ✅ **Test Coverage** - 236+ validator tests added

### Commits

- `2fd3f8e` - Move shared utilities from web app to libs
- `80bd7d5` - Split dashboard.ts router into modular directory structure
- `a80af32` - Split cases.ts router into modular directory structure
- `02bafeb` - Fix import paths to use new shared lib locations
- `7189e0c` - Split services into focused sub-libraries
- `b7d7741` - Consolidate web app types to shared libs
- `90b11d8` - Integrate all agent changes and fix TypeScript errors

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

### Code Moved to Shared Libs ✅

| File                            | Lines | Target              | Status      | Commit                |
| ------------------------------- | ----- | ------------------- | ----------- | --------------------- |
| `transforms/case-transforms.ts` | ~200  | `libs/utils/`       | ✅ Complete | `2fd3f8e`             |
| `db/scribe-transactions.ts`     | 446   | `libs/db/entities/` | ✅ Complete | `2fd3f8e`             |
| `schedule/validators.ts`        | ~100  | `libs/validators/`  | ✅ Complete | `2fd3f8e`             |
| `clinic-context.tsx`            | 111   | -                   | ⚠️ Skipped  | App-specific          |
| `llamaindex/*.ts`               | ~150  | -                   | ⏸️ Deferred | Will move when needed |

### Code to Keep in Web App

| File           | Lines | Reason                                      |
| -------------- | ----- | ------------------------------------------- |
| `mock-data.ts` | 250+  | Development/testing only                    |
| `posthog.ts`   | 12    | App-specific initialization                 |
| `utils.ts`     | 14    | App-specific utils (`cn`, `formatDuration`) |

---

## 2. Oversized Router Files

### Critical Files - ✅ REFACTORED

| File                              | Original Lines | Current State              | Status      |
| --------------------------------- | -------------- | -------------------------- | ----------- |
| `server/api/routers/dashboard.ts` | 2,029          | Split into 6 modular files | ✅ Complete |
| `server/api/routers/cases.ts`     | 2,003          | Split into 6 modular files | ✅ Complete |

### dashboard.ts - ✅ COMPLETED (Commit: `80bd7d5`)

**Original Structure (2,029 lines):** Single monolithic file

**Current Structure:**

```
server/api/routers/dashboard/
├── index.ts         # Main router export
├── activity.ts      # Activity procedures (489 lines)
├── listings.ts      # Listings procedures (660 lines)
├── performance.ts   # Performance stats
├── scheduled.ts     # Scheduled items
├── stats.ts         # Dashboard statistics
└── types.ts         # Shared types
```

**Improvement**: 2,029 lines → 6 focused files (largest: 660 lines)

### cases.ts - ✅ COMPLETED (Commit: `a80af32`)

**Original Structure (2,003 lines):** Single monolithic file

**Current Structure:**

```
server/api/routers/cases/
├── index.ts                # Main router export
├── admin.ts                # Admin operations
├── batch-operations.ts     # Bulk operations
├── patient-management.ts   # Patient CRUD
├── schemas.ts              # Zod validation (25 lines)
└── user-cases.ts           # User-specific cases
```

**Improvement**: 2,003 lines → 6 focused files with separated schemas

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

### Type Consolidation - ✅ COMPLETED (Commit: `b7d7741`)

**Moved to `libs/types/src/`:**

| File             | Lines | Status   |
| ---------------- | ----- | -------- |
| dashboard.ts     | 512   | ✅ Moved |
| case.ts          | 46    | ✅ Moved |
| services.ts      | 109   | ✅ Moved |
| patient.ts       | -     | ✅ Moved |
| orchestration.ts | -     | ✅ Moved |

**Kept in Web App:**

| File               | Reason                | Status  |
| ------------------ | --------------------- | ------- |
| case-study.ts      | App-specific UI type  | ✅ Kept |
| supabase.ts        | App-specific DB types | ✅ Kept |
| clinic-branding.ts | App-specific branding | ✅ Kept |

**Import Updates**: 42+ import statements updated (Commit: `02bafeb`)

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
