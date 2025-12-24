# Documentation Index

> Authoritative index for all documentation in the ODIS AI Nx workspace.

## Quick Links

| Document                        | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| [AGENTS.md](../AGENTS.md)       | **Primary AI assistant guide** (start here) |
| [.cursorrules](../.cursorrules) | Cursor IDE specific rules                   |
| [CLAUDE.md](../CLAUDE.md)       | Claude Code specific rules                  |

---

## Directory Structure

```
docs/
  api/                    # API documentation
  architecture/           # System design, Nx patterns, library maps
  audits/                 # Codebase audit reports
  compliance/             # Compliance/legal requirements
  cursor-commands/        # Cursor/Playwright workflows
  deployment/             # CI/CD, environments, runtime config
  development/            # Developer workflows, local setup
  implementation/         # Feature-specific implementation guides
  integrations/           # Third-party integration docs (IDEXX, VAPI)
  reference/              # Generated inventories, cross-domain refs
  testing/                # Testing strategy and checklists
  vapi/                   # Voice AI knowledge base, prompts
```

---

## Architecture Documentation

| Document                                                  | Description                       |
| --------------------------------------------------------- | --------------------------------- |
| [CORE_LIBS.md](architecture/CORE_LIBS.md)                 | Library inventory by domain group |
| [NX_BEST_PRACTICES.md](architecture/NX_BEST_PRACTICES.md) | Nx workspace conventions          |

---

## Reference Documentation

| Document                                       | Description                          |
| ---------------------------------------------- | ------------------------------------ |
| [NX_PROJECTS.md](reference/NX_PROJECTS.md)     | **Generated** - Nx project inventory |
| [nx-projects.json](reference/nx-projects.json) | Machine-readable inventory           |

> Regenerate with `pnpm docs:nx`. Do not edit generated files manually.

---

## API Documentation

| Document                                                     | Description                 |
| ------------------------------------------------------------ | --------------------------- |
| [API_REFERENCE.md](api/API_REFERENCE.md)                     | API routes and endpoints    |
| [ORCHESTRATION_API_GUIDE.md](api/ORCHESTRATION_API_GUIDE.md) | Discharge orchestration API |

---

## Testing Documentation

| Document                                           | Description                    |
| -------------------------------------------------- | ------------------------------ |
| [TESTING_STRATEGY.md](testing/TESTING_STRATEGY.md) | Comprehensive testing approach |

---

## Workspace Structure

```
apps/
  web/                    # Next.js 15 application
  chrome-extension/       # IDEXX Neo browser extension
  idexx-sync/            # Headless sync service

libs/
  shared/                # Cross-cutting (types, validators, util, ui, hooks, logger, ...)
  data-access/           # Database layer (db, supabase-client, repository-*, api)
  domain/                # Business logic (cases, discharge, clinics, auth, shared)
  integrations/          # External services (vapi, idexx, qstash, resend, slack, ai)
  extension/             # Chrome extension (shared, storage, env)
```

---

## Nx-Aware Placement Rules

- **Apps** (`apps/*`): Document app behavior in `architecture/` or feature-specific folders
- **Libraries** (`libs/*`): Add library docs to `architecture/` (design) or `reference/` (inventories)
- **Use Nx tags**: Reflect `type:*`, `scope:*`, `platform:*` in doc organization
- **Update this README**: When adding or moving documentation

---

## Writing Guidelines

- Keep documents concise and scoped
- Link to code and generated inventories rather than duplicating
- Use UPPER_SNAKE_CASE for guides, kebab-case for feature docs
- Place release notes in `reference/` or `architecture/` depending on scope

---

## Import Conventions

See [AGENTS.md](../AGENTS.md) for current import patterns:

```typescript
// Domain-grouped imports
import { ... } from "@odis-ai/shared/types";
import { ... } from "@odis-ai/data-access/db";
import { ... } from "@odis-ai/domain/cases";
import { ... } from "@odis-ai/integrations/vapi";
```

---

_Last updated: December 2024_
