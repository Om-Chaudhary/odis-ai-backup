# ODIS AI (Nx Monorepo)

Next.js 16 workspace for ODIS AI, organized as an Nx monorepo with applications for web dashboard, documentation, and IDEXX sync service, plus shared libraries for API utilities, database access, VAPI voice automation, IDEXX transformations, logging, and UI.

**Tech Stack**: Next.js 16 (App Router) · React 19 · TypeScript (strict) · Supabase (PostgreSQL) · tRPC · Tailwind CSS 4 · shadcn/ui · Nx monorepo

## Quick links

- AI Assistant Guide: `AGENTS.md` (start here for coding assistants)
- Docs index: `docs/README.md`
- Nx project inventory (generated): `docs/reference/NX_PROJECTS.md` (`pnpm docs:nx`)
- Core library responsibilities: `docs/architecture/CORE_LIBS.md`
- Testing strategy: `docs/testing/TESTING_STRATEGY.md`

## Workspace overview

### Apps

| App | Description |
|-----|-------------|
| `apps/web` | Next.js 16 App Router, Supabase auth, tRPC + Server Actions, PostHog analytics |
| `apps/docs` | Docusaurus documentation site |
| `apps/idexx-sync` | Headless IDEXX Neo sync service (Express + Playwright) |

### Libraries (Domain-Grouped)

```
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
    entities/               # Domain entities

  domain/                   # Business logic
    cases/data-access/      # CasesService (case management, ingestion)
    discharge/data-access/  # DischargeOrchestrator, batch processor
    shared/util/            # ExecutionPlan, shared service utilities
    clinics/util/           # Clinic config, VAPI config helpers
    auth/util/              # Authentication utilities

  integrations/             # External services
    vapi/                   # VAPI voice AI (client, webhooks, tools)
    idexx/                  # IDEXX Neo transforms, credentials
    qstash/                 # QStash scheduling (IScheduler)
    resend/                 # Email sending (IEmailClient)
    slack/                  # Slack notifications
    ai/                     # LlamaIndex/Anthropic utilities
```

### Nx conventions

- Projects tagged with `type:*`, `scope:*`, `platform:*` in `project.json`.
- Generated inventory lives in `docs/reference/NX_PROJECTS.md`; regenerate with `pnpm docs:nx`.

## Getting started

```bash
pnpm install
pnpm dev            # starts apps/web
```

### Common commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Lint app |
| `pnpm lint:all` | Lint all projects |
| `pnpm test` | Test app |
| `pnpm test:all` | Test all projects |
| `pnpm typecheck` | TypeScript check app |
| `pnpm typecheck:all` | TypeScript check all projects |
| `pnpm check` | Lint + typecheck all projects |
| `pnpm format:check` | Check formatting |
| `pnpm format:write` | Fix formatting |
| `pnpm docs:nx` | Regenerate Nx docs |

### Multi-project workflows (CI-friendly)

- Build everything: `pnpm build:all`
- Lint + typecheck everything: `pnpm check`
- Run selected targets: `pnpm nx run-many -t <target> -p <projects>`

## Architecture highlights

- **Dual API surface**: tRPC for type-safe RPC (`apps/web/src/server/api`), Server Actions for form-like flows (`apps/web/src/server/actions`), API Routes reserved for external webhooks.
- **Supabase clients**: RLS-respecting and service (admin) clients exported from `@odis-ai/data-access/db`.
- **VAPI voice automation**: call scheduling/execution via `@odis-ai/integrations/vapi` and `@odis-ai/integrations/qstash`, webhook handling under `apps/web/src/app/api/webhooks/vapi`.
- **IDEXX data**: transformation and validation in `@odis-ai/integrations/idexx`.
- **Logging**: structured logging via `@odis-ai/shared/logger` (namespaced, JSON-friendly output).

## Product highlights

- AI-powered veterinary case management and discharge workflows
- VAPI-powered follow-up and discharge calls with retries and transcripts
- Inbound call handling with appointment scheduling and message taking
- Dashboard for clinicians with real-time polling and analytics
- IDEXX Neo integration via headless sync service

## Documentation & autodoc

- Follow placement rules in `docs/README.md`; update section READMEs when adding content.
- Generated Nx inventory: `docs/reference/NX_PROJECTS.md` (run `pnpm docs:nx`). Do not hand-edit generated files.
- Core library map: `docs/architecture/CORE_LIBS.md`.

## Conventions

- Prefer Server Actions over API Routes unless integrating with external systems.
- Default to Server Components; mark `"use client"` only where browser APIs/state are required.
- Use refs for polling/interval hooks to avoid unstable dependencies.
- `NEXT_PUBLIC_*` env vars are public—keep secrets server-only.

## Import conventions

All imports use the `@odis-ai/` namespace with domain-grouped paths:

```typescript
// Shared
import type { DashboardCase, Database } from "@odis-ai/shared/types";
import { dischargeSchema } from "@odis-ai/shared/validators";
import { Button, Card } from "@odis-ai/shared/ui";

// Data Access
import { createServerClient, createServiceClient } from "@odis-ai/data-access/db";
import type { ICasesRepository } from "@odis-ai/data-access/repository-interfaces";

// Domain
import { CasesService } from "@odis-ai/domain/cases";
import { DischargeOrchestrator } from "@odis-ai/domain/discharge";

// Integrations
import { createPhoneCall } from "@odis-ai/integrations/vapi";
import { scheduleCallExecution } from "@odis-ai/integrations/qstash";
```

## Environment

Set values from `.env.example` (Supabase, PostHog, VAPI, QStash, site URL). Use environment-specific files as needed.
