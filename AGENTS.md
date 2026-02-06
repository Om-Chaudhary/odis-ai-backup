# AGENTS.md - AI Coding Assistant Guide

> Comprehensive guide for AI coding assistants (Cursor, Codex, Copilot) working in the ODIS AI monorepo.
> **Claude Code**: uses `.claude/rules/` for modular instructions instead of this file. See root `CLAUDE.md`.

## Project Overview

**ODIS AI** is a veterinary technology platform that automates patient discharge calls and case management. Core capabilities:

- **Voice AI**: Automated discharge and inbound calls via VAPI (voice AI platform)
- **Case Management**: Veterinary case tracking and workflow automation
- **IDEXX Integration**: Headless sync service for IDEXX Neo veterinary software
- **Discharge Orchestration**: Batch scheduling, staggered calls, retry logic

**Tech Stack**: Next.js 16 (App Router) · React 19 · TypeScript (strict) · Supabase (PostgreSQL) · tRPC · Tailwind CSS 4 · shadcn/ui · Nx monorepo

---

## Quick Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server (nx dev web)
pnpm build                  # Production build (nx build web)

# Quality
pnpm check                  # lint + typecheck (all projects)
pnpm lint:all               # Lint all projects
pnpm typecheck:all          # TypeScript check all projects

# Testing
pnpm test:all               # Run all tests
pnpm test:coverage          # Coverage report
nx test <project>           # Test specific project
nx test <project> -t "name" # Run specific test

# Nx
nx affected -t lint,test    # Run on affected projects
nx graph                    # View dependency graph
pnpm docs:nx                # Regenerate Nx inventory docs
```

---

## Workspace Architecture

```
apps/
  web/                      # Next.js 16 application (dashboard, API routes, tRPC)
  docs/                     # Docusaurus documentation site
  idexx-sync/               # Headless IDEXX Neo sync service (Express + Playwright)

libs/
  shared/                   # Cross-cutting concerns
    types/                  # TypeScript types (Database, Case, Patient, etc.)
    validators/             # Zod schemas (95%+ test coverage)
    util/                   # Utilities (transforms, business-hours, phone, dates)
    ui/                     # shadcn/ui components (59+ components)
    hooks/                  # React hooks
    logger/                 # Structured logging with namespaces
    crypto/                 # AES encryption helpers
    constants/              # Shared configuration
    env/                    # Environment variable validation
    styles/                 # Global CSS + Tailwind config
    testing/                # Test utilities, mocks, fixtures
    email/                  # Email templates (React Email)

  data-access/              # Database layer
    db/                     # Main re-export (clients + repos)
    supabase-client/        # Supabase client initialization
    repository-interfaces/  # Repository contracts (ICasesRepository, etc.)
    repository-impl/        # Concrete Supabase implementations
    api/                    # API helpers (auth, CORS, responses)
    entities/               # Domain entities (scribe transactions)

  domain/                   # Business logic
    cases/data-access/      # CasesService (case management, ingestion)
    discharge/data-access/  # DischargeOrchestrator, batch processor
    shared/util/            # ExecutionPlan, shared service utilities
    clinics/util/           # Clinic config, VAPI config helpers
    auth/util/              # Authentication utilities

  integrations/             # External services
    vapi/                   # VAPI voice AI integration
      src/
        client.ts           # VapiClient wrapper (createPhoneCall)
        validators.ts       # Dynamic variable validation
        utils.ts            # Variable formatting helpers
        types.ts            # TypeScript types (DynamicVariables, etc.)
        core/               # Request/response primitives
        schemas/            # Zod schemas by domain (appointments, triage, etc.)
        processors/         # Tool call processors by domain
        webhooks/
          types.ts          # Webhook payload types
          tools/            # Tool execution (registry, executor, built-in)
          background-jobs/  # Fire-and-forget tasks (Slack, transcripts)
          utils/            # Modular utilities:
            status-mapper   # Call status conversion
            retry-scheduler # Retry logic with backoff
            cost-calculator # Duration and cost formatting
            sentiment-analyzer # Analysis extraction
            call-enricher   # Payload transformation
    idexx/                  # IDEXX Neo transforms, credentials
    qstash/                 # QStash scheduling (IScheduler)
    resend/                 # Email sending (IEmailClient)
    slack/                  # Slack notifications
    ai/                     # LlamaIndex/Anthropic utilities
```

---

## Import Conventions

All imports use the `@odis-ai/` namespace. Use the domain-grouped pattern:

```typescript
// Shared
import type { DashboardCase, Database } from "@odis-ai/shared/types";
import { dischargeSchema, scheduleSchema } from "@odis-ai/shared/validators";
import {
  transformBackendCase,
  isWithinBusinessHours,
} from "@odis-ai/shared/util";
import { Button, Card, DataTable } from "@odis-ai/shared/ui";
import { loggers } from "@odis-ai/shared/logger";

// Data Access
import {
  createServerClient,
  createServiceClient,
} from "@odis-ai/data-access/db";
import type {
  ICasesRepository,
  ICallRepository,
} from "@odis-ai/data-access/repository-interfaces";
import {
  CasesRepository,
  CallRepository,
} from "@odis-ai/data-access/repository-impl";

// Domain
import { CasesService } from "@odis-ai/domain/cases";
import { DischargeOrchestrator } from "@odis-ai/domain/discharge";
import { ExecutionPlan } from "@odis-ai/domain/shared";
import { getClinicByUserId, getVapiConfig } from "@odis-ai/domain/clinics";

// Integrations
import {
  createPhoneCall,
  validateDynamicVariables,
} from "@odis-ai/integrations/vapi";
import {
  mapVapiStatus,
  shouldRetry,
} from "@odis-ai/integrations/vapi/webhooks/utils";
import {
  processToolCall,
  ToolRegistry,
} from "@odis-ai/integrations/vapi/webhooks/tools";
import { scheduleCallExecution } from "@odis-ai/integrations/qstash";
import { sendEmail } from "@odis-ai/integrations/resend";
import { transformIdexxData } from "@odis-ai/integrations/idexx";

// Web app internal (use sparingly)
import { something } from "~/lib/something";
```

---

## Key Architectural Patterns

### Repository Pattern + Dependency Injection

Services accept repository interfaces for testability:

```typescript
// Interfaces in @odis-ai/data-access/repository-interfaces
interface ICasesRepository {
  findById(id: string): Promise<Case | null>;
  create(data: CreateCaseInput): Promise<Case>;
}

// Concrete implementations in @odis-ai/data-access/repository-impl
class CasesRepository implements ICasesRepository { ... }

// Services accept interfaces (DI)
class CasesService {
  constructor(
    private casesRepo: ICasesRepository,
    private callRepo: ICallRepository
  ) {}
}
```

### Supabase Client Pattern

```typescript
// Standard client (RLS-enabled, uses cookies)
import {
  createServerClient,
  createBrowserClient,
} from "@odis-ai/data-access/db";

// Service client (bypasses RLS - admin/webhook paths ONLY)
import { createServiceClient } from "@odis-ai/data-access/db";
```

### tRPC Router Structure

Routers split into modular directories:

```
apps/web/src/server/api/routers/
  dashboard/
    index.ts        # Router export
    stats.ts        # Stats procedures
    listings.ts     # List procedures
    activity.ts     # Activity feed
    ...
  cases/
    index.ts
    schemas.ts      # Zod schemas
    batch-operations.ts
    ...
  outbound/
    router.ts
    schemas.ts
    procedures/     # Individual procedures
      approve.ts
      schedule-remaining.ts
      ...
  inbound/
    index.ts
    procedures/     # Inbound call handling
      ...
  admin/
    index.ts        # Admin-only procedures
```

### Server Actions vs API Routes

- **Server Actions** (`apps/web/src/server/actions/`): Internal flows, form handling
- **API Routes** (`apps/web/src/app/api/`): Webhooks, external integrations only

### React Patterns

```typescript
// Use refs for polling stability
const dataRef = useRef(items);
useEffect(() => {
  dataRef.current = items;
}, [items]);
const hasActive = useCallback(() => dataRef.current.some((x) => x.active), []);

// Default to Server Components, minimize "use client"
// Wrap client components in Suspense with fallback
```

### Dashboard Component Organization

Dashboard components follow a consistent structure:

```
{feature}/
  hooks/          # React hooks (data fetching, mutations)
  utils/          # Utility functions (formatters, helpers)
  table/          # Table components and subcomponents
  detail/         # Detail view components
    utils/        # Only if 5+ detail-specific shared utilities
  views/          # Top-level view components
  types.ts        # TypeScript types (UI state, filters)
  mock-data.ts    # Mock data for development/testing
  index.ts        # Public API exports
  {feature}-client.tsx
```

**Organization Rules**:

1. **Hooks**: Always colocate in `{feature}/hooks/`, never in routing layer
2. **Utils**: Start at feature root; nest only when subfolder needs 5+ shared utils
3. **Types**: Feature-specific types stay local; domain types go to `@odis-ai/shared/types`
4. **Mock Data**: Use `mock-data.ts` naming (not "demo-data")
5. **Index Files**: Every directory with 2+ exports needs index.ts with explicit exports

---

## Security Considerations

### Critical Warnings

1. **Service Client**: `createServiceClient()` bypasses Row Level Security - use ONLY in:
   - Webhook handlers (VAPI, QStash)
   - Admin-only server actions
   - Background jobs

2. **Environment Variables**:
   - `NEXT_PUBLIC_*` variables are exposed to the browser - NEVER store secrets
   - Keep secrets in server-only variables

3. **Webhook Verification**: Always verify signatures:
   - VAPI: `VAPI_WEBHOOK_SECRET`
   - QStash: Built-in verification middleware

4. **Authentication**:
   - Supabase Auth for user sessions
   - tRPC protected procedures enforce auth automatically
   - Server Actions must check session explicitly

---

## Testing

**Framework**: Vitest + Testing Library
**Coverage Target**: 70% lines/functions/branches

### Commands

```bash
nx test <project>              # Run project tests
nx test <project> -t "name"    # Run specific test
nx test <project> --coverage   # With coverage
pnpm test:all                  # All projects
pnpm test:coverage             # Full coverage report
```

### Test Organization

Tests are colocated in `__tests__/` directories:

```
libs/shared/validators/src/
  __tests__/
    discharge.test.ts
    schedule.test.ts
    ...
  discharge.ts
  schedule.ts
```

### Mock Patterns

```typescript
// Supabase mock
import { createMockSupabaseClient } from "@odis-ai/shared/testing";

// VAPI mock
vi.mock("@vapi-ai/server-sdk", () => ({
  VapiClient: vi.fn(() => ({
    calls: { create: vi.fn(), get: vi.fn() },
  })),
}));

// QStash mock
vi.mock("@upstash/qstash", () => ({
  Client: vi.fn(() => ({ publishJSON: vi.fn() })),
}));
```

---

## Key File Locations

| Purpose                | Location                                      |
| ---------------------- | --------------------------------------------- |
| API Routes             | `apps/web/src/app/api/`                       |
| tRPC Routers           | `apps/web/src/server/api/routers/`            |
| Server Actions         | `apps/web/src/server/actions/`                |
| VAPI Webhooks (routes) | `apps/web/src/app/api/webhooks/vapi/`         |
| VAPI Library           | `libs/integrations/vapi/src/`                 |
| Dashboard Pages        | `apps/web/src/app/dashboard/`                 |
| UI Components          | `libs/shared/ui/src/`                         |
| Domain Services        | `libs/domain/*/`                              |
| Repository Interfaces  | `libs/data-access/repository-interfaces/src/` |
| Zod Validators         | `libs/shared/validators/src/`                 |
| Test Utilities         | `libs/shared/testing/src/`                    |

---

## Agent Behaviors

### Before Completing Work

1. Run affected checks: `nx affected -t lint,test`
2. Verify no circular dependencies: `nx graph`
3. Check TypeScript: `pnpm typecheck:all`

### When Adding Projects

1. Use appropriate Nx tags: `type:*`, `scope:*`, `platform:*`
2. Add to `tsconfig.base.json` paths
3. Regenerate docs: `pnpm docs:nx`

### When Exploring

- Use `nx_workspace` MCP tool for overview
- Use `nx_project_details <project>` for specific project
- Reference `docs/reference/NX_PROJECTS.md` for generated inventory

### Preferences

- Prefer editing existing files over creating new ones
- Use repository interfaces for new services
- Default to Server Components
- Split large files (>500 lines) into modules

---

## Documentation Links

| Document          | Path                                     |
| ----------------- | ---------------------------------------- |
| Nx Inventory      | `docs/reference/NX_PROJECTS.md`          |
| Testing Strategy  | `docs/testing/TESTING_STRATEGY.md`       |
| Core Libraries    | `docs/architecture/CORE_LIBS.md`         |
| Nx Best Practices | `docs/architecture/NX_BEST_PRACTICES.md` |
| API Reference     | `docs/api/API_REFERENCE.md`              |

---

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->
