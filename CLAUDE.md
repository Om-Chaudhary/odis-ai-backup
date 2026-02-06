# CLAUDE.md

## Commands

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

# Database
pnpm update-types           # Regenerate types after Supabase schema changes
```

## Workflow

- Use conventional commits with scopes: `(web)` `(cases)` `(clinics)` `(vapi)` `(outbound)` `(inbound)` `(dashboard)` `(ui)` `(util)` `(db)`
- After modifying Supabase schema, ALWAYS run `pnpm update-types` (generates `libs/shared/types/src/database.types.ts`)
- DO NOT create `middleware.ts` files. Auth uses proxy pattern at `apps/web/src/proxy.ts`. See @docs/architecture/AUTH_PROXY_PATTERN.md

## Code Standards

- All imports use `@odis-ai/` namespace (see `tsconfig.base.json` for paths)
- `createServerClient` (RLS-enabled) is the default Supabase client. `createServiceClient` (bypasses RLS) ONLY for webhooks, admin actions, background jobs.
- Default to Server Components. Minimize `"use client"` directives.
- Split files exceeding 500 lines into modules.
- Prefer editing existing files over creating new ones.

## Key Locations

| Purpose            | Location                           |
| ------------------ | ---------------------------------- |
| API Routes         | `apps/web/src/app/api/`            |
| tRPC Routers       | `apps/web/src/server/api/routers/` |
| Server Actions     | `apps/web/src/server/actions/`     |
| UI Components      | `libs/shared/ui/src/`              |
| Domain Services    | `libs/domain/*/`                   |
| Validators         | `libs/shared/validators/src/`      |
| VAPI Library       | `libs/integrations/vapi/src/`      |
| Dashboard          | `apps/web/src/components/dashboard/` |

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
