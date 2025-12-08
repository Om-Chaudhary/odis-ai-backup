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
- CMS: Sanity
- Analytics: PostHog
- AI/Voice: VAPI

### Nx Layout

```text
apps/
  web/                   # Next.js app
libs/
  api/                   # API helpers (auth, cors, responses)
  api-client/            # API client utilities
  constants/             # Shared constants
  clinics/               # Clinic configuration helpers
  crypto/                # AES helpers
  db/                    # Supabase clients + repositories
  email/                 # Email rendering
  idexx/                 # IDEXX transformations & validation
  logger/                # Structured logging
  qstash/                # QStash scheduling helpers
  resend/                # Resend client
  services/              # Domain orchestrators
  types/                 # Shared types
  ui/                    # Shared UI primitives
  utils/                 # Shared utilities
  validators/            # Zod schemas
  vapi/                  # VAPI integration (knowledge base, webhooks, tools)
```

Tags to use in new projects: `type:*`, `scope:*`, `platform:*`.

## Key Architectural Patterns

### Dual API Surface

- tRPC: `apps/web/src/server/api/*` for type-safe RPC, auth via protected procedures.
- Server Actions: `apps/web/src/server/actions/*` for form-like flows and Supabase reads/writes.
- API Routes: reserved for webhooks/external integrations.

### Supabase Client Pattern

- Standard client (RLS): from `libs/db` via `createServerClient` / `createBrowserClient`.
- Service client (bypasses RLS): `createServiceClient` for admin/webhook paths only.

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

- Core library: `libs/vapi` (client, validators, knowledge base, call manager, webhooks, tools).
- IDEXX transform: `libs/idexx` (credential manager, transformer, validation).
- Scheduling: `libs/qstash` for delayed execution.
- API routes/webhooks: `apps/web/src/app/api/webhooks/vapi`, `apps/web/src/app/api/calls/*`.
- UI surface: dashboard call management in `apps/web/src/app/dashboard/calls` and related components.
- Dynamic variables: pass via `assistantOverrides.variableValues`; see `libs/vapi/extract-variables.ts`.

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
