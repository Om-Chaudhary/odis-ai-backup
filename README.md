# ODIS AI Web (Nx Monorepo)

Next.js 15 workspace for ODIS AI, organized as an Nx monorepo with one app (`apps/web`) and shared libraries for API utilities, database access, VAPI voice automation, IDEXX transformations, logging, and UI.

## Quick links

- Docs index: `docs/README.md`
- Nx project inventory (generated): `docs/reference/NX_PROJECTS.md` (`pnpm docs:nx`)
- Core library responsibilities: `docs/architecture/CORE_LIBS.md`
- Cursor rules: `.cursorrules`
- Testing strategy: `docs/testing/TESTING_STRATEGY.md`

## Workspace overview

### Apps

- `apps/web` – Next.js App Router, Supabase auth, tRPC + Server Actions, Sanity CMS, PostHog analytics.

### Libraries (selected)

- `libs/api` – API helpers (auth, CORS, responses, errors)
- `libs/db` – Supabase clients (RLS + service) and repository layer
- `libs/vapi` – VAPI integration: call manager, knowledge base, prompts, webhook handlers, tools
- `libs/idexx` – IDEXX Neo transforms, validation, credential management
- `libs/logger` – Structured logging utility
- `libs/services` – Domain orchestrators (discharge, execution plans)
- `libs/types` – Shared types for cases, patients, orchestration, Supabase
- `libs/ui` – Shared UI primitives
- `libs/utils` / `libs/validators` / `libs/constants` / `libs/clinics` – Common helpers and configuration
- Supporting libs: `api-client`, `crypto`, `qstash`, `resend`, `email`

### Nx conventions

- Projects tagged with `type:*`, `scope:*`, `platform:*` in `project.json`.
- Generated inventory lives in `docs/reference/NX_PROJECTS.md`; regenerate with `pnpm docs:nx`.

## Getting started

```bash
pnpm install
pnpm dev            # starts apps/web
```

### Common commands

- Build app: `pnpm build`
- Lint: `pnpm lint` (app) or `pnpm lint:all`
- Tests: `pnpm test` (app) or `pnpm test:all`
- Typecheck: `pnpm typecheck` (app) or `pnpm typecheck:all`
- Format: `pnpm format:check` / `pnpm format:write`
- Regenerate Nx docs: `pnpm docs:nx`

### Multi-project workflows (CI-friendly)

- Build everything: `pnpm build:all`
- Lint + typecheck everything: `pnpm check`
- Run selected targets: `pnpm nx run-many -t <target> -p <projects>`

## Architecture highlights

- **Dual API surface**: tRPC for type-safe RPC (`apps/web/src/server/api`), Server Actions for form-like flows (`apps/web/src/server/actions`), API Routes reserved for external webhooks.
- **Supabase clients**: RLS-respecting and service (admin) clients exported from `libs/db`.
- **VAPI voice automation**: call scheduling/execution via `libs/vapi` and `libs/qstash`, webhook handling under `apps/web/src/app/api/webhooks/vapi`, dynamic variable extraction in `libs/vapi/extract-variables.ts`.
- **IDEXX data**: transformation and validation in `libs/idexx`; credential management in `libs/idexx/credential-manager.ts`.
- **Logging**: structured logging via `libs/logger` (namespaced, JSON-friendly output).
- **CMS**: Sanity Studio under `apps/web/src/app/studio`; content fetched server-side.

## Product highlights

- AI SOAP note generation with template management (tRPC + Server Actions)
- VAPI-powered follow-up and discharge calls with retries and transcripts
- Dashboard for clinicians with adaptive polling and PostHog analytics
- Sanity-powered marketing/blog content

## Documentation & autodoc

- Follow placement rules in `docs/README.md`; update section READMEs when adding content.
- Generated Nx inventory: `docs/reference/NX_PROJECTS.md` and `docs/reference/nx-projects.json` (run `pnpm docs:nx`). Do not hand-edit generated files.
- Core library map: `docs/architecture/CORE_LIBS.md`.

## Conventions

- Prefer Server Actions over API Routes unless integrating with external systems.
- Default to Server Components; mark `"use client"` only where browser APIs/state are required.
- Use refs for polling/interval hooks to avoid unstable dependencies.
- `NEXT_PUBLIC_*` env vars are public—keep secrets server-only.

## Environment

Set values from `.env.example` (Supabase, Sanity, PostHog, VAPI, QStash, site URL). Use environment-specific files as needed.
