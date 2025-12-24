# CLAUDE.md

Guidance for Claude/Cursor when working in the ODIS AI Nx monorepo.

## Development Commands

```bash
# App targets
pnpm dev                 # nx dev web
pnpm build               # nx build web
pnpm start               # nx start web
pnpm preview             # build then start web

# Multi-project
pnpm build:all           # nx run-many -t build
pnpm lint:all            # nx run-many -t lint
pnpm test:all            # nx run-many -t test
pnpm typecheck:all       # nx run-many -t typecheck
pnpm check               # lint + typecheck

# Formatting
pnpm format:check
pnpm format:write

# Supabase types
pnpm update-types        # requires PROJECT_REF

# Nx inventories
pnpm docs:nx             # regenerate docs/reference/NX_PROJECTS.md
```

## Workspace Overview

- Framework: Next.js 15 (App Router, RSC by default)
- Language: TypeScript (strict)
- Styling: Tailwind CSS 4 + shadcn/ui (Radix)
- Data: Supabase (PostgreSQL)
- API: tRPC + Server Actions
- Analytics: PostHog
- AI/Voice: VAPI

### Nx Layout (Domain-Grouped Architecture)

```text
apps/
  web/                       # Next.js app (dashboard, API routes, server actions)

libs/
  # Shared Infrastructure (cross-cutting concerns)
  shared/
    types/                   # Shared TypeScript types (Database, Dashboard, Case, Patient, etc.)
    validators/              # Zod validation schemas (229 tests, 95%+ coverage)
    util/                    # Shared utilities (case-transforms, business-hours, phone, date)
    constants/               # Shared constants & configuration
    ui/                      # Shared React components (shadcn/ui, 59 components)
    hooks/                   # Shared React hooks
    styles/                  # Global styles & Tailwind config
    logger/                  # Structured logging with namespaces
    crypto/                  # AES encryption helpers
    testing/                 # Test utilities, mocks, fixtures, setup
    env/                     # Environment variable validation
    email/                   # Email template rendering (React Email)

  # Data Access Layer (persistence & repositories)
  data-access/
    db/                      # Main database library (re-exports below)
    supabase-client/         # Supabase client initialization (browser, server, service, proxy)
    repository-interfaces/   # Repository contracts (ICasesRepository, ICallRepository, etc.)
    repository-impl/         # Concrete Supabase implementations
    entities/                # Domain entity helpers (scribe transactions)
    api/                     # API helpers (auth, cors, responses, errors)

  # External Integrations
  integrations/
    vapi/                    # Main VAPI library (re-exports below)
      client/                # VAPI SDK wrapper, variables, validators, knowledge base
      webhooks/              # Webhook infrastructure & dispatcher
      handlers/              # Event handlers (end-of-call, status-update, etc.)
      tools/                 # Tool system (registry, executor, built-ins)
      inbound/               # Inbound call → User mapping
    idexx/                   # IDEXX Neo transformations & validation
    qstash/                  # QStash scheduling + IScheduler interface
    resend/                  # Resend email client + IEmailClient interface
    slack/                   # Slack integration
    ai/                      # AI/LLM utilities
    retell/                  # Legacy Retell integration (deprecated)

  # Domain (business logic & features)
  domain/
    cases/
      data-access/           # CasesService (case management, ingestion, scheduling)
    discharge/
      data-access/           # DischargeOrchestrator, batch processor, call/email executors
    shared/
      util/                  # Shared service utilities (ExecutionPlan, interfaces)
    clinics/
      util/                  # Clinic configuration & VAPI config helpers
    auth/
      util/                  # Authentication utilities

  # Extension (Chrome extension libraries)
  extension/
    shared/                  # Shared extension utilities
    storage/                 # Extension storage abstractions
    env/                     # Extension environment config
```

**Tags**: Use `type:*`, `scope:*`, `platform:*` in new projects.

**New Projects (since migration)**:

- `services-cases`, `services-discharge`, `services-shared` (scope: domain/shared)
- Repository interfaces in `libs/db/interfaces/`
- External API interfaces (IScheduler, ICallClient, IEmailClient)

## Key Architectural Patterns

### Dual API Surface

- **tRPC**: `apps/web/src/server/api/routers/*` for type-safe RPC, auth via protected procedures.
  - Routers split into modular directories:
    - `dashboard/` - 6 files (was 2,029 lines monolith)
    - `cases/` - 6 files (was 2,003 lines monolith)
- **Server Actions**: `apps/web/src/server/actions/*` for form-like flows and Supabase reads/writes.
- **API Routes**: Reserved for webhooks/external integrations (`apps/web/src/app/api/*`).

### Supabase Client Pattern & Repositories

- **Standard client (RLS)**: from `libs/db` via `createServerClient` / `createBrowserClient`.
- **Service client (bypasses RLS)**: `createServiceClient` for admin/webhook paths only.
- **Repository Pattern**: Use repository interfaces for testability:
  - `ICasesRepository`, `IUserRepository`, `ICallRepository`, `IEmailRepository` from `@odis-ai/db/interfaces`
  - Concrete implementations in `@odis-ai/db/repositories`
  - Enables dependency injection and mocking in tests

### Service Layer Pattern

Services split into focused libraries with dependency injection:

```typescript
// Import from focused service libraries
import { CasesService } from "@odis-ai/services-cases";
import { DischargeOrchestrator } from "@odis-ai/services-discharge";
import { ExecutionPlan } from "@odis-ai/services-shared";

// Services accept repository interfaces for testing
const service = new CasesService(casesRepo, userRepo, callRepo);
```

### React Hook Pattern for Polling

Use refs to keep interval callbacks stable:

```typescript
const dataRef = useRef(items);
useEffect(() => {
  dataRef.current = items;
}, [items]);

const hasActive = useCallback(() => dataRef.current.some((x) => x.active), []);
```

### VAPI Integration

- **Core library**: `libs/vapi` (client, validators, knowledge base, call manager, webhooks, tools).
  - `ICallClient` interface for testing
  - Knowledge bases by medical specialty
  - Webhook handlers + tool registry
- **IDEXX transform**: `libs/idexx` (credential manager, transformer, validation).
- **Scheduling**: `libs/qstash` with `IScheduler` interface for delayed execution.
- **API routes/webhooks**: `apps/web/src/app/api/webhooks/vapi`, `apps/web/src/app/api/calls/*`.
- **UI surface**: dashboard call management in `apps/web/src/app/dashboard/calls` and related components.
- **Dynamic variables**: pass via `assistantOverrides.variableValues`; see `libs/vapi/extract-variables.ts`.

### Import Patterns (Domain-Grouped)

**Shared Libraries:**

```typescript
// Types
import type { DashboardCase, DashboardStats, Database } from "@odis-ai/shared/types";
import type { CaseData, PatientInfo } from "@odis-ai/shared/types";

// Validators (229 tests, 95%+ coverage)
import { dischargeSchema, scheduleSchema } from "@odis-ai/shared/validators";

// Utilities
import { transformBackendCaseToDashboardCase } from "@odis-ai/shared/util";
import { isWithinBusinessHours } from "@odis-ai/shared/util";
import { cn } from "@odis-ai/shared/util";

// UI Components
import { Button } from "@odis-ai/shared/ui";
import { Card } from "@odis-ai/shared/ui";

// Logging
import { loggers } from "@odis-ai/shared/logger";
```

**Data Access:**

```typescript
// Supabase clients
import { createServerClient, createServiceClient } from "@odis-ai/data-access/supabase-client";

// Repository interfaces (for DI/testing)
import type { ICasesRepository, ICallRepository } from "@odis-ai/data-access/repository-interfaces";

// Repository implementations
import { CasesRepository, CallRepository } from "@odis-ai/data-access/repository-impl";

// Or use convenience re-export
import { createServerClient, ICasesRepository, CasesRepository } from "@odis-ai/data-access/db";
```

**Integrations:**

```typescript
// VAPI - Client
import { createPhoneCall, validateVariables } from "@odis-ai/integrations/vapi/client";

// VAPI - Webhooks (for webhook routes)
import { handleWebhook } from "@odis-ai/integrations/vapi/webhooks";

// Other integrations
import { scheduleCallExecution } from "@odis-ai/integrations/qstash";
import { sendEmail } from "@odis-ai/integrations/resend";
import { transformIdexxData } from "@odis-ai/integrations/idexx";
```

**Domain:**

```typescript
// Cases domain
import { CasesService } from "@odis-ai/domain/cases";

// Discharge domain
import { DischargeOrchestrator } from "@odis-ai/domain/discharge";
import { ExecutionPlan } from "@odis-ai/domain/shared";

// Clinic configuration
import { getClinicByUserId } from "@odis-ai/domain/clinics";
```

**Extension:**

```typescript
// Chrome extension
import { useStorage } from "@odis-ai/extension/shared";
import { StorageArea } from "@odis-ai/extension/storage";
```

### Authentication & Authorization

- Supabase Auth; use server-side session checks in actions.
- tRPC protected procedures enforce auth automatically.

### Webhook Security

- Always verify signatures (e.g., VAPI/QStash secrets) inside API routes.

## Environment Variables

See `.env.example` for required values (Supabase, Sanity, PostHog, VAPI, QStash, site URL). `NEXT_PUBLIC_*` values are public; keep secrets in server-only vars.

## Code Style & Tooling

- TypeScript strict; prefer interfaces over types; avoid enums.
- Prettier + Tailwind plugin; ESLint with Nx defaults.
- Directory naming: lowercase-with-dashes; components: PascalCase.
- Husky + lint-staged run ESLint/Prettier on commit.

## Documentation

- Index: `docs/README.md` (Nx-aware placement rules).
- Generated inventory: `docs/reference/NX_PROJECTS.md` (`pnpm docs:nx`).
- Core library overview: `docs/architecture/CORE_LIBS.md`.
- Cursor quick rules: `.cursorrules`.

## Testing

- Strategy: `docs/testing/TESTING_STRATEGY.md`.
- Preferred: Vitest + Testing Library; mock Supabase; test Server Actions against a test instance when possible.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
