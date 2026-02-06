# Workspace Architecture

ODIS AI is a veterinary platform for automated discharge calls and case management.

**Stack**: Next.js 16 (App Router), React 19, TypeScript (strict), Supabase (PostgreSQL), tRPC, Tailwind CSS 4, shadcn/ui, Nx monorepo.

## Apps

- `apps/web/` -- Next.js dashboard, API routes, tRPC
- `apps/docs/` -- Docusaurus documentation
- `apps/pims-sync/` -- PIMS sync service (Express + Playwright)
- `apps/idexx-sync/` -- Legacy IDEXX Neo sync service
- `apps/mobile/` -- React Native / Expo mobile app
- `apps/chrome-extension/` -- Browser extension for IDEXX integration

## Libraries

- `libs/shared/` -- types, validators, util, ui (59+ shadcn components), hooks, logger, crypto, constants, env, styles, testing, email
- `libs/data-access/` -- db (Supabase clients), supabase-client, repository-interfaces, repository-impl, api, entities
- `libs/domain/` -- cases, discharge, shared, clinics, auth, sync, auto-scheduling
- `libs/integrations/` -- vapi, idexx, pims, qstash, resend, slack, ai, stripe, axiom
- `libs/extension/` -- Chrome extension shared code
- `libs/mobile/` -- Mobile UI components

## Key Locations

| Purpose | Location |
|---------|----------|
| API Routes | `apps/web/src/app/api/` |
| tRPC Routers | `apps/web/src/server/api/routers/` |
| Server Actions | `apps/web/src/server/actions/` |
| VAPI Webhooks | `apps/web/src/app/api/webhooks/vapi/` |
| Dashboard Pages | `apps/web/src/app/dashboard/` |
| Dashboard Components | `apps/web/src/components/dashboard/` |
| UI Components | `libs/shared/ui/src/` |
| Domain Services | `libs/domain/*/` |
| Repository Interfaces | `libs/data-access/repository-interfaces/src/` |
| Validators | `libs/shared/validators/src/` |
| Test Utilities | `libs/shared/testing/src/` |
| VAPI Library | `libs/integrations/vapi/src/` |
