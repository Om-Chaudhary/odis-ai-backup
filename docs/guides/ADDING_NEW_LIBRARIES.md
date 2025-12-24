# Adding New Libraries to the Nx Monorepo

**Updated:** 2025-12-23 (Post-restructuring)

This guide explains how to add new libraries to the domain-grouped monorepo structure.

---

## Quick Reference

**Before adding a library, answer these questions:**

1. **What does it do?** → Determines the **group** (shared, data-access, integrations, domain)
2. **What layer is it?** → Determines the **type** tag (feature, data-access, ui, util, types)
3. **Where is it used?** → Determines the **scope** tag (shared, server, browser, domain)
4. **What platform?** → Determines the **platform** tag (node, browser, node+browser)

---

## Step 1: Choose the Right Group

### libs/shared/ - Cross-Cutting Concerns

**Use when:** Code is used across multiple domains/apps

**Examples:**
- `shared/types/` - Shared TypeScript types
- `shared/util/` - Pure utility functions
- `shared/ui/` - Reusable UI components
- `shared/validators/` - Zod validation schemas

**Command:**
```bash
nx generate @nx/js:library my-utility --directory=shared/my-utility
```

---

### libs/data-access/ - Persistence & Data Layer

**Use when:** Code handles data persistence, API clients, or database access

**Examples:**
- `data-access/supabase-client/` - Database client initialization
- `data-access/repository-interfaces/` - Repository contracts
- `data-access/repository-impl/` - Repository implementations

**Command:**
```bash
nx generate @nx/js:library my-repository --directory=data-access/my-repository
```

---

### libs/integrations/ - External Services

**Use when:** Code integrates with external APIs or third-party services

**Examples:**
- `integrations/vapi/client/` - VAPI SDK wrapper
- `integrations/qstash/` - QStash scheduling
- `integrations/resend/` - Email sending

**Command:**
```bash
nx generate @nx/js:library my-integration --directory=integrations/my-integration
```

---

### libs/domain/ - Business Logic

**Use when:** Code implements business rules specific to a feature area

**Structure:** `libs/domain/{feature-name}/{type}/`

**Types within domain:**
- `feature/` - UI components for that feature
- `data-access/` - Services and business logic
- `util/` - Feature-specific utilities

**Examples:**
- `domain/cases/data-access/` - CasesService
- `domain/discharge/data-access/` - DischargeOrchestrator
- `domain/discharge/feature/` - Discharge UI components (future)

**Command:**
```bash
# For data-access
nx generate @nx/js:library cases-service --directory=domain/cases/data-access

# For feature library (React components)
nx generate @nx/react:library discharge-ui --directory=domain/discharge/feature
```

---

### libs/extension/ - Platform-Specific

**Use when:** Code is specific to Chrome extension platform

**Examples:**
- `extension/shared/` - Extension utilities
- `extension/storage/` - Extension storage abstractions

**Command:**
```bash
nx generate @nx/js:library my-extension-lib --directory=extension/my-extension-lib
```

---

## Step 2: Add Correct Tags

Tags enforce module boundaries and prevent architectural violations.

### Type Tags (What layer?)

| Tag | Purpose | Can Depend On |
|-----|---------|---------------|
| `type:feature` | Smart components, pages | data-access, ui, util, types |
| `type:data-access` | Repositories, API clients | util, types, config |
| `type:ui` | Presentational components | ui, util, types |
| `type:util` | Pure functions, helpers | util, types, config |
| `type:types` | TypeScript types only | types |
| `type:service` | Business logic services | service, integration, data-access, util, types |
| `type:integration` | External API wrappers | integration, data-access, util, types |
| `type:config` | Configuration | config |
| `type:testing` | Test utilities | (anything) |

### Scope Tags (Where used?)

| Tag | Meaning | Can Depend On |
|-----|---------|---------------|
| `scope:shared` | Used everywhere | scope:shared |
| `scope:server` | Server-side only | scope:server, scope:shared |
| `scope:browser` | Browser-side only | scope:browser, scope:shared |
| `scope:extension` | Chrome extension | scope:extension, scope:shared |
| `scope:domain` | Domain-specific | (varies) |

### Platform Tags

| Tag | Meaning |
|-----|---------|
| `platform:node` | Node.js only |
| `platform:browser` | Browser only |
| `platform:node+browser` | Isomorphic |

---

## Step 3: Update project.json

**Example for a new utility library:**

```json
{
  "name": "shared-my-utility",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/shared/my-utility/src",
  "projectType": "library",
  "tags": [
    "type:util",
    "scope:shared",
    "platform:node+browser"
  ],
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p tsconfig.json",
        "cwd": "libs/shared/my-utility"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run",
        "cwd": "libs/shared/my-utility"
      }
    }
  }
}
```

**Key points:**
- `name`: Use pattern `{group}-{library-name}` (e.g., `shared-my-utility`)
- `$schema`: Adjust `../` depth based on nesting level
- `sourceRoot`: Full path to src directory
- `tags`: Include type, scope, and platform
- `targets.*.cwd`: Path to library directory

---

## Step 4: Add Path Alias

Update `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@odis-ai/shared/my-utility": ["libs/shared/my-utility/src/index.ts"],
      "@odis-ai/shared/my-utility/*": ["libs/shared/my-utility/src/*"]
    }
  }
}
```

**Naming convention:**
- Shared: `@odis-ai/shared/{name}`
- Data Access: `@odis-ai/data-access/{name}`
- Integrations: `@odis-ai/integrations/{name}`
- Domain: `@odis-ai/domain/{feature-name}`
- Extension: `@odis-ai/extension/{name}`

---

## Step 5: Create tsconfig.json

**For 3-level libs** (shared/*, integrations/*, data-access/*):

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts", "**/*.spec.ts"]
}
```

**For 4-level libs** (domain/*/*/):

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../../../dist/out-tsc",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts", "**/*.spec.ts"]
}
```

**Key:** Count the depth and add appropriate `../` levels to reach workspace root.

---

## Step 6: Validate

Run these commands to ensure your library is correctly configured:

```bash
# Typecheck
pnpm nx typecheck my-library-name

# Lint (checks module boundaries)
pnpm nx lint my-library-name

# Test
pnpm nx test my-library-name

# Visualize dependencies
pnpm nx graph
```

---

## Common Patterns

### Creating a New Domain Feature

```bash
# 1. Create the domain group if it doesn't exist
mkdir -p libs/domain/my-feature

# 2. Create data-access library
nx generate @nx/js:library my-feature-service \
  --directory=domain/my-feature/data-access \
  --tags=type:service,scope:server,platform:node

# 3. (Optional) Create feature library for UI
nx generate @nx/react:library my-feature-ui \
  --directory=domain/my-feature/feature \
  --tags=type:feature,scope:browser,platform:browser

# 4. (Optional) Create util library
nx generate @nx/js:library my-feature-utils \
  --directory=domain/my-feature/util \
  --tags=type:util,scope:shared,platform:node+browser
```

### Creating a New Integration

```bash
nx generate @nx/js:library my-service-client \
  --directory=integrations/my-service \
  --tags=type:integration,scope:server,platform:node
```

### Creating a Shared Utility

```bash
nx generate @nx/js:library my-helpers \
  --directory=shared/my-helpers \
  --tags=type:util,scope:shared,platform:node+browser
```

---

## Module Boundary Rules

The `@nx/enforce-module-boundaries` ESLint rule prevents architectural violations:

**✅ ALLOWED:**
```typescript
// Feature can import from data-access
// libs/domain/discharge/feature/
import { DischargeOrchestrator } from "@odis-ai/domain/discharge";

// Data-access can import from util
// libs/domain/cases/data-access/
import { transformCase } from "@odis-ai/shared/util";

// Integration can import from data-access
// libs/integrations/vapi/
import { createServerClient } from "@odis-ai/data-access/supabase-client";
```

**❌ FORBIDDEN:**
```typescript
// UI cannot import from data-access
// libs/shared/ui/
import { CasesRepository } from "@odis-ai/data-access/repository-impl"; // ERROR

// Util cannot import from integration
// libs/shared/util/
import { sendEmail } from "@odis-ai/integrations/resend"; // ERROR

// Types cannot import from anything except types
// libs/shared/types/
import { logger } from "@odis-ai/shared/logger"; // ERROR
```

If you get a boundary violation, reconsider your library's type tag or refactor the dependency.

---

## Checklist for New Libraries

- [ ] Library in correct group (shared, data-access, integrations, domain, extension)
- [ ] Correct tags (type, scope, platform)
- [ ] Path alias added to `tsconfig.base.json`
- [ ] tsconfig.json with correct depth (`extends` path)
- [ ] project.json with correct name pattern
- [ ] `pnpm nx typecheck {lib-name}` passes
- [ ] `pnpm nx lint {lib-name}` passes (no boundary violations)
- [ ] Tests added (if applicable)
- [ ] Exported from index.ts
- [ ] Documented in README.md (if complex)

---

## Examples from Codebase

### Utility Library (shared/util)
- **Path:** `libs/shared/util/`
- **Alias:** `@odis-ai/shared/util`
- **Tags:** `type:util, scope:shared, platform:node+browser`
- **Exports:** Pure functions (cn, transformCase, isWithinBusinessHours)
- **Depends on:** `shared/types`

### Integration Library (integrations/vapi/client)
- **Path:** `libs/integrations/vapi/client/`
- **Alias:** `@odis-ai/integrations/vapi/client`
- **Tags:** `type:integration, scope:server, platform:node`
- **Exports:** createPhoneCall(), validators, variable builders
- **Depends on:** `shared/env`, `shared/logger`, `shared/validators`

### Service Library (domain/cases/data-access)
- **Path:** `libs/domain/cases/data-access/`
- **Alias:** `@odis-ai/domain/cases`
- **Tags:** `type:service, scope:server, platform:node`
- **Exports:** CasesService (case management logic)
- **Depends on:** `integrations/qstash`, `integrations/vapi`, `data-access/db`

---

## Troubleshooting

### "Cannot find module @odis-ai/my-lib"
- Check path alias exists in `tsconfig.base.json`
- Verify path points to correct location
- Clear cache: `rm -rf .nx dist apps/web/.next`

### "Circular dependency detected"
- Check if you're importing from a library that imports back to yours
- Use interfaces to break the cycle (see Phase 7 DI pattern)
- Consider if libraries are in wrong group

### "Module boundary violation"
- Check your library's `type:*` tag
- Check the dependency's `type:*` tag
- Refer to module boundary rules table above
- May need to refactor or change tags

---

## Best Practices

1. **Keep libraries focused** - Single responsibility, <2,000 lines
2. **Use interfaces for DI** - Break circular dependencies
3. **Prefer composition** - Small, focused libraries over large monoliths
4. **Tag correctly** - Wrong tags lead to boundary violations
5. **Document exports** - Clear index.ts with JSDoc
6. **Add tests** - Every library should have tests
7. **Follow naming** - `{group}-{name}` for project names

---

## Migration from Old Structure

**Old flat structure:**
```typescript
import { something } from "@odis-ai/utils";
```

**New grouped structure:**
```typescript
import { something } from "@odis-ai/shared/util";
```

See [NX_RESTRUCTURING_COMPLETE.md](../refactoring/NX_RESTRUCTURING_COMPLETE.md) for full migration details.

---

## Getting Help

- **Nx docs:** https://nx.dev/concepts/more-concepts/library-types
- **Module boundaries:** https://nx.dev/nx-api/eslint-plugin/documents/enforce-module-boundaries
- **CLAUDE.md:** Project-specific patterns and conventions
- **Restructuring docs:** docs/refactoring/NX_RESTRUCTURING_COMPLETE.md
