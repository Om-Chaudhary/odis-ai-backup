# Core Libraries (Nx)

Inventory of priority shared libraries in the Nx workspace. Use this as a quick map for ownership, entry points, and dependencies.

## @odis-ai/api (`libs/api`)

- Purpose: API helpers for web/server actions (auth headers, CORS, error and response helpers).
- Entry points: `libs/api/src/auth.ts`, `libs/api/src/cors.ts`, `libs/api/src/response.ts`, `libs/api/src/errors.ts`.
- Consumers: `apps/web` server actions, API routes, and tRPC handlers.
- Notes: Keep shared HTTP helpers here; avoid duplicating response formatting inside apps.

## @odis-ai/db (`libs/db`)

- Purpose: Supabase clients, repository interfaces, and repository implementations for calls, emails, users, and cases.
- Entry points: `createBrowserClient`, `createServerClient`, `createServiceClient`, middleware helper (`libs/db/src/middleware.ts`).
- Repository interfaces: `interfaces/*` (ICasesRepository, IUserRepository, ICallRepository, IEmailRepository) for dependency injection and testing.
- Repository implementations: `repositories/*` (call, email, user, base, types).
- Database entities: `lib/entities/*` (scribe-transactions).
- Consumers: `apps/web` server actions, API routes, `libs/services-*`, `libs/vapi`.
- Notes: Use service client only for admin/webhook paths; default to RLS client elsewhere. Repository interfaces enable testable service layer with DI.

## @odis-ai/vapi (`libs/vapi`)

- Purpose: VAPI call orchestration, knowledge base, prompts, webhooks, and tooling.
- Entry points: `client.ts`, `call-manager.ts`, `warm-transfer.ts`, `validators.ts`, `extract-variables.ts`, `webhooks/` handlers, `tools/`.
- Knowledge base: `knowledge-base/*` by specialty; prompts in `prompts/`.
- Consumers: `apps/web` VAPI API routes/webhooks, `libs/services`, dashboard call flows.
- Notes: Dynamic variable injection happens in `extract-variables.ts`; keep prompts/KB consistent with variable names.

## @odis-ai/idexx (`libs/idexx`)

- Purpose: IDEXX Neo integration (credential management, validation, variable transforms).
- Entry points: `credential-manager.ts`, `transformer.ts`, `validation.ts`, `types.ts`.
- Consumers: `libs/vapi` variable extraction, `apps/web` onboarding/IDEXX flows.
- Notes: Keep data-shape changes here; avoid coupling IDEXX specifics inside app components.

## @odis-ai/logger (`libs/logger`)

- Purpose: Structured logging with namespacing and JSON-friendly output.
- Entry points: `createLogger` (namespace-scoped), `Logger` class, types.
- Consumers: Webhooks, services, repositories, background tasks.
- Notes: Use namespaces per domain (e.g., `vapi-webhook`, `db-repo`, `qstash-runner`) and include contextual fields for searchability.

## @odis-ai/services-cases (`libs/services-cases`)

- Purpose: Case management service layer with dependency injection support.
- Entry points: `cases-service.ts` (main service), `interfaces.ts` (DI interfaces).
- Consumers: `apps/web` API routes, tRPC routers.
- Notes: Accepts repository interfaces for testability; use factory pattern for instantiation.

## @odis-ai/services-discharge (`libs/services-discharge`)

- Purpose: Discharge workflow orchestration including batch processing and staggered scheduling.
- Entry points: `discharge-orchestrator.ts`, `discharge-batch-processor.ts`.
- Tests: Comprehensive staggered batch scheduling tests in `__tests__/`.
- Consumers: `apps/web` discharge flow endpoints.
- Notes: Handles multi-step discharge workflows with error recovery.

## @odis-ai/services-shared (`libs/services-shared`)

- Purpose: Shared service utilities and execution plan logic used across domain services.
- Entry points: `execution-plan.ts`.
- Consumers: `libs/services-cases`, `libs/services-discharge`.
- Notes: Cross-cutting service concerns; keep domain-agnostic.

## @odis-ai/types (`libs/types`)

- Purpose: Shared TypeScript types and interfaces used across the monorepo.
- Entry points: `dashboard.ts`, `case.ts`, `services.ts`, `patient.ts`, `orchestration.ts`, `database.types.ts`, `supabase.ts`.
- Consumers: All apps and libs.
- Notes: Consolidates types previously scattered in web app; single source of truth for domain types.

## @odis-ai/utils (`libs/utils`)

- Purpose: Shared utility functions for transformations, formatting, and business logic.
- Entry points: `case-transforms.ts` (case data transformations), `business-hours.ts` (scheduling logic), `phone-formatting.ts`, `date-ranges.ts`, `discharge-readiness.ts`.
- Consumers: `apps/web`, `libs/services-*`, `libs/vapi`.
- Notes: Pure functions with no side effects; thoroughly testable.

## @odis-ai/validators (`libs/validators`)

- Purpose: Zod validation schemas for API requests, webhooks, and data integrity.
- Entry points: `discharge.ts`, `discharge-summary.ts`, `assessment-questions.ts`, `orchestration.ts`, `schedule.ts`, `scribe.ts`.
- Test coverage: 236+ tests across 6 test files with comprehensive validation coverage.
- Consumers: API routes, server actions, webhook handlers.
- Notes: See `TEST_COVERAGE.md` for detailed test documentation; all validators have 95%+ coverage.

## Related supporting libs

- `libs/qstash` – QStash scheduling helpers with IScheduler interface for delayed execution.
- `libs/resend` – Email client with IEmailClient interface for testability.
- `libs/constants` – Shared constants and configuration values.

## Documentation flow

- Update this file when adding/modifying core libraries.
- Reflect new projects in `docs/reference/NX_PROJECTS.md` via `pnpm docs:nx`.
- Mirror naming to Nx tags: type, scope, and platform.
