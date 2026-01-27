# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Quick Reference

```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm build                  # Production build
pnpm check                  # lint + typecheck all

# Testing
pnpm test:all               # Run all tests
nx test <project>           # Test specific project
nx test <project> -t "name" # Run single test by name

# Nx
nx affected -t lint,test    # Run on affected projects
nx graph                    # View dependency graph
pnpm docs:nx                # Regenerate Nx inventory
```

## Development Workflow

**Never use `git commit` or `git add`** — GitButler handles all commits automatically.

Use conventional commits with these scopes:
- `(web)` `(extension)` `(cases)` `(clinics)` `(vapi)` `(outbound)` `(inbound)` `(dashboard)` `(ui)` `(util)` `(db)`

## Database Schema Changes

**After modifying Supabase schema, ALWAYS run:**

```bash
pnpm update-types
```

This regenerates TypeScript types to `libs/shared/types/src/database.types.ts`.

## Critical Patterns

### Auth Proxy (NOT Middleware)

**DO NOT create `middleware.ts` files!**

```
apps/web/src/proxy.ts      ← USE THIS (Clerk + Supabase hybrid auth)
apps/web/src/middleware.ts ← NEVER CREATE
```

See: `docs/architecture/AUTH_PROXY_PATTERN.md`

### Import Conventions

```typescript
import { ... } from "@odis-ai/shared/types";
import { ... } from "@odis-ai/shared/validators";
import { ... } from "@odis-ai/data-access/db";
import { ... } from "@odis-ai/domain/cases";
import { ... } from "@odis-ai/integrations/vapi";
```

### Supabase Clients

```typescript
// Standard client (RLS-enabled) - use this by default
import { createServerClient } from "@odis-ai/data-access/db";

// Service client (bypasses RLS) - webhooks/admin ONLY
import { createServiceClient } from "@odis-ai/data-access/db";
```

## Code Organization Rules

- **Dashboard hooks**: Always in `components/dashboard/{feature}/hooks/`, never in `app/dashboard/*/_hooks/`
- **Mock data**: Name files `mock-data.ts` (not "demo-data")
- **Utils**: Start flat at feature root, nest only for 5+ shared files in subfolder
- **Server Components**: Default choice; minimize `"use client"`
- **File size**: Split files >500 lines into modules

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

## Sentry Usage

See `.cursor/rules/sentry.mdc` for guidance on exceptions, spans, and logs.

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

Use these for efficient codebase navigation:

```
nx_workspace              # Full workspace overview
nx_project_details <name> # Specific project config
nx_docs <query>           # Search Nx documentation
```

## Session Notes

<!-- Add project-specific notes, decisions, or context for ongoing work here -->
