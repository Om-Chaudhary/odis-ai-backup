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

### Nx Layout

```text
apps/
  web/                       # Next.js app (dashboard, API routes, server actions)

libs/
  # API & Client
  api/                       # API helpers (auth, cors, responses, errors)
  api-client/                # REST API client utilities
  auth/                      # Authentication utilities

  # Data & Persistence
  db/                        # Supabase clients + repository interfaces + implementations
    ├── interfaces/          # ICasesRepository, IUserRepository, ICallRepository, IEmailRepository
    ├── repositories/        # Concrete implementations
    └── lib/entities/        # scribe-transactions

  # Domain Services (split for testability & DI)
  services-cases/            # Case management service layer
  services-discharge/        # Discharge workflow orchestration + batch processing
  services-shared/           # Shared execution plan logic

  # External Integrations
  idexx/                     # IDEXX Neo transformations & validation
  vapi/                      # VAPI voice calls (client, call-manager, webhooks, tools, knowledge-base)
    ├── call-client.interface.ts  # ICallClient for testing
    ├── knowledge-base/      # Medical specialty knowledge bases
    ├── webhooks/            # Webhook handlers + tools
    └── prompts/             # VAPI system prompts

  qstash/                    # QStash scheduling + IScheduler interface
  resend/                    # Resend email client + IEmailClient interface
  retell/                    # Legacy Retell integration (deprecated)

  # Shared Infrastructure
  types/                     # Shared TypeScript types (dashboard, case, services, patient, orchestration)
  validators/                # Zod validation schemas (236+ tests, 95%+ coverage)
  utils/                     # Shared utilities (case-transforms, business-hours, phone, date helpers)
  constants/                 # Shared constants & configuration
  logger/                    # Structured logging with namespaces

  # UI & Styling
  ui/                        # Shared React components (shadcn/ui)
  styles/                    # Global styles & Tailwind config
  hooks/                     # Shared React hooks

  # Dev & Testing
  testing/                   # Test utilities, mocks, fixtures, setup
  env/                       # Environment variable validation

  # Supporting Libraries
  clinics/                   # Clinic configuration helpers
  crypto/                    # AES encryption helpers
  email/                     # Email template rendering (React Email)
  ai/                        # AI/LLM utilities
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

### Import Patterns

**Shared Libraries:**

```typescript
// Types (consolidated from web app)
import type { DashboardCase, DashboardStats } from "@odis-ai/types";
import type { CaseData, PatientInfo } from "@odis-ai/types";

// Validators (236+ tests, 95%+ coverage)
import { dischargeSchema, scheduleSchema } from "@odis-ai/validators";

// Utilities (moved from web app)
import { transformBackendCaseToDashboardCase } from "@odis-ai/utils";
import { isWithinBusinessHours } from "@odis-ai/utils";

// Database interfaces & repositories
import type { ICasesRepository } from "@odis-ai/db/interfaces";
import { CasesRepository } from "@odis-ai/db/repositories";

// Services (split into focused libs)
import { CasesService } from "@odis-ai/services-cases";
import { DischargeOrchestrator } from "@odis-ai/services-discharge";
import { ExecutionPlan } from "@odis-ai/services-shared";

// External integrations
import { createPhoneCall } from "@odis-ai/vapi";
import { scheduleMessage } from "@odis-ai/qstash";
import { sendEmail } from "@odis-ai/resend";
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
