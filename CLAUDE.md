# CLAUDE.md

@AGENTS.md

## Claude Code Specific

### Quick Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm check                  # lint + typecheck all

# Testing
pnpm test:all               # Run all tests
nx test <project>           # Test specific project

# Nx
nx graph                    # View dependency graph
pnpm docs:nx                # Regenerate Nx inventory
```

### ⚠️ Environment Configuration

**Each app has its own `.env.local` file following Nx best practices.**

```bash
# First-time setup for any app
cp apps/{app-name}/.env.example apps/{app-name}/.env.local

# Edit with your actual values
# .env.local is gitignored - never commit it
```

**Quick setup:**
```bash
# Web app (Next.js - uses NEXT_PUBLIC_ prefix)
cp apps/web/.env.example apps/web/.env.local

# Mobile app (Expo - uses EXPO_PUBLIC_ prefix)
cp apps/mobile/.env.example apps/mobile/.env.local

# IDEXX sync service
cp apps/idexx-sync/.env.example apps/idexx-sync/.env.local
```

**See `ENV_SETUP.md` for:**
- Required variables per app
- How to get credentials
- Security best practices
- Troubleshooting

### ⚠️ Database Schema Changes

**CRITICAL: After modifying the Supabase database schema (adding/modifying tables, columns, types, etc.), ALWAYS run:**

```bash
pnpm update-types
```

This regenerates TypeScript types from the Supabase database schema to `libs/shared/types/src/database.types.ts`.

**When to run:**

- After creating/modifying tables in Supabase dashboard
- After running migrations locally or in production
- After modifying database enums, composite types, or functions
- When you see TypeScript errors about missing database types

**What it does:**

- Connects to your Supabase project (via `NEXT_PUBLIC_SUPABASE_URL` or `PROJECT_REF`)
- Generates TypeScript types matching your database schema
- Automatically fixes known issues in generated types
- Ensures type safety across the entire codebase

**Note:** The script requires Supabase CLI authentication. If it prompts for login:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

### Workspace Exploration

Use MCP tools for efficient codebase navigation:

```
nx_workspace              # Get full workspace overview
nx_project_details <name> # Get specific project config
nx_docs <query>           # Search Nx documentation
```

### Import Conventions

Always use domain-grouped imports:

```typescript
import { ... } from "@odis-ai/shared/types";
import { ... } from "@odis-ai/shared/validators";
import { ... } from "@odis-ai/data-access/db";
import { ... } from "@odis-ai/domain/cases";
import { ... } from "@odis-ai/integrations/vapi";
```

### Context Preferences

- Prefer concise responses with code examples
- Ask clarifying questions before large refactors
- When unsure about architecture, check `AGENTS.md` first
- Use domain-grouped import paths (`@odis-ai/shared/*`, `@odis-ai/data-access/*`, etc.)
- Default to Server Components; minimize `"use client"`
- Prefer editing existing files over creating new ones
- Dashboard hooks: Always colocate in `components/dashboard/{feature}/hooks/`
- NEVER create hooks in `app/dashboard/*/_hooks/` - routing layer should be thin
- Mock data: Use `mock-data.ts` naming (not "demo-data")
- Utils: Start flat at feature root, nest only for complex subfeatures (5+ shared files)

### ⚠️ Critical: Auth Proxy Pattern

**DO NOT create `middleware.ts` files!**

This project uses a **custom proxy pattern** at `apps/web/src/proxy.ts` instead of standard Next.js middleware.

```
apps/web/src/proxy.ts ← USE THIS (supports Clerk + Supabase hybrid auth)
apps/web/src/middleware.ts ← NEVER CREATE THIS
```

The proxy enables:

- Hybrid authentication (Clerk for web, Supabase Auth for iOS)
- Always refreshes Supabase sessions for iOS compatibility
- Graceful fallback if Clerk is not configured

See: `docs/architecture/AUTH_PROXY_PATTERN.md`

### Key Locations

| Purpose         | Location                           |
| --------------- | ---------------------------------- |
| API Routes      | `apps/web/src/app/api/`            |
| tRPC Routers    | `apps/web/src/server/api/routers/` |
| Server Actions  | `apps/web/src/server/actions/`     |
| UI Components   | `libs/shared/ui/src/`              |
| Domain Services | `libs/domain/*/`                   |
| Validators      | `libs/shared/validators/src/`      |

### Session Notes

<!-- Add project-specific notes, decisions, or context for ongoing work here -->

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
