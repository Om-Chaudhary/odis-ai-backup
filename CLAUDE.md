# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm build                  # Production build
pnpm check                  # lint + typecheck all
pnpm typecheck:all          # TypeScript verification only

# Testing
pnpm test:all               # Run all tests
nx test <project>           # Test specific project
nx test <project> -t "name" # Run single test by name

# Nx
nx affected -t lint,test    # Run on affected projects
nx graph                    # View dependency graph

# Database
pnpm update-types           # Regenerate types after Supabase schema changes

# UI Components
npx shadcn@latest add <component>  # Add shadcn component
```

## Workflow

- Use conventional commits with scopes: `(web)` `(cases)` `(clinics)` `(vapi)` `(outbound)` `(inbound)` `(dashboard)` `(ui)` `(util)` `(db)`
- After modifying Supabase schema, ALWAYS run `pnpm update-types` (generates `libs/shared/types/src/database.types.ts`)
- DO NOT create `middleware.ts` files. Auth uses proxy pattern at `apps/web/src/proxy.ts`. See @docs/architecture/AUTH_PROXY_PATTERN.md
- Use the `frontend-design` skill whenever doing anything UI related

## Code Standards

- All imports use `@odis-ai/` namespace (see `tsconfig.base.json` for paths)
- `createServerClient` (RLS-enabled) is the default Supabase client. `createServiceClient` (bypasses RLS) ONLY for webhooks, admin actions, background jobs.
- Default to Server Components. Minimize `"use client"` directives.
- Split files exceeding 500 lines into modules.
- Prefer editing existing files over creating new ones.
- Naming: lowercase-with-dashes for folders, PascalCase for components.
- Formatting: Prettier with Tailwind plugin (runs on commit).

## Architecture

- **Repository pattern**: Domain services accept interface contracts from `@odis-ai/data-access/repository-interfaces`. Concrete implementations in `@odis-ai/data-access/repository-impl`.
- **Server Actions** (`apps/web/src/server/actions/`): Internal form handling, simple mutations.
- **API Routes** (`apps/web/src/app/api/`): Webhooks, external integrations, cron jobs, VAPI endpoints.
- **tRPC Routers** (`apps/web/src/server/api/routers/`): Organized by domain. Each has `index.ts`, `schemas.ts`, optionally `procedures/`.
- Contextual rules for dashboard, VAPI, Sentry, and security are in `.claude/rules/`.

## Key Locations

| Purpose         | Location                           |
| --------------- | ---------------------------------- |
| API Routes      | `apps/web/src/app/api/`            |
| tRPC Routers    | `apps/web/src/server/api/routers/` |
| Server Actions  | `apps/web/src/server/actions/`     |
| UI Components   | `libs/shared/ui/src/`              |
| Domain Services | `libs/domain/*/`                   |
| Validators      | `libs/shared/validators/src/`      |
| VAPI Library    | `libs/integrations/vapi/src/`      |
| Scripts         | `scripts/`                         |

## Scripts

### Creating New Scripts

**Location**: ALL scripts go in `/scripts/{category}/`:

- `scripts/tooling/` - Build & dev utilities (generate-nx-docs, update-types, etc.)
- `scripts/backfill/` - Data backfill operations
- `scripts/sync/` - External service syncing (VAPI, etc.)

**Template**: Use the standard template at `scripts/_template.ts`

**Required Pattern**:

```typescript
import {
  loadScriptEnv,
  parseScriptArgs,
  createScriptSupabaseClient,
  scriptLog,
} from "@odis-ai/shared/script-utils";

loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });
```

**Standard CLI flags**:

- `--dry-run` - Show what would happen without making changes
- `--verbose` - Show detailed output
- `--limit=N` - Limit number of records processed
- `--days=N` - Filter by date range

### Running Scripts

```bash
# Run a script with tsx
pnpm tsx scripts/backfill/backfill-discharge-summaries.ts --dry-run

# Or use pnpm script if defined
pnpm backfill:inbound-outcomes --dry-run
```

### Script Guidelines

**DO**:

- Use `@odis-ai/shared/script-utils` for env loading and Supabase
- Use `@odis-ai/*` path aliases for all imports
- Include `--dry-run` support for destructive operations
- Log progress with `scriptLog.info/success/error/warn()`

**DON'T**:

- Create scripts in `/apps/*/src/scripts/` (exception: scripts needing web app internals)
- Use relative imports like `../libs/...`
- Manually parse `.env` files with `dotenv` directly
- Hardcode credentials or sensitive data in scripts

## Sentry Usage

See `.claude/rules/sentry.md` for guidance on exceptions, spans, and logs.

```typescript
import * as Sentry from "@sentry/nextjs";

// Exception capture
Sentry.captureException(error);

// Span instrumentation
Sentry.startSpan({ op: "http.client", name: "GET /api/users" }, async () => {
  // ... operation
});
```

## MCP Tools

```
nx_workspace              # Full workspace overview
nx_project_details <name> # Specific project config
nx_docs <query>           # Search Nx documentation
```

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
