# Testing Conventions

## Framework

Vitest + Testing Library. Coverage target: 70% lines/functions/branches.

## Commands

- `nx test <project>` -- Run project tests
- `nx test <project> -t "name"` -- Run specific test by name
- `pnpm test:all` -- All projects
- `pnpm test:coverage` -- Full coverage report

## Organization

Tests colocated in `__tests__/` directories adjacent to source:

```
libs/shared/validators/src/__tests__/discharge.test.ts
libs/domain/discharge/data-access/src/__tests__/orchestrator.test.ts
```

## Mocks

- Supabase: `import { createMockSupabaseClient } from "@odis-ai/shared/testing"`
- VAPI: `vi.mock("@vapi-ai/server-sdk", () => ({ VapiClient: vi.fn(() => ({ calls: { create: vi.fn() } })) }))`
- QStash: `vi.mock("@upstash/qstash", () => ({ Client: vi.fn(() => ({ publishJSON: vi.fn() })) }))`

## Before Completing Work

1. Run `nx affected -t lint,test` for affected checks
2. Run `pnpm typecheck:all` for TypeScript verification
3. When adding Nx projects: add tags (`type:*`, `scope:*`, `platform:*`), update `tsconfig.base.json` paths, run `pnpm docs:nx`
