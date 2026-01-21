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

| Purpose | Location |
|---------|----------|
| API Routes | `apps/web/src/app/api/` |
| tRPC Routers | `apps/web/src/server/api/routers/` |
| Server Actions | `apps/web/src/server/actions/` |
| UI Components | `libs/shared/ui/src/` |
| Domain Services | `libs/domain/*/` |
| Validators | `libs/shared/validators/src/` |

### Session Notes

<!-- Add project-specific notes, decisions, or context for ongoing work here -->
