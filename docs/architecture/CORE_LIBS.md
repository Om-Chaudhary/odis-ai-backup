# Core Libraries (Nx)

Inventory of priority shared libraries in the Nx workspace. Use this as a quick map for ownership, entry points, and dependencies.

## @odis/api (`libs/api`)

- Purpose: API helpers for web/server actions (auth headers, CORS, error and response helpers).
- Entry points: `libs/api/src/auth.ts`, `libs/api/src/cors.ts`, `libs/api/src/response.ts`, `libs/api/src/errors.ts`.
- Consumers: `apps/web` server actions, API routes, and tRPC handlers.
- Notes: Keep shared HTTP helpers here; avoid duplicating response formatting inside apps.

## @odis/db (`libs/db`)

- Purpose: Supabase clients and repository layer for calls, emails, and users.
- Entry points: `createBrowserClient`, `createServerClient`, `createServiceClient`, middleware helper (`libs/db/src/middleware.ts`).
- Repositories: `repositories/*` (call, email, user, base, types).
- Consumers: `apps/web` server actions, API routes, `libs/services`, `libs/vapi`.
- Notes: Use service client only for admin/webhook paths; default to RLS client elsewhere.

## @odis/vapi (`libs/vapi`)

- Purpose: VAPI call orchestration, knowledge base, prompts, webhooks, and tooling.
- Entry points: `client.ts`, `call-manager.ts`, `warm-transfer.ts`, `validators.ts`, `extract-variables.ts`, `webhooks/` handlers, `tools/`.
- Knowledge base: `knowledge-base/*` by specialty; prompts in `prompts/`.
- Consumers: `apps/web` VAPI API routes/webhooks, `libs/services`, dashboard call flows.
- Notes: Dynamic variable injection happens in `extract-variables.ts`; keep prompts/KB consistent with variable names.

## @odis/idexx (`libs/idexx`)

- Purpose: IDEXX Neo integration (credential management, validation, variable transforms).
- Entry points: `credential-manager.ts`, `transformer.ts`, `validation.ts`, `types.ts`.
- Consumers: `libs/vapi` variable extraction, `apps/web` onboarding/IDEXX flows.
- Notes: Keep data-shape changes here; avoid coupling IDEXX specifics inside app components.

## @odis/logger (`libs/logger`)

- Purpose: Structured logging with namespacing and JSON-friendly output.
- Entry points: `createLogger` (namespace-scoped), `Logger` class, types.
- Consumers: Webhooks, services, repositories, background tasks.
- Notes: Use namespaces per domain (e.g., `vapi-webhook`, `db-repo`, `qstash-runner`) and include contextual fields for searchability.

## Related supporting libs

- `libs/services` – Domain orchestrators for discharge and execution flows.
- `libs/qstash` – QStash scheduling helpers for delayed execution.
- `libs/utils` / `libs/validators` / `libs/constants` – Shared helpers and schema definitions.

## Documentation flow

- Update this file when adding/modifying core libraries.
- Reflect new projects in `docs/reference/NX_PROJECTS.md` via `pnpm docs:nx`.
- Mirror naming to Nx tags: type, scope, and platform.
